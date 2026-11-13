<template>
    <un-dialog
        title="机柜跨房腾挪"
        :visible.sync="visibleProxy"
        width="560px"
        custom-class="idc3-dialog"
        append-to-body
    >
        <!-- 第 1 步：选要腾挪的机柜 -->
        <div v-if="step === 1" class="xf-dialog__step">
            <div class="xf-dialog__label">选择要腾挪的机柜（当前：{{ room.name }}）</div>
            <un-select v-model="rackId" size="small" popper-class="idc3-popper" filterable placeholder="选择机柜">
                <un-option v-for="r in rackOptions" :key="r.id" :label="r.label" :value="r.id" />
            </un-select>
        </div>

        <!-- 第 2 步：选目标机房 -->
        <div v-else-if="step === 2" class="xf-dialog__step">
            <div class="xf-dialog__label">选择目标机房</div>
            <un-select v-model="targetRoomId" size="small" popper-class="idc3-popper" placeholder="选择机房">
                <un-option v-for="r in targetOptions" :key="r.id" :label="r.label" :value="r.id" />
            </un-select>
        </div>

        <!-- 第 3 步：目标机房网格选格 + 朝向 -->
        <div v-else class="xf-dialog__step">
            <div class="xf-dialog__label">
                在 {{ targetModel ? targetModel.name : '' }} 的网格上点一个空格子作为新位置
            </div>
            <div class="xf-dialog__canvas">
                <RackGrid
                    v-if="targetModel"
                    :racks="targetModel.racks"
                    :grid-rows="targetModel.gridRows"
                    :grid-cols="targetModel.gridCols"
                    :cell-size="26"
                    disable-occupied
                    @cell="onPickCell"
                />
            </div>
            <div class="xf-dialog__row">
                <span>新位置：</span>
                <b v-if="cell" class="xf-dialog__pos">({{ cell.row }}, {{ cell.col }})</b>
                <span v-else class="xf-dialog__hint">未选择</span>
                <span class="xf-dialog__spacer" />
                <span>朝向</span>
                <un-button size="mini" @click="facing = facing === 'S' ? 'N' : 'S'">
                    {{ facing === 'S' ? '南（S）' : '北（N）' }}
                </un-button>
            </div>
        </div>

        <template slot="footer">
            <un-button size="small" v-if="step > 1" @click="step -= 1">上一步</un-button>
            <un-button size="small" v-if="step < 3" :disabled="!canNext" @click="step += 1">下一步</un-button>
            <un-button size="small" type="primary" v-else :disabled="!cell" :loading="loading" @click="confirm">
                确认腾挪
            </un-button>
        </template>
    </un-dialog>
</template>

<script>
/**
 * 机柜跨房腾挪向导（M5 需求 7，见 开发文档.md 11.2）
 *
 * 三步：选机柜 → 选目标机房 → 目标网格点空格（复用 RackGrid，已占格禁选）+ 朝向 →
 * 调 api.transferRack（源房移除 + 目标房放置）→ emit('done') 由父组件刷新双端。
 * 冲突校验在 api 层完成（目标格占用返回 code=1）。
 */
import RackGrid from './RackGrid.vue';
import { RACK_KIND_LABEL } from '../model';
import { getRoom, getRooms, transferRack } from '../../api';

export default {
    name: 'TransferDialog',
    components: { RackGrid },
    props: {
        room: { type: Object, required: true },
        visible: { type: Boolean, default: false },
    },
    data() {
        return {
            step: 1,
            rackId: '',
            targetRoomId: '',
            targetModel: null,
            cell: null,
            facing: 'S',
            loading: false,
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
        rackOptions() {
            return this.room.racks.map(r => ({
                id: r.id,
                label: `${r.id}（${RACK_KIND_LABEL[r.kind] || r.kind}）`,
            }));
        },
        targetOptions() {
            return getRooms()
                .filter(r => r.id !== this.room.id)
                .map(r => ({ id: r.id, label: `${r.siteName} · ${r.name}` }));
        },
        rack() {
            return this.room.racks.find(r => r.id === this.rackId) || null;
        },
        canNext() {
            if (this.step === 1) return !!this.rackId;
            if (this.step === 2) return !!this.targetRoomId;
            return false;
        },
    },
    watch: {
        visible(v) {
            if (v) {
                this.step = 1;
                this.rackId = '';
                this.targetRoomId = '';
                this.targetModel = null;
                this.cell = null;
                this.facing = 'S';
            }
        },
        // 进入第 3 步时加载目标机房模型（含对方的当前布局/编辑记录）
        step(s) {
            if (s === 3 && this.targetRoomId) {
                this.targetModel = getRoom(this.targetRoomId);
                this.cell = null;
            }
        },
    },
    methods: {
        onPickCell(row, col) {
            this.cell = { row, col };
        },
        confirm() {
            if (!this.rack || !this.cell || this.loading) return;
            this.loading = true;
            const res = transferRack({
                rack: this.rack,
                fromRoomId: this.room.id,
                toRoomId: this.targetRoomId,
                row: this.cell.row,
                col: this.cell.col,
                facing: this.facing,
            });
            this.loading = false;
            if (res.code !== 0) {
                this.$message.error(res.msg || '腾挪失败');
                return;
            }
            this.$message.success(`${this.rack.id} 已腾挪至 ${this.targetModel ? this.targetModel.name : ''}`);
            this.visibleProxy = false;
            this.$emit('done', { rackId: this.rackId, toRoomId: this.targetRoomId });
        },
    },
};
</script>

<style scoped lang="scss">
.xf-dialog {
    &__step {
        display: flex;
        flex-direction: column;
        gap: var(--idc3-gap-md);
    }

    &__label {
        font-size: var(--idc3-font-sm);
        color: var(--idc3-block-title);
    }

    &__canvas {
        max-height: 340px;
        padding: var(--idc3-gap-sm);
        overflow: auto;
        border: 1px solid var(--idc3-border-block);
        border-radius: var(--idc3-radius-sm);
    }

    &__row {
        display: flex;
        gap: var(--idc3-gap-sm);
        align-items: center;
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text);
    }

    &__pos {
        color: var(--idc3-glow);
        font-variant-numeric: tabular-nums;
    }

    &__hint {
        color: var(--idc3-text-dim);
    }

    &__spacer {
        flex: 1;
    }
}
</style>
