<template>
    <div class="room-editor">
        <div class="room-editor__bar">
            <un-select v-model="kind" size="mini" popper-class="idc3-popper" class="room-editor__kind">
                <un-option v-for="k in kindOptions" :key="k.value" :label="k.label" :value="k.value" />
            </un-select>
            <span class="room-editor__tip">点空格放置新柜 · 点机柜选中 · 选中后再点空格移动</span>
        </div>

        <div class="room-editor__canvas">
            <RackGrid
                :racks="draft"
                :grid-rows="gridRows"
                :grid-cols="gridCols"
                :selected-id="selectedId"
                :cell-size="30"
                @cell="onCell"
                @rack="onRack"
            />
        </div>

        <div class="room-editor__status">
            <template v-if="selected">
                选中 <b>{{ selected.id }}</b>（{{ selected.row }}, {{ selected.col }}）朝向
                {{ selected.facing === 'S' ? '南' : '北' }}
            </template>
            <template v-else>未选中机柜（点击机柜编辑属性 / 移动）</template>
            <span class="room-editor__diff">新增 {{ diff.added }} · 删除 {{ diff.removed }} · 移动 {{ diff.moved }}</span>
        </div>

        <!-- 机柜属性编辑：选中即改，随「保存布局」一起提交。
             不提供编号编辑——新增柜 id 由系统自动生成（NEW-*），存量柜改 id 会断设备/配件/告警引用；
             U 位 v-model 所见即所得（数字规范化在 change，范围/收缩拦截在保存） -->
        <div v-if="selected" class="room-editor__props">
            <div class="room-editor__prop">
                <label>名称</label>
                <un-input v-model="selected.name" size="mini" class="room-editor__prop-name" placeholder="机柜名称" />
            </div>
            <div class="room-editor__prop">
                <label>U 位</label>
                <un-input
                    v-model="selected.uTotal"
                    size="mini"
                    class="room-editor__prop-u"
                    placeholder="0-48"
                    @change="normalizeUTotal"
                />
            </div>
            <div class="room-editor__prop">
                <label>柜型</label>
                <un-select :value="selected.kind" size="mini" popper-class="idc3-popper" class="room-editor__prop-kind" @change="onKindChange">
                    <un-option v-for="k in kindOptions" :key="k.value" :label="k.label" :value="k.value" />
                </un-select>
            </div>
        </div>

        <div class="room-editor__ops">
            <un-button size="mini" :disabled="!selected" @click="toggleFacing">切换朝向</un-button>
            <un-button size="mini" :disabled="!selected" @click="removeSelected">删除机柜</un-button>
            <span class="room-editor__spacer" />
            <un-button size="mini" @click="resetDraft">重置</un-button>
            <un-button size="mini" type="primary" @click="save">保存布局</un-button>
        </div>
    </div>
</template>

<script>
/**
 * 机房布局编辑器（M5：稀疏网格编辑，见 开发文档.md 5.2）
 *
 * 工作在 draft（props.room.racks 的浅拷贝 + 新增柜）上，保存时整体提交：
 * api.saveRoomLayout(room.id, draft) → 父组件重新 getRoom → 3D 重建。
 * 交互：空格放置选中柜型的新柜；点击柜选中；选中后再点空格移动；
 * 朝向切换 / 删除 / 重置；保存前做同格冲突校验。
 */
import RackGrid from './RackGrid.vue';
import { RACK_KIND_LABEL, U_TOTAL } from '../model';
import { saveRoomLayout } from '../../api';

const FACILITY_KINDS = ['aircon', 'power', 'ups', 'empty'];

