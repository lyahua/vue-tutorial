/**
 * 机房数据导入导出（M5，纯前端工具，无后端交互）
 *
 * 导出：
 * - exportRoomJson(room)   JSON 快照（{ version, exportedAt, rooms[] }），downloadFile 触发下载
 * - exportRoomExcel(room)  Excel 双 sheet（机柜布局 + 设备台账），xlsx.writeFile 触发下载
 *
 * 导入：
 * - parseImportFile(file)  按扩展名解析 .json / .xlsx，
 *                          返回 { type: 'room'|'rack', room?|rack?, fileName }
 *                          （Excel 单机柜行 → rack，多行 → room）
 * - validateRoom(room)     整房校验：枚举/坐标/同格冲突/U 位越界与重叠
 * - validateRack(rack)     单机柜校验（同格冲突由调用方对着房间查）
 *
 * 约定：导入只负责"解析 + 校验"，落库走 api.js（saveRoomLayout / importRack）；
 * 校验失败必须阻止导入（整房/单柜均整单回滚——不落库即回滚）。
 */
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { RACK_KIND_LABEL } from './model';

const SCHEMA_VERSION = 1;
const KINDS = Object.keys(RACK_KIND_LABEL);
const DOOR_WALLS = ['N', 'S', 'E', 'W'];

/** 触发浏览器下载一个文本文件 */
export function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 导出 JSON 快照（含版本号，导入按 version 做迁移入口） */
export function exportRoomJson(room) {
    const payload = {
        version: SCHEMA_VERSION,
        exportedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        rooms: [room],
    };
    downloadFile(`${room.name}-机房快照.json`, JSON.stringify(payload, null, 2), 'application/json');
    return payload;
}

/** 导出 Excel 双 sheet：机柜布局 + 设备台账（中文表头，导入按同表头解析） */
export function exportRoomExcel(room) {
    const layout = room.racks.map(r => ({
        机柜ID: r.id,
        类型: r.kind,
        行: r.row,
        列: r.col,
        朝向: r.facing,
        U位数: r.uTotal,
        状态: r.status,
    }));
    const devices = [];
    room.racks.forEach(r => {
        (r.devices || []).forEach(d => {
            devices.push({
                所属机柜: r.id,
                设备ID: d.id,
                名称: d.name,
                类型: d.category,
                型号: d.model,
                SN: d.sn || '',
                起始U: d.startU,
                占用U数: d.uSize,
                状态: d.status,
            });
        });
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(layout), '机柜布局');
    XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(devices.length ? devices : [{ 说明: '无设备' }]),
        '设备台账'
    );
    // 门配置（Room 级）：无门时也导出占位说明行，保持三 sheet 结构稳定（导入按表名识别）
    const doors = (room.doors || []).map(d => ({
        墙: d.wall,
        位置m: d.offset,
        宽度m: d.width,
        标签: d.label || '',
    }));
    XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(doors.length ? doors : [{ 说明: '无门' }]),
        '门配置'
    );
    XLSX.writeFile(wb, `${room.name}-机柜台账.xlsx`);
    return { layout: layout.length, devices: devices.length, doors: doors.length };
}

/** 带 U 位的设备类柜型（缺省 U 位数时的推断依据） */
const U_RACK_KINDS = ['compute', 'network', 'storage'];

/** Excel 行 → 机柜对象（表头与导出一致） */
function excelRowToRack(row, devicesByRack) {
    const id = String(row['机柜ID'] || '').trim();
    const kind = String(row['类型'] || 'compute').trim();
    const devices = devicesByRack.get(id) || [];
    // U 位数：优先取表格填写值；缺省时设备类柜型 42U、设施类 0（if 链替代嵌套三元）
    let uTotal;
    if (row['U位数'] != null) {
        uTotal = Number(row['U位数']);
    } else if (U_RACK_KINDS.includes(kind)) {
        uTotal = 42;
    } else {
        uTotal = 0;
    }
    return {
        id,
        name: id,
        kind,
        row: Number(row['行']),
        col: Number(row['列']),
        facing: String(row['朝向'] || 'S').trim(),
        uTotal,
        status: String(row['状态'] || 'normal').trim(),
        powerKw: undefined,
        devices,
    };
}

