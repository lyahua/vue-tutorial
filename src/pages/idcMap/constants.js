/**
 * 机房可视化的常量与配色约定（Vue2 版）
 *
 * 状态色与温度色阶在平面图、地图、抽屉里必须一致，
 * 否则同一个机柜在两处颜色不同，看的人会误判。
 */

export const U_TOTAL = 42;

/** 机柜外形尺寸（米）：宽沿 x，深沿 z */
export const RACK_W = 1.2;
export const RACK_D = 1.1;

/** 同排列内机柜中心间距（米） */
export const RACK_PITCH_X = 1.9;

/** 相邻排列中心间距（米） */
export const ROW_PITCH_Z = 3.0;

/** 设备类型池，权重按出现次数体现 */
export const DEVICE_TYPES = ['server', 'server', 'server', 'server', 'storage', 'storage', 'network', 'security'];

export const DEVICE_TYPE_LABEL = {
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

/** 状态严重度，取站点/机房状态时比较用 */
export const SEVERITY = {
    offline: 3,
    alarm: 2,
    warning: 1,
    normal: 0,
};

export const STATUS_COLOR = {
    normal: '#22c55e',
    warning: '#eab308',
    alarm: '#ef4444',
    offline: '#64748b',
};

export const DEVICE_COLOR = {
    server: '#3b82f6',
    storage: '#8b5cf6',
    network: '#06b6d4',
    security: '#f97316',
};

/**
 * 图表底色，与平面图共用，保证两页视觉连续。
 * 取值必须与 idc-theme.less 的结构层一一对应，改一边不改另一边，
 * 地图和面板就会出现两个色。
 *
 * transparent 给 ECharts 的 option.backgroundColor 用：暗底与渐变由外层 DOM
 * 容器负责，图表自己再铺一层实色就会把渐变盖掉。
 */
export const CANVAS = {
    bg: '#0c1130',
    panel: '#141a3f',
    border: '#26305e',
    text: '#dbe2ff',
    textDim: '#7c88b8',
    accent: '#409eff',
    // 图表浮层底色收口在这里，避免五个组件各写一遍 rgba 字面量
    tooltipBg: 'rgba(20, 26, 63, 0.94)',
    transparent: 'transparent',
    // 底图面/边界色：靛蓝家族，比面板亮一档但不与状态色撞车
    geoArea: '#202a5c',
    geoBorder: '#5566c0',
    geoAreaEmphasis: '#3a4aa8',
    // 平面图线框
    wall: '#3a478a',
    zone: '#2a3468',
    zoneLabel: '#5f6b9c',
    splitLine: '#1b2350',
};

/**
 * 品牌靛蓝与荣誉金，供 canvas 侧使用，取值与 idc-theme.less 的
 * @idc-primary / @idc-primary-deep / @idc-primary-bright / @idc-gold 一一对应。
 * 只给装饰与荣誉标记用。上一版是品牌红，与 STATUS_COLOR.alarm 色相几乎重合，
 * 换成靛蓝后红色在图上只剩「告警」一个含义。
 */
export const BRAND = {
    base: '#667eea',
    deep: '#2749e1',
    bright: '#9cabf1',
    gold: '#d4a24c',
};

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** 品牌靛蓝加透明度，canvas 侧替代 rgba 硬编码 */
export function brandAlpha(a) {
    const [r, g, b] = hexToRgb(BRAND.base);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** 温度色阶：进风温度 ℃ → 颜色 */
const TEMP_STOPS = [
    [21.5, '#3b82f6'],
    [24.5, '#22d3ee'],
    [27, '#22c55e'],
    [29, '#eab308'],
    [30.5, '#f59e0b'],
    [32, '#ef4444'],
];

/** 线性插值取温度色，超出两端取端点色 */
export function tempColor(t) {
    if (t <= TEMP_STOPS[0][0]) return TEMP_STOPS[0][1];
    const last = TEMP_STOPS[TEMP_STOPS.length - 1];
    if (t >= last[0]) return last[1];
    for (let i = 0; i < TEMP_STOPS.length - 1; i += 1) {
        const pair0 = TEMP_STOPS[i];
        const pair1 = TEMP_STOPS[i + 1];
        if (t >= pair0[0] && t <= pair1[0]) {
            const k = (t - pair0[0]) / (pair1[0] - pair0[0]);
            const a = hexToRgb(pair0[1]);
            const b = hexToRgb(pair1[1]);
            return rgbToHex(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
        }
    }
    return last[1];
}

export const TEMP_GRADIENT = TEMP_STOPS.map(pair => `${pair[1]} ${pair[0]}℃`).join(' → ');

/** 站点等级文案 */
export const LEVEL_LABEL = {
    core: '核心',
    region: '区域',
    edge: '边缘',
};

/** 告警级别 → Element UI tag type */
export const ALARM_LEVEL = {
    critical: { label: '严重', type: 'danger' },
    warning: { label: '警告', type: 'warning' },
};
