<template>
    <div class="floor-view">
        <div class="floor-view__bar">
            <span class="floor-view__title">{{ floor ? floor.name : '楼层视图' }}</span>
            <div class="floor-view__views">
                <un-button
                    v-for="v in VIEW_PRESETS"
                    :key="v.name"
                    size="mini"
                    :type="view === v.name ? 'primary' : 'text'"
                    @click="setView(v.name)"
                >
                    {{ v.label }}
                </un-button>
            </div>
        </div>
        <div ref="stage" class="floor-view__stage"></div>

        <!-- 悬停信息卡（跟随鼠标，pointer-events 关闭不挡交互） -->
        <div
            v-if="hoverRoom"
            class="floor-view__hover-card"
            :style="{ left: hoverPos.x + 14 + 'px', top: hoverPos.y + 14 + 'px' }"
        >
            <div class="floor-view__hover-name">{{ hoverRoom.name }}</div>
            <div class="floor-view__hover-row">机柜 {{ hoverRoom.racks.length }} 台 · {{ statusLabel(hoverRoom) }}</div>
            <div class="floor-view__hover-tip">点击进入机房详情</div>
        </div>
    </div>
</template>

<script>
/**
 * 楼层视图组件（需求 11 / L1.5）：站点下所有机房的 3D 沙盘
 *
 * 职责边界：three 的 Vue2 生命周期桥接 + 悬停信息卡（同 ThreeRoom 的模式），
 * 数据从父组件传入（L1 index.vue 调 api.getFloor 后传 floor prop）；
 * 点击房间 → emit pick-room(roomId)，由 L1 跳单机房页（路由 /idc-three/room）。
 *
 * 本组件由 L1 以异步组件引入（() => import(...)）：只有切到「机房建模图」
 * 才加载含 three 的 chunk，首屏地图视图不背 670K 的 3D 体积。
 */
import { FloorScene } from './three/scene';
import { STATUS_LABEL } from '../room/model';

const VIEW_PRESETS = [
    { name: 'overview', label: '总览' },
    { name: 'top', label: '俯视' },
    { name: 'front', label: '正视' },
];

export default {
    name: 'FloorView',
    props: {
        // api.getFloor() 产物（Floor 楼层模型）；变化时整场景重建
        floor: { type: Object, default: null },
    },
    data() {
        return {
            view: 'overview',
            hoverRoom: null,
            hoverPos: { x: 0, y: 0 },
            VIEW_PRESETS,
        };
    },
    watch: {
        floor(model) {
            if (this.scene && model) this.scene.build(model);
        },
    },
    mounted() {
        this.scene = new FloorScene(this.$refs.stage, {
            onHoverRoom: (room, x, y) => {
                this.hoverRoom = room;
                if (room) this.hoverPos = { x, y };
            },
            onSelectRoom: room => {
                if (room) this.$emit('pick-room', room.roomId);
            },
        });
        if (this.floor) this.scene.build(this.floor);
    },
    beforeDestroy() {
        if (this.scene) this.scene.dispose();
        this.scene = null;
    },
    methods: {
        setView(name) {
            this.view = name;
            if (this.scene) this.scene.setView(name);
        },
        statusLabel(room) {
            return STATUS_LABEL[room.status] || room.status;
        },
    },
};
</script>

<style scoped lang="scss">
.floor-view {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;

    &__bar {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: space-between;
        gap: var(--idc3-gap-md);
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
    }

    &__title {
        font-size: var(--idc3-font-md);
        color: var(--idc3-block-title);
    }

    &__views {
        display: flex;
        gap: var(--idc3-gap-xs);
        align-items: center;
    }

    &__stage {
        position: relative;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        // three canvas 撑满容器
        ::v-deep canvas {
            display: block;
        }
    }

    &__hover-card {
        position: absolute;
        z-index: 4;
        min-width: 160px;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        pointer-events: none;
        background: var(--idc3-tooltip-bg);
        border: 1px solid var(--idc3-tooltip-border);
        border-radius: var(--idc3-radius-sm);
        box-shadow: 0 4px 18px var(--idc3-title-glow);
    }

    &__hover-name {
        margin-bottom: 4px;
        font-size: var(--idc3-font-md);
        color: var(--idc3-title);
    }

    &__hover-row {
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text);
    }

    &__hover-tip {
        margin-top: 4px;
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text-dim);
    }
}
</style>
