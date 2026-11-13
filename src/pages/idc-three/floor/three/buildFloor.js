/**
 * 楼层视图建模（需求 11 / L1.5）：站点下所有机房摆一张平面上的「沙盘模型」
 *
 * 与 room/three/buildRoom.js 的分工：
 * - buildRoom = 单机房明细（柜面 U 位画布 / 冷通道围护 / 门 / LOD 动态明细）
 * - buildFloor = 站点总览沙盘：白墙房间 + 房名标签 + 全站机柜实例化色块
 *   （楼层视图永远是远景，机柜不画 U 位画布——点房间进 L3 room 页看明细）
 *
 * 渲染要素（参考 images/1-下钻珠海.jpg）：
 * - 整层底板 + 各房不透明白墙（hover/选中时墙提亮）+ 房名标签（状态色）
 * - 机柜全站合成 1 个 InstancedMesh（instanceColor 按柜型/状态）+ 告警信标 IM
 * - 每房一块透明「感应板」做拾取目标（点击房间 → 跳单机房页）
 */
import * as THREE from '../../vendor/three.module.min.js';
import { METRIC, cellCenter } from '../../room/model';
import { makeLabelSprite } from '../../room/three/buildRoom';

/**
 * 机柜实例颜色（参考 images/1 的观感：统一深色阵列 + 异常跳眼）：
 * - 异常柜（告警红/预警橙/离线灰）最优先——沙盘视图的核心价值是"一眼看出哪间房有问题"；
 * - 设施柜（aircon/power/ups）保柜型色——辅助间整房呈现语义色；
 * - 正常设备柜统一深灰蓝——七种柜型色全上会花，统一后阵列整洁（图 1 同款观感）。
 */
function instanceColor(rack, theme) {
    if (rack.status === 'alarm') return new THREE.Color(theme.status.alarm);
    if (rack.status === 'warning') return new THREE.Color(theme.status.warning);
    if (rack.status === 'offline') return new THREE.Color(theme.status.offline);
    if (rack.kind === 'aircon' || rack.kind === 'power' || rack.kind === 'ups') {
        return new THREE.Color(theme.rack[rack.kind]);
    }
    return new THREE.Color(theme.rack.compute);
}

/** 房名标签文字色：按房间最严重状态 */
function roomLabelColor(status, theme) {
    if (theme.status[status]) return theme.status[status];
    return theme.title;
}

const WALL_H = 2.5; // 与单机房墙同高
const SENSE_Y = 1.4; // 感应板高度（柜半高附近，覆盖整房易点）

/**
 * 构建楼层视图。
 * @param {THREE.Scene} scene
 * @param {object} floor api.getFloor() 产物（见 mock/floors.js 头注释）
 * @param {object} theme sceneTheme() 产物
 * @returns {object} view：{ group, pickables, bounds, setHover, setSelect, dispose }
 */
