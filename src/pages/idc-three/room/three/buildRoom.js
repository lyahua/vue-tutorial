/**
 * 机房建模（M3 + O1）：地板网格 / 墙裙 / 冷通道 / 灯光 / 机柜 + 柜面 U 位纹理
 *
 * 性能与资源约定：
 * - BoxGeometry / PlaneGeometry / 信标几何体是模块级共享的，跨 build 复用，
 *   view.dispose() 不释放它们（量极小，避免重建时报 disposed geometry）；
 * - 材质按类型共享（同 kind 同状态共用一个 MeshLambertMaterial），
 *   hover/select 通过换材质引用实现，不克隆不复制；
 * - 柜面 U 位用 CanvasTexture 绘制（一个机柜一张 128×512 画布，MeshBasicMaterial
 *   不受光照影响、始终可读），M4 的 U 位面板与这里共用同一套令牌色。
 *
 * O1 LOD 分级渲染（需求 6，见 开发文档.md 11.1）：
 * - 柜数 ≤ LOD_THRESHOLD：走原「每柜完整 Group」路径，零回归；
 * - 柜数 > LOD_THRESHOLD：全部柜体合成 1 个 InstancedMesh（instanceColor 按
 *   柜型/状态着色，2 个 draw call 画完几千柜）；相机距离 < DETAIL_DIST 或
 *   选中/悬停的机柜动态替换为完整明细组（柜面 U 位画布 + 名称牌），明细组
 *   的纹理随组销毁（等价 LRU 上限 = 距离圈内的机柜数）；
 * - 拾取：InstancedMesh 的 raycast 返回 instanceId → userData.rackIds 映射；
 *   明细组的 body mesh 动态进出 pickables 数组（picker 持同引用）。
 */
import * as THREE from '../../vendor/three.module.min.js';
import { METRIC, ROW_PITCH, cellCenter, roomSize, facingSign, doorCenter } from '../model';
import { withAlpha } from '../../styles/tokens';

// —— 模块级共享几何体（dispose 时保留）——
const BODY_GEO = new THREE.BoxGeometry(METRIC.RACK_W, METRIC.RACK_H, METRIC.RACK_D);
const FACE_GEO = new THREE.PlaneGeometry(METRIC.RACK_W * 0.92, METRIC.RACK_H * 0.94);
const BEACON_GEO = new THREE.BoxGeometry(METRIC.RACK_W * 0.55, 0.06, 0.05);
// 柜体棱线（顶面/侧面描边）：相邻机柜贴在一起时靠边线区分轮廓，避免"挤成一块"
const BODY_EDGES = new THREE.EdgesGeometry(BODY_GEO);

const KINDS = ['compute', 'network', 'storage', 'aircon', 'power', 'ups', 'empty'];

/**
 * O1：超过该柜数启用 LOD 实例化渲染。
 * 定 350 的账（完整渲染路径每柜成本）：
 *   draw call ≈ 3/柜（柜体+柜面+名称牌）→ 350 柜 ≈ 1050，处于浏览器舒适上限内；
 *   显存 ≈ 320KB/柜（128×512 柜面画布 + 名称牌纹理）→ 350 柜 ≈ 110MB，独显无压力；
 *   350~600 为临界区（核显一体机吃力），>600 纯色块实例收益巨大（一把降到个位数 draw call）。
 * 现场设备普遍孱弱时可下调此值（一行常量，无需改其他逻辑）。
 */
export const LOD_THRESHOLD = 350;
/** O1：相机与机柜距离小于该值（米）时切换为完整明细组 */
export const DETAIL_DIST = 10;

/** 建一套材质（每次 build 新建，dispose 统一释放） */
function createMaterials(theme) {
    const lambert = (color, emissive, intensity) =>
        new THREE.MeshLambertMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(emissive || '#000000'),
            emissiveIntensity: intensity == null ? 1 : intensity,
        });

    const kinds = {};
    KINDS.forEach(k => {
        kinds[k] = {
            normal: lambert(theme.rack[k]),
            hover: lambert(theme.rack[k], theme.glow, 0.35),
            select: lambert(theme.rack[k], theme.glow, 0.7),
        };
    });

    const status = {
        alarm: lambert(theme.status.alarm, theme.status.alarm, 0.55),
        warning: lambert(theme.status.warning, theme.status.warning, 0.45),
        offline: lambert(theme.status.offline),
        normal: lambert(theme.status.normal, theme.status.normal, 0.35),
    };
    // 柜体棱线材质：强调青半透明细线（科技大屏风格，深色柜体上勾出轮廓）
    const edges = new THREE.LineBasicMaterial({
        color: new THREE.Color(theme.glow),
        transparent: true,
        opacity: 0.4,
    });
    return { kinds, status, edges };
}

