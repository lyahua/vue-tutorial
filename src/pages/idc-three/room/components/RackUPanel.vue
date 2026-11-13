<template>
    <div class="rack-u">
        <div class="rack-u__legend">
            <span v-for="l in legend" :key="l.label" class="rack-u__legend-item">
                <i class="rack-u__legend-dot" :style="{ background: l.color }" />{{ l.label }}
            </span>
        </div>

        <div v-if="!rack.uTotal" class="rack-u__facility">设施机柜 · 无 U 位</div>

        <!--
            42U 网格（CSS Grid 三列两区）：
            - 列 1 = U 号，列 2 = 槽位；行数 = uTotal，等分由 grid 引擎保证；
            - 空槽格线每行一个（gridRow = i）；
            - 设备块按「顶 U」换算成起始行 + span 跨行（1U 在底部，自下而上）。
            用 Grid 而不是绝对定位百分比：对齐由网格构造保证，
            不受 padding box / border 累加 / 高度解析差异影响（前两版踩过的坑）。
        -->
        <div v-else class="rack-u__grid" :style="gridStyle">
            <span
                v-for="i in rack.uTotal"
                :key="'n' + i"
                class="rack-u__num"
                :style="{ gridRow: i, gridColumn: 1 }"
            >
                {{ rack.uTotal - i + 1 }}
            </span>
            <div
                v-for="i in rack.uTotal"
                :key="'s' + i"
                class="rack-u__slot"
                :style="{ gridRow: i, gridColumn: 2 }"
            />
            <button
                v-for="d in rack.devices"
                :key="d.id"
                type="button"
                class="rack-u__device"
                :class="{ 'is-warning': d.status === 'warning' }"
                :style="deviceStyle(d)"
                :title="deviceTitle(d)"
                @click="$emit('pick-device', d)"
            >
                <span class="rack-u__device-name">{{ d.name }}</span>
                <span v-if="d.uSize >= 2" class="rack-u__device-u">{{ d.startU }}–{{ d.startU + d.uSize - 1 }}U</span>
            </button>
        </div>
    </div>
</template>

<script>
/**
 * 机柜 U 位面板（M4：42U 2D 网格，与 3D 柜面共用同一套令牌色）
 *
 * 数据：props.rack 即 model.js 的 Rack 对象（与 3D 场景同一引用），
 * 换配件后父组件改设备数据，这里与 3D 柜面同步刷新（Vue 响应式）。
 * 点击设备块 → $emit('pick-device', device) → 父组件打开 DeviceDialog。
 *
 * 定位：CSS Grid（行 = U 位）。设备起始行 = uTotal - 顶U + 1，跨 uSize 行；
 * 数据约定 1U 在底部、自下而上连续排布（与 3D 柜面画布同一约定）。
 */
import { DEV_CATEGORY_LABEL } from '../model';
import { cssVar } from '../../styles/tokens';

const DEV_CATEGORIES = ['server', 'storage', 'network', 'security'];

export default {
    name: 'RackUPanel',
    props: {
        rack: { type: Object, required: true },
    },
    computed: {
        legend() {
            const used = new Set(this.rack.devices.map(d => d.category));
            const out = DEV_CATEGORIES.filter(c => used.has(c)).map(c => ({
                label: DEV_CATEGORY_LABEL[c],
                color: cssVar('--idc3-dev-' + c),
            }));
            out.push({ label: '空闲', color: cssVar('--idc3-split-line') });
            out.push({ label: '预警', color: cssVar('--idc3-status-warning') });
            return out;
        },
        /** 行模板内联生成（行数随 uTotal 变化）；minmax(0,1fr) 保证 42 行严格等分 */
        gridStyle() {
            return { gridTemplateRows: `repeat(${this.rack.uTotal}, minmax(0, 1fr))` };
        },
    },
    methods: {
        colorOf(category) {
            return cssVar('--idc3-dev-' + category) || cssVar('--idc3-dev-server');
        },
        /**
         * 设备块的网格定位。
         * 顶 U = startU + uSize - 1；网格行自上而下 1 起算：
         * 起始行 = uTotal - 顶U + 1（U42 在第 1 行、U1 在最后一行），跨 uSize 行。
         */
        deviceStyle(d) {
            const total = this.rack.uTotal;
            const topU = d.startU + d.uSize - 1;
            const rowStart = total - topU + 1;
            return {
                gridRow: `${rowStart} / span ${d.uSize}`,
                gridColumn: 2,
                '--dev-color': this.colorOf(d.category),
            };
        },
        deviceTitle(d) {
            const label = DEV_CATEGORY_LABEL[d.category] || d.category;
            return `${d.name}（${label}）${d.startU}-${d.startU + d.uSize - 1}U`;
        },
    },
};
</script>

<style scoped lang="scss">
.rack-u {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &__legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--idc3-gap-sm) var(--idc3-gap-md);
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text-dim);
        border-bottom: 1px solid var(--idc3-border-block);
    }

    &__legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    &__legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
    }

    &__facility {
        padding: 24px var(--idc3-gap-md);
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text-dim);
        text-align: center;
    }

    // 42U 网格本体：列 1 = U 号（22px），列 2 = 槽位。
    // 最小高度 42 × 13px：1U 设备也放得下一行 10px 文字（超出侧栏自动滚动）。
    &__grid {
        display: grid;
        flex: 1;
        min-height: 546px;
        grid-template-columns: 22px 1fr;
    }

    &__num {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--idc3-font-xs);
        font-variant-numeric: tabular-nums;
        color: var(--idc3-text-dim);
        border-right: 1px solid var(--idc3-border-block);
    }

    &__slot {
        box-sizing: border-box;
        border-bottom: 1px dashed var(--idc3-split-line);
    }

    &__device {
        // grid 布局项：跨行由 deviceStyle 的 gridRow 决定，与格线构造性对齐
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        margin: 0 3px;
        padding: 0 4px;
        overflow: hidden;
        cursor: pointer;
        background: var(--dev-color);
        border: 1px solid var(--dev-color);
        border-radius: 2px;
        color: var(--idc3-bg-page);
        font-size: var(--idc3-font-xs);
        // 行高 1：1U 行高约 13px，10px 字 + 1.2 行高会上下裁边
        line-height: 1;
        transition: filter 0.15s ease, box-shadow 0.15s ease;

        &:hover {
            filter: brightness(1.25);
            box-shadow: 0 0 8px var(--dev-color);
        }

        // 预警设备：橙色描边 + 角标点，与 3D 柜面预警色块一致
        &.is-warning {
            border-color: var(--idc3-status-warning);
            box-shadow: inset 0 0 0 1px var(--idc3-status-warning);

            &::after {
                content: '';
                position: absolute;
                top: 2px;
                right: 2px;
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: var(--idc3-status-warning);
            }
        }
    }

    &__device-name {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__device-u {
        font-size: var(--idc3-font-xs);
        opacity: 0.75;
        font-variant-numeric: tabular-nums;
    }
}
</style>
