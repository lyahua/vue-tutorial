/**
 * 配件更换接口 mock（M4）
 *
 * 【接口数据】本文件模拟后端「更换配件」接口：
 *   POST /idc/device/{deviceId}/component/{componentId}/replace
 *   body: { model: 新型号 }
 *   返回: { code: 0, data: { model, replacedAt } }
 *
 * 接真实后端时把 api.js 里的 replaceComponent 换成 request 调用即可。
 *
 * 更换记录保存在模块级 Map（componentId → { model, replacedAt }）：
 * mock/rooms.js 每次 getRoom 组装 Room 时都会合并这份记录——页面重建/路由往返后，
 * 已更换的配件型号与时间不丢（mock 会话级持久化）。
 */

/** componentId → { model, replacedAt } */
const replaced = new Map();

/** 查询某配件的更换记录（无记录返回 null） */
export function getReplaced(componentId) {
    return replaced.get(componentId) || null;
}

/**
 * 【接口数据】更换配件（模拟 300ms 接口耗时）
 * @param {string} deviceId 设备 id
 * @param {string} componentId 配件 id（`${deviceId}::${slot}`）
 * @param {{ model: string }} payload 新型号
 * @returns {Promise<{code:number, data:{model:string, replacedAt:number}}>}
 */
export function replaceComponent(deviceId, componentId, payload) {
    return new Promise(resolve => {
        setTimeout(() => {
            const rec = {
                model: payload && payload.model,
                replacedAt: Date.now(),
            };
            replaced.set(componentId, rec);
            resolve({ code: 0, data: rec, deviceId });
        }, 300);
    });
}
