/**
 * 机房 Room 模型生成（mock）
 *
 * 【接口数据】getRoom(roomId) 等价 GET /idc/room?roomId=xxx，
 * 直接返回「稀疏网格 Room 模型」——即入手教程第一章那棵四级 JSON 树：
 * Room → Rack(row/col/facing/kind) → Device(startU/uSize/category) → Component。
 * 真实后端按同样结构返回，api.js 一换即接，页面零改动。
 *
 * 生成规则（布局怎么从台账长出来）：
 * 1. 台账（mock/geo.js）只配「排×数量」+ 告警/离线名单，不逐柜填数据；
 * 2. 指标与设备由 runtime.js 的 rackStates 种子随机生成（同 id 每次一致），
 *    本文件取快照（getRoomRacks）组装成 Room；
 * 3. 布局：第 0 排摆设施机柜（空调/配电/UPS），第 1 排空隔，设备排从第 2 排起
 *    按 row 字母顺序展开；相邻排朝向交替 S/N（面对面 → 冷通道自动成型）；
 *    第二排规模够大时在第 4 格留一个空位，演示「断行」稀疏布局；
 * 4. 每台设备按类型确定性生成可更换配件（components[]），
 *    已有更换记录（mock/parts.js）的合并记录值并视为已修复。
 */
import { PART_SPECS, PART_MODEL_POOL, U_TOTAL } from '../room/model';
import { getReplaced } from './parts';
import { SITES } from './geo';
import { getRoomRacks } from './runtime';
import { getRoomEdits } from './roomEdits';

/** 设施机柜（贴墙一排，不带 U 位） */
const FACILITY_SPECS = [
    { kind: 'aircon', name: '精密空调' },
    { kind: 'power', name: '配电柜' },
    { kind: 'ups', name: 'UPS电池柜' },
];

const VENDOR_BY_CATEGORY = {
    server: 'HPE',
    storage: 'Huawei',
    network: 'H3C',
    security: 'Huawei',
};

/** 字符串 → 稳定种子（同一 id 每次生成相同配件/SN） */
function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
}

/**
 * 生成一台设备的可更换配件清单。
 * 预警设备的第一块盘设为故障——更换它即可让设备恢复正常，
 * 形成「换配件 → 3D 柜面/2D 面板状态同步」的完整演示闭环。
 */
function buildComponents(deviceId, category, deviceStatus) {
    const specs = PART_SPECS[category] || PART_SPECS.network;
    const seed = hashCode(deviceId);
    const out = [];
    specs.forEach((spec, si) => {
        spec.slots.forEach((slot, i) => {
            const pool = PART_MODEL_POOL[spec.kind];
            const id = `${deviceId}::${slot}`;
            const rec = getReplaced(id);
            const fault = deviceStatus === 'warning' && spec.kind === 'disk' && i === 0;
            // 有更换记录视为已修复；仅「无记录 + 生成为故障」才落 fault（单层三元）
            out.push({
                id,
                kind: spec.kind,
                slot,
                model: rec ? rec.model : pool[(seed + si * 7 + i * 3) % pool.length],
                status: !rec && fault ? 'fault' : 'ok',
                replacedAt: rec ? rec.replacedAt : null,
            });
        });
    });
    return out;
}

/** runtime 的设备 → 模型设备（含 rackId / 厂商 / SN / 配件） */
function convertDevice(src, rackId) {
    return {
        id: src.id,
        rackId,
        name: src.name,
        model: src.model,
        vendor: VENDOR_BY_CATEGORY[src.type] || '-',
        sn: `SN${hashCode(src.id).toString(16).toUpperCase().padStart(6, '0')}`,
        category: src.type,
        startU: src.uStart,
        uSize: src.uSize,
        status: src.status,
        components: buildComponents(src.id, src.type, src.status),
    };
}

