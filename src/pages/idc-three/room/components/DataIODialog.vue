<template>
    <un-dialog
        title="机房数据导入导出"
        :visible.sync="visibleProxy"
        width="600px"
        custom-class="idc3-dialog"
        append-to-body
    >
        <!-- 顶部 tab 切换（un-button 组） -->
        <div class="io-dialog__tabs">
            <un-button
                v-for="t in TABS"
                :key="t.name"
                size="mini"
                :type="tab === t.name ? 'primary' : 'text'"
                @click="tab = t.name"
            >
                {{ t.label }}
            </un-button>
        </div>

        <!-- 导出 -->
        <div v-if="tab === 'export'" class="io-dialog__pane">
            <div class="io-dialog__line">导出「{{ room.name }}」完整快照（含布局坐标、设备与配件）：</div>
            <div class="io-dialog__row">
                <un-button size="small" @click="exportJson">导出 JSON</un-button>
                <un-button size="small" @click="exportExcel">导出 Excel（布局 + 台账）</un-button>
            </div>
            <div class="io-dialog__note">
                JSON 用于备份/还原（导出→清空→导入完全还原）；Excel 给运维线下维护资产台账。
            </div>
        </div>

        <!-- 整房导入（全量替换当前机房布局） -->
        <div v-else-if="tab === 'room'" class="io-dialog__pane">
            <div class="io-dialog__line">
                选择导出的 JSON / Excel 文件，<b>全量替换</b>当前机房的机柜与设备（其他机房不受影响）：
            </div>
            <label class="io-dialog__file">
                <input type="file" accept=".json,.xlsx" @change="onFile" />
                {{ parsed ? parsed.fileName : '选择文件…' }}
            </label>

            <div v-if="parsed && parsed.type !== 'room'" class="io-dialog__error">
                该文件是单机柜数据，请切到「按机柜导入」页签。
            </div>
            <template v-if="parsed && parsed.type === 'room'">
                <div class="io-dialog__preview">
                    <span>机柜 {{ parsed.room.racks.length }} 台</span>
                    <span>设备 {{ deviceCount }} 台</span>
                </div>
                <ul v-if="errors.length" class="io-dialog__errors">
                    <li v-for="(e, i) in errors.slice(0, 6)" :key="i">{{ e }}</li>
                    <li v-if="errors.length > 6">… 共 {{ errors.length }} 处问题</li>
                </ul>
                <div class="io-dialog__row">
                    <un-button
                        size="small"
                        type="primary"
                        :disabled="errors.length > 0"
                        @click="importRoom"
                    >
                        确认导入（替换全部 {{ parsed.room.racks.length }} 柜）
                    </un-button>
                </div>
            </template>
        </div>

        <!-- 按机柜导入（增量 merge，需求 8） -->
        <div v-else class="io-dialog__pane">
            <div class="io-dialog__line">
                选择单机柜数据（JSON 单机柜对象 / Excel 单机柜行 + 设备行），<b>增量合并</b>进当前机房：
            </div>
            <label class="io-dialog__file">
                <input type="file" accept=".json,.xlsx" @change="onFile" />
                {{ parsed ? parsed.fileName : '选择文件…' }}
            </label>

            <div v-if="parsed && parsed.type !== 'rack'" class="io-dialog__error">
                该文件是整房数据，请切到「整房导入」页签。
            </div>
            <template v-if="parsed && parsed.type === 'rack'">
                <div class="io-dialog__preview">
                    <span>{{ parsed.rack.id }}</span>
                    <span>({{ parsed.rack.row }}, {{ parsed.rack.col }})</span>
                    <span>设备 {{ (parsed.rack.devices || []).length }} 台</span>
                </div>
                <ul v-if="errors.length" class="io-dialog__errors">
                    <li v-for="(e, i) in errors.slice(0, 6)" :key="i">{{ e }}</li>
                    <li v-if="errors.length > 6">… 共 {{ errors.length }} 处问题</li>
                </ul>
                <div v-if="errors.length === 0" class="io-dialog__row">
                    <span class="io-dialog__label-inline">同 ID 机柜：</span>
                    <un-button size="mini" :type="conflict === 'overwrite' ? 'primary' : 'text'" @click="conflict = 'overwrite'">
                        覆盖
                    </un-button>
                    <un-button size="mini" :type="conflict === 'skip' ? 'primary' : 'text'" @click="conflict = 'skip'">
                        跳过
                    </un-button>
                    <span class="io-dialog__spacer" />
                    <un-button size="small" type="primary" @click="importRack">确认导入</un-button>
                </div>
            </template>
        </div>
    </un-dialog>
</template>

<script>
/**
 * 机房数据导入导出向导（M5，见 开发文档.md 5.3 / 11.3）
 *
 * 三个页签：
 * - 导出：JSON 快照 / Excel 双 sheet（io.js 触发下载）
 * - 整房导入：解析 + validateRoom → 全量替换（api.saveRoomLayout）；校验失败禁止导入（= 整单回滚）
 * - 按机柜导入（需求 8）：解析 + validateRack + 同格检查 → 冲突策略（覆盖/跳过）→ api.importRack
 */
import {
    exportRoomExcel,
    exportRoomJson,
    parseImportFile,
    validateRack,
    validateRoom,
} from '../io';
import { importRack as apiImportRack, saveRoomLayout } from '../../api';