/** 解析上传文件（.json / .xlsx） */
export function parseImportFile(file) {
    return new Promise((resolve, reject) => {
        const isJson = /\.json$/i.test(file.name);
        const isExcel = /\.xlsx$/i.test(file.name);
        if (!isJson && !isExcel) {
            reject(new Error('仅支持 .json / .xlsx 文件'));
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.onload = e => {
            try {
                if (isJson) {
                    const data = JSON.parse(String(e.target.result));
                    resolve(parseJsonPayload(data, file.name));
                } else {
                    const wb = XLSX.read(e.target.result, { type: 'array' });
                    resolve(parseExcelWorkbook(wb, file.name));
                }
            } catch (err) {
                reject(err);
            }
        };
        if (isJson) reader.readAsText(file, 'utf-8');
        else reader.readAsArrayBuffer(file);
    });
}

/** JSON 载荷 → { type: 'room'|'rack', … } */
function parseJsonPayload(data, fileName) {
    if (Array.isArray(data.racks)) return { type: 'room', room: data, fileName };
    if (data.rooms && data.rooms.length && Array.isArray(data.rooms[0].racks)) {
        return { type: 'room', room: data.rooms[0], fileName };
    }
    if (data.id != null && data.row != null) return { type: 'rack', rack: data, fileName };
    throw new Error('JSON 结构不识别：需要机房对象（含 racks）或单机柜对象（含 row/col）');
}

/** Excel 工作簿 → 机柜数组（单机柜行按 rack 类型返回） */
function parseExcelWorkbook(wb, fileName) {
    const layoutWs = wb.Sheets['机柜布局'];
    if (!layoutWs) throw new Error('缺少「机柜布局」工作表');
    const layoutRows = XLSX.utils.sheet_to_json(layoutWs);

    // 设备台账按所属机柜分组
    const devicesByRack = new Map();
    const deviceWs = wb.Sheets['设备台账'];
    if (deviceWs) {
        XLSX.utils.sheet_to_json(deviceWs).forEach(d => {
            if (d['所属机柜'] == null || d['说明']) return;
            const rackId = String(d['所属机柜']).trim();
            if (!devicesByRack.has(rackId)) devicesByRack.set(rackId, []);
            devicesByRack.get(rackId).push({
                id: String(d['设备ID'] || '').trim(),
                name: String(d['名称'] || '').trim(),
                category: String(d['类型'] || 'server').trim(),
                model: String(d['型号'] || '').trim(),
                sn: String(d['SN'] || '').trim(),
                startU: Number(d['起始U']),
                uSize: Number(d['占用U数']),
                status: String(d['状态'] || 'normal').trim(),
            });
        });
    }

    const racks = layoutRows.map(r => excelRowToRack(r, devicesByRack));
    if (!racks.length) throw new Error('「机柜布局」工作表为空');
    if (racks.length === 1) return { type: 'rack', rack: racks[0], fileName };
    return {
        type: 'room',
        room: { id: racks[0].id, name: '导入机房', racks, doors: parseDoorsSheet(wb) },
        fileName,
    };
}

/** 「门配置」sheet → doors 数组（表头与导出一致；无表/占位行 → 空数组） */
function parseDoorsSheet(wb) {
    const ws = wb.Sheets['门配置'];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws)
        .filter(d => d['说明'] == null)
        .map(d => ({
            wall: String(d['墙'] || '').trim(),
            offset: Number(d['位置m']),
            width: Number(d['宽度m']),
            label: String(d['标签'] || '').trim(),
        }))
        .filter(d => d.wall);
}

// ————————————————————————— 校验 —————————————————————————

