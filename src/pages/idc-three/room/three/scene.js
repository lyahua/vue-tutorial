/**
 * 三维场景编排（M3）：渲染器 / 场景 / 相机 / 拾取 / 渲染循环 / 资源释放
 *
 * 对外接口（Vue 侧 ThreeRoom.vue 桥接）：
 *   new RoomScene(container, { onHover(rack, x, y), onSelect(rack) })
 *   build(roomModel)          构建机房（可重复调用，先释放旧场景）
 *   setView('overview'|'top'|'front')  视角预设
 *   focusRack(rackId)         相机聚焦某机柜
 *   resize() / dispose()
 *
 * 资源释放（路由往返不泄漏）：
 * - dispose() 全链路：cancelAnimationFrame → picker/controls 监听 → roomView 材质纹理
 *   → renderer.dispose → 从 DOM 摘除 canvas → ResizeObserver 断开。
 * - 模块级共享几何体（buildRoom.js）不在此释放，跨 build 复用。
 */
import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { createRoomView } from './buildRoom';
import { Picker } from './picker';
import { CameraRig } from './camera';
import { METRIC } from '../model';
import { sceneTheme } from '../../styles/tokens';

export class RoomScene {
    constructor(container, handlers) {
        this.container = container;
        this.handlers = handlers || {};
        this.roomView = null;
        this.roomModel = null;

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(sceneTheme().bg);

        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 300);
        this.camera.position.set(8, 8, 12);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        // 不允许钻到地板下面，也不允许拉到无限远（O1：大房间放宽到 300）
        this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 300;

        this.rig = new CameraRig(this.camera, this.controls);

        this.picker = new Picker(this.renderer.domElement, this.camera, {
            onHover: (rackId, x, y) => this._emitHover(rackId, x, y),
            onSelect: rackId => this._emitSelect(rackId),
            onDblClick: rackId => this._emitDblSelect(rackId),
        });

        this.clock = new THREE.Clock();
        this._loop = this._loop.bind(this);
        this._raf = requestAnimationFrame(this._loop);

        // 容器尺寸变化（含窗口变化）→ 重设相机宽高比
        this._onResize = () => this.resize();
        if (typeof ResizeObserver !== 'undefined') {
            this._ro = new ResizeObserver(this._onResize);
            this._ro.observe(container);
        }
        window.addEventListener('resize', this._onResize);

