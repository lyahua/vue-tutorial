<template>
    <div ref="stage" class="three-room"></div>
</template>

<script>
/**
 * three 的 Vue2 封装（M3）：生命周期桥接，业务事件转发
 *
 * 职责边界：本组件只管「挂载/重建/销毁 + 事件转发 + 方法代理」，
 * 不碰业务数据；机房模型由父组件传入（room/index.vue 从 model.js 构建）。
 *
 * 事件：
 * - @hover(rack|null, x, y)  悬停机柜变化（x/y 为画布内像素坐标）
 * - @select(rack|null)       点击机柜（拖拽视角不算点击）
 * - @dblselect(rack|null)    双击机柜（双击会先触发两次 select，幂等无害）
 *
 * 方法（父组件经 $refs 调用）：
 * - setView('overview'|'top'|'front')  视角预设
 * - focusRack(rackId)                  相机聚焦
 */
import { RoomScene } from '../three/scene';

export default {
    name: 'ThreeRoom',
    props: {
        // api.getRoom() 产物（Room 稀疏网格模型）；变化时整场景重建
        room: { type: Object, default: null },
    },
    watch: {
        room(roomModel) {
            if (this.scene && roomModel) this.scene.build(roomModel);
        },
    },
    mounted() {
        this.scene = new RoomScene(this.$refs.stage, {
            onHover: (rack, x, y) => this.$emit('hover', rack, x, y),
            onSelect: rack => this.$emit('select', rack),
            onDblSelect: rack => this.$emit('dblselect', rack),
        });
        if (this.room) this.scene.build(this.room);
    },
    beforeDestroy() {
        // 全链路释放：几何/材质/纹理/renderer/DOM/监听，避免路由往返内存泄漏
        if (this.scene) this.scene.dispose();
        this.scene = null;
    },
    methods: {
        setView(name) {
            if (this.scene) this.scene.setView(name);
        },
        focusRack(rackId) {
            if (this.scene) this.scene.focusRack(rackId);
        },
        /** 数据变化后局部刷新某机柜（换配件 3D 同步），不丢相机视角 */
        refreshRack(rackId) {
            if (this.scene) this.scene.refreshRack(rackId);
        },
        /** M7：外部选中某机柜（定位联动 3D 高亮；空 id 清除） */
        selectRack(rackId) {
            if (this.scene) this.scene.selectRack(rackId);
        },
    },
};
</script>

<style scoped lang="scss">
.three-room {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    // three canvas 撑满容器
    ::v-deep canvas {
        display: block;
    }
}
</style>
