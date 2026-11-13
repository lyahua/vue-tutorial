/**
 * 机房领域层（纯常量与几何公式，不取数、不生成）
 *
 * 模型定义见 开发文档.md 第五章 / 入手教程.md 第一章：
 * Room  { id, name, siteId, siteName, gridRows, gridCols, racks[] }
 * Rack  { id, name, kind, row, col, facing, uTotal, status, 指标…, devices[] }
 * Device{ id, rackId, name, model, vendor, sn, category, startU, uSize, status, components[] }
 *
 * 数据生成在 mock/rooms.js（getRoom 直接产出上述 Room 格式）；
 * 布局规则：机柜稀疏摆放在地板网格上（放哪格哪格有柜，没放的格子就是空地），
 * 1 格 = 600mm 防静电地板，相邻排朝向交替（面对面 → 自动生成封闭冷通道）。
 */

// —— 尺寸约定（米）：600mm 防静电地板一格 ——
export const METRIC = {
    RACK_W: 0.6, // 机柜宽 = 一格
    RACK_D: 1.1, // 机柜深
    RACK_H: 2.2, // 42U 机柜高
    AISLE_D: 1.2, // 通道宽（冷通道）
};
/** 相邻排列的 z 向间距：机柜深 + 通道 */
export const ROW_PITCH = METRIC.RACK_D + METRIC.AISLE_D;
export const U_TOTAL = 42;

export const RACK_KIND_LABEL = {
    compute: '设备机柜',
    network: '网络机柜',
    storage: '存储机柜',
    aircon: '空调机柜',
    power: '配电机柜',
    ups: 'UPS电池柜',
    empty: '预留柜位',
};

export const DEV_CATEGORY_LABEL = {
    server: '服务器',
    storage: '存储',
    network: '网络',
    security: '安全',
};

export const STATUS_LABEL = {
    normal: '正常',
    warning: '预警',
    alarm: '告警',
    offline: '离线',
};

// ==========================================================================
//  可更换配件（M4）：每个设备挂 components[]，型号从型号池确定性挑选
//  （同一设备 id 每次生成相同配件，配合 mock/parts.js 的更换记录实现会话级持久）
// ==========================================================================

export const PART_KIND_LABEL = {
    cpu: 'CPU',
    mem: '内存',
    disk: '硬盘',
    psu: '电源',
    fan: '风扇',
};

/** 各类型设备的配件槽位模板（更换弹框的表格行就来自这里） */
export const PART_SPECS = {
    server: [
        { kind: 'cpu', slots: ['CPU-1', 'CPU-2'] },
        { kind: 'mem', slots: ['DIMM-A1', 'DIMM-A2', 'DIMM-B1', 'DIMM-B2'] },
        { kind: 'disk', slots: ['DISK-0', 'DISK-1', 'DISK-2', 'DISK-3'] },
        { kind: 'psu', slots: ['PSU-1', 'PSU-2'] },
        { kind: 'fan', slots: ['FAN-1', 'FAN-2', 'FAN-3', 'FAN-4'] },
    ],
    security: [
        { kind: 'cpu', slots: ['CPU-1'] },
        { kind: 'mem', slots: ['DIMM-A1', 'DIMM-A2'] },
        { kind: 'disk', slots: ['DISK-0', 'DISK-1'] },
        { kind: 'psu', slots: ['PSU-1', 'PSU-2'] },
    ],
    network: [
        { kind: 'mem', slots: ['DIMM-A1'] },
        { kind: 'psu', slots: ['PSU-1', 'PSU-2'] },
        { kind: 'fan', slots: ['FAN-1', 'FAN-2'] },
    ],
    storage: [
        { kind: 'disk', slots: ['DISK-0', 'DISK-1', 'DISK-2', 'DISK-3'] },
        { kind: 'psu', slots: ['PSU-1', 'PSU-2'] },
    ],
};

