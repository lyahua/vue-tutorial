/**
 * 实时指标模拟（mock）
 *
 * 【接口数据】本文件模拟的是后端「实时指标」接口的行为：
 * - GET  /idc/metrics          → getMetrics()，返回一次全国快照
 * - SSE  /idc/metrics/stream   → subscribe(listener)，每 2.5s 推送一次快照
 * - GET  /idc/rooms            → listRooms()
 * - 内部：getRoomRacks(roomId) 给 mock/rooms.js 提供某机房的机柜状态快照
 * 接真实后端时，把 api.js 里对应函数换成 request / EventSource 调用即可，
 * 返回结构保持本文件注释里的字段不变。
 *
 * 实现方式：一次性生成全部机柜与设备的静态结构，之后每 2.5s 做一次随机游走，
 * 模拟温度 / 功耗 / U 位占用的小幅波动，并按需翻转机柜状态。
 * 定时器由首个订阅者启动、最后一个订阅者离开时停止，
 * 避免多个页面同时挂载时定时器叠加。
 *
 * Rack 结构（rackStates 内部件，也是 L1 指标与机房页的共同数据源）：
 * { id, siteId, roomId, row, rowIndex, status, uUsed, uTotal,
 *   powerKw, ratedPowerKw, loadPct, tempIn, tempOut, humidity,
 *   devices: [{ id, name, model, type, uStart, uSize, status }] }
 */
import { DEVICE_TYPES, SEVERITY, U_TOTAL } from '../constants';
import { SITES, roomGeometry } from './geo';

/** 随机游走步长上限 */
const WALK = {
    temp: 0.18,
    power: 0.12,
    humidity: 0.4,
};

