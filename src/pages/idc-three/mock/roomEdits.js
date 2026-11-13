/**
 * 机房布局编辑持久层（mock，M5）
 *
 * 【接口数据】模拟后端对机房布局的全部"写操作"：
 * - POST /idc/room/{roomId}/layout        → saveRoomLayout()（编辑器保存 / 整房导入，全量替换）
 * - POST /idc/room/{roomId}/rack          → addOrReplaceRack()（按机柜导入 / 腾挪入）
 * - POST /idc/rack/transfer               → 配合 api.js 的 transferRack（移出 + 移入两步）
 *
 * 持久化结构（模块级 Map，会话级——与 parts.js 的更换记录同一套路）：
 *   roomId → {
 *     moves:   { [rackId]: { row, col, facing } }   位置微调（编辑器逐柜移动）
 *     added:   Rack[]                                追加的机柜（新增/腾挪入/导入覆盖）
 *     removed: rackId[]                              从基础数据里剔除的机柜（删除/腾挪出）
 *     full:    Rack[] | null                         全量覆盖（编辑器整体保存 / 整房导入）
 *   }
 * mock/rooms.js 的 getRoom 在基础生成后应用这些记录；
 * full 存在时优先于 moves/added/removed（整体替换语义）。
 */

/** roomId → 编辑记录 */
const edits = new Map();

function editRecord(roomId) {
    if (!edits.has(roomId)) {
        edits.set(roomId, { moves: {}, added: [], removed: [], full: null });
    }
    return edits.get(roomId);
}

/** 取某机房的编辑记录（无记录返回 null，rooms.js 据此跳过合并） */
export function getRoomEdits(roomId) {
    return edits.get(roomId) || null;
}

/**
 * 全量替换机房布局（编辑器保存 / 整房导入）。
 * @param {string} roomId
 * @param {Rack[]} racks 完整机柜数组（含位置/设备）
 */
export function saveRoomLayout(roomId, racks, doors) {
    const e = editRecord(roomId);
    e.full = racks;
    // 整房导入可能带门配置（room.doors）；编辑器保存不传 doors 时保留已有门
    if (doors) e.doors = doors.map(d => ({ ...d }));
    return { code: 0 };
}

/**
 * 追加或覆盖一台机柜（按机柜导入 / 跨房腾挪入）。
 * 语义：基础数据里的同 id 机柜被剔除，本对象进入 added——即"整柜替换"。
 * @param {string} roomId
 * @param {Rack} rack 完整机柜对象
 */
export function addOrReplaceRack(roomId, rack) {
    const e = editRecord(roomId);
    e.removed = Array.from(new Set([...e.removed, rack.id]));
    e.added = e.added.filter(r => r.id !== rack.id).concat([rack]);
    delete e.moves[rack.id];
    if (e.full) {
        // 全量覆盖态下追加：直接改写 full，保持两个通道一致
        e.full = e.full.filter(r => r.id !== rack.id).concat([rack]);
    }
    return { code: 0 };
}

/**
 * 从机房剔除一台机柜（编辑器删除 / 跨房腾挪出）。
 * @param {string} roomId
 * @param {string} rackId
 */
export function removeRack(roomId, rackId) {
    const e = editRecord(roomId);
    e.added = e.added.filter(r => r.id !== rackId);
    e.removed = Array.from(new Set([...e.removed, rackId]));
    delete e.moves[rackId];
    if (e.full) {
        e.full = e.full.filter(r => r.id !== rackId);
    }
    return { code: 0 };
}

/**
 * 微调一台机柜的位置/朝向（编辑器逐柜移动；暂未单独使用，保留给轻量操作）。
 * @param {string} roomId
 * @param {string} rackId
 * @param {{ row: number, col: number, facing: string }} pos
 */
export function moveRack(roomId, rackId, pos) {
    const e = editRecord(roomId);
    e.moves[rackId] = pos;
    if (e.full) {
        e.full = e.full.map(r => (r.id === rackId ? { ...r, ...pos } : r));
    }
    return { code: 0 };
}