const TABS = [
    { name: 'export', label: '导出' },
    { name: 'room', label: '整房导入' },
    { name: 'rack', label: '按机柜导入' },
];

export default {
    name: 'DataIODialog',
    props: {
        room: { type: Object, required: true },
        visible: { type: Boolean, default: false },
    },
    data() {
        return {
            TABS,
            tab: 'export',
            parsed: null,
            errors: [],
            conflict: 'overwrite',
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
        deviceCount() {
            return (this.parsed && this.parsed.room ? this.parsed.room.racks : []).reduce(
                (sum, r) => sum + (r.devices || []).length,
                0
            );
        },
    },
    watch: {
        visible(v) {
            if (v) {
                this.tab = 'export';
                this.parsed = null;
                this.errors = [];
            }
        },
        tab() {
            this.parsed = null;
            this.errors = [];
        },
    },
    methods: {
        onFile(e) {
            const file = e.target.files && e.target.files[0];
            e.target.value = ''; // 允许重复选同一个文件
            if (!file) return;
            this.parsed = null;
            this.errors = [];
            parseImportFile(file)
                .then(res => {
                    this.parsed = res;
                    // 类型匹配当前页签时才校验（不匹配只提示切换）
                    if (res.type === 'room' && this.tab === 'room') this.errors = validateRoom(res.room);
                    if (res.type === 'rack' && this.tab === 'rack') this.errors = validateRack(res.rack);
                })
                .catch(err => {
                    this.$message.error(err.message || '文件解析失败');
                });
        },
        exportJson() {
            exportRoomJson(this.room);
            this.$message.success('JSON 已导出');
        },
        exportExcel() {
            const res = exportRoomExcel(this.room);
            this.$message.success(`Excel 已导出（机柜 ${res.layout} / 设备 ${res.devices}）`);
        },
        importRoom() {
            const racks = this.parsed.room.racks;
            // 门配置随整房导入一起落（无门数据时传 undefined，保留已有门）
            const doors = this.parsed.room.doors;
            const res = saveRoomLayout(this.room.id, racks, doors);
            if (res.code !== 0) {
                this.$message.error('导入失败');
                return;
            }
            const doorText = doors && doors.length ? ` / 门 ${doors.length} 处` : '';
            this.$message.success(`已替换全部 ${racks.length} 台机柜${doorText}`);
            this.visibleProxy = false;
            this.$emit('imported');
        },
        importRack() {
            const rack = this.parsed.rack;
            // 同格冲突（api 层也会兜底校验）
            const taken = this.room.racks.some(
                r => r.row === rack.row && r.col === rack.col && r.id !== rack.id
            );
            if (taken) {
                this.$message.error(`目标格 (${rack.row}, ${rack.col}) 已被占用，请先调整文件中的坐标`);
                return;
            }
            const res = apiImportRack(this.room.id, rack, { conflict: this.conflict });
            if (res.code !== 0) {
                this.$message.error(res.msg || '导入失败');
                return;
            }
            if (res.action === 'skipped') {
                // 同 id 且策略为跳过：什么都不落——用 warning 明确告知出路，
                // 且不关弹窗（用户可当场切「覆盖」再导，或改文件里的机柜ID）
                this.$message.warning(
                    `${rack.id} 已存在于本机房，已跳过——选择「覆盖」可整柜替换，或修改文件中的机柜ID后重试`
                );
                return;
            }
            const verb = res.action === 'replaced' ? '覆盖' : '新增';
            this.$message.success(`${rack.id} 已${verb}`);
            this.visibleProxy = false;
            this.$emit('imported');
        },
    },
};
</script>

<style scoped lang="scss">
.io-dialog {
    &__tabs {
        display: flex;
        gap: var(--idc3-gap-xs);
        padding-bottom: var(--idc3-gap-md);
        border-bottom: 1px solid var(--idc3-border-block);
    }

    &__pane {
        display: flex;
        flex-direction: column;
        gap: var(--idc3-gap-md);
    }

    &__line {
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text);

        b {
            color: var(--idc3-glow);
        }
    }

    &__row {
        display: flex;
        gap: var(--idc3-gap-md);
        align-items: center;
    }

    &__note {
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text-dim);
    }

    &__file {
        display: inline-flex;
        gap: var(--idc3-gap-md);
        align-items: center;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text);
        border: 1px dashed var(--idc3-border-block);
        border-radius: var(--idc3-radius-sm);
        cursor: pointer;

        &:hover {
            border-color: var(--idc3-glow);
        }

        input {
            display: none;
        }
    }

    &__preview {
        display: flex;
        gap: var(--idc3-gap-md);
        font-size: var(--idc3-font-sm);
        color: var(--idc3-status-normal);
    }

    &__errors {
        margin: 0;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        list-style: none;
        font-size: var(--idc3-font-xs);
        color: var(--idc3-status-alarm);
        background: var(--idc3-panel-soft);
        border-radius: var(--idc3-radius-sm);
    }

    &__error {
        font-size: var(--idc3-font-sm);
        color: var(--idc3-status-warning);
    }

    &__label-inline {
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text);
    }

    &__spacer {
        flex: 1;
    }
}
</style>