        // 方位罗盘（DOM overlay，右下角常驻）：盘面随相机水平朝向旋转，N 指向正北
        // （北 = -z，与 row/col、门 wall 的方向语义一致）。样式在 styles/index.scss。
        this._compass = document.createElement('div');
        this._compass.className = 'idc3-compass';
        this._compass.innerHTML =
            '<div class="idc3-compass__dial">' +
            '<span class="idc3-compass__n">N</span>' +
            '<span class="idc3-compass__needle-n"></span>' +
            '<span class="idc3-compass__needle-s"></span>' +
            '</div>';
        container.appendChild(this._compass);
        this._compassDial = this._compass.firstElementChild;
        this._compassDeg = null;
    }

    /** 构建机房视图（可重复调用：先释放旧视图） */
    build(roomModel) {
        if (this.roomView) {
            this.roomView.dispose();
            this.roomView = null;
        }
        const theme = sceneTheme();
        this.scene.background = new THREE.Color(theme.bg);
        this.roomView = createRoomView(this.scene, roomModel, theme);
        this.roomModel = roomModel;
        this.picker.setTargets(this.roomView.pickables);
        this.rig.frameRoom(this.roomView.bounds);
    }

    setView(name) {
        if (this.roomView) this.rig.preset(name, this.roomView.bounds);
    }

    /** 相机聚焦某机柜：落到其前脸（有 U 位画布）那一侧近观；LOD 模式 entry 无 group，用 pos 兜底 */
    focusRack(rackId) {
        if (!this.roomView) return;
        const entry = this.roomView.rackById.get(rackId);
        if (!entry) return;
        const p = entry.group ? entry.group.position : entry.pos;
        // 保持当前视角姿态的平移聚焦（focus 内部取当前视线方向，不再看 facing）
        this.rig.focus(new THREE.Vector3(p.x, METRIC.RACK_H * 0.55, p.z));
    }

    /**
     * 数据变化后局部刷新某机柜（M4 换配件等）：
     * 只重画该柜的柜面纹理与材质，不重建场景、不丢相机视角。
     * rack 数据对象与 build 时是同一引用，页面侧直接改对象后调这里即可。
     */
    refreshRack(rackId) {
        if (this.roomView) this.roomView.updateRack(rackId);
    }

    /**
     * 外部选中某机柜（M7 定位联动 3D 高亮；传 null 清除选中）。
     * 与 picker 点击选中共用 view.setSelect——LOD 下选中柜自动出完整明细。
     */
    selectRack(rackId) {
        if (this.roomView) this.roomView.setSelect(rackId);
    }

    _emitHover(rackId, x, y) {
        if (this.roomView) this.roomView.setHover(rackId);
        const rack = rackId ? this._findRack(rackId) : null;
        if (this.handlers.onHover) this.handlers.onHover(rack, x, y);
    }

    _emitSelect(rackId) {
        if (this.roomView) this.roomView.setSelect(rackId);
        const rack = rackId ? this._findRack(rackId) : null;
        if (this.handlers.onSelect) this.handlers.onSelect(rack);
    }

    /** 双击选中（与单击共用 setSelect 高亮；相机飞行由页面层决定） */
    _emitDblSelect(rackId) {
        if (this.roomView) this.roomView.setSelect(rackId);
        const rack = rackId ? this._findRack(rackId) : null;
        if (this.handlers.onDblSelect) this.handlers.onDblSelect(rack);
    }

    _findRack(rackId) {
        if (!this.roomModel) return null;
        return this.roomModel.racks.find(r => r.id === rackId) || null;
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (!w || !h) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    dispose() {
        cancelAnimationFrame(this._raf);
        window.removeEventListener('resize', this._onResize);
        if (this._ro) {
            this._ro.disconnect();
            this._ro = null;
        }
        this.picker.dispose();
        this.controls.dispose();
        if (this.roomView) {
            this.roomView.dispose();
            this.roomView = null;
        }
        this.roomModel = null;
        this.renderer.dispose();
        const dom = this.renderer.domElement;
        if (dom.parentNode) dom.parentNode.removeChild(dom);
        if (this._compass && this._compass.parentNode) {
            this._compass.parentNode.removeChild(this._compass);
            this._compass = null;
            this._compassDial = null;
        }
    }

    _loop() {
        this._raf = requestAnimationFrame(this._loop);
        const dt = this.clock.getDelta();
        this.rig.update(dt);
        this.controls.update();
        // O1 LOD：按相机距离增删机柜明细组（非 LOD 房间为 no-op）
        if (this.roomView) this.roomView.updateDetail(this.camera);
        // 不透明白墙的动态剖切：隐藏朝向相机的那面墙（非房间视图为 no-op）
        if (this.roomView && this.roomView.updateWalls) this.roomView.updateWalls(this.camera);
        this.picker.flush(); // 处理节流后的悬停拾取
        this._updateCompass();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 罗盘随相机水平朝向旋转。
     * 视线前向 → 北(-z) 的方位角：朝正北时盘面 N 朝上；朝东时北在屏幕左 → 盘逆时针转。
     * 变化 <0.5° 不写 DOM（每帧写 style 没必要）。
     */
    _updateCompass() {
        if (!this._compassDial) return;
        const dx = this.controls.target.x - this.camera.position.x;
        const dz = this.controls.target.z - this.camera.position.z;
        const deg = (-Math.atan2(dx, -dz) * 180) / Math.PI;
        if (this._compassDeg == null || Math.abs(deg - this._compassDeg) > 0.5) {
            this._compassDeg = deg;
            this._compassDial.style.transform = `rotate(${deg}deg)`;
        }
    }
}
