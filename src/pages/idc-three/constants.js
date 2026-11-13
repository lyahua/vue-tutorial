/**
 * idc-three 公共常量（自包含，从 idcMap/constants.js 摘取本模块用到的部分）
 *
 * 说明：RACK_* / ROW_PITCH_Z 这组是 mock 楼宇台账（geo.js/runtime.js）推算
 * 2D 平面尺寸用的旧约定（宽 1.2m 的展示尺寸）；3D 场景的真实机柜尺寸
 * 以 room/model.js 的 METRIC（600mm 标准）为准，两者互不影响。
 */

export const U_TOTAL = 42;

/** 机柜外形尺寸（米）：宽沿 x，深沿 z（mock 平面图约定） */
export const RACK_W = 1.2;
export const RACK_D = 1.1;

/** 同排列内机柜中心间距（米） */
export const RACK_PITCH_X = 1.9;

/** 相邻排列中心间距（米） */
export const ROW_PITCH_Z = 3.0;

/** 设备类型池，权重按出现次数体现 */
export const DEVICE_TYPES = ['server', 'server', 'server', 'server', 'storage', 'storage', 'network', 'security'];

/** 状态严重度，取站点/机房状态时比较用 */
export const SEVERITY = {
    offline: 3,
    alarm: 2,
    warning: 1,
    normal: 0,
};