function rackBaseErrors(rack, prefix, errors) {
    if (!rack.id || typeof rack.id !== 'string') errors.push(`${prefix}：机柜 ID 缺失`);
    if (!KINDS.includes(rack.kind)) errors.push(`${prefix}：未知柜型 ${rack.kind}`);
    if (!Number.isInteger(rack.row) || rack.row < 0) errors.push(`${prefix}：行(row) 必须是不小于 0 的整数`);
    if (!Number.isInteger(rack.col) || rack.col < 0) errors.push(`${prefix}：列(col) 必须是不小于 0 的整数`);
    if (rack.facing !== 'S' && rack.facing !== 'N') errors.push(`${prefix}：朝向必须是 S 或 N`);
    if (rack.uTotal != null && (rack.uTotal < 0 || rack.uTotal > 48)) errors.push(`${prefix}：U 位数超出范围（0~48）`);
}

function deviceErrors(rack, prefix, errors) {
    const devices = rack.devices || [];
    if (!rack.uTotal && devices.length) errors.push(`${prefix}：设施机柜（U位 0）不允许挂设备`);
    const sorted = devices.slice().sort((a, b) => a.startU - b.startU);
    let prevEnd = 0;
    sorted.forEach(d => {
        const dPrefix = `${prefix} / 设备 ${d.id || d.name || '?'}`;
        if (!Number.isInteger(d.startU) || d.startU < 1) errors.push(`${dPrefix}：起始 U 必须是不小于 1 的整数`);
        if (!Number.isInteger(d.uSize) || d.uSize < 1) errors.push(`${dPrefix}：占用 U 数必须是不小于 1 的整数`);
        if (rack.uTotal && d.startU + d.uSize - 1 > rack.uTotal) {
            errors.push(`${dPrefix}：U 位越界（${d.startU}-${d.startU + d.uSize - 1} 超出 ${rack.uTotal}U）`);
        }
        if (prevEnd && d.startU <= prevEnd) {
            errors.push(`${dPrefix}：U 位与下方设备重叠（从 ${d.startU}U 起）`);
        }
        if (d.startU + d.uSize - 1 > prevEnd) prevEnd = d.startU + d.uSize - 1;
    });
}

/** 门校验：wall 枚举 / offset 与 width 数值范围（贴墙角/超墙长的拦截交给后端与渲染兜底） */
function doorErrors(room, errors) {
    (room.doors || []).forEach((d, i) => {
        const prefix = `门 #${i + 1}${d.label ? `（${d.label}）` : ''}`;
        if (!DOOR_WALLS.includes(d.wall)) errors.push(`${prefix}：墙必须是 N/S/E/W`);
        if (!Number.isFinite(d.offset) || d.offset < 0) errors.push(`${prefix}：位置(offset) 必须是不小于 0 的数字（米）`);
        if (!Number.isFinite(d.width) || d.width < 0.3 || d.width > 3) errors.push(`${prefix}：宽度必须在 0.3~3 米`);
    });
}

/** 单机柜校验（同格冲突由调用方对着目标房间检查） */
export function validateRack(rack) {
    const errors = [];
    rackBaseErrors(rack, `机柜 ${rack.id || '?'}`, errors);
    deviceErrors(rack, `机柜 ${rack.id || '?'}`, errors);
    return errors;
}

/** 整房校验：单柜规则 + 同格冲突 + 门 */
export function validateRoom(room) {
    const errors = [];
    if (!room || !Array.isArray(room.racks)) {
        errors.push('数据缺少 racks 数组');
        return errors;
    }
    const byCell = new Map();
    room.racks.forEach(rack => {
        const prefix = `机柜 ${rack.id || '?'}`;
        rackBaseErrors(rack, prefix, errors);
        deviceErrors(rack, prefix, errors);
        const key = `${rack.row}:${rack.col}`;
        if (byCell.has(key)) {
            errors.push(`同格冲突：${byCell.get(key)} 与 ${rack.id} 都在 (${rack.row}, ${rack.col})`);
        } else {
            byCell.set(key, rack.id);
        }
    });
    doorErrors(room, errors);
    return errors;
}
