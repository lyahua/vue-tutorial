/**
 * idc-three 数据入口（自包含版：整个文件夹拷到真实项目即可用）
 *
 * 【接口数据】视图层只 import 本文件；接真实后端时只改这里的函数体，
 * 函数签名与返回结构不变，组件零改动。
 * ★ 换后端的操作手册：《后端对接文档.md》第八节「接口切换指南」——
 *   含逐函数对照表、字段映射写法（适配器）、SSE 换法、换完的清理清单。
 *   判据永远只有一条：本文件吐出的结构 = 每个函数 JSDoc 里的 @returns。
 *
 * 接口清单（每个函数头上都有完整返回结构标注）：
 *   GET  /idc/geo/{adcode}_full.json          → getGeoJson(adcode)       行政区划边界
 *   GET  /idc/metrics                         → getMetricsSnapshot()     全国指标快照
 *   SSE  /idc/metrics/stream                  → subscribeMetrics()       实时指标推送（2.5s/次）
 *   GET  /idc/rooms                           → getRooms()               机房简表
 *   GET  /idc/room?roomId=xx                  → getRoom()                机房 Room 模型（稀疏网格）
 *   GET  /idc/floor?siteId=xx                 → getFloor()               站点楼层模型（需求 11 楼层视图）
 *   POST /idc/room/{roomId}/layout            → saveRoomLayout()         保存布局（M5 编辑器/整房导入）
 *   POST /idc/room/{roomId}/rack/import       → importRack()             按机柜导入（M5 需求 8）
 *   POST /idc/rack/transfer                   → transferRack()           机柜跨房腾挪（M5 需求 7）
 *   POST /idc/device/{id}/component/{id}/replace → replaceComponent()    更换配件（M4）
 *
 * 当前实现：全部走本地 mock（./mock/），数据结构见各 mock 文件头部注释。
 */
import { getMetrics, listRooms, subscribe } from './mock/runtime';
import { getRoom as readRoom } from './mock/rooms';
import { getFloor as readFloor } from './mock/floors';
import { addOrReplaceRack, removeRack, saveRoomLayout as saveLayout } from './mock/roomEdits';

/**
 * 【接口数据】加载行政区划边界 GeoJSON
 *
 * 数据源：public/geo/{adcode}_full.json（阿里 DataV.GeoAtlas 下载后本地化，
 * 内网部署拿不到 CDN，外链地图必然白屏）。
 * 用 document.baseURI 拼接：项目使用 hash 路由，直接 fetch('geo/xx.json')
 * 会跟着当前 URL 解析，深链刷新即 404；baseURI 恒指向 index.html，
 * 等价于 webpack 的 BASE_URL 且不依赖 node 环境。
 *
 * @param {string} adcode 行政区划码，如 '100000'（全国）、'330100'（杭州）
 * @returns {Promise<object>} GeoJSON FeatureCollection（标准格式，后端无需实现）：
 *   {
 *     type: 'FeatureCollection',
 *     features: [{ type: 'Feature', properties: { adcode, name, … }, geometry: { type, coordinates } }]
 *   }
 */
export function getGeoJson(adcode) {
    const url = new URL(`geo/${adcode}_full.json`, document.baseURI).toString();
    // 真实接口形如：return request.get(`/idc/geo/${adcode}`)
    return fetch(url).then(res => {
        if (!res.ok) throw new Error(`加载地图数据失败：${adcode}（${res.status}）`);
        return res.json();
    });
}

/**
 * 【接口数据】全国汇总 + 各站点当前指标（L1 指标条/地图/榜单/告警流的数据源）。
 * 等价 GET /idc/metrics。
 *
 * @returns {object} Metrics 快照，结构（完整示例见 后端对接文档.md 第三节 R2）：
 *   {
 *     summary: {                              —— 全国汇总（KPI 条）
 *       siteTotal: number,                    站点数
 *       roomTotal: number,                    机房数
 *       rackTotal: number,                    机柜总数
 *       rackOnline: number,                   在线机柜数（总数-离线）
 *       uUsed: number, uTotal: number,        已用 U / 总 U
 *       powerKw: number, ratedPowerKw: number, 总功耗 / 总额定功率（kW）
 *       avgPue: number,                       功率加权平均 PUE
 *       alarmCount: number, offlineCount: number
 *     },
 *     sites: Array<{                          —— 站点（地图散点/下钻）
 *       id: string, name: string,             站点代号（如 'SH'）/ 展示名
 *       adcode: string, province: string, city: string, provinceAdcode: string,
 *       lng: number, lat: number,             全国地图散点坐标
 *       level: 'core'|'region'|'edge',
 *       status: 'normal'|'warning'|'alarm'|'offline',   站点级状态=机柜最严重态
 *       roomCount: number, rackTotal: number, rackOnline: number,
 *       uUsed: number, uTotal: number, powerKw: number, ratedPowerKw: number,
 *       pue: number, tempAvg: number, humidity: number,
 *       alarmCount: number, offlineCount: number,
 *       rooms: Array<{                        —— 机房（城市视图点位）
 *         id: string, name: string, siteId: string,
 *         lng: number, lat: number,
 *         status: string, rackTotal: number,
 *         uUsed: number, uTotal: number, powerKw: number, ratedPowerKw: number,
 *         tempAvg: number, pue: number, alarmCount: number
 *       }>
 *     }>,
 *     alarms: Array<{                         —— 实时告警（告警流，点击直达机柜）
 *       id: string,                           告警 id（如 'B-02-alarm'）
 *       siteId: string, siteName: string,
 *       roomId: string, rackId: string,       告警所在机房/机柜（跳转定位用）
 *       level: 'critical'|'warning',
 *       title: string, detail: string,
 *       ts: number                            毫秒时间戳
 *     }>,
 *     ts: number                              快照生成时间戳
 *   }
 */
