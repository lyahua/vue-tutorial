<template>
    <div class="rack-drawer">
        <div class="idc-panel__title">
            {{ rack.id }}
            <el-tag size="mini" :type="tagType">{{ STATUS_LABEL[rack.status] }}</el-tag>
        </div>
        <div class="rack-drawer__body">
            <dl class="rack-drawer__stats">
                <div v-for="s in stats" :key="s.label" class="rack-drawer__stat">
                    <dt>{{ s.label }}</dt>
                    <dd>{{ s.value }}</dd>
                </div>
            </dl>

            <div class="rack-drawer__section">
                <div class="rack-drawer__section-title">
                    U 位占用
                    <span class="rack-drawer__section-extra">{{ rack.uUsed }}/{{ rack.uTotal }} U</span>
                </div>
                <!-- 42U 立面图：从上往下编号，空位画虚线框，一眼看出哪几 U 是空的 -->
                <div class="rack-drawer__u">
                    <div
                        v-for="u in uCells"
                        :key="u.key"
                        class="rack-drawer__cell"
                        :class="{ 'is-empty': !u.device }"
                        :style="u.device ? { background: DEVICE_COLOR[u.device.type] } : null"
                        :title="u.device ? u.device.name + ' · ' + u.device.model : 'U' + u.no + ' 空'"
                    >
                        <span v-if="u.device && !u.hidden" class="rack-drawer__cell-text">
                            {{ u.device.name }} · {{ u.device.uSize }}U
                        </span>
                        <span v-else-if="!u.device && !u.hidden" class="rack-drawer__cell-no">U{{ u.no }}</span>
                    </div>
                </div>
            </div>

            <div class="rack-drawer__section">
                <div class="rack-drawer__section-title">
                    设备清单
                    <span class="rack-drawer__section-extra">{{ rack.devices.length }} 台</span>
                </div>
                <el-table :data="rack.devices" size="mini" height="180" class="rack-drawer__table">
                    <el-table-column prop="name" label="名称" min-width="80" />
                    <el-table-column prop="model" label="型号" min-width="110" />
                    <el-table-column label="类型" width="70">
                        <template slot-scope="{ row }">
                            <span :style="{ color: DEVICE_COLOR[row.type] }">
                                {{ DEVICE_TYPE_LABEL[row.type] }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column label="U 位" width="90">
                        <template slot-scope="{ row }">
                            U{{ row.uStart }}-{{ row.uStart + row.uSize - 1 }}
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * 机柜详情抽屉（Vue2 版）：指标 + 42U 立面 + 设备清单
 *
 * 【接口数据】props.rack 来自 GET /idc/room/floorplan 的 Floorplan.racks[i]，
 * devices[] 含 { name, model, type, uStart, uSize }，组件只做立面排布。
 */
import { DEVICE_COLOR, DEVICE_TYPE_LABEL, STATUS_LABEL } from '../constants';

const TAG_TYPE = {
    normal: 'success',
    warning: 'warning',
    alarm: 'danger',
    offline: 'info',
};

export default {
    name: 'RackDrawer',
    props: {
        rack: { type: Object, required: true },
    },
    data() {
        return { DEVICE_COLOR, DEVICE_TYPE_LABEL, STATUS_LABEL };
    },
    computed: {
        tagType() {
            return TAG_TYPE[this.rack.status];
        },
        stats() {
            const r = this.rack;
            return [
                { label: '进风', value: `${r.tempIn} ℃` },
                { label: '出风', value: `${r.tempOut} ℃` },
                { label: '湿度', value: `${r.humidity} %` },
                { label: '功率', value: `${r.powerKw} kW` },
                { label: '负载率', value: `${r.loadPct} %` },
                { label: '位置', value: `${r.row}-${String(r.rowIndex).padStart(2, '0')}` },
            ];
        },
        /** 42U 立面单元格：同一设备占多 U 时只在首格显示文字，避免文字重叠 */
        uCells() {
            const byStart = {};
            this.rack.devices.forEach(d => {
                byStart[d.uStart] = d;
            });
            const covered = {};
            this.rack.devices.forEach(d => {
                for (let u = d.uStart + 1; u < d.uStart + d.uSize; u += 1) covered[u] = true;
            });
            const cells = [];
            for (let no = this.rack.uTotal; no >= 1; no -= 1) {
                cells.push({
                    key: no,
                    no,
                    device: byStart[no],
                    hidden: !byStart[no] && !!covered[no],
                });
            }
            return cells;
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.rack-drawer {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &__body {
        padding: @idc-gap-md;
        overflow-y: auto;
    }

    &__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: @idc-gap-sm;
        margin: 0;
    }

    &__stat {
        padding: @idc-gap-sm;
        background: @idc-panel-soft;
        border-radius: @idc-radius-sm;

        dt {
            font-size: @idc-font-xs;
            color: @idc-text-dim;
        }

        dd {
            margin: 2px 0 0;
            font-size: @idc-font-md;
            color: @idc-text;
            font-variant-numeric: tabular-nums;
        }
    }

    &__section {
        margin-top: @idc-gap-lg;
    }

    &__section-title {
        display: flex;
        align-items: center;
        margin-bottom: @idc-gap-sm;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__section-extra {
        margin-left: auto;
        color: @idc-text;
    }

    &__u {
        display: flex;
        flex-direction: column;
        padding: @idc-gap-sm;
        background: @idc-panel-soft;
        border-radius: @idc-radius-sm;
    }

    &__cell {
        height: 13px;
        line-height: 13px;
        border-radius: 2px;
        overflow: hidden;

        &.is-empty {
            background: transparent;
            border: 1px dashed @idc-border;
        }
    }

    &__cell-text,
    &__cell-no {
        display: block;
        padding-left: 4px;
        font-size: @idc-font-xs;
        // 设备色块是亮色，编号文字必须压成深色才读得清
        color: fade(@idc-bg, 85%);
        white-space: nowrap;
    }

    &__cell-no {
        color: @idc-text-dim;
    }
}

// Element UI 2 的表格没有 CSS 变量，只能逐层覆盖类名
/deep/ .rack-drawer__table,
/deep/ .rack-drawer__table th,
/deep/ .rack-drawer__table tr,
/deep/ .rack-drawer__table td.is-leaf {
    background-color: transparent;
    color: @idc-text;
    border-bottom-color: @idc-border;
}

/deep/ .rack-drawer__table th {
    color: @idc-text-dim;
    background-color: @idc-panel-soft;
}

/deep/ .rack-drawer__table::before,
/deep/ .rack-drawer__table::after {
    background-color: @idc-border;
}

/deep/ .rack-drawer__table td,
/deep/ .rack-drawer__table th.is-leaf {
    border-color: @idc-border;
}

/deep/ .rack-drawer__table .el-table__row:hover > td,
/deep/ .rack-drawer__table .el-table__body tr.hover-row > td {
    background-color: @idc-panel-soft;
}

/deep/ .rack-drawer__table .el-table__empty-block {
    background: @idc-panel-soft;
}

/deep/ .rack-drawer__table .el-table__empty-text {
    color: @idc-text-dim;
}

// 标题里的状态 tag 同样去掉浅底
/deep/ .el-tag {
    .idc-ui-tag(@idc-text-dim);
}

/deep/ .el-tag--success {
    .idc-ui-tag(#22c55e);
}

/deep/ .el-tag--warning {
    .idc-ui-tag(#eab308);
}

/deep/ .el-tag--danger {
    .idc-ui-tag(#f87171);
}
</style>