export function createFloorView(scene, floor, theme) {
    const group = new THREE.Group();
    const disposables = [];
    const track = obj => {
        disposables.push(obj);
        return obj;
    };

    // ---------- 楼层 bounds（所有房间外扩 2m 走廊）----------
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    floor.rooms.forEach(r => {
        minX = Math.min(minX, r.x);
        maxX = Math.max(maxX, r.x + r.w);
        minZ = Math.min(minZ, r.z);
        maxZ = Math.max(maxZ, r.z + r.d);
    });
    const M = 2;
    const fx0 = minX - M;
    const fx1 = maxX + M;
    const fz0 = minZ - M;
    const fz1 = maxZ + M;

    // ---------- 整层底板 + 白墙（「沙盘模型」配色，参考 images/1：白色楼板墙体）----------
    // 楼板浅灰白、墙体近白（深一档的楼板衬托墙体立体层次）；沿用 theme.floor 的
    // #C7CDD8 蓝灰在深色大屏底上读成"灰脏"，沙盘要的是干净的白。
    const SLAB_COLOR = '#E4E9F0'; // 楼板（浅灰白）
    const WALL_COLOR = '#F5F7FB'; // 墙体（近白，受光后最亮）
    const floorMat = track(new THREE.MeshLambertMaterial({ color: new THREE.Color(SLAB_COLOR) }));
    const slabGeo = track(new THREE.PlaneGeometry(fx1 - fx0, fz1 - fz0));
    const slab = new THREE.Mesh(slabGeo, floorMat);
    slab.rotation.x = -Math.PI / 2;
    slab.position.set((fx0 + fx1) / 2, 0, (fz0 + fz1) / 2);
    group.add(slab);

    // 底板描边（勾出楼层范围）
    const edgeMat = track(new THREE.LineBasicMaterial({ color: new THREE.Color(theme.glow), transparent: true, opacity: 0.4 }));
    const outlinePts = [
        new THREE.Vector3(fx0, 0.01, fz0), new THREE.Vector3(fx1, 0.01, fz0),
        new THREE.Vector3(fx1, 0.01, fz1), new THREE.Vector3(fx0, 0.01, fz1),
        new THREE.Vector3(fx0, 0.01, fz0),
    ];
    const outlineGeo = track(new THREE.BufferGeometry().setFromPoints(outlinePts));
    group.add(new THREE.Line(outlineGeo, edgeMat));

    // ---------- 白墙基材质（每房 clone 一份，hover/选中时改 emissive）----------
    const baseWallMat = track(
        new THREE.MeshLambertMaterial({ color: new THREE.Color(WALL_COLOR), side: THREE.DoubleSide })
    );

    // ---------- 机柜实例（全站一个 InstancedMesh）----------
    // 楼层专用几何：宽/深各留 ~8% 缝隙——柜宽=格宽 0.6 时相邻柜零间隙，
    // 远景俯视下一排柜糊成一条线；留缝后逐柜可辨（分清每台机柜）。
    const allRacks = [];
    floor.rooms.forEach(r => r.racks.forEach(rk => allRacks.push({ rack: rk, room: r })));
    const BODY_GEO = track(new THREE.BoxGeometry(METRIC.RACK_W * 0.86, METRIC.RACK_H, METRIC.RACK_D * 0.96));
    const bodyIM = new THREE.InstancedMesh(BODY_GEO, track(new THREE.MeshLambertMaterial({ color: 0xffffff })), allRacks.length);
    bodyIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bodyIM.frustumCulled = false;

    // 告警/预警信标实例
    const warnRacks = allRacks.filter(it => it.rack.status === 'alarm' || it.rack.status === 'warning');
    const BEACON_GEO = track(new THREE.BoxGeometry(METRIC.RACK_W * 0.55, 0.06, 0.05));
    const beaconIM = warnRacks.length
        ? new THREE.InstancedMesh(BEACON_GEO, track(new THREE.MeshBasicMaterial({ color: 0xffffff })), warnRacks.length)
        : null;
    if (beaconIM) {
        beaconIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        beaconIM.frustumCulled = false;
    }

    const pickables = [];
    const roomById = new Map();
    const M4 = new THREE.Matrix4();

    // ---------- 逐房：白墙 + 房名 + 感应板 + 机柜实例 ----------
    floor.rooms.forEach(room => {
        const wallMat = baseWallMat.clone();
        disposables.push(wallMat);
        const entry = { room, wallMat };
        roomById.set(room.roomId, entry);

        // 四面墙（不透明白，沙盘质感；hover/选中时整体提亮）
        const walls = [
            { len: room.w, x: room.x + room.w / 2, z: room.z, rot: false },
            { len: room.w, x: room.x + room.w / 2, z: room.z + room.d, rot: false },
            { len: room.d, x: room.x, z: room.z + room.d / 2, rot: true },
            { len: room.d, x: room.x + room.w, z: room.z + room.d / 2, rot: true },
        ];
        walls.forEach(wl => {
            const geo = track(new THREE.PlaneGeometry(wl.len, WALL_H));
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(wl.x, WALL_H / 2, wl.z);
            if (wl.rot) wall.rotation.y = Math.PI / 2;
            group.add(wall);
        });

        // 房名标签（状态色 + 机柜数）
        const label = makeLabelSprite(
            `${room.name}（${room.racks.length} 柜）`,
            theme,
            roomLabelColor(room.status, theme)
        );
        label.position.set(room.x + room.w / 2, WALL_H + 0.4, room.z + room.d / 2);
        label.scale.set(2.4, 0.6, 1);
        group.add(label);
        track(label.material);
        track(label.material.map);

        // 感应板（透明，拾取目标）：盖住房间上空，点击/hover 判定到「房间」。
        // userData 键名沿用 Picker 约定的 rackId（Picker 按此键反查），此处传 roomId
        const senseGeo = track(new THREE.PlaneGeometry(room.w, room.d));
        const senseMat = track(
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        const sense = new THREE.Mesh(senseGeo, senseMat);
        sense.rotation.x = -Math.PI / 2;
        sense.position.set(room.x + room.w / 2, SENSE_Y, room.z + room.d / 2);
        sense.userData.rackId = room.roomId;
        group.add(sense);
        pickables.push(sense);
    });

    // 机柜实例矩阵与颜色（房内坐标 + 房间偏移）
    allRacks.forEach((it, i) => {
        const c = cellCenter(it.rack.row, it.rack.col);
        M4.makeTranslation(it.room.x + c.x, METRIC.RACK_H / 2, it.room.z + c.z);
        bodyIM.setMatrixAt(i, M4);
        bodyIM.setColorAt(i, instanceColor(it.rack, theme));
    });
    group.add(bodyIM);

    warnRacks.forEach((it, i) => {
        const c = cellCenter(it.rack.row, it.rack.col);
        M4.makeTranslation(it.room.x + c.x, METRIC.RACK_H + 0.05, it.room.z + c.z);
        beaconIM.setMatrixAt(i, M4);
        beaconIM.setColorAt(i, new THREE.Color(theme.status[it.rack.status]));
    });
    if (beaconIM) group.add(beaconIM);

    // ---------- hover / select：房间墙提亮 ----------
    let hoverId = null;
    let selectId = null;

    function apply(id) {
        const entry = id && roomById.get(id);
        if (!entry) return;
        const state = id === selectId ? 'select' : 'hover';
        if (state === 'select') {
            entry.wallMat.emissive = new THREE.Color(theme.glow);
            entry.wallMat.emissiveIntensity = 0.35;
        } else {
            entry.wallMat.emissive = new THREE.Color(theme.glow);
            entry.wallMat.emissiveIntensity = 0.15;
        }
    }

    function reset(id) {
        const entry = id && roomById.get(id);
        if (!entry) return;
        entry.wallMat.emissive = new THREE.Color('#000000');
        entry.wallMat.emissiveIntensity = 1;
    }

    function setHover(id) {
        if (id === hoverId) return;
        const prev = hoverId;
        hoverId = id;
        if (prev && prev !== selectId) reset(prev);
        if (id) apply(id);
    }

    function setSelect(id) {
        if (id === selectId) return;
        const prev = selectId;
        selectId = id;
        if (prev) reset(prev);
        if (id) apply(id);
    }

    scene.add(group);

    // ---------- 灯光（与 buildRoom 同款：Lambert 材质受光照才显色，漏灯光=全黑）----------
    group.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set((fx0 + fx1) * 0.4, 14, (fz0 + fz1) * 0.3);
    group.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set((fx0 + fx1) * -0.3, 10, (fz0 + fz1) * -0.3);
    group.add(fill);

    return {
        group,
        pickables,
        roomById,
        bounds: {
            w: fx1 - fx0,
            d: fz1 - fz0,
            h: WALL_H + 1,
            cx: (fx0 + fx1) / 2,
            cz: (fz0 + fz1) / 2,
        },
        setHover,
        setSelect,
        dispose() {
            scene.remove(group);
            disposables.forEach(obj => {
                if (obj.dispose) obj.dispose();
            });
            bodyIM.dispose();
            if (beaconIM) beaconIM.dispose();
        },
    };
}