export function getMetricsSnapshot() {
    return getMetrics();
}

/**
 * 【接口数据】订阅实时指标（等价 SSE /idc/metrics/stream，2.5s 推送一次）。
 * 订阅时会立即同步回调一次（「连接即推首帧」的 SSE 语义）。
 *
 * @param {(m: object) => void} listener 回调参数结构同 getMetricsSnapshot 的返回值
 * @returns {() => void} unsubscribe 解绑函数（页面销毁时调用）
 */
export function subscribeMetrics(listener) {
    return subscribe(listener);
}

/**
 * 【接口数据】机房简表（腾挪向导的目标机房列表 / 缺省机房）。
 * 等价 GET /idc/rooms。
 *
 * @returns {Array<object>} 机房数组，每项：
 *   {
 *     id: string,        机房 id（如 'SH-R1'，路由与关联键）
 *     name: string,      展示名
 *     siteId: string, siteName: string,
 *     rackTotal: number, 机柜数
 *   }
 */
export function getRooms() {
    console.log('getRooms-listRooms()', listRooms())
    return listRooms();
}

/**
 * 【接口数据】机房 Room 模型（稀疏网格，3D / 2D 共用，机房页的唯一数据输入）。
 * 等价 GET /idc/room?roomId=xxx。
 *
 * @param {string} roomId
 * @returns {object|null} Room 四级树（roomId 不存在返回 null）：
 *   {
 *     id: string, name: string, siteId: string, siteName: string,
 *     gridRows: number, gridCols: number,     地板网格行列数（1 格 = 600mm）
 *     doors: Array<{                        —— 门（Room 级，可选，无门为 []）
 *       wall: 'N'|'S'|'E'|'W',              四面墙（与 row/col 同一方向语义）
 *       offset: number,                     门中心沿墙米数（北/南墙从西端量、东/西墙从北端量）
 *       width: number,                      门宽（单门 1.0 / 双开 1.8）
 *       label: string,                      可选门上文字（主入口/应急门）
 *     }>,
 *     racks: Array<{                          —— 机柜（row/col 为 0 起算整数，见 model.js cellCenter）
 *       id: string, name: string,
 *       kind: 'compute'|'network'|'storage'|'aircon'|'power'|'ups'|'empty',  柜型（决定颜色）
 *       row: number, col: number,             网格坐标（原点西北角，col 东 row 南）
 *       facing: 'S'|'N',                      前脸朝向（相邻排交替 = 冷通道）
 *       uTotal: number, uUsed: number,        U 位总数 / 已用（设施柜 uTotal=0）
 *       status: 'normal'|'warning'|'alarm'|'offline',
 *       powerKw: number, ratedPowerKw: number, loadPct: number,   实时指标
 *       tempIn: number, humidity: number,
 *       devices: Array<{                      —— 设备（U 位区间，1U 在底部自下而上）
 *         id: string, rackId: string, name: string,
 *         category: 'server'|'storage'|'network'|'security',  设备类型（U 位色块颜色）
 *         model: string, vendor: string, sn: string,
 *         startU: number, uSize: number,      起始 U / 占用 U 数（区间不重叠）
 *         status: 'normal'|'warning',
 *         components: Array<{                 —— 可更换配件（M4 弹框数据源）
 *           id: string,                       `${deviceId}::${slot}`
 *           kind: 'cpu'|'mem'|'disk'|'psu'|'fan',
 *           slot: string,                     槽位号（'CPU-1' / 'DIMM-A1' …）
 *           model: string,                    当前型号（更换后写回）
 *           status: 'ok'|'fault',
 *           replacedAt: number|null           最近更换时间戳，null=从未换过
 *         }>
 *       }>
 *     }>
 *   }
 */
export function getRoom(roomId) {
    console.log('getRoom-readRoom(roomId)', readRoom(roomId))
    return readRoom(roomId);
}

