/**
 * 相机装置（M3）：OrbitControls + 视角预设 + 补间飞行
 *
 * 与 scene.js 的分工：scene 每帧调 rig.update(dt) 推进补间；
 * 补间期间 controls 禁用，避免用户输入与补间互相拉扯。
 * 所有坐标均为世界坐标（网格原点在西北角，机柜 y = RACK_H/2）。
 */
import * as THREE from '../../vendor/three.module.min.js';

/** easeInOutCubic */
function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** 大房分档线：超过该柜数总览改高俯视（柜多排密时低俯角前排全挡后排，只见几条侧棱） */
const BIG_ROOM_RACKS = 80;

export class CameraRig {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.tween = null;
    }

    /**
     * 视角预设。
     * @param {'overview'|'top'|'front'} name 总览(斜视)/俯视/正视
     * @param {{cx:number, cz:number, w:number, d:number, h:number, rackCount?:number}} bounds 房间包围盒
     */
    preset(name, bounds) {
        const { cx, cz, w, d, h } = bounds;
        const maxDim = Math.max(w, d);
        let pos;
        if (name === 'top') {
            pos = new THREE.Vector3(cx, maxDim * 1.35, cz + 0.01); // +0.01 避免俯视时 up 向量退化
        } else if (name === 'front') {
            pos = new THREE.Vector3(cx, h * 1.4, cz + d * 0.55 + maxDim * 0.4);
        } else if ((bounds.rackCount || 0) > BIG_ROOM_RACKS) {
            // 大房总览：高俯视（~70°），机柜阵列铺满视野呈状态色块矩阵
            pos = new THREE.Vector3(cx + w * 0.18, maxDim * 1.05, cz + d * 0.32);
        } else {
            pos = new THREE.Vector3(cx + w * 0.72, maxDim * 0.85, cz + d * 0.85);
        }
        const target = new THREE.Vector3(cx, h * 0.45, cz);
        this.flyTo(pos, target, 0.8);
    }

    /** 进房间的初始总览视角（同 preset('overview')，时长稍长做入场动画） */
    frameRoom(bounds) {
        this.preset('overview', bounds);
        if (this.tween) this.tween.dur = 1.1;
    }

    /**
     * 聚焦某个点（双击定位/搜索定位）：**保持当前视角姿态的平移聚焦**——
     * 取当前相机→目标的视线方向，把机位平移到目标点沿该方向 4.5m 处。
     * 方位角/俯仰角与用户当前视角完全一致（俯视就俯视着过去、平视就平视着过去），
     * 只换焦点不换视角——空间感连贯，不会有"突然转到另一面"的跳变。
     */
    focus(point) {
        // 当前视线方向（相机 → 目标反向），保持姿态平移
        const dir = this.camera.position.clone().sub(this.controls.target);
        const dist = dir.length() || 1;
        dir.divideScalar(dist);
        const useDist = Math.min(dist, 4.5); // 距离收到观察尺度（已在近处则不拉远）
        const pos = point.clone().add(dir.multiplyScalar(useDist));
        this.flyTo(pos, point.clone(), 0.7);
    }

    /** 发起一次补间飞行（世界坐标） */
    flyTo(pos, target, dur) {
        this.controls.enabled = false;
        this.tween = {
            fromPos: this.camera.position.clone(),
            toPos: pos,
            fromTarget: this.controls.target.clone(),
            toTarget: target,
            elapsed: 0,
            dur: dur || 0.8,
        };
    }

    /** 每帧推进补间；scene 的渲染循环调用 */
    update(dt) {
        if (!this.tween) return;
        const t = this.tween;
        t.elapsed += dt;
        const k = ease(Math.min(1, t.elapsed / t.dur));
        this.camera.position.lerpVectors(t.fromPos, t.toPos, k);
        this.controls.target.lerpVectors(t.fromTarget, t.toTarget, k);
        if (t.elapsed >= t.dur) {
            this.tween = null;
            this.controls.enabled = true;
        }
    }
}