/** 材质优先级：选中 > 悬停 > 状态覆盖（告警/预警/离线）> 类型默认 */
function resolveMaterial(mats, rack, state) {
    const set = mats.kinds[rack.kind] || mats.kinds.compute;
    if (state === 'select') return set.select;
    if (state === 'hover') return set.hover;
    if (rack.status === 'alarm') return mats.status.alarm;
    if (rack.status === 'warning') return mats.status.warning;
    if (rack.status === 'offline') return mats.status.offline;
    return set.normal;
}

/**
 * 绘制柜面画布：机柜编号 + U 位占用色块（1U 在底部，自下而上）。
 * 传 reuse 时在原画布上重画（M4 换配件后局部刷新用，免重建纹理对象）；
 * 重设 width/height 会清空旧内容，同尺寸也一样清。
 */
function drawFaceCanvas(rack, theme, reuse) {
    const W = 128;
    const H = 512;
    const cv = reuse || document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    const kindColor = (theme.rack[rack.kind] || theme.rack.compute);

    // 底：深藏青 + 类型色淡层（正面读成深底面板，图1参考）
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = withAlpha(kindColor, 0.35);
    ctx.fillRect(0, 0, W, H);

    // 边框（选中/告警色在换材质时体现，画布边框统一用强调色淡线）
    ctx.strokeStyle = withAlpha(theme.glow, 0.45);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // 机柜编号
    ctx.fillStyle = theme.title;
    ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rack.id, W / 2, 32);

    // U 位（设施机柜 uTotal=0，只画名称）
    if (!rack.uTotal) {
        ctx.fillStyle = theme.text;
        ctx.font = '20px "Microsoft YaHei", sans-serif';
        ctx.fillText(rack.name, W / 2, H / 2);
        return cv;
    }

    // 设备占用表：occ[u-1] = device
    const occ = new Array(rack.uTotal).fill(null);
    (rack.devices || []).forEach(d => {
        for (let u = d.startU; u < d.startU + d.uSize && u <= rack.uTotal; u += 1) {
            occ[u - 1] = d;
        }
    });

    const top = 54;
    const bottom = H - 6;
    const slotH = (bottom - top) / rack.uTotal;
    for (let u = 1; u <= rack.uTotal; u += 1) {
        const y = bottom - u * slotH;
        const d = occ[u - 1];
        if (d) {
            ctx.fillStyle = d.status === 'warning' ? theme.status.warning : theme.dev[d.category] || theme.dev.server;
            ctx.fillRect(6, y + 0.5, W - 12, Math.max(1, slotH - 1));
        } else {
            // 空 U 位画青色细线，整列读成图1机柜正面的青色网格
            ctx.fillStyle = withAlpha(theme.glow, 0.3);
            ctx.fillRect(6, y, W - 12, 1);
        }
    }
    return cv;
}

/** 浮空标签（Sprite 画布）：半透底 + 描边 + 文字。color 缺省用标题青。
 *  导出供 floor/three/buildFloor.js（楼层视图房名标签）复用 */
export function makeLabelSprite(text, theme, color) {
    const W = 256;
    const H = 64;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = theme.tooltipBg;
    ctx.fillRect(2, 10, W - 4, H - 20);
    ctx.strokeStyle = theme.tooltipBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 10, W - 4, H - 20);
    ctx.fillStyle = color || theme.title;
    ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2);
    const texture = new THREE.CanvasTexture(cv);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    return new THREE.Sprite(material);
}

/** 机柜名称牌文字色：告警红 / 预警橙 / 离线灰 / 正常青（if 链替代嵌套三元） */
function rackLabelColor(rack, theme) {
    if (rack.status === 'alarm') return theme.status.alarm;
    if (rack.status === 'warning') return theme.status.warning;
    if (rack.status === 'offline') return theme.status.offline;
    return theme.title;
}

/**
 * 构建一台机柜的完整明细组（O1 抽取：常规路径全量使用，LOD 路径按需创建）：
 * body 柜体 + face 柜面 U 位画布 + beacon 告警信标 + label 名称牌。
 * @param {Function} track 一次性资源入池回调——⚠️ 契约：必须「返回对象本身」
 *   （本函数用返回值赋给 texture/faceMat；返回 push() 的长度会让材质变成数字）
 * @returns {{ group, body, texture, canvas }}
 */