/**
 * 【接口数据】站点楼层模型（需求 11 / L1.5 楼层视图：站点下所有机房摆一张平面，
 * 点房间进单机房详情）。等价 GET /idc/floor?siteId=xxx。
 *
 * 房间摆放来源：site 级 floor_layout 台账（JSON 列或独立表，一次性配置）；
 * 未配置时后端可自行排布（前端 mock 为横排 + 3m 走廊）。
 *
 * @param {string} siteId 站点 id（如 'ZH'）
 * @returns {object|null} Floor 模型（siteId 不存在返回 null）：
 *   {
 *     siteId: string, siteName: string, name: string,   楼层视图标题
 *     rooms: Array<{
 *       roomId: string, name: string,
 *       x: number, z: number,          房间西北角在楼层平面上的位置（米，原点任意）
 *       w: number, d: number,          房间宽深（= gridCols×0.6 / gridRows×2.3）
 *       status: 'normal'|'warning'|'alarm'|'offline',   房内最严重机柜状态（标题色）
 *       racks: Array<{                 —— 机柜概要（楼层 LOD 实例化渲染，无设备明细）
 *         id: string, kind: string, status: string, row: number, col: number
 *       }>
 *     }>
 *   }
 */
export function getFloor(siteId) {
    return readFloor(siteId);
}

/**
 * 【接口数据】保存机房布局（M5 布局编辑器 / 整房导入，事务性全量替换：
 * 库里该房机柜以本次提交为准——少的删除、有的 upsert）。
 * 等价 POST /idc/room/{roomId}/layout。
 *
 * @param {string} roomId
 * @param {Array<object>} racks 完整机柜数组（结构同 getRoom 返回的 racks，含设备）
 * @param {Array<object>} [doors] 门配置（整房导入可能带；缺省保留已有门），
 *   每项 { wall: 'N'|'S'|'E'|'W', offset: 门中心沿墙米数, width: 门宽, label?: 文字 }
 * @returns {{ code: number }} code=0 成功；失败由 HTTP 4xx + 错误列表表达（整单回滚）
 */
export function saveRoomLayout(roomId, racks, doors) {
    return saveLayout(roomId, racks, doors);
}

/**
 * 【接口数据】按机柜粒度导入（M5 需求 8：增量 merge，不触碰其他机柜）。
 * 等价 POST /idc/room/{roomId}/rack/import。
 * 冲突策略：rackId 已存在时 conflict='overwrite' 整柜替换、'skip' 跳过；
 * 目标格被占一律拒绝。
 *
 * @param {string} roomId
 * @param {object} rack 完整机柜对象（结构同 getRoom 返回的 racks 元素）
 * @param {{ conflict?: 'overwrite'|'skip' }} [options]
 * @returns {{ code: number, action?: 'added'|'replaced'|'skipped', msg?: string }}
 *   code=0 成功（action 标明动作）；code=1 失败（msg 为原因）
 */
export function importRack(roomId, rack, options) {
    const room = readRoom(roomId);
    if (!room) return { code: 1, msg: '机房不存在' };
    const existing = room.racks.find(r => r.id === rack.id);
    if (existing && (!options || options.conflict !== 'overwrite')) {
        return { code: 0, action: 'skipped' };
    }
    const taken = room.racks.some(r => r.row === rack.row && r.col === rack.col && r.id !== rack.id);
    if (taken) return { code: 1, msg: `目标格 (${rack.row}, ${rack.col}) 已被占用` };
    addOrReplaceRack(roomId, rack);
    return { code: 0, action: existing ? 'replaced' : 'added' };
}

/**
 * 【接口数据】机柜跨房腾挪（M5 需求 7：源房移除 + 目标房放置，id 不变，
 * 设备配件跟随）。等价 POST /idc/rack/transfer。
 *
 * @param {{ rack: object, fromRoomId: string, toRoomId: string, row: number, col: number, facing: 'S'|'N' }} payload
 *   rack 为完整机柜对象（结构同 getRoom 返回的 racks 元素）
 * @returns {{ code: number, msg?: string }} code=0 成功；code=1 失败（目标格占用/机房不存在）
 */
export function transferRack(payload) {
    const { rack, fromRoomId, toRoomId, row, col, facing } = payload;
    const target = readRoom(toRoomId);
    if (!target) return { code: 1, msg: '目标机房不存在' };
    const taken = target.racks.some(r => r.row === row && r.col === col);
    if (taken) return { code: 1, msg: `目标格 (${row}, ${col}) 已被占用` };
    removeRack(fromRoomId, rack.id);
    addOrReplaceRack(toRoomId, { ...rack, row, col, facing });
    return { code: 0 };
}

/**
 * 【接口数据】更换配件（M4：确认事件走接口；fault 件修复时后端同步
 * device.status='normal'）。等价 POST /idc/device/{deviceId}/component/{componentId}/replace。
 *
 * @param {string} deviceId 设备 id
 * @param {string} componentId 配件 id（`${deviceId}::${slot}`）
 * @param {{ model: string }} payload 新型号
 * @returns {Promise<{ code: number, data: { model: string, replacedAt: number }, deviceId: string }>}
 *   replacedAt 为毫秒时间戳（写回配件行 + 更换审计日志）
 */
export { replaceComponent } from './mock/parts';