/** runtime 的机柜 → 模型机柜（稀疏网格坐标 + 朝向） */
function convertRack(src, row, col, facing) {
    return {
        id: src.id,
        name: src.name || src.id,
        // kind：设施排（runtime 的 rowSpec.kind）透传；设备柜缺省 compute
        kind: src.kind || 'compute',
        row,
        col,
        facing,
        // uTotal：设施柜为 0（`||` 会把 0 错误兜底成 42，用显式判空）
        uTotal: src.uTotal != null ? src.uTotal : U_TOTAL,
        status: src.status,
        // 指标（展示用）
        powerKw: src.powerKw,
        ratedPowerKw: src.ratedPowerKw,
        loadPct: src.loadPct,
        tempIn: src.tempIn,
        humidity: src.humidity,
        uUsed: src.uUsed,
        devices: (src.devices || []).map(d => convertDevice(d, src.id)),
    };
}

/** roomId → { site, room }（台账反查） */
function findSiteRoom(roomId) {
    for (const site of SITES) {
        const room = site.rooms.find(r => r.id === roomId);
        if (room) return { site, room };
    }
    return null;
}

/**
 * O1 压力验证机房（URL 直达 /idc-three/room?room=STRESS-2000，不进机房列表）：
 * 合成 N 台机柜的稀疏布局，每 97 台掺一台告警柜看信标与实例着色。
 * 柜数 > 200 自动触发 LOD 实例化渲染（见 buildRoom.js）。
 *
 * 设备用「确定性排盘」（按机柜序号派生，不用 Math.random——刷新结果稳定）：
 * 曾经留空导致 LOD 柜面画布 bug 在此页无差异显形（2026-11-06 教训），
 * 现在掺入真实 U 位区间，让压力验证同时覆盖「实例化渲染」与「明细组柜面」
 * 两条渲染路径——点选/拉近后必须能看到 U 位色块才算验证通过。
 */
const STRESS_RE = /^STRESS-(\d+)$/;

/** 确定性排盘：按机柜序号 i 派生 12~38U 的设备区间（类型循环、尺寸按序号取模） */
function stressDevices(rackId, i) {
    const types = ['server', 'storage', 'network', 'security'];
    const target = 12 + (i % 27); // 12~38U，视觉上有疏有密
    const devices = [];
    let cursor = 1;
    let seq = 0;
    while (cursor <= target) {
        const type = types[(i + seq) % 4];
        const size = type === 'storage' ? 4 : type === 'network' ? 2 : 1 + ((i + seq) % 2);
        devices.push({
            id: `${rackId}-U${cursor}`,
            name: `${type.toUpperCase()}-${String(seq + 1).padStart(2, '0')}`,
            model: 'STRESS-MOCK',
            category: type,
            startU: cursor,
            uSize: size,
            status: 'normal',
        });
        cursor += size;
        seq += 1;
    }
    return devices;
}

function buildStressRoom(roomId, count) {
    const n = Math.max(1, Math.min(5000, count));
    const cols = Math.min(n, 84);
    const rows = Math.ceil(n / cols);
    const racks = [];

    FACILITY_SPECS.forEach((spec, i) => {
        racks.push({
            id: `FAC-${roomId}-${i + 1}`,
            name: spec.name,
            kind: spec.kind,
            row: 0,
            col: i,
            facing: 'N',
            uTotal: 0,
            status: 'normal',
            devices: [],
        });
    });

    for (let i = 0; i < n; i += 1) {
        const row = 2 + Math.floor(i / cols);
        const col = i % cols;
        const id = `S-${String(i + 1).padStart(4, '0')}`;
        racks.push({
            id,
            name: id,
            kind: 'compute',
            row,
            col,
            facing: Math.floor(i / cols) % 2 === 0 ? 'S' : 'N',
            uTotal: 42,
            status: i % 97 === 5 ? 'alarm' : 'normal',
            devices: stressDevices(id, i),
        });
    }

    return {
        id: roomId,
        name: `压力验证机房（${n} 柜）`,
        siteId: 'STRESS',
        siteName: '压力验证',
        gridRows: rows + 4,
        gridCols: cols + 2,
        racks,
    };
}