function buildRackDetail(rack, mats, theme, track) {
    const g = new THREE.Group();

    // 柜体（拾取目标，userData.rackId 供 picker 反查）
    const body = new THREE.Mesh(BODY_GEO, resolveMaterial(mats, rack, null));
    body.userData.rackId = rack.id;
    g.add(body);

    // 柜体棱线：顶面 + 四侧描边（俯视/侧视时相邻柜靠轮廓线区分）；
    // 微放大 1.002 防 z-fighting；共享 BODY_EDGES 与 mats.edges，无独立资源需 track
    const edges = new THREE.LineSegments(BODY_EDGES, mats.edges);
    edges.scale.setScalar(1.002);
    g.add(edges);

    // 柜面（U 位画布，贴在朝向侧）
    const canvas = drawFaceCanvas(rack, theme);
    const texture = track(new THREE.CanvasTexture(canvas));
    const faceMat = track(new THREE.MeshBasicMaterial({ map: texture }));
    const face = new THREE.Mesh(FACE_GEO, faceMat);
    const dz = facingSign(rack.facing) * (METRIC.RACK_D / 2 + 0.003);
    face.position.z = dz;
    if (rack.facing === 'N') face.rotation.y = Math.PI;
    g.add(face);

    // 告警/预警信标（顶部长条）
    if (rack.status === 'alarm' || rack.status === 'warning') {
        const beaconMat = track(
            new THREE.MeshLambertMaterial({
                color: new THREE.Color(theme.status[rack.status]),
                emissive: new THREE.Color(theme.status[rack.status]),
                emissiveIntensity: 0.8,
            })
        );
        const beacon = new THREE.Mesh(BEACON_GEO, beaconMat);
        beacon.position.set(0, METRIC.RACK_H / 2 + 0.05, dz * 0.6);
        g.add(beacon);
    }

    // 机柜名称标签：Sprite 悬浮柜顶，始终面向相机（颜色跟状态）
    const label = makeLabelSprite(rack.name || rack.id, theme, rackLabelColor(rack, theme));
    label.position.set(0, METRIC.RACK_H / 2 + 0.3, 0);
    label.scale.set(1.0, 0.25, 1);
    g.add(label);
    track(label.material);
    track(label.material.map);

    return { group: g, body, texture, canvas };
}

/**
 * 构建整个机房视图。
 * @param {THREE.Scene} scene
 * @param {object} room api.getRoom() 产物（Room 稀疏网格模型）
 * @param {object} theme sceneTheme() 产物
 * @returns {object} view：{ group, pickables, rackById, bounds, setHover, setSelect, updateRack, updateDetail, dispose }
 */
