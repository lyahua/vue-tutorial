<template>
    <un-dialog
        :title="device ? `设备详情 · ${device.name}` : '设备详情'"
        :visible.sync="visibleProxy"
        width="680px"
        custom-class="idc3-dialog"
        append-to-body
    >
        <template v-if="device">
            <div class="dev-dialog__info">
                <div class="dev-dialog__info-item">
                    <span>类型</span>
                    <b>{{ categoryLabel }}</b>
                </div>
                <div class="dev-dialog__info-item">
                    <span>型号</span>
                    <b>{{ device.model }}</b>
                </div>
                <div class="dev-dialog__info-item">
                    <span>厂商 / SN</span>
                    <b>{{ device.vendor }} · {{ device.sn }}</b>
                </div>
                <div class="dev-dialog__info-item">
                    <span>U 位</span>
                    <b>{{ device.startU }}–{{ device.startU + device.uSize - 1 }}U（{{ device.uSize }}U）</b>
                </div>
                <div class="dev-dialog__info-item">
                    <span>状态</span>
                    <b :class="'is-' + device.status">{{ deviceStatusLabel }}</b>
                </div>
            </div>

            <div class="dev-dialog__section-title">可更换配件（点击「更换」选择新型号）</div>
            <table class="dev-dialog__parts">
                <thead>
                    <tr>
                        <th>槽位</th>
                        <th>类型</th>
                        <th>当前型号</th>
                        <th>状态</th>
                        <th>最近更换</th>
                        <th class="dev-dialog__op-col">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in device.components" :key="p.id">
                        <td>{{ p.slot }}</td>
                        <td>{{ partLabel(p.kind) }}</td>
                        <td>{{ p.model }}</td>
                        <td>
                            <span class="dev-dialog__status" :class="{ 'is-fault': p.status === 'fault' }">
                                {{ p.status === 'fault' ? '故障' : '正常' }}
                            </span>
                        </td>
                        <td>{{ fmt(p.replacedAt) }}</td>
                        <td class="dev-dialog__op-col">
                            <un-button size="mini" type="text" @click="startReplace(p)">更换</un-button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- 更换确认区：选型号 → 确认走接口（需求 2.2 确认结论：弹框确认事件走接口） -->
            <div v-if="replacing" class="dev-dialog__replace">
                <div class="dev-dialog__replace-head">
                    <span>
                        更换 <b>{{ replacing.component.slot }}</b>（{{ partLabel(replacing.component.kind) }}）
                    </span>
                    <un-button size="mini" type="text" @click="replacing = null">取消</un-button>
                </div>
                <div class="dev-dialog__replace-row">
                    <un-select
                        v-model="replacing.model"
                        size="small"
                        popper-class="idc3-popper"
                        placeholder="选择新型号"
                    >
                        <un-option v-for="m in replacingModels" :key="m" :label="m" :value="m" />
                    </un-select>
                    <un-button
                        size="small"
                        type="primary"
                        :loading="replacing.loading"
                        :disabled="!replacing.model"
                        @click="confirmReplace"
                    >
                        确认更换
                    </un-button>
                </div>
            </div>
        </template>
    </un-dialog>
</template>

<script>
/**
 * 设备详情 + 配件更换弹框（M4）
 *
 * 交互（对应需求 2.2 确认结论）：
 * 点击 U 位设备 → 本弹框：设备信息 + 配件表格（cpu/内存/硬盘/电源/风扇）→
 * 行内「更换」→ 选新型号 →「确认更换」→ 调 api.replaceComponent（本阶段 mock，
 * 真实后端只换 api.js 一处）→ 写回型号与 replacedAt；故障件修复同时把设备
 * 状态恢复 normal → $emit('replaced')，父组件触发 3D 柜面局部刷新。
 */
import dayjs from 'dayjs';
import { DEV_CATEGORY_LABEL, STATUS_LABEL, PART_KIND_LABEL, PART_MODEL_POOL } from '../model';
import { replaceComponent } from '../../api';