/**
 * 【接口数据】取机房 Room 模型（稀疏网格，3D / 2D 共用）。
 * 生成顺序：台账基础布局 → 应用编辑记录（roomEdits：位置微调/增删/全量替换）→
 * 为缺配件的设备补生成 components（编辑器新增/导入的设备没有配件数据）。
 * @param {string} roomId
 * @returns {object|null} Room 模型；roomId 不存在返回 null
 */
export function getRoom(roomId) {
    const stress = STRESS_RE.exec(roomId);
    if (stress) return buildStressRoom(roomId, Number(stress[1]));

    const hit = findSiteRoom(roomId);
    if (!hit) return null;
    const { site, room } = hit;
    const states = getRoomRacks(roomId) || [];

    // 按排字母分组，排内按序号排序
    const rowMap = new Map();
    states.forEach(r => {
        if (!rowMap.has(r.row)) rowMap.set(r.row, []);
        rowMap.get(r.row).push(r);
    });
    const letters = Array.from(rowMap.keys());
    letters.forEach(l => rowMap.get(l).sort((a, b) => a.rowIndex - b.rowIndex));

    const racks = [];
    let maxCol = 0;

    // —— 设施机柜：网格第 0 排贴边摆放 ——
    FACILITY_SPECS.forEach((spec, i) => {
        racks.push({
            id: `FAC-${roomId}-${i + 1}`,
            name: spec.name,
            kind: spec.kind,
            row: 0,
            col: i,
            facing: 'N',
            uTotal: 0,
            status: 'normal',
            devices: [],
        });
        maxCol = Math.max(maxCol, i);
    });

    // —— 设备机柜：第 2 排起逐排展开；相邻排朝向交替（面对面 → 冷通道） ——
    let baseRows = 2 + letters.length + 1;
    letters.forEach((letter, li) => {
        const list = rowMap.get(letter);
        const gridRow = 2 + li;
        const facing = li % 2 === 0 ? 'S' : 'N';
        // 断行演示：第二排规模够大时，在第 4 格留一个空位（稀疏布局）
        const gapCol = li === 1 && list.length >= 6 ? 3 : -1;
        let col = 0;
        list.forEach(src => {
            if (col === gapCol) col += 1; // 跳过一格 → 空地
            racks.push(convertRack(src, gridRow, col, facing));
            maxCol = Math.max(maxCol, col);
            col += 1;
        });
    });

    // —— 应用编辑记录（M5：编辑器保存 / 按机柜导入 / 跨房腾挪） ——
    const e = getRoomEdits(roomId);
    let finalRacks = racks;
    if (e) {
        if (e.full) {
            finalRacks = e.full.map(r => ({ ...r, devices: (r.devices || []).map(d => ({ ...d })) }));
        } else {
            finalRacks = racks
                .filter(r => !e.removed.includes(r.id))
                .map(r => (e.moves[r.id] ? { ...r, ...e.moves[r.id] } : r))
                .concat(e.added.map(r => ({ ...r, devices: (r.devices || []).map(d => ({ ...d })) })));
        }
    }

    // 为缺配件的设备补生成 components（导入/新增的设备）
    finalRacks.forEach(r => {
        (r.devices || []).forEach(d => {
            if (!d.components) d.components = buildComponents(d.id, d.category, d.status);
        });
    });

    // 网格要包住所有机柜（编辑后可能超出基础布局）
    const maxRow = finalRacks.reduce((m, r) => Math.max(m, r.row), 0);
    const maxColFinal = finalRacks.reduce((m, r) => Math.max(m, r.col), 0);

    return {
        id: room.id,
        name: room.name,
        siteId: site.id,
        siteName: site.name,
        gridRows: Math.max(baseRows, maxRow + 2),
        gridCols: Math.max(maxCol + 2, maxColFinal + 2),
        // 门（Room 级属性）：整房导入保存过 doors 用保存值，否则用台账配置
        doors: (e && e.doors ? e.doors : room.doors || []).map(d => ({ ...d })),
        racks: finalRacks,
    };
}