/** mulberry32：固定种子的伪随机，保证每次刷新布局一致 */
function createRandom(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const round = (v, digits = 1) => {
    const p = Math.pow(10, digits);
    return Math.round(v * p) / p;
};

const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

/** 各设备类型的 U 位规格候选（查表替代嵌套三元） */
const SIZE_TABLE = {
    storage: [4, 6, 8],
    network: [1, 2],
    default: [1, 2, 4],
};

/** 按设备类型生成演示型号（if 链替代嵌套三元；每条路径恰好消耗一次 rnd） */
function genModel(type, rnd) {
    if (type === 'server') return `R4900-G${Math.ceil(rnd() * 3)}`;
    if (type === 'storage') return `OceanStor-${Math.ceil(rnd() * 5)}00`;
    if (type === 'network') return `CE68${Math.ceil(rnd() * 8)}0`;
    return `USG-${Math.ceil(rnd() * 6)}00`;
}

/** 在 42U 内顺序摆放设备，返回设备清单与已用 U 数（1U 在底部，自下而上连续排布） */
function packDevices(rackId, targetUsed, rnd) {
    const devices = [];
    let cursor = 1;
    let seq = 1;
    while (cursor <= targetUsed) {
        const type = pick(DEVICE_TYPES, rnd);
        const sizeTable = SIZE_TABLE[type] || SIZE_TABLE.default;
        let size = pick(sizeTable, rnd);
        if (cursor + size - 1 > U_TOTAL) size = U_TOTAL - cursor + 1;
        if (size <= 0) break;
        const status = rnd() < 0.03 ? 'warning' : 'normal';
        devices.push({
            id: `${rackId}-U${cursor}`,
            name: `${type.toUpperCase()}-${String(seq).padStart(2, '0')}`,
            model: genModel(type, rnd),
            type,
            uStart: cursor,
            uSize: size,
            status,
        });
        cursor += size;
        seq += 1;
    }
    return devices;
}

/**
 * RackState：
 * { rack: Rack, ratedPowerKw: number, pinned: 'offline'|'alarm'|null }
 * pinned 表示该机柜被人工指定为告警/离线，随机游走不得覆盖。
 */
/** 设施排的柜名（rowSpec.kind 指定整排柜型，如 UPS间/配电间） */
const FACILITY_NAME = {
    ups: 'UPS电池柜',
    power: '配电柜',
    aircon: '精密空调',
    storage: '存储柜',
};

function buildRoomRacks(site, room) {
    const { rowZ, rackX } = roomGeometry(room.rows);
    const alarmSet = new Set(room.alarmRacks || []);
    const offlineSet = new Set(room.offlineRacks || []);
    const states = [];

    room.rows.forEach((rowSpec, rowIndex) => {
        for (let i = 0; i < rowSpec.count; i += 1) {
            const index = i + 1;
            const id = `${rowSpec.row}-${String(index).padStart(2, '0')}`;

            // 设施排（rowSpec.kind 指定整排柜型：UPS间/配电间等辅助房间）：
            // 无设备无 U 位、指标给正常小值（powerKw>0 保证汇总/告警聚合不碰 null）
            if (rowSpec.kind) {
                states.push({
                    ratedPowerKw: room.ratedPowerPerRackKw,
                    pinned: null,
                    rack: {
                        id,
                        siteId: site.id,
                        roomId: room.id,
                        row: rowSpec.row,
                        rowIndex: index,
                        x: rackX(i, rowSpec.count),
                        z: rowZ.get(rowSpec.row) || 0,
                        rot: 0,
                        kind: rowSpec.kind,
                        name: FACILITY_NAME[rowSpec.kind] || rowSpec.kind,
                        status: 'normal',
                        uUsed: 0,
                        uTotal: 0,
                        powerKw: 1.5,
                        ratedPowerKw: room.ratedPowerPerRackKw,
                        loadPct: 15,
                        tempIn: 23,
                        tempOut: 25,
                        humidity: 45,
                        devices: [],
                    },
                });
                continue;
            }

            const rnd = createRandom(
                room.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 1000 +
                    rowIndex * 100 +
                    index
            );
            const offline = offlineSet.has(id);
            const alarm = alarmSet.has(id);
            // if 链替代嵌套三元；rnd 消耗顺序与原实现严格一致（种子数据不变）
            let loadPct = 0;
            let fillRatio = 0;
            if (!offline) {
                if (alarm) {
                    loadPct = 82 + rnd() * 14;
                    fillRatio = 0.9;
                } else {
                    loadPct = 30 + rnd() * 45;
                    fillRatio = 0.45 + rnd() * 0.4;
                }
            }
            const uUsed = Math.round(U_TOTAL * fillRatio);
            const devices = offline ? [] : packDevices(id, uUsed, rnd);
            const realUsed = devices.reduce((sum, d) => sum + d.uSize, 0);
            const baseTemp = 22 + rnd() * 4 + (alarm ? 5.5 : 0);
            const ratedPowerKw = room.ratedPowerPerRackKw;

            let pinned = null;
            let status = 'normal';
            if (offline) {
                pinned = 'offline';
                status = 'offline';
            } else if (alarm) {
                pinned = 'alarm';
                status = 'alarm';
            }

            states.push({
                ratedPowerKw,
                pinned,
                rack: {
                    id, // 主键 机柜编号（C-08）。全局唯一（腾挪跨房不改 id，跨房定位靠它）
                    siteId: site.id,
                    roomId: room.id, //  外键/索引 当前所在机房（腾挪 = 改这个字段 + 改坐标）
                    row: rowSpec.row,
                    rowIndex: index,
                    x: rackX(i, rowSpec.count),
                    z: rowZ.get(rowSpec.row) || 0,
                    rot: 0,
                    status,
                    uUsed: realUsed,
                    uTotal: U_TOTAL,
                    powerKw: round((ratedPowerKw * loadPct) / 100, 2),
                    ratedPowerKw,
                    loadPct: round(loadPct),
                    tempIn: round(baseTemp),
                    tempOut: round(baseTemp + 3 + rnd() * 2.5),
                    humidity: round(42 + rnd() * 10),
                    devices,
                },
            });
        }
    });
    return states;
}

/** 全量机柜状态，按机房分组保存 */
const rackStates = new Map();

SITES.forEach(site => {
    site.rooms.forEach(room => {
        rackStates.set(room.id, buildRoomRacks(site, room));
    });
});

function worst(list) {
    return list.reduce((acc, s) => (SEVERITY[s] > SEVERITY[acc] ? s : acc), 'normal');
}

/**
 * MachineRoom 结构：
 * { id, name, siteId, lng, lat, width, depth, status, rackTotal,
 *   uUsed, uTotal, powerKw, ratedPowerKw, tempAvg, pue, alarmCount,
 *   auxiliary }  —— auxiliary=true 为辅助房间（UPS间/配电间等）：
 *   不出现在城市点位图与机房简表（城市点位是"机房"，辅助间进楼层视图才见）
 */
function buildRoom(site, room, states) {
    const racks = states.map(s => s.rack);
    const alarmCount = racks.filter(r => r.status === 'alarm').length;
    const online = racks.filter(r => r.status !== 'offline');
    const rated = online.reduce((sum, r) => sum + r.ratedPowerKw, 0);
    const geo = roomGeometry(room.rows);
    return {
        id: room.id, // 主键 如 ZH-R1，前端路由 query 与全链关联键
        name: room.name,
        siteId: site.id, // 外键
        lng: room.lng,
        lat: room.lat,
        width: geo.w,
        depth: geo.d,
        status: worst(racks.map(r => r.status)),
        rackTotal: racks.length,
        uUsed: racks.reduce((sum, r) => sum + r.uUsed, 0),
        uTotal: racks.length * U_TOTAL,
        powerKw: round(online.reduce((sum, r) => sum + r.powerKw, 0)),
        ratedPowerKw: round(rated),
        tempAvg: round(online.length ? online.reduce((s, r) => s + r.tempIn, 0) / online.length : 0),
        pue: room.level === 'edge' ? site.pue + 0.06 : site.pue,
        alarmCount,
        auxiliary: !!room.auxiliary,
    };
}

/**
 * Site 结构：
 * { id, name, adcode, province, city, provinceAdcode, level, lng, lat,
 *   roomCount, status, rackTotal, rackOnline, uUsed, uTotal, powerKw,
 *   ratedPowerKw, pue, tempAvg, humidity, alarmCount, offlineCount, rooms }
 */
function buildSite(site) {
    console.log('site in runtime', site)
    const rooms = site.rooms.map(room => buildRoom(site, room, rackStates.get(room.id) || []));
    const powerKw = rooms.reduce((s, r) => s + r.powerKw, 0);
    const pue = powerKw ? rooms.reduce((s, r) => s + r.pue * r.powerKw, 0) / powerKw : site.pue;
    const racks = [];
    site.rooms.forEach(rm => {
        (rackStates.get(rm.id) || []).forEach(x => racks.push(x.rack));
    });
    return {
        id: site.id, // 主键
        name: site.name, // 全国地图上显示的机房总名称
        adcode: site.adcode, // 珠海市 行政区编码，地图下钻的主键。与json文件名对齐
        province: site.province, // 省名称。点击时反查adcode
        city: site.city, // 市名称。点击时反查adcode
        provinceAdcode: site.provinceAdcode, // 省份编码
        level: site.level, // core 核心 / region 区域 / edge 边缘（影响 PUE 基准与展示）地图上点的样式不一样
        lng: site.lng, // 经度
        lat: site.lat, // 纬度
        // 机房数不含辅助间（UPS间/配电间是楼层里的配套房间，不是独立机房点位）；
        // rackTotal 等资产汇总保留全部（辅助间的柜子是真实资产）
        roomCount: rooms.filter(r => !r.auxiliary).length,
        status: worst(rooms.map(r => r.status)),
        rackTotal: rooms.reduce((s, r) => s + r.rackTotal, 0),
        rackOnline: rooms.reduce(
            (s, r) => s + (rackStates.get(r.id) || []).filter(x => x.rack.status !== 'offline').length,
            0
        ),
        uUsed: rooms.reduce((s, r) => s + r.uUsed, 0),
        uTotal: rooms.reduce((s, r) => s + r.uTotal, 0),
        powerKw: round(powerKw),
        ratedPowerKw: round(rooms.reduce((s, r) => s + r.ratedPowerKw, 0)),
        pue: round(pue, 2),
        tempAvg: round(rooms.length ? rooms.reduce((s, r) => s + r.tempAvg, 0) / rooms.length : 0),
        humidity: round(racks.length ? racks.reduce((s, r) => s + r.humidity, 0) / racks.length : 0),
        alarmCount: rooms.reduce((s, r) => s + r.alarmCount, 0),
        offlineCount: rooms.reduce(
            (s, r) => s + (rackStates.get(r.id) || []).filter(x => x.rack.status === 'offline').length,
            0
        ),
        rooms,
    };
}

/**
 * Summary 结构：
 * { siteTotal, roomTotal, rackTotal, rackOnline, uUsed, uTotal,
 *   powerKw, ratedPowerKw, avgPue, alarmCount, offlineCount }
 */
function buildSummary(sites) {
    const powerKw = sites.reduce((s, x) => s + x.powerKw, 0);
    return {
        siteTotal: sites.length,
        roomTotal: sites.reduce((s, x) => s + x.roomCount, 0),
        rackTotal: sites.reduce((s, x) => s + x.rackTotal, 0),
        rackOnline: sites.reduce((s, x) => s + x.rackOnline, 0),
        uUsed: sites.reduce((s, x) => s + x.uUsed, 0),
        uTotal: sites.reduce((s, x) => s + x.uTotal, 0),
        powerKw: round(powerKw),
        ratedPowerKw: round(sites.reduce((s, x) => s + x.ratedPowerKw, 0)),
        avgPue: round(powerKw ? sites.reduce((s, x) => s + x.pue * x.powerKw, 0) / powerKw : 0, 2),
        alarmCount: sites.reduce((s, x) => s + x.alarmCount, 0),
        offlineCount: sites.reduce((s, x) => s + x.offlineCount, 0),
    };
}

const ALARM_TEMPLATES = {
    temp: r => ({
        title: '进风温度超阈值',
        detail: `${r.id} 进风 ${r.tempIn}℃，超过上限 27℃`,
    }),
    power: r => ({
        title: '单机柜功率超限',
        detail: `${r.id} 实测 ${r.powerKw}kW，额定 ${r.ratedPowerKw}kW`,
    }),
    offline: r => ({
        title: '机柜失联',
        detail: `${r.id} 采集中断，最后心跳 ${new Date(Date.now() - 600 * 1000).toLocaleTimeString()}`,
    }),
};

/**
 * Alarm 结构：
 * { id, siteId, siteName, roomId, rackId, level: 'critical'|'warning',
 *   title, detail, ts }
 */
/** rackId → 稳定的"距现在 N 秒"偏移（0~480s），保证告警排序跨刷新不跳变 */
function stableSec(id) {
    let h = 0;
    for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h % (8 * 60);
}

function buildAlarms(sites) {
    const list = [];
    sites.forEach(site => {
        site.rooms.forEach(room => {
            (rackStates.get(room.id) || []).forEach(({ rack }) => {
                if (rack.status === 'offline') {
                    const t = ALARM_TEMPLATES.offline(rack);
                    list.push({
                        id: `${rack.id}-offline`,
                        siteId: site.id,
                        siteName: site.name,
                        roomId: room.id,
                        rackId: rack.id,
                        level: 'critical',
                        title: t.title,
                        detail: t.detail,
                        ts: Date.now() - 9 * 60 * 1000,
                    });
                } else if (rack.status === 'alarm') {
                    const hot = rack.tempIn > 28;
                    const t = hot ? ALARM_TEMPLATES.temp(rack) : ALARM_TEMPLATES.power(rack);
                    list.push({
                        id: `${rack.id}-alarm`,
                        siteId: site.id,
                        siteName: site.name,
                        roomId: room.id,
                        rackId: rack.id,
                        level: hot ? 'critical' : 'warning',
                        title: t.title,
                        detail: t.detail,
                        // ts 偏移量按 rackId 稳定散列（不能用 Math.random：真实推送后
                        // 每 2.5s 会重排告警列表，读起来在跳动）
                        ts: Date.now() - stableSec(rack.id) * 1000,
                    });
                }
            });
        });
    });
    return list.sort((a, b) => b.ts - a.ts);
}

let snapshot = null;

/**
 * Metrics 结构（GET /idc/metrics 的返回体）：
 * { summary, sites, alarms, ts }
 */
function refresh() {
    const sites = SITES.map(buildSite);
    snapshot = {
        summary: buildSummary(sites),
        sites,
        alarms: buildAlarms(sites),
        ts: Date.now(),
    };
    return snapshot;
}

/** 随机游走：温度、功耗、湿度小幅波动，偶发预警态；游走后把新快照推给全部订阅者 */
function walk() {
    rackStates.forEach(states => {
        states.forEach(state => {
            const r = state.rack;
            if (r.status === 'offline') return;
            r.tempIn = round(Math.min(34, Math.max(19, r.tempIn + (Math.random() - 0.5) * WALK.temp * 2)));
            r.tempOut = round(Math.max(r.tempIn + 1.5, r.tempOut + (Math.random() - 0.5) * WALK.temp * 2));
            r.humidity = round(
                Math.min(65, Math.max(35, r.humidity + (Math.random() - 0.5) * WALK.humidity * 2))
            );
            r.powerKw = round(
                Math.min(state.ratedPowerKw, Math.max(0.4, r.powerKw + (Math.random() - 0.5) * WALK.power * 2)),
                2
            );
            r.loadPct = round((r.powerKw / state.ratedPowerKw) * 100);
            if (!state.pinned) {
                // 未固定的机柜在临界区随机进出预警态，让画面有呼吸感
                const hot = r.tempIn > 27.5 || r.loadPct > 92;
                r.status = hot ? 'warning' : 'normal';
            }
        });
    });
    // ⚠️ 模拟 SSE 的关键一步：游走后必须把新快照推给订阅者。
    // （原 idcMap 版缺这一步——walk 只换 snapshot 不通知，订阅者除首帧永远收不到推送）
    const snap = refresh();
    listeners.forEach(fn => fn(snap));
}

let timer = null;
const listeners = new Set();

/** 【接口数据】订阅实时指标（模拟 SSE 推送），返回解绑函数 */
export function subscribe(listener) {
    listeners.add(listener);
    listener(snapshot || refresh());
    if (!timer) timer = setInterval(walk, 25000);
    return () => {
        listeners.delete(listener);
        if (!listeners.size && timer) {
            clearInterval(timer);
            timer = null;
        }
    };
}

/** 【接口数据】拉取一次当前快照，等价 GET /idc/metrics */
export function getMetrics() {
    return snapshot || refresh();
}

/**
 * 【内部】取某机房全部机柜状态的快照（rackStates 的深拷贝），
 * 给 mock/rooms.js 组装 Room 模型用。拷贝的意义：2.5s 随机游走在原地改
 * rackStates，页面拿到的是进入时刻的稳定快照，不会被后台游走悄悄改掉。
 * @returns {Array|null} RackState 快照数组；roomId 不存在返回 null
 */
export function getRoomRacks(roomId) {
    const states = rackStates.get(roomId);
    if (!states) return null;
    return states.map(s => ({ ...s.rack, devices: s.rack.devices.map(d => ({ ...d })) }));
}

/** 【接口数据】列出全部机房，供页面做机房切换，等价 GET /idc/rooms */
export function listRooms() {
    const out = [];
    SITES.forEach(site => {
        site.rooms.forEach(room => {
            // 辅助房间不进机房简表（腾挪目标/缺省机房应是设备机房；
            // 辅助间经楼层视图或直链 query.room 访问）
            if (room.auxiliary) return;
            const { w, d } = roomGeometry(room.rows);
            const racks = (rackStates.get(room.id) || []).map(s => s.rack);
            out.push({
                id: room.id,
                name: room.name,
                siteId: site.id,
                siteName: site.name,
                rackTotal: racks.length,
                width: w,
                depth: d,
            });
        });
    });
    console.log('out全部机房', out)
    return out;
}