export default {
    name: 'DeviceDialog',
    props: {
        // model.js 的 Device 对象（与 room.racks 内同一引用，数据可回写）
        device: { type: Object, default: null },
        visible: { type: Boolean, default: false },
    },
    data() {
        return {
            // { component, model, loading } | null
            replacing: null,
        };
    },
    computed: {
        visibleProxy: {
            get() {
                return this.visible;
            },
            set(v) {
                this.$emit('update:visible', v);
            },
        },
        categoryLabel() {
            return DEV_CATEGORY_LABEL[this.device.category] || this.device.category;
        },
        deviceStatusLabel() {
            return STATUS_LABEL[this.device.status] || this.device.status;
        },
        replacingModels() {
            if (!this.replacing) return [];
            return PART_MODEL_POOL[this.replacing.component.kind] || [];
        },
    },
    watch: {
        visible(v) {
            if (!v) this.replacing = null;
        },
    },
    methods: {
        partLabel(kind) {
            return PART_KIND_LABEL[kind] || kind;
        },
        fmt(ts) {
            return ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '—';
        },
        startReplace(part) {
            const pool = PART_MODEL_POOL[part.kind] || [];
            // 默认选中一个与当前不同的型号
            const first = pool.find(m => m !== part.model) || pool[0];
            this.replacing = { component: part, model: first, loading: false };
        },
        confirmReplace() {
            const r = this.replacing;
            if (!r || !r.model || r.loading) return;
            r.loading = true;
            replaceComponent(this.device.id, r.component.id, { model: r.model })
                .then(res => {
                    // 接口成功后本地同步写回：型号 + 更换时间；故障件修复、设备恢复 normal
                    r.component.model = res.data.model;
                    r.component.replacedAt = res.data.replacedAt;
                    const wasFault = r.component.status === 'fault';
                    r.component.status = 'ok';
                    if (wasFault) this.device.status = 'normal';
                    const slot = r.component.slot;
                    this.replacing = null;
                    this.$message.success(`${slot} 更换成功`);
                    this.$emit('replaced', { device: this.device, component: r.component });
                })
                .catch(() => {
                    if (this.replacing) this.replacing.loading = false;
                });
        },
    },
};
</script>

<style scoped lang="scss">
// 弹框挂 body 下（append-to-body），容器级暗色由全局 .idc3-dialog 负责；
// 这里只管内容排版，颜色照旧走令牌。
.dev-dialog {
    &__info {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--idc3-gap-sm) var(--idc3-gap-md);
        margin-bottom: var(--idc3-gap-md);
    }

    &__info-item {
        display: flex;
        justify-content: space-between;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        font-size: var(--idc3-font-sm);
        background: var(--idc3-panel-soft);
        border: 1px solid var(--idc3-border-block);
        border-radius: var(--idc3-radius-sm);

        span {
            color: var(--idc3-text-dim);
        }

        b {
            font-weight: 500;
            color: var(--idc3-text);

            &.is-normal {
                color: var(--idc3-status-normal);
            }

            &.is-warning {
                color: var(--idc3-status-warning);
            }

            &.is-alarm {
                color: var(--idc3-status-alarm);
            }

            &.is-offline {
                color: var(--idc3-status-offline);
            }
        }
    }

    &__section-title {
        margin-bottom: var(--idc3-gap-sm);
        font-size: var(--idc3-font-sm);
        color: var(--idc3-block-title);
    }

    &__parts {
        width: 100%;
        border-collapse: collapse;

        th,
        td {
            padding: 7px 10px;
            font-size: var(--idc3-font-sm);
            font-weight: 400;
            text-align: left;
            border-bottom: 1px solid var(--idc3-border-block);
        }

        th {
            color: var(--idc3-text-dim);
            background: var(--idc3-panel-soft);
        }

        td {
            color: var(--idc3-text);
        }

        tbody tr:hover td {
            background: var(--idc3-panel-soft);
        }
    }

    &__op-col {
        width: 64px;
        text-align: center;
    }

    &__status {
        &.is-fault {
            color: var(--idc3-status-alarm);
        }
    }

    // —— 更换确认区 ——
    &__replace {
        margin-top: var(--idc3-gap-md);
        padding: var(--idc3-gap-md);
        background: var(--idc3-panel-soft);
        border: 1px solid var(--idc3-border-block);
        border-radius: var(--idc3-radius-sm);
    }

    &__replace-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--idc3-gap-sm);
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text);

        b {
            color: var(--idc3-glow);
        }
    }

    &__replace-row {
        display: flex;
        gap: var(--idc3-gap-md);
    }
}
</style>
