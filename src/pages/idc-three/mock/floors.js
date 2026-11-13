/**
 * 站点楼层模型（需求 11 / L1.5 楼层视图，mock）
 *
 * 【接口数据】getFloor(siteId) 等价 GET /idc/floor?siteId=xxx：
 * 站点下所有机房摆到一张楼层平面上的「沙盘模型」数据——
 * 房间位置尺寸 + 房内机柜概要（不含设备/U 位明细，点房间进 L3 room 页再看）。
 *
 * Floor 结构（渲染层 floor/three/buildFloor.js 的输入）：
 * {
 *   siteId: string, siteName: string, name: string,   楼层视图标题
 *   rooms: Array<{
 *     roomId: string, name: string,
 *     x: number, z: number,        房间西北角在楼层平面上的位置（米，楼层坐标系原点任意）
 *     w: number, d: number,        房间宽深（= gridCols×0.6 / gridRows×2.3，getRoom 推导）
 *     status: 'normal'|'warning'|'alarm'|'offline',   房内机柜最严重状态（房间标题色）
 *     racks: Array<{ id, kind, status, row, col }>,   机柜概要（LOD 实例化渲染用）
 *   }>
 * }
 *
 * 房间摆放来源：
 * 1. geo.js 站点级 floorLayout（手配，珠海/上海照参考图摆）；
 * 2. 未配置的站点自动布局：横排、每行最多 3 间、间隔 3m 走廊。
 * 真实后端：floorLayout 属站点级台账，建议 site 表一列 JSON 或独立
 * idc_floor_layout 表（一次性配置，见 后端对接文档）。
 */
import { SITE_BY_ID } from './geo';
import { getRoom } from './rooms';
import { SEVERITY } from '../constants';

/** 自动布局：横排摆放（每行 3 间，走廊 3m），返回 roomId → {x, z} */
function autoLayout(rooms, sizeOf) {
    const GAP = 3;
    const layout = new Map();
    let x = 0;
    let z = 0;
    let rowMaxD = 0;
    rooms.forEach((room, i) => {
        const { w, d } = sizeOf(room.id);
        layout.set(room.id, { x, z });
        rowMaxD = Math.max(rowMaxD, d);
        x += w + GAP;
        if ((i + 1) % 3 === 0) {
            x = 0;
            z += rowMaxD + GAP;
            rowMaxD = 0;
        }
    });
    return layout;
}

/** 房间内机柜最严重状态（offline > alarm > warning > normal，按 SEVERITY 排序） */
function worstStatus(racks) {
    let worst = 'normal';
    racks.forEach(r => {
        if (SEVERITY[r.status] > SEVERITY[worst]) worst = r.status;
    });
    return worst;
}

/**
 * 【接口数据】取站点楼层模型。
 * @param {string} siteId 站点 id（如 'ZH'）
 * @returns {object|null} Floor 模型；siteId 不存在返回 null
 */
export function getFloor(siteId) {
    const site = SITE_BY_ID.get(siteId);
    if (!site) return null;

    // 房间尺寸从 getRoom 推导（含编辑记录后的最新布局）
    const sizeOf = roomId => {
        const room = getRoom(roomId);
        return { w: room.gridCols * 0.6, d: room.gridRows * 2.3 };
    };

    // 摆放位置：手配 floorLayout 优先，缺省自动布局
    const configured = new Map((site.floorLayout || []).map(f => [f.roomId, { x: f.x, z: f.z }]));
    const auto = configured.size ? null : autoLayout(site.rooms, sizeOf);

    const rooms = site.rooms.map(room => {
        const full = getRoom(room.id);
        const { w, d } = sizeOf(room.id);
        const pos = configured.get(room.id) || auto.get(room.id) || { x: 0, z: 0 };
        return {
            roomId: room.id,
            name: room.name,
            x: pos.x,
            z: pos.z,
            w,
            d,
            status: worstStatus(full.racks),
            // 机柜概要：楼层视图 LOD 实例化渲染只需要这四个字段
            racks: full.racks.map(r => ({ id: r.id, kind: r.kind, status: r.status, row: r.row, col: r.col })),
        };
    });

    return {
        siteId: site.id,
        siteName: site.name,
        name: `${site.name}楼层视图`,
        rooms,
    };
}
