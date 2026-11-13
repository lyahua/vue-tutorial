/**
 * 楼层视图场景编排（需求 11 / L1.5）：渲染器 / 相机 / 拾取 / 渲染循环 / 资源释放
 *
 * 与 room/three/scene.js（RoomScene）的分工：RoomScene 管单机房（LOD 明细/
 * 换配件局部刷新/机柜聚焦），本类管站点楼层沙盘——拾取对象是「房间」，
 * 无 LOD 动态明细（楼层永远是远景实例化）。相机/罗盘/释放链路同构。
 *
 * 对外接口（FloorView.vue 桥接）：
 *   new FloorScene(container, { onHoverRoom(room), onSelectRoom(room) })
 *   build(floorModel)     构建楼层（可重复调用，先释放旧视图）
 *   setView('overview'|'top'|'front')  视角预设
 *   dispose()
 */
import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { createFloorView } from './buildFloor';
import { Picker } from '../../room/three/picker';
import { CameraRig } from '../../room/three/camera';
import { sceneTheme } from '../../styles/tokens';

export class FloorScene {
    constructor(container, handlers) {
        this.container = container;
        this.handlers = handlers || {};
        this.floorView = null;

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(sceneTheme().bg);

        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
        this.camera.position.set(10, 10, 14);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 400;

        this.rig = new CameraRig(this.camera, this.controls);

        this.picker = new Picker(this.renderer.domElement, this.camera, {
            onHover: (roomId, x, y) => this._emitHover(roomId, x, y),
            onSelect: roomId => this._emitSelect(roomId),
        });

        this.clock = new THREE.Clock();
        this._loop = this._loop.bind(this);
        this._raf = requestAnimationFrame(this._loop);

        this._onResize = () => this.resize();
        if (typeof ResizeObserver !== 'undefined') {
            this._ro = new ResizeObserver(this._onResize);
            this._ro.observe(container);
        }
        window.addEventListener('resize', this._onResize);

        // 方位罗盘（与 RoomScene 同款）：盘面随相机水平朝向旋转，N 指向正北
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

    /** 构建楼层视图（可重复调用：先释放旧视图） */
    build(floorModel) {
        if (this.floorView) {
            this.floorView.dispose();
            this.floorView = null;
        }
        this.scene.background = new THREE.Color(sceneTheme().bg);
        this.floorView = createFloorView(this.scene, floorModel, sceneTheme());
        this.picker.setTargets(this.floorView.pickables);
        this.rig.frameRoom(this.floorView.bounds);
    }

    setView(name) {
        if (this.floorView) this.rig.preset(name, this.floorView.bounds);
    }

    _emitHover(roomId, x, y) {
        if (this.floorView) this.floorView.setHover(roomId);
        const room = roomId ? this._findRoom(roomId) : null;
        if (this.handlers.onHoverRoom) this.handlers.onHoverRoom(room, x, y);
    }

    _emitSelect(roomId) {
        if (this.floorView) this.floorView.setSelect(roomId);
        const room = roomId ? this._findRoom(roomId) : null;
        if (this.handlers.onSelectRoom) this.handlers.onSelectRoom(room);
    }

    _findRoom(roomId) {
        if (!this.floorView) return null;
        const entry = this.floorView.roomById.get(roomId);
        return entry ? entry.room : null;
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
        if (this.floorView) {
            this.floorView.dispose();
            this.floorView = null;
        }
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
        this.picker.flush();
        this._updateCompass();
        this.renderer.render(this.scene, this.camera);
    }

    /** 罗盘随相机水平朝向旋转（与 RoomScene._updateCompass 同一算法） */
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