/** 配件型号池（更换弹框的候选型号也从这里取） */
export const PART_MODEL_POOL = {
    cpu: ['Xeon Gold 6338', 'Xeon Silver 4410Y', 'EPYC 9354'],
    mem: ['DDR4 32GB RDIMM', 'DDR5 64GB RDIMM'],
    disk: ['NVMe SSD 1.92TB', 'SAS HDD 4TB', 'NVMe SSD 3.84TB'],
    psu: ['1200W 铂金冗余', '800W 钛金冗余'],
    fan: ['涡轮风扇模组 V2', '高速风扇模组 V3'],
};

/**
 * 网格坐标 → 世界坐标（three 场景用的坐标）。
 *
 * ┌──────────────── 坐标体系（俯视示意）────────────────┐
 * │  网格原点在世界 (0,0)，x 向东（列 col 增大），z 向南（行 row 增大）
 * │
 * │        col=0   col=1   col=2   col=3          ← 机柜占一格（600mm）
 * │  row0 [空调]  [配电]  [UPS]   (空)             ← 设施排（贴北侧）
 * │  row1 (空)    (空)    (空)    (空)             ← 空隔
 * │  row2 [A-01] [A-02] [A-03] [A-04] facing S     ← 设备排，朝 +z
 * │  row3 [B-01] [B-02] (空)   [B-03] facing N     ← 朝 -z，与 row2 面对面
 * │        ↑ row2/row3 之间 = 封闭冷通道（弧罩+端门）
 * │  row4 [C-01] [C-02] [C-03] [C-04] facing S
 * │  ...
 * │
 * │  定位公式（cellCenter）：
 * │    x = (col + 0.5) * RACK_W          —— 机柜中心在格子正中
 * │    z = (row + 0.5) * ROW_PITCH       —— ROW_PITCH = 柜深 + 通道宽
 * │    y = RACK_H / 2（在 buildRoom 里加）—— 机柜中心在半高处，底贴地板
 * └──────────────────────────────────────────────────────┘
 *
 * 放哪格哪个格才有柜子：racks 数组里没有的 (row, col) 就是空地，
 * 不满排/断行/留通道都是"少放几个"自然形成的，不需要额外配置。
 */
export function cellCenter(row, col) {
    return { x: (col + 0.5) * METRIC.RACK_W, z: (row + 0.5) * ROW_PITCH };
}

/** Room 模型 → 地板尺寸（米）：宽 = 格数×600mm，深 = 行数×排距 */
export function roomSize(model) {
    return { w: model.gridCols * METRIC.RACK_W, d: model.gridRows * ROW_PITCH };
}

/**
 * 机柜朝向 → 前脸法线的 z 符号。
 * facing 'S' = 前脸朝 +z（南），'N' = 前脸朝 -z（北）。
 * 相邻排交替 S/N → 面对面 → 中间那条就是封闭冷通道（进风面朝冷通道是标准气流组织）。
 */
export function facingSign(facing) {
    return facing === 'N' ? -1 : 1;
}

// ==========================================================================
//  门（Room 级属性）：room.doors = [{ wall, offset, width, label? }]
//  wall   'N'|'S'|'E'|'W' 四面墙（与 row/col 同一方向语义）
//  offset 门中心沿墙的米数——北/南墙从西端往东量，东/西墙从北端往南量
//         （统一「从靠西北的那头起量」，与网格坐标共用西北角参考点）
//  width  门宽（单门 1.0 / 双开 1.8，米）
//  label  可选文字标签（主入口 / 应急门…），渲染在门顶上方
// ==========================================================================

/** 门位置 → 世界坐标（门中心）。size 为 roomSize() 产物 { w, d } */
export function doorCenter(door, size) {
    if (door.wall === 'S') return { x: door.offset, z: size.d };
    if (door.wall === 'W') return { x: 0, z: door.offset };
    if (door.wall === 'E') return { x: size.w, z: door.offset };
    return { x: door.offset, z: 0 }; // 'N'
}
