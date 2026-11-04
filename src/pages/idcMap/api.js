/* eslint-env node */
/**
 * 机房可视化数据入口（Vue2 版）
 *
 * 【接口数据】视图层只 import 本文件，所有函数都对应一个真实后端接口。
 * 当前实现走本地 mock（mock/runtime.js），接真实后端时把函数体换成
 * request 调用即可，函数签名与返回结构保持不变。
 *
 * 接口清单：
 *   GET  /idc/geo/{adcode}_full.json   → getGeoJson(adcode)   行政区划边界
 *   GET  /idc/metrics                  → getMetricsSnapshot() 全国指标快照
 *   SSE  /idc/metrics/stream           → subscribeMetrics()   实时指标推送（2.5s/次）
 *   GET  /idc/sites                    → getSites()           站点列表
 *   GET  /idc/rooms                    → getRooms()           机房简表
 *   GET  /idc/room/floorplan?roomId=xx → getFloorplan()       机房平面图
 */
import {
    getFloorplan as readFloorplan,
    getMetrics,
    listRooms,
    subscribe,
} from './mock/runtime';

/**
 * 【接口数据】加载行政区划边界 GeoJSON
 *
 * 数据源：public/geo/{adcode}_full.json（阿里 DataV.GeoAtlas 下载后本地化）。
 * 必须用 BASE_URL 拼接：项目 base 为相对路径且使用 hash 路由，
 * 直接 fetch('geo/xx.json') 会跟着当前 URL 解析，刷新即 404。
 *
 * @param {string} adcode 行政区划码，如 '100000'（全国）、'330100'（杭州）
 * @returns {Promise<object>} GeoJSON FeatureCollection
 */
export function getGeoJson(adcode) {
    const base = typeof process !== 'undefined' && process.env && process.env.BASE_URL
        ? process.env.BASE_URL
        : '/';
    const url = `${base}geo/${adcode}_full.json`;
    // 真实接口形如：return request.get(`/idc/geo/${adcode}`)
    return fetch(url).then(res => {
        if (!res.ok) throw new Error(`加载地图数据失败：${adcode}（${res.status}）`);
        return res.json();
    });
}

/**
 * 【接口数据】全国汇总 + 各站点当前指标
 * 等价 GET /idc/metrics，返回 Metrics { summary, sites, links, alarms, ts }
 */
export function getMetricsSnapshot() {
    return getMetrics();
}

/**
 * 【接口数据】订阅实时指标，返回解绑函数
 * 等价 SSE / WebSocket 推送，每 2.5s 回调一次 Metrics
 *
 * @param {(m: object) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeMetrics(listener) {
    return subscribe(listener);
}

/** 【接口数据】站点列表，等价 GET /idc/sites（当前从快照里取） */
export function getSites() {
    return getMetrics().sites;
}

/** 【接口数据】按行政区划码取站点 */
export function getSiteByAdcode(adcode) {
    return getMetrics().sites.find(s => s.adcode === adcode);
}

/** 【接口数据】按站点 id 取站点 */
export function getSiteById(id) {
    return getMetrics().sites.find(s => s.id === id);
}

/** 【接口数据】机房简表，用于页面上的机房切换，等价 GET /idc/rooms */
export function getRooms() {
    return listRooms();
}

/**
 * 【接口数据】机房平面图，等价 GET /idc/room/floorplan?roomId=xxx
 * @returns {object|null} Floorplan，roomId 不存在时返回 null
 */
export function getFloorplan(roomId) {
    // 真实接口形如：return request.get('/idc/room/floorplan', { params: { roomId } })
    return readFloorplan(roomId);
}

export { DEVICE_TYPE_LABEL, STATUS_LABEL, LEVEL_LABEL } from './constants';
