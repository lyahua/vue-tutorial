/**
 * 拾取器（M3）：Raycaster hover / click / dblclick
 *
 * 事件流：
 * - pointermove 只记录 NDC 与屏幕坐标（节流思路：由 scene 渲染循环调 flush()，
 *   每帧最多拾取一次，鼠标快速划过时不会产生几十次 Raycaster 计算）；
 * - click 与 OrbitControls 拖拽的区分：pointerdown 记录落点，抬起位移 > 5px
 *   视为拖拽视角，不算点击；
 * - dblclick 用浏览器原生事件（自带双击时序判定）——双击会先触发两次 click
 *   （幂等无害），再触发本回调，用于「双击才定位视野」的交互分层。
 *
 * 对外回调（构造参数 handlers）：
 * - onHover(rackId|null, screenX, screenY)  悬停目标变化时
 * - onSelect(rackId|null)                    有效点击时
 * - onDblClick(rackId|null)                  有效双击时
 */
import * as THREE from '../../vendor/three.module.min.js';

/** 拖拽阈值（px²）：位移平方小于它才算点击 */
const DRAG_SQUARE = 25;

export class Picker {
    constructor(dom, camera, handlers) {
        this.dom = dom;
        this.camera = camera;
        this.handlers = handlers || {};
        this.raycaster = new THREE.Raycaster();
        this._ndc = new THREE.Vector2();
        this._screen = { x: 0, y: 0 };
        this.targets = [];
        this.hoverId = null;
        this._pending = false;
        this._down = null;

        this._onPointerMove = e => {
            const rect = this.dom.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            this._ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this._ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            this._screen.x = e.clientX - rect.left;
            this._screen.y = e.clientY - rect.top;
            this._pending = true;
        };
        this._onPointerDown = e => {
            this._down = { x: e.clientX, y: e.clientY };
        };
        this._onClick = e => {
            if (!this._down) return;
            const dx = e.clientX - this._down.x;
            const dy = e.clientY - this._down.y;
            this._down = null;
            if (dx * dx + dy * dy > DRAG_SQUARE) return; // 拖拽视角，不是点击
            this._onPointerMove(e); // 用点击位置刷新 NDC
            const id = this._pick();
            if (this.handlers.onHover) this.handlers.onHover(id, this._screen.x, this._screen.y);
            if (this.handlers.onSelect) this.handlers.onSelect(id);
        };
        this._onDblClick = e => {
            this._onPointerMove(e); // 用双击位置刷新 NDC
            const id = this._pick();
            if (this.handlers.onDblClick) this.handlers.onDblClick(id);
        };

        dom.addEventListener('pointermove', this._onPointerMove);
        dom.addEventListener('pointerdown', this._onPointerDown);
        dom.addEventListener('click', this._onClick);
        dom.addEventListener('dblclick', this._onDblClick);
    }

    /** 设置可拾取网格列表（buildRoom 的 pickables，mesh.userData.rackId） */
    setTargets(list) {
        this.targets = list || [];
        this.hoverId = null;
        this._pending = false;
    }

    /** 渲染循环调用：处理节流后的悬停拾取，目标变化才回调 */
    flush() {
        if (!this._pending) return;
        this._pending = false;
        const id = this._pick();
        if (id === this.hoverId) return;
        this.hoverId = id;
        if (this.handlers.onHover) this.handlers.onHover(id, this._screen.x, this._screen.y);
    }

    _pick() {
        if (!this.targets.length) return null;
        this.raycaster.setFromCamera(this._ndc, this.camera);
        const hits = this.raycaster.intersectObjects(this.targets, false);
        if (!hits.length) return null;
        const hit = hits[0];
        const obj = hit.object;
        // 普通明细体：userData.rackId 直接命中
        if (obj.userData.rackId) return obj.userData.rackId;
        // LOD InstancedMesh：instanceId → userData.rackIds 数组映射（O1）
        if (hit.instanceId != null && obj.userData.rackIds) {
            const rack = obj.userData.rackIds[hit.instanceId];
            return rack ? rack.id : null;
        }
        return null;
    }

    dispose() {
        this.dom.removeEventListener('pointermove', this._onPointerMove);
        this.dom.removeEventListener('pointerdown', this._onPointerDown);
        this.dom.removeEventListener('click', this._onClick);
        this.dom.removeEventListener('dblclick', this._onDblClick);
        this.targets = [];
    }
}
