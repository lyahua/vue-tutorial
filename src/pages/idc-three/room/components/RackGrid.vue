<template>
    <div class="rack-grid" :style="gridStyle">
        <!-- 空格子（可点击放置；disableOccupied 时已占格禁用） -->
        <div
            v-for="cell in cells"
            :key="cell.key"
            class="rack-grid__cell"
            :class="{ 'is-disabled': cell.disabled }"
            :style="cell.style"
            :title="cell.disabled ? '该格已被占用' : `(${cell.row}, ${cell.col})`"
            @click="onCell(cell)"
        />
        <!-- 机柜块（显式定位覆盖在格子上，拦截点击） -->
        <div
            v-for="r in racks"
            :key="r.id"
            class="rack-grid__rack"
            :class="{
                'is-selected': r.id === selectedId,
                'is-alarm': r.status === 'alarm' || r.status === 'warning',
                'is-offline': r.status === 'offline',
            }"
            :style="rackStyle(r)"
            :title="rackTitle(r)"
            @click.stop="$emit('rack', r)"
        >
            {{ r.id }}
        </div>
    </div>
</template>

<script>
/**
 * 稀疏网格画布（M5 共享组件：布局编辑器 / 腾挪向导复用）
 *
 * 渲染约定与 3D 一致：网格原点在西北角，(row, col) 显式定位；
 * 颜色按柜型走设计令牌。空格子可点击（emit cell），机柜块可点击（emit rack）。
 *
 * props：
 * - racks / gridRows / gridCols：Room 模型字段
 * - selectedId：选中的机柜（编辑器高亮）
 * - disableOccupied：已占格子禁点（腾挪向导选目标格时用）
 * - cellSize：格子边长（px）
 */
import { RACK_KIND_LABEL } from '../model';
import { cssVar } from '../../styles/tokens';

export default {
    name: 'RackGrid',
    props: {
        racks: { type: Array, default: () => [] },
        gridRows: { type: Number, required: true },
        gridCols: { type: Number, required: true },
        selectedId: { type: String, default: '' },
        disableOccupied: { type: Boolean, default: false },
        cellSize: { type: Number, default: 34 },
    },
    computed: {
        gridStyle() {
            return {
                gridTemplateColumns: `repeat(${this.gridCols}, ${this.cellSize}px)`,
                gridTemplateRows: `repeat(${this.gridRows}, ${this.cellSize}px)`,
            };
        },
        occupiedMap() {
            const map = new Map();
            this.racks.forEach(r => map.set(`${r.row}:${r.col}`, r));
            return map;
        },
        cells() {
            const out = [];
            for (let row = 0; row < this.gridRows; row += 1) {
                for (let col = 0; col < this.gridCols; col += 1) {
                    const occupied = this.occupiedMap.has(`${row}:${col}`);
                    out.push({
                        key: `${row}-${col}`,
                        row,
                        col,
                        disabled: this.disableOccupied && occupied,
                        style: { gridRow: row + 1, gridColumn: col + 1 },
                    });
                }
            }
            return out;
        },
    },
    methods: {
        kindColor(kind) {
            return cssVar('--idc3-rack-' + kind) || cssVar('--idc3-rack-compute');
        },
        rackStyle(r) {
            return {
                gridRow: r.row + 1,
                gridColumn: r.col + 1,
                '--rg-color': this.kindColor(r.kind),
            };
        },
        rackTitle(r) {
            const label = RACK_KIND_LABEL[r.kind] || r.kind;
            return `${r.id}（${label}）(${r.row}, ${r.col}) 朝向 ${r.facing === 'S' ? '南' : '北'}`;
        },
        onCell(cell) {
            if (cell.disabled) return;
            this.$emit('cell', cell.row, cell.col);
        },
    },
};
</script>

<style scoped lang="scss">
.rack-grid {
    display: grid;
    gap: 2px;
    width: max-content;

    &__cell {
        box-sizing: border-box;
        border: 1px dashed var(--idc3-split-line);
        border-radius: 2px;
        cursor: pointer;
        transition: background 0.12s ease, border-color 0.12s ease;

        &:hover {
            background: var(--idc3-cold-aisle);
            border-color: var(--idc3-glow);
        }

        &.is-disabled {
            cursor: not-allowed;
            border-color: var(--idc3-status-alarm);
            opacity: 0.6;
        }
    }

    &__rack {
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: pointer;
        background: var(--rg-color);
        border: 1px solid var(--rg-color);
        border-radius: 2px;
        color: var(--idc3-block-title);
        font-size: var(--idc3-font-xs);
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: filter 0.12s ease, box-shadow 0.12s ease;

        &:hover {
            filter: brightness(1.3);
            box-shadow: 0 0 8px var(--rg-color);
        }

        &.is-selected {
            outline: 2px solid var(--idc3-glow);
            box-shadow: 0 0 10px var(--idc3-glow);
        }

        &.is-alarm {
            border-color: var(--idc3-status-alarm);
        }

        &.is-offline {
            opacity: 0.45;
        }
    }
}
</style>