export default {
    name: 'RoomEditor',
    components: { RackGrid },
    props: {
        room: { type: Object, required: true },
    },
    data() {
        return {
            draft: [],
            kind: 'compute',
            selectedId: '',
            seq: 0,
        };
    },
    computed: {
        kindOptions() {
            return Object.keys(RACK_KIND_LABEL).map(k => ({ value: k, label: RACK_KIND_LABEL[k] }));
        },
        selected() {
            return this.draft.find(r => r.id === this.selectedId) || null;
        },
        gridRows() {
            return this.room.gridRows + 2; // 编辑时多给两排余量，方便往外围扩
        },
        gridCols() {
            return this.room.gridCols + 2;
        },
        /** 与原布局的差异统计 */
        diff() {
            const origin = new Map(this.room.racks.map(r => [r.id, r]));
            let moved = 0;
            this.draft.forEach(r => {
                const o = origin.get(r.id);
                if (o && (o.row !== r.row || o.col !== r.col || o.facing !== r.facing)) moved += 1;
            });
            return {
                added: this.draft.filter(r => !origin.has(r.id)).length,
                removed: this.room.racks.filter(r => !this.draft.some(d => d.id === r.id)).length,
                moved,
            };
        },
    },
    watch: {
        // 进入编辑模式 / 切换机房时重置草稿
        room: {
            immediate: true,
            handler() {
                this.resetDraft();
            },
        },
    },
    methods: {
        resetDraft() {
            this.draft = this.room.racks.map(r => ({ ...r }));
            this.selectedId = '';
            this.seq = 0;
        },
        /**
         * U 位输入规范化（change = 失焦/回车时）：v-model 所见即所得，
         * 这里只把字符串转成数字（el-input 输入的是字符串）；范围与收缩
         * 校验放保存时统一拦截——输入时打断体验，保存时明确报错更好。
         */
        normalizeUTotal() {
            const rack = this.selected;
            if (!rack) return;
            rack.uTotal = Number(rack.uTotal);
        },
        /** 柜型切换：U 位重置为该类默认（设施柜 0 / 设备柜 42），可再手动改 */
        onKindChange(kind) {
            const rack = this.selected;
            if (!rack) return;
            rack.kind = kind;
            rack.uTotal = FACILITY_KINDS.includes(kind) ? 0 : U_TOTAL;
        },
        onRack(rack) {
            this.selectedId = rack.id === this.selectedId ? '' : rack.id;
        },
        onCell(row, col) {
            if (this.selectedId) {
                // 选中态点空格 → 移动该柜
                const rack = this.draft.find(r => r.id === this.selectedId);
                if (rack) {
                    rack.row = row;
                    rack.col = col;
                }
                return;
            }
            // 未选中 → 放置当前柜型的新柜
            const rack = {
                id: this.genId(),
                name: this.genId(),
                kind: this.kind,
                row,
                col,
                facing: 'S',
                uTotal: FACILITY_KINDS.includes(this.kind) ? 0 : U_TOTAL,
                status: 'normal',
                devices: [],
            };
            this.draft.push(rack);
            this.selectedId = rack.id;
        },
        genId() {
            let id;
            do {
                this.seq += 1;
                id = `NEW-${this.seq}`;
            } while (this.draft.some(r => r.id === id));
            return id;
        },
        toggleFacing() {
            if (!this.selected) return;
            this.selected.facing = this.selected.facing === 'S' ? 'N' : 'S';
        },
        removeSelected() {
            if (!this.selected) return;
            this.draft = this.draft.filter(r => r.id !== this.selectedId);
            this.selectedId = '';
        },
        save() {
            // —— 保存前全量校验（属性编辑可能引入的问题都在这里拦）——
            const byCell = new Map();
            const byId = new Set();
            for (const r of this.draft) {
                // 同格冲突（编辑器移动可能制造）
                const key = `${r.row}:${r.col}`;
                if (byCell.has(key)) {
                    this.$message.error(`同格冲突：${byCell.get(key)} 与 ${r.id} 都在 (${r.row}, ${r.col})`);
                    return;
                }
                byCell.set(key, r.id);
                // 编号唯一（新增柜改过编号可能撞存量）
                if (byId.has(r.id)) {
                    this.$message.error(`编号重复：${r.id}`);
                    return;
                }
                byId.add(r.id);
                // 名称非空
                if (!r.name || !String(r.name).trim()) {
                    this.$message.error(`机柜 ${r.id} 的名称不能为空`);
                    return;
                }
                // U 位范围
                if (!Number.isInteger(r.uTotal) || r.uTotal < 0 || r.uTotal > 48) {
                    this.$message.error(`机柜 ${r.id} 的 U 位数必须是 0~48 的整数`);
                    return;
                }
                // 设施柜（U 位 0）不允许挂设备
                if (!r.uTotal && (r.devices || []).length) {
                    this.$message.error(`机柜 ${r.id}（U 位 0）不允许挂设备，请先调整柜型或清空设备`);
                    return;
                }
                // U 位收缩校验：不能小于设备最高占用
                const maxU = (r.devices || []).reduce((m, d) => Math.max(m, d.startU + d.uSize - 1), 0);
                if (maxU > r.uTotal) {
                    this.$message.error(`机柜 ${r.id} 的设备已占用到 ${maxU}U，U 位总数不能小于 ${maxU}`);
                    return;
                }
            }
            saveRoomLayout(this.room.id, this.draft.map(r => ({ ...r })));
            this.$message.success('布局已保存');
            this.$emit('saved');
        },
    },
};
</script>

<style scoped lang="scss">
.room-editor {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &__bar {
        display: flex;
        gap: var(--idc3-gap-md);
        align-items: center;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        border-bottom: 1px solid var(--idc3-border-block);
    }

    &__kind {
        width: 110px;
        flex-shrink: 0;
    }

    &__tip {
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text-dim);
    }

    &__canvas {
        flex: 1;
        min-height: 0;
        padding: var(--idc3-gap-md);
        overflow: auto;
    }

    &__status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text);
        border-top: 1px solid var(--idc3-border-block);

        b {
            color: var(--idc3-glow);
        }
    }

    // 机柜属性编辑区：横向紧凑表单（编号 / 名称 / U 位 / 柜型）
    &__props {
        display: flex;
        flex-wrap: wrap;
        gap: var(--idc3-gap-sm) var(--idc3-gap-md);
        align-items: center;
        padding: var(--idc3-gap-xs) var(--idc3-gap-md);
        border-top: 1px solid var(--idc3-border-block);
    }

    &__prop {
        display: flex;
        align-items: center;
        gap: var(--idc3-gap-xs);

        label {
            flex-shrink: 0;
            font-size: var(--idc3-font-xs);
            color: var(--idc3-text-dim);
        }
    }

    &__prop-name {
        width: 130px;
    }

    &__prop-u {
        width: 70px;
    }

    &__prop-kind {
        width: 110px;
    }

    &__diff {
        font-variant-numeric: tabular-nums;
        color: var(--idc3-text-dim);
    }

    &__ops {
        display: flex;
        gap: var(--idc3-gap-sm);
        align-items: center;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        border-top: 1px solid var(--idc3-border-block);
    }

    &__spacer {
        flex: 1;
    }
}
</style>
