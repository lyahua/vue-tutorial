/**
 * 设计令牌的 JS 桥（配合 styles/index.scss 的 :root CSS 自定义属性）
 *
 * 用法约定（见 开发文档.md 6.1）：
 * - JS / ECharts 需要颜色时用 cssVar('--idc3-xxx') 读取，
 *   不允许在组件 JS 里写颜色字面量 —— 唯一来源是 _tokens.scss；
 * - 必须在组件 mounted 之后的渲染函数里调用（此时全局样式已注入），
 *   不要在模块顶层调用（dev 模式样式注入晚于模块求值）；
 * - withAlpha() 用来给 rgb() 令牌加透明度（ECharts 的 areaColor/边框常用）。
 */

const cache = new Map();

/**
 * 读取一条设计令牌。
 * @param {string} name CSS 自定义属性名，如 '--idc3-bg-map'
 * @returns {string} 形如 'rgb(5, 5, 93)' 的颜色串；样式未就绪时返回空串（不缓存）
 */
export function cssVar(name) {
    const hit = cache.get(name);
    if (hit !== undefined) return hit;
    const value = (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim();
    if (!value) return '';
    cache.set(name, value);
    return value;
}

/** 换肤 / 热更新后清缓存（当前主题静态，预留） */
export function resetTokenCache() {
    cache.clear();
}

/**
 * 给 rgb()/rgba() 颜色加透明度。
 * @param {string} color 如 'rgb(31, 87, 163)'
 * @param {number} alpha 0~1
 * @returns {string} 'rgba(31, 87, 163, 0.4)'；入参不是 rgb 族颜色时原样返回
 */
export function withAlpha(color, alpha) {
    const m = /^rgba?\(([^)]+)\)$/i.exec(String(color));
    if (!m) return color;
    const parts = m[1].split(',').map(s => s.trim());
    if (parts.length < 3) return color;
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

/**
 * ECharts 主题（每次调用现取令牌，保证与 CSS 一致）。
 * 返回结构与各图表组件约定的字段如下，加字段请同步 _tokens.scss。
 */
export function chartTheme() {
    return {
        transparent: 'transparent',
        // 地图
        mapArea: cssVar('--idc3-map-area'),
        mapAreaEmphasis: cssVar('--idc3-map-area-emphasis'),
        provinceBorder: cssVar('--idc3-border-province'),
        glow: cssVar('--idc3-glow'),
        // 文字
        text: cssVar('--idc3-text'),
        textDim: cssVar('--idc3-text-dim'),
        // 浮层
        tooltipBg: cssVar('--idc3-tooltip-bg'),
        tooltipBorder: cssVar('--idc3-tooltip-border'),
        // 分割线 / 边框
        splitLine: cssVar('--idc3-split-line'),
        border: cssVar('--idc3-border-block'),
        // 语义状态
        status: {
            normal: cssVar('--idc3-status-normal'),
            warning: cssVar('--idc3-status-warning'),
            alarm: cssVar('--idc3-status-alarm'),
            offline: cssVar('--idc3-status-offline'),
        },
        // 荣誉金
        gold: cssVar('--idc3-gold'),
    };
}

/**
 * 3D 场景主题（M3）：机柜/设备类型色 + 场景色 + 状态色，
 * three 侧所有材质颜色都从这里取（含 Canvas 纹理绘制）。
 */
export function sceneTheme() {
    return {
        bg: cssVar('--idc3-scene-bg'),
        floor: cssVar('--idc3-floor'),
        floorGrid: cssVar('--idc3-floor-grid'),
        coldAisle: cssVar('--idc3-cold-aisle'),
        cover: cssVar('--idc3-cover'),
        door: cssVar('--idc3-door'),
        glow: cssVar('--idc3-glow'),
        text: cssVar('--idc3-text'),
        textDim: cssVar('--idc3-text-dim'),
        title: cssVar('--idc3-title'),
        rack: {
            compute: cssVar('--idc3-rack-compute'),
            network: cssVar('--idc3-rack-network'),
            storage: cssVar('--idc3-rack-storage'),
            aircon: cssVar('--idc3-rack-aircon'),
            power: cssVar('--idc3-rack-power'),
            ups: cssVar('--idc3-rack-ups'),
            empty: cssVar('--idc3-rack-empty'),
        },
        dev: {
            server: cssVar('--idc3-dev-server'),
            storage: cssVar('--idc3-dev-storage'),
            network: cssVar('--idc3-dev-network'),
            security: cssVar('--idc3-dev-security'),
        },
        status: {
            normal: cssVar('--idc3-status-normal'),
            warning: cssVar('--idc3-status-warning'),
            alarm: cssVar('--idc3-status-alarm'),
            offline: cssVar('--idc3-status-offline'),
        },
    };
}