export function createRoomView(scene, room, theme) {
    const group = new THREE.Group();
    const size = roomSize(room);
    const disposables = []; // 材质/纹理/几何体，dispose() 统一释放

    // 墙体外扩边界（维护通道）：网格 col0/row0 的柜边本来就贴网格线，
    // 墙画在网格边界 = 柜贴墙——外扩 0.9m 让机柜与墙之间留出维护通道。
    // 墙裙/墙/门/地板用外边界；网格线与机柜坐标不动（都在内网格）。
    const WALL_MARGIN = 0.9;
    const bx0 = -WALL_MARGIN;
    const bx1 = size.w + WALL_MARGIN;
    const bz0 = -WALL_MARGIN;
    const bz1 = size.d + WALL_MARGIN;

    const track = obj => {
        disposables.push(obj);
        return obj;
    };

    // ---------- 地板（铺到墙，机柜网格区之外是维护通道地面）----------
    const floorMat = track(new THREE.MeshLambertMaterial({ color: new THREE.Color(theme.floor) }));
    const floorGeo = track(new THREE.PlaneGeometry(bx1 - bx0, bz1 - bz0));
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((bx0 + bx1) / 2, 0, (bz0 + bz1) / 2);
    group.add(floor);

    // ---------- 地板网格线（对齐 600mm 格 / 排距）----------
    const pts = [];
    for (let c = 0; c <= room.gridCols; c += 1) {
        pts.push(c * METRIC.RACK_W, 0.002, 0, c * METRIC.RACK_W, 0.002, size.d);
    }
    for (let r = 0; r <= room.gridRows; r += 1) {
        pts.push(0, 0.002, r * ROW_PITCH, size.w, 0.002, r * ROW_PITCH);
    }
    const gridGeo = track(new THREE.BufferGeometry());
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const gridMat = track(
        new THREE.LineBasicMaterial({ color: new THREE.Color(theme.floorGrid), transparent: true, opacity: 0.85 })
    );
    group.add(new THREE.LineSegments(gridGeo, gridMat));

    // ---------- 墙裙 + 墙体（四面围护，画在外扩边界上）----------
    // ⚠️ 墙不入库：位置由 gridRows/gridCols 推导 + WALL_MARGIN 渲染常量外扩，
    // 高度也是渲染常量——库里只有"墙上的例外"= doors。将来出现 L 形机房/内隔断
    // 才需要把墙升级为数据（walls 线段清单），当前矩形假设下零存储。
    // 墙为不透明白墙（参考 images/1-1 实体围护）+「动态剖切」：渲染循环每帧判断
    // 相机在哪面墙外侧，隐藏那一面墙——四分之三保持实体围护感，任何角度都看得见
    // 房内机柜（纯不透明会在低视角被近侧墙挡死）。墙不进 pickables（不影响拾取）。
    const WALL_H = 2.5; // 略高于机柜（2.2）
    const skirtMat = track(
        new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.glow),
            transparent: true,
            opacity: 0.18,
        })
    );
    const wallMat = track(
        new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.cover),
            side: THREE.DoubleSide,
        })
    );
    const wallTopMat = track(
        new THREE.MeshLambertMaterial({
            color: new THREE.Color(theme.glow),
            transparent: true,
            opacity: 0.25,
        })
    );
    const skirtH = 0.1;
    const walls = [
        { side: 'N', len: bx1 - bx0, x: (bx0 + bx1) / 2, z: bz0, rot: false },
        { side: 'S', len: bx1 - bx0, x: (bx0 + bx1) / 2, z: bz1, rot: false },
        { side: 'W', len: bz1 - bz0, x: bx0, z: (bz0 + bz1) / 2, rot: true },
        { side: 'E', len: bz1 - bz0, x: bx1, z: (bz0 + bz1) / 2, rot: true },
    ];
    const wallMeshes = []; // 剖切用：{ mesh, side }，updateWalls 每帧判定
    walls.forEach(wl => {
        // 墙裙（墙底发光描边）
        const skirtGeo = track(
            wl.rot ? new THREE.BoxGeometry(0.06, skirtH, wl.len) : new THREE.BoxGeometry(wl.len, skirtH, 0.06)
        );
        const skirt = new THREE.Mesh(skirtGeo, skirtMat);
        skirt.position.set(wl.x, skirtH / 2, wl.z);
        group.add(skirt);
        // 墙体（不透明白）
        const geo = track(new THREE.PlaneGeometry(wl.len, WALL_H));
        const wall = new THREE.Mesh(geo, wallMat);
        wall.position.set(wl.x, WALL_H / 2, wl.z);
        if (wl.rot) wall.rotation.y = Math.PI / 2;
        group.add(wall);
        wallMeshes.push({ mesh: wall, side: wl.side });
        // 顶边描边条（弱化：勾轮廓即可，俯视时即房间边框线）
        const topGeo = track(new THREE.BoxGeometry(wl.len, 0.05, 0.05));
        const top = new THREE.Mesh(topGeo, wallTopMat);
        top.position.set(wl.x, WALL_H, wl.z);
        if (wl.rot) top.rotation.y = Math.PI / 2;
        group.add(top);
    });

    /**
     * 动态剖切（渲染循环每帧调用）：相机在哪面墙的外侧就隐藏那面墙。
     * 墙都是轴对齐的，用相机坐标与房间边界直接比较即可（无需向量运算）。
     * 只剖墙板（2.5m 高会挡视线）；墙裙/顶边条很矮不挡，保留边界感。
     */
    function updateWalls(camera) {
        const px = camera.position.x;
        const pz = camera.position.z;
        wallMeshes.forEach(w => {
            let hide = false;
            if (w.side === 'N') hide = pz < bz0;
            else if (w.side === 'S') hide = pz > bz1;
            else if (w.side === 'W') hide = px < bx0;
            else if (w.side === 'E') hide = px > bx1;
            if (w.mesh.visible !== !hide) w.mesh.visible = !hide;
        });
    }

    // ---------- 门（room.doors：墙上的出入口，琥珀金色区分于青色机柜元素）----------
    // 门是 Room 级属性：{ wall: N/S/E/W, offset: 门中心沿墙米数（从靠西北端量）,
    // width: 门宽, label: 可选文字 }。没配 doors 的房间不画（向后兼容）。
    if (room.doors && room.doors.length) {
        const DOOR_COLOR = '#d4a24c';
        const doorMat = track(
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(DOOR_COLOR),
                emissive: new THREE.Color(DOOR_COLOR),
                emissiveIntensity: 0.25,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
        );
        const doorEdgeMat = track(new THREE.LineBasicMaterial({ color: new THREE.Color(DOOR_COLOR) }));
        const seamMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(DOOR_COLOR) }));
        const doorH = METRIC.RACK_H; // 门与柜同高

        room.doors.forEach(door => {
            const c = doorCenter(door, size);
            const inner = 0.05; // 门板略内移，避免与墙裙线重合
            let x = c.x;
            let z = c.z;
            // 门画在外扩墙上（墙裙内移 0.05 防重叠）；沿墙位置保持 offset 语义
            // （北/南墙的 x、东/西墙的 z = 从网格西北角量的米数，对着机房主体区）
            if (door.wall === 'N') z = bz0 + inner;
            else if (door.wall === 'S') z = bz1 - inner;
            else if (door.wall === 'W') x = bx0 + inner;
            else if (door.wall === 'E') x = bx1 - inner;

            const geo = track(new THREE.BoxGeometry(door.width, doorH, 0.08));
            const panel = new THREE.Mesh(geo, doorMat);
            panel.position.set(x, doorH / 2, z);
            if (door.wall === 'W' || door.wall === 'E') panel.rotation.y = Math.PI / 2;
            group.add(panel);

            // 门框描边（顶面/棱线描边同款思路，勾出门的轮廓）
            const edgeGeo = track(new THREE.EdgesGeometry(geo));
            const edges = new THREE.LineSegments(edgeGeo, doorEdgeMat);
            edges.position.copy(panel.position);
            edges.rotation.copy(panel.rotation);
            edges.scale.setScalar(1.002);
            group.add(edges);

            // 双开门中缝（宽 ≥1.5m 视为双开）
            if (door.width >= 1.5) {
                const seamGeo = track(new THREE.BoxGeometry(0.05, doorH * 0.92, 0.1));
                const seam = new THREE.Mesh(seamGeo, seamMat);
                seam.position.set(x, doorH * 0.46, z);
                if (door.wall === 'W' || door.wall === 'E') seam.rotation.y = Math.PI / 2;
                group.add(seam);
            }

            // 门顶标签（可选 label）
            if (door.label) {
                const label = makeLabelSprite(door.label, theme, DOOR_COLOR);
                label.position.set(x, doorH + 0.25, z);
                label.scale.set(1.1, 0.28, 1);
                group.add(label);
                track(label.material);
                track(label.material.map);
            }
        });
    }

    // ---------- 封闭冷通道：两边机柜面对面，中间通风冷却 ----------
    // 参考实物形态：地贴 + 平顶罩（半透明玻璃）+ 两端深色端板 + 冷通道温度标签。
    // 只在成对相邻排（朝向交替，前脸互对）之间搭建；孤单排不建围护。
    const aisleMat = track(
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(theme.coldAisle),
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
        })
    );
    const coverMat = track(
        new THREE.MeshPhongMaterial({
            // 深蓝半透（参考图顶罩呈蓝色调；曾用浅灰白与白墙混淆）
            color: new THREE.Color('#1E4E8C'),
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
            depthWrite: false,
            shininess: 90,
        })
    );
    // 冷通道端板：深色实心块（与柜体同色系的深灰蓝，参考 images/1-1 端部形态）
    const aisleEndMat = track(
        new THREE.MeshLambertMaterial({ color: new THREE.Color(theme.rack.compute) })
    );

    const deviceRows = new Set(room.racks.map(r => r.row).filter(r => r >= 2));
    const sortedRows = Array.from(deviceRows).sort((a, b) => a - b);
    sortedRows.forEach(r => {
        // 只从成对排的偶数侧发起（排 2&3、4&5……），避免重复搭建
        if ((r - 2) % 2 !== 0 || !deviceRows.has(r + 1)) return;
        buildContainment(r, r + 1);
    });

    /** 一组封闭冷通道（含地贴/顶罩/端板/参差侧封板/温度标签） */
    function buildContainment(r1, r2) {
        const racksA = room.racks.filter(rk => rk.row === r1);
        const racksB = room.racks.filter(rk => rk.row === r2);
        if (!racksA.length || !racksB.length) return;
        // 围护覆盖两排总跨度（含参差段——一行 3 柜一行 10 柜时多出的 7 格
        // 同样封闭，参考 images/1-1）；缺柜那格的通道侧用深色侧板封堵
        const colsA = racksA.map(rk => rk.col);
        const colsB = racksB.map(rk => rk.col);
        const lo = Math.min(Math.min.apply(null, colsA), Math.min.apply(null, colsB));
        const hi = Math.max(Math.max.apply(null, colsA), Math.max.apply(null, colsB));
        const minX = lo * METRIC.RACK_W;
        const maxX = (hi + 1) * METRIC.RACK_W;
        const len = maxX - minX;
        const cx = (minX + maxX) / 2;
        const zc = (r1 + 1) * ROW_PITCH; // 两条排前脸之间冷通道的中心
        const zSpan = ROW_PITCH - METRIC.RACK_D; // 冷通道宽 = AISLE_D

        // 地贴（冷色发光）
        const stripGeo = track(new THREE.PlaneGeometry(len, zSpan * 0.92));
        const strip = new THREE.Mesh(stripGeo, aisleMat);
        strip.rotation.x = -Math.PI / 2;
        strip.position.set(cx, 0.004, zc);
        group.add(strip);

        // 平顶罩：半透玻璃平板搭在两侧柜顶，略外挑压到柜顶内侧
        // （参考实物为平顶围护；曾用半圆柱拱罩，与实物不符已改平）
        const coverW = zSpan + 0.6;
        const coverGeo = track(new THREE.PlaneGeometry(len, coverW));
        const cover = new THREE.Mesh(coverGeo, coverMat);
        cover.rotation.x = -Math.PI / 2; // 放平：法线朝上
        cover.position.set(cx, METRIC.RACK_H + 0.01, zc);
        group.add(cover);

        // 两端端板（深色实心块封住围护截面全宽，参考图端部形态）：
        // 宽度 = coverW（与顶罩同宽，含两侧外挑——曾只封通道宽 zSpan，
        // 顶罩外挑 0.3m 的下方悬空露缝）；高度封过顶罩平面，不留顶缝。
        [minX, maxX].forEach(x => {
            const endH = METRIC.RACK_H + 0.05;
            const endGeo = track(new THREE.BoxGeometry(0.1, endH, coverW));
            const end = new THREE.Mesh(endGeo, aisleEndMat);
            // 外移半厚：端板贴在排头柜外侧，不与柜体穿插
            const dir = x === minX ? -0.05 : 0.05;
            end.position.set(x + dir, endH / 2, zc);
            group.add(end);
        });

        // ---------- 参差侧封板：该格对面排无机柜 → 通道侧敞开 → 立板封堵 ----------
        // 侧板 z 落在对面排柜前脸平面（通道边线），顶替缺失柜面把通道封死；
        // 连续缺柜段合并成一块板（逐格建 mesh 会碎）。断行空位（B 排 col3 跳格）同样命中。
        const setA = new Set(colsA);
        const setB = new Set(colsB);
        const sealH = METRIC.RACK_H + 0.05;
        const buildSideSeals = (missing, zEdge) => {
            // missing 格序号 → 连续段 [[c0, c1], ...]
            const segs = [];
            let seg = null;
            missing.forEach(c => {
                if (seg && c === seg[1] + 1) {
                    seg[1] = c;
                } else {
                    seg = [c, c];
                    segs.push(seg);
                }
            });
            segs.forEach(([c0, c1]) => {
                const x0 = c0 * METRIC.RACK_W;
                const x1 = (c1 + 1) * METRIC.RACK_W;
                const geo = track(new THREE.BoxGeometry(x1 - x0, sealH, 0.1));
                const seal = new THREE.Mesh(geo, aisleEndMat);
                seal.position.set((x0 + x1) / 2, sealH / 2, zEdge);
                group.add(seal);
            });
        };
        const missingForB = []; // B 侧（z = zc + zSpan/2）：B 排缺柜的格
        const missingForA = []; // A 侧（z = zc - zSpan/2）：A 排缺柜的格
        for (let c = lo; c <= hi; c += 1) {
            if (!setB.has(c)) missingForB.push(c);
            if (!setA.has(c)) missingForA.push(c);
        }
        buildSideSeals(missingForB, zc + zSpan / 2);
        buildSideSeals(missingForA, zc - zSpan / 2);

        // 冷通道温度标签（Sprite 始终面向相机）：两侧机柜进风温度均值
        const racksPair = racksA.concat(racksB);
        const temps = racksPair.filter(rk => rk.tempIn != null).map(rk => rk.tempIn);
        const avg = temps.length ? (temps.reduce((s, v) => s + v, 0) / temps.length).toFixed(1) : '--';
        const label = makeLabelSprite(`冷通道 ${avg}℃`, theme);
        label.position.set(cx, METRIC.RACK_H + 0.35, zc);
        label.scale.set(1.4, 0.35, 1);
        group.add(label);
        track(label.material);
        track(label.material.map);
    }

    // ---------- 灯光 ----------
    group.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(size.w * 0.4, 12, size.d * 0.3);
    group.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-size.w * 0.3, 9, -size.d * 0.3);
    group.add(fill);

    // ---------- 机柜 ----------
    const mats = createMaterials(theme);
    KINDS.forEach(k => {
        track(mats.kinds[k].normal);
        track(mats.kinds[k].hover);
        track(mats.kinds[k].select);
    });
    Object.keys(mats.status).forEach(k => track(mats.status[k]));
    track(mats.edges);

    const pickables = [];
    const rackById = new Map();

    // ---------- 状态与 LOD 扩展点（提前声明：LOD 分支执行时会赋值/注入）----------
    let hoverId = null;
    let selectId = null;
    let viewUpdateDetail = null; // LOD：每帧按相机距离增删明细组
    let viewDisposeExtra = null; // LOD：额外释放（明细组资源 + InstancedMesh）
    let repaintInstance = null; // LOD：实例重涂颜色（apply 的实例态分支回调）

    // O1：柜数超过阈值走 LOD 实例化渲染，否则走原「每柜完整 Group」路径（零回归）
    const useLOD = room.racks.length > LOD_THRESHOLD;

    if (!useLOD) {
        // ===== 常规路径（≤ LOD_THRESHOLD 柜）：每柜完整明细组 =====
        room.racks.forEach(rack => {
            const cell = cellCenter(rack.row, rack.col);
            const d = buildRackDetail(rack, mats, theme, track);
            d.group.position.set(cell.x, METRIC.RACK_H / 2, cell.z);
            group.add(d.group);
            pickables.push(d.body);
            rackById.set(rack.id, { rack, group: d.group, body: d.body, texture: d.texture, canvas: d.canvas });
        });
    } else {
        // ===== LOD 路径（需求 6）：柜体实例化 + 近距动态明细 =====
        const kindColors = {};
        KINDS.forEach(k => {
            kindColors[k] = new THREE.Color(theme.rack[k]);
        });
        const statusColors = {
            alarm: new THREE.Color(theme.status.alarm),
            warning: new THREE.Color(theme.status.warning),
            offline: new THREE.Color(theme.status.offline),
        };
        const glowColor = new THREE.Color(theme.glow);

        // 实例颜色：状态优先，hover/select 向强调青靠拢（等价换材质的视觉效果）
        const instanceColorOf = (rack, state) => {
            let c;
            if (rack.status === 'alarm') c = statusColors.alarm.clone();
            else if (rack.status === 'warning') c = statusColors.warning.clone();
            else if (rack.status === 'offline') c = statusColors.offline.clone();
            else c = (kindColors[rack.kind] || kindColors.compute).clone();
            if (state === 'hover') c.lerp(glowColor, 0.35);
            else if (state === 'select') c.lerp(glowColor, 0.6);
            return c;
        };

        // 注入给 apply() 的实例态分支（bodyIM 闭包在这里可见）
        repaintInstance = (entry, state) => {
            bodyIM.setColorAt(entry.index, instanceColorOf(entry.rack, state));
            if (bodyIM.instanceColor) bodyIM.instanceColor.needsUpdate = true;
        };

        const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
        const M = new THREE.Matrix4();

        // 柜体 InstancedMesh：材质白色，颜色全走 instanceColor
        const bodyMat = track(new THREE.MeshLambertMaterial({ color: 0xffffff }));
        const bodyIM = new THREE.InstancedMesh(BODY_GEO, bodyMat, room.racks.length);
        bodyIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        // ⚠️ 实例散布全房间，必须关掉视锥剔除（默认按共享几何体的包围球算，会整组误剔除）
        bodyIM.frustumCulled = false;
        group.add(bodyIM);

        // 告警信标 InstancedMesh（只有告警/预警机柜）
        const alarmRacks = room.racks.filter(r => r.status === 'alarm' || r.status === 'warning');
        const beaconIM = alarmRacks.length
            ? new THREE.InstancedMesh(BEACON_GEO, track(new THREE.MeshBasicMaterial({ color: 0xffffff })), alarmRacks.length)
            : null;
        if (beaconIM) {
            beaconIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            beaconIM.frustumCulled = false;
            group.add(beaconIM);
        }

        const instanceRacks = []; // bodyIM.instanceId → rack（picker 映射）
        const beaconIndex = new Map(); // rackId → beaconIM 实例序号

        const rackMatrix = (entry, visible) => {
            M.makeTranslation(entry.pos.x, METRIC.RACK_H / 2, entry.pos.z);
            if (!visible) M.multiply(ZERO);
            return M;
        };

        const beaconMatrix = (rack, entry, visible) => {
            const dz = facingSign(rack.facing) * (METRIC.RACK_D / 2 + 0.003);
            M.makeTranslation(entry.pos.x, METRIC.RACK_H + 0.05, entry.pos.z + dz * 0.6);
            if (!visible) M.multiply(ZERO);
            return M;
        };

        room.racks.forEach((rack, i) => {
            const cell = cellCenter(rack.row, rack.col);
            const entry = { rack, pos: new THREE.Vector3(cell.x, METRIC.RACK_H / 2, cell.z), index: i, detail: null, body: null };
            instanceRacks.push(rack);
            rackById.set(rack.id, entry);
            bodyIM.setMatrixAt(i, rackMatrix(entry, true));
            bodyIM.setColorAt(i, instanceColorOf(rack, null));
        });
        bodyIM.userData.rackIds = instanceRacks; // picker：instanceId → rack.id
        pickables.push(bodyIM);

        alarmRacks.forEach((rack, bi) => {
            const entry = rackById.get(rack.id);
            beaconIndex.set(rack.id, bi);
            beaconIM.setMatrixAt(bi, beaconMatrix(rack, entry, true));
            beaconIM.setColorAt(bi, statusColors[rack.status].clone());
        });

        // 异常柜（告警/预警/离线）常驻名称牌：数量少成本低，LOD 降级下保住
        // 「异常一眼可见」；正常柜不建（几百个 Sprite 正是 LOD 要省的开销），
        // 靠 hover 信息卡与「定位机柜」搜索。明细组激活时临时隐藏防双牌重叠。
        room.racks.forEach(rack => {
            if (rack.status === 'normal') return;
            const entry = rackById.get(rack.id);
            const label = makeLabelSprite(rack.name || rack.id, theme, rackLabelColor(rack, theme));
            label.position.set(entry.pos.x, METRIC.RACK_H + 0.3, entry.pos.z);
            group.add(label);
            track(label.material);
            track(label.material.map);
            entry.warnLabel = label;
        });

        /** 为某机柜创建完整明细组（近距/选中/悬停时），并隐藏其实例 */
        const addDetail = (id, entry) => {
            const localDisposables = [];
            // ⚠️ track 回调必须「返回对象本身」：buildRackDetail 内部用返回值
            // 赋给 texture/faceMat。曾写成 obj => arr.push(obj)（push 返回数组长度），
            // 导致柜面材质变成数字、渲染器静默跳过该 mesh——LOD 房间点击后 U 位不显示的根因。
            const localTrack = obj => {
                localDisposables.push(obj);
                return obj;
            };
            const d = buildRackDetail(entry.rack, mats, theme, localTrack);
            d.group.position.copy(entry.pos);
            group.add(d.group);
            entry.detail = {
                group: d.group,
                body: d.body,
                texture: d.texture,
                canvas: d.canvas,
                disposables: localDisposables,
            };
            entry.body = d.body;
            pickables.push(d.body); // 明细体可拾取（实例已隐藏）
            if (entry.warnLabel) entry.warnLabel.visible = false; // 明细组自带名称牌，防双牌重叠
            bodyIM.setMatrixAt(entry.index, rackMatrix(entry, false));
            bodyIM.instanceMatrix.needsUpdate = true;
            const bi = beaconIndex.get(id);
            if (bi != null && beaconIM) {
                beaconIM.setMatrixAt(bi, beaconMatrix(entry.rack, entry, false));
                beaconIM.instanceMatrix.needsUpdate = true;
            }
            apply(id);
        };

        /** 撤销明细组（恢复实例），纹理随组销毁（LOD 天然的 LRU 上限） */
        const removeDetail = (id, entry) => {
            group.remove(entry.detail.group);
            entry.detail.disposables.forEach(obj => {
                if (obj.dispose) obj.dispose();
            });
            const pi = pickables.indexOf(entry.detail.body);
            if (pi > -1) pickables.splice(pi, 1);
            entry.detail = null;
            entry.body = null;
            if (entry.warnLabel) entry.warnLabel.visible = true; // 恢复常驻异常牌
            bodyIM.setMatrixAt(entry.index, rackMatrix(entry, true));
            bodyIM.instanceMatrix.needsUpdate = true;
            const bi = beaconIndex.get(id);
            if (bi != null && beaconIM) {
                beaconIM.setMatrixAt(bi, beaconMatrix(entry.rack, entry, true));
                beaconIM.instanceMatrix.needsUpdate = true;
            }
            apply(id); // 回到实例着色
        };

        /** 每帧由 scene 渲染循环调用：相机距离阈值内 / 选中 / 悬停的机柜换完整明细 */
        viewUpdateDetail = camera => {
            const cam = camera.position;
            rackById.forEach((entry, id) => {
                const want =
                    cam.distanceTo(entry.pos) < DETAIL_DIST || id === selectId || id === hoverId;
                if (want && !entry.detail) addDetail(id, entry);
                else if (!want && entry.detail) removeDetail(id, entry);
            });
        };

        viewDisposeExtra = () => {
            rackById.forEach(entry => {
                if (entry.detail) {
                    entry.detail.disposables.forEach(obj => {
                        if (obj.dispose) obj.dispose();
                    });
                }
            });
            bodyIM.dispose();
            if (beaconIM) beaconIM.dispose();
        };
    }

    scene.add(group);

    // ---------- hover / select 状态管理（只动变化的机柜）----------
    function apply(id) {
        const entry = id && rackById.get(id);
        if (!entry) return;
        let state = null;
        if (id === selectId) state = 'select';
        else if (id === hoverId) state = 'hover';
        if (entry.body) {
            // 常规路径 / LOD 明细组：换共享材质引用
            entry.body.material = resolveMaterial(mats, entry.rack, state);
        } else if (entry.index != null) {
            // LOD 实例：重涂 instanceColor（repaintInstance 由 LOD 分支注入）
            if (repaintInstance) repaintInstance(entry, state);
        }
    }

    function setHover(id) {
        if (id === hoverId) return;
        const prev = hoverId;
        hoverId = id;
        if (prev) apply(prev);
        if (id) apply(id);
    }

    function setSelect(id) {
        if (id === selectId) return;
        const prev = selectId;
        selectId = id;
        if (prev) apply(prev);
        if (id) apply(id);
    }

    /**
     * 数据变化后局部刷新某机柜（M4 换配件同步用）：
     * 有明细组 → 原画布重画 U 位纹理 + 重算材质；
     * LOD 实例态 → 重涂 instanceColor（状态变化可见）。
     */
    function updateRack(rackId) {
        const entry = rackById.get(rackId);
        if (!entry) return;
        if (entry.detail) {
            drawFaceCanvas(entry.rack, theme, entry.canvas);
            entry.texture.needsUpdate = true;
        }
        apply(rackId);
    }

    return {
        group,
        pickables,
        rackById,
        updateWalls,
        bounds: {
            // 尺寸含墙体（外扩 WALL_MARGIN），相机取景不裁墙
            w: bx1 - bx0,
            d: bz1 - bz0,
            // 高度余量：墙顶描边 + 冷通道标签悬浮，保证相机取景不裁顶
            h: Math.max(WALL_H, METRIC.RACK_H) + 0.9,
            cx: (bx0 + bx1) / 2,
            cz: (bz0 + bz1) / 2,
            rackCount: room.racks.length, // 大房总览视角分档用（camera.js preset）
        },
        setHover,
        setSelect,
        updateRack,
        updateDetail(camera) {
            if (viewUpdateDetail) viewUpdateDetail(camera);
        },
        dispose() {
            if (viewDisposeExtra) viewDisposeExtra();
            disposables.forEach(obj => {
                if (obj.dispose) obj.dispose();
            });
            disposables.length = 0;
            scene.remove(group);
        },
    };
}
