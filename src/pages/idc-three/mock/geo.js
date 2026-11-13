/**
 * 站点静态台账（mock，自包含副本）
 *
 * 【接口数据】真实项目里这部分来自 CMDB 接口（建议 GET /idc/sites），
 * 只保留「不随时间变化」的字段；功耗、温度、告警数等动态指标由 runtime.js 推进。
 *
 * 站点结构说明（对应 GET /idc/sites 返回项）：
 * {
 *   id, name, adcode, province, city, provinceAdcode,
 *   lng, lat,                  // 站点定位点，全国地图散点坐标
 *   level: 'core'|'region'|'edge',
 *   pue, // 能效基准
 *   rooms: [{
 *     id, name, siteId, level, 
 *     lng, lat, // 点位坐标
 *     rows: [{ row: 'A', count: 8 }],   // 排列号 + 该排列机柜数。排乘数量
 *     ratedPowerPerRackKw,               // 单机柜额定功率 kW
 *     alarmRacks?: string[],             // 人为指定的告警机柜
 *     offlineRacks?: string[]            // 人为指定的离线机柜
 *   }]
 * }
 */
import { RACK_PITCH_X, ROW_PITCH_Z } from '../constants';

export const SITES = [
    {
        id: 'ZH', // 主键
        name: '珠海机房',
        city: '珠海市', // 市名称。点击时反查adcode
        adcode: '440400', // 珠海市 行政区编码，地图下钻的主键。与json文件名对齐
        province: '广东省', // 省名称。点击时反查adcode
        provinceAdcode: '440000', // 省份编码
        lng: 113.57, // 经度
        lat: 22.27, // 纬度
        level: 'core', // core 核心 / region 区域 / edge 边缘（影响 PUE 基准与展示）地图上点的样式不一样
        pue: 1.38, // 站点能效基准值（如 1.37），机房 PUE 按级别微调。评价数据中心“绿色程度”和“运营效率”的关键指标，越低越好
        rooms: [
            {
                id: 'ZH-R1', // 主键 如 ZH-R1，前端路由 query 与全链关联键
                name: '主机房A', // 照参考图（原「珠海一号机房」， roomId 不变）
                siteId: 'ZH', // 外键
                level: 'core', // 同站点 level（edge 机房 PUE 会 +0.06）
                lng: 113.543, // 经度
                lat: 22.221, // 纬度
                rows: [
                    { row: 'A', count: 30 },
                    { row: 'B', count: 30 },
                    { row: 'C', count: 30 },
                    { row: 'D', count: 30 },
                    { row: 'E', count: 30 },
                    { row: 'F', count: 30 },
                    { row: 'G', count: 30 },
                    { row: 'H', count: 5 },
                ],
                ratedPowerPerRackKw: 8,
                alarmRacks: ['B-03', 'D-06'], // 告警机柜
                offlineRacks: ['C-07'], // 离线机柜
                doors: [
                    { wall: 'N', offset: 9.6, width: 1.8, label: '主入口' },
                    { wall: 'W', offset: 12.6, width: 1.0, label: '应急门' },
                    { wall: 'E', offset: 12.6, width: 1.0, label: '应急门' },
                ],
            },
            {
                id: 'ZH-R2',
                name: '主机房B', // 照参考图（原「珠海二号机房」，roomId 不变）
                siteId: 'ZH',
                level: 'region',
                lng: 113.574,
                lat: 22.271,
                rows: [
                    { row: 'A', count: 6 },
                    { row: 'B', count: 6 },
                    { row: 'C', count: 6 },
                ],
                ratedPowerPerRackKw: 6,
                alarmRacks: ['C-02'],
                doors: [{ wall: 'N', offset: 2.4, width: 1.2, label: '主入口' }],
            },
            {
                // 辅助房间（设施排）：rows 配 kind → 整排设施柜，无设备无 U 位
                id: 'ZH-UPS',
                name: 'UPS间',
                siteId: 'ZH',
                auxiliary: true, // 辅助房间：不出现在城市点位图/机房简表（楼层视图/直链可见）
                level: 'core',
                lng: 113.543,
                lat: 22.221,
                rows: [
                    { row: 'A', count: 4, kind: 'ups' },
                    { row: 'B', count: 4, kind: 'ups' },
                ],
                ratedPowerPerRackKw: 4,
            },
            {
                id: 'ZH-PD',
                name: '其他配电间',
                siteId: 'ZH',
                auxiliary: true, // 辅助房间：不出现在城市点位图/机房简表（楼层视图/直链可见）
                level: 'core',
                lng: 113.543,
                lat: 22.221,
                rows: [{ row: 'A', count: 3, kind: 'power' }],
                ratedPowerPerRackKw: 4,
            },
            {
                id: 'ZH-BF',
                name: '备份间',
                siteId: 'ZH',
                auxiliary: true, // 辅助房间：不出现在城市点位图/机房简表（楼层视图/直链可见）
                level: 'region',
                lng: 113.543,
                lat: 22.221,
                rows: [{ row: 'A', count: 3, kind: 'storage' }],
                ratedPowerPerRackKw: 4,
            },
        ],
        // 楼层布局（需求 11 / L1.5 楼层视图）：照「珠海本部」参考图摆放——
        // 主机房A（大）居左，右侧一列依次 UPS间 / 配电间+备份间 / 主机房B。
        // 未配置 floorLayout 的站点由 mock/floors.js 自动布局（横排 + 走廊间隔）。
        floorLayout: [
            { roomId: 'ZH-R1', x: 0, z: 0 },
            { roomId: 'ZH-UPS', x: 21.5, z: 0 },
            { roomId: 'ZH-PD', x: 21.5, z: 13 },
            { roomId: 'ZH-BF', x: 25.5, z: 13 },
            { roomId: 'ZH-R2', x: 21.5, z: 24 },
        ],
    },
    {
        id: 'HZ',
        name: '杭州机房',
        adcode: '330100',
        province: '浙江省',
        city: '杭州市',
        provinceAdcode: '330000',
        lng: 120.21,
        lat: 30.25,
        level: 'core',
        pue: 1.41,
        rooms: [
            {
                id: 'HZ-R1',
                name: '杭州一号机房',
                siteId: 'HZ',
                level: 'core',
                lng: 120.21,
                lat: 30.25,
                rows: [
                    { row: 'A', count: 8 },
                    { row: 'B', count: 8 },
                    { row: 'C', count: 8 },
                    { row: 'D', count: 8 },
                    { row: 'E', count: 8 },
                    { row: 'F', count: 8 },
                ],
                ratedPowerPerRackKw: 10,
                alarmRacks: ['A-05', 'C-01', 'E-04'],
                offlineRacks: ['F-08'],
                doors: [
                    { wall: 'N', offset: 3.0, width: 1.8, label: '主入口' },
                    { wall: 'S', offset: 3.0, width: 1.2, label: '消防通道' },
                ],
            },
            {
                id: 'HZ-R2',
                name: '杭州二号机房',
                siteId: 'HZ',
                level: 'region',
                lng: 120.32,
                lat: 30.28,
                rows: [
                    { row: 'A', count: 7 },
                    { row: 'B', count: 7 },
                    { row: 'C', count: 7 },
                    { row: 'D', count: 7 },
                ],
                ratedPowerPerRackKw: 8,
                alarmRacks: ['B-05'],
                doors: [
                    { wall: 'N', offset: 2.7, width: 1.5, label: '主入口' },
                    { wall: 'W', offset: 8.0, width: 1.0, label: '应急门' },
                ],
            },
        ],
    },
    {
        id: 'SH',
        name: '上海机房',
        // 直辖市没有地级市层，下钻底图直接用市级 310000 的区县级边界（同北京 110000、天津 120000）
        adcode: '310000',
        province: '上海市',
        city: '上海市',
        provinceAdcode: '310000',
        lng: 121.47,
        lat: 31.23,
        level: 'core',
        pue: 1.37,
        rooms: [
            {
                id: 'SH-R1',
                name: '张江一号机房',
                siteId: 'SH',
                level: 'core',
                lng: 121.6,
                lat: 31.205,
                rows: [
                    { row: 'A', count: 8 },
                    { row: 'B', count: 8 },
                    { row: 'C', count: 8 },
                    { row: 'D', count: 8 },
                    { row: 'E', count: 8 },
                    { row: 'F', count: 8 },
                ],
                ratedPowerPerRackKw: 10,
                alarmRacks: ['B-02', 'E-05'],
                offlineRacks: ['D-08'],
                // 门（Room 级属性，可选）：wall 四面墙 / offset 门中心沿墙米数（从靠西北端量）
                // / width 门宽 / label 门上标签。没配 doors 的房间不画门（向后兼容）
                doors: [
                    { wall: 'N', offset: 2.7, width: 1.8, label: '主入口' },
                    { wall: 'E', offset: 9.2, width: 1.0, label: '应急门' },
                ],
            },
            {
                id: 'SH-R2',
                name: '闵行二号机房',
                siteId: 'SH',
                level: 'region',
                lng: 121.38,
                lat: 31.0,
                rows: [
                    { row: 'A', count: 7 },
                    { row: 'B', count: 7 },
                    { row: 'C', count: 7 },
                    { row: 'D', count: 7 },
                ],
                ratedPowerPerRackKw: 8,
                alarmRacks: ['C-04'],
                doors: [
                    { wall: 'N', offset: 2.7, width: 1.5, label: '主入口' },
                    { wall: 'E', offset: 8.0, width: 1.0, label: '应急门' },
                ],
            },
        ],
        // 楼层布局（需求 11）：张江大机房 + 闵行机房错位相邻（其余站点自动布局）
        floorLayout: [
            { roomId: 'SH-R1', x: 0, z: 0 },
            { roomId: 'SH-R2', x: 10, z: 3 },
        ],
    },
    {
        id: 'CD',
        name: '成都机房',
        adcode: '510100',
        province: '四川省',
        city: '成都市',
        provinceAdcode: '510000',
        lng: 104.07,
        lat: 30.57,
        level: 'region',
        pue: 1.45,
        rooms: [
            {
                id: 'CD-R1',
                name: '成都一号机房',
                siteId: 'CD',
                level: 'region',
                lng: 104.066,
                lat: 30.572,
                rows: [
                    { row: 'A', count: 8 },
                    { row: 'B', count: 8 },
                    { row: 'C', count: 8 },
                    { row: 'D', count: 8 },
                    { row: 'E', count: 8 },
                ],
                ratedPowerPerRackKw: 8,
                alarmRacks: ['E-02'],
                offlineRacks: ['B-06'],
                doors: [
                    { wall: 'N', offset: 3.0, width: 1.8, label: '主入口' },
                    { wall: 'E', offset: 9.2, width: 1.0, label: '应急门' },
                ],
            },
            {
                id: 'CD-R2',
                name: '成都二号机房',
                siteId: 'CD',
                level: 'edge',
                lng: 104.13,
                lat: 30.62,
                rows: [
                    { row: 'A', count: 6 },
                    { row: 'B', count: 6 },
                    { row: 'C', count: 6 },
                ],
                ratedPowerPerRackKw: 6,
                doors: [{ wall: 'N', offset: 2.4, width: 1.2, label: '主入口' }],
            },
        ],
    },
    {
        id: 'BJ',
        name: '北京机房',
        adcode: '110000',
        province: '北京市',
        city: '北京市',
        provinceAdcode: '110000',
        lng: 116.41,
        lat: 39.9,
        level: 'core',
        pue: 1.36,
        rooms: [
            {
                id: 'BJ-R1',
                name: '北京一号机房',
                siteId: 'BJ',
                level: 'core',
                lng: 116.44,
                lat: 39.92,
                rows: [
                    { row: 'A', count: 8 },
                    { row: 'B', count: 8 },
                    { row: 'C', count: 8 },
                    { row: 'D', count: 8 },
                    { row: 'E', count: 8 },
                    { row: 'F', count: 8 },
                ],
                ratedPowerPerRackKw: 10,
                alarmRacks: ['A-02', 'D-07'],
                doors: [
                    { wall: 'N', offset: 3.0, width: 1.8, label: '主入口' },
                    { wall: 'W', offset: 10.0, width: 1.0, label: '应急门' },
                ],
            },
            {
                id: 'BJ-R2',
                name: '北京二号机房',
                siteId: 'BJ',
                level: 'region',
                lng: 116.3,
                lat: 39.85,
                rows: [
                    { row: 'A', count: 7 },
                    { row: 'B', count: 7 },
                    { row: 'C', count: 7 },
                    { row: 'D', count: 7 },
                ],
                ratedPowerPerRackKw: 8,
                offlineRacks: ['B-05'],
                doors: [
                    { wall: 'N', offset: 2.7, width: 1.5, label: '主入口' },
                    { wall: 'E', offset: 8.0, width: 1.0, label: '应急门' },
                ],
            },
        ],
    },
    {
        id: 'WQ',
        name: '武清机房',
        // 武清是天津下辖区，下钻底图沿用天津市（120000）区县级边界
        adcode: '120000',
        province: '天津市',
        city: '天津市',
        provinceAdcode: '120000',
        lng: 117.04,
        lat: 39.38,
        level: 'core',
        pue: 1.39,
        rooms: [
            {
                id: 'WQ-R1',
                name: '武清一号机房',
                siteId: 'WQ',
                level: 'core',
                lng: 117.03,
                lat: 39.38,
                rows: [
                    { row: 'A', count: 8 },
                    { row: 'B', count: 8 },
                    { row: 'C', count: 8 },
                    { row: 'D', count: 8 },
                ],
                ratedPowerPerRackKw: 10,
                alarmRacks: ['B-04'],
                doors: [
                    { wall: 'N', offset: 3.0, width: 1.8, label: '主入口' },
                    { wall: 'S', offset: 3.0, width: 1.0, label: '应急门' },
                ],
            },
            {
                id: 'WQ-R2',
                name: '武清二号机房',
                siteId: 'WQ',
                level: 'edge',
                lng: 117.1,
                lat: 39.42,
                rows: [
                    { row: 'A', count: 6 },
                    { row: 'B', count: 6 },
                    { row: 'C', count: 6 },
                ],
                ratedPowerPerRackKw: 6,
                doors: [{ wall: 'N', offset: 2.4, width: 1.2, label: '主入口' }],
            },
        ],
    },
    {
        id: 'XA',
        name: '西安机房',
        adcode: '610100',
        province: '陕西省',
        city: '西安市',
        provinceAdcode: '610000',
        lng: 108.94,
        lat: 34.34,
        level: 'region',
        pue: 1.43,
        rooms: [
            {
                id: 'XA-R1',
                name: '西安一号机房',
                siteId: 'XA',
                level: 'region',
                lng: 108.9,
                lat: 34.34,
                rows: [
                    { row: 'A', count: 8 },
                    { row: 'B', count: 8 },
                    { row: 'C', count: 8 },
                    { row: 'D', count: 8 },
                    { row: 'E', count: 8 },
                ],
                ratedPowerPerRackKw: 8,
                alarmRacks: ['C-03'],
                offlineRacks: ['E-06'],
                doors: [
                    { wall: 'N', offset: 3.0, width: 1.8, label: '主入口' },
                    { wall: 'E', offset: 9.2, width: 1.0, label: '应急门' },
                ],
            },
            {
                id: 'XA-R2',
                name: '西安二号机房',
                siteId: 'XA',
                level: 'edge',
                lng: 109.0,
                lat: 34.4,
                rows: [
                    { row: 'A', count: 6 },
                    { row: 'B', count: 6 },
                    { row: 'C', count: 6 },
                ],
                ratedPowerPerRackKw: 6,
                doors: [{ wall: 'N', offset: 2.4, width: 1.2, label: '主入口' }],
            },
        ],
    },
];

/** adcode → 站点，地图下钻时按行政区划码定位 */
export const SITE_BY_ADCODE = new Map(SITES.map(s => [s.adcode, s]));

export const SITE_BY_ID = new Map(SITES.map(s => [s.id, s]));

export function findRoom(roomId) {
    for (const site of SITES) {
        const hit = site.rooms.find(r => r.id === roomId);
        if (hit) return hit;
    }
    return null;
}

/** 由排列配置推算机房物理尺寸与排列 z 坐标（米，原点在机房中心） */
export function roomGeometry(rows) {
    const maxCount = Math.max.apply(null, rows.map(r => r.count));
    const w = maxCount * RACK_PITCH_X + 4;
    const d = rows.length * ROW_PITCH_Z + 5;
    const rowZ = new Map();
    rows.forEach((r, i) => {
        rowZ.set(r.row, ((rows.length - 1) / 2 - i) * ROW_PITCH_Z);
    });
    const rackX = (index, count) => (index - (count - 1) / 2) * RACK_PITCH_X;
    return { w, d, rowZ, rackX };
}
