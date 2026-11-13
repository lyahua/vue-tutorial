<template>
    <div class="idc3-page room-page">
        <header class="room-page__head">
            <div class="room-page__title-wrap">
                <un-button size="mini" type="text" icon="el-icon-back" @click="goBack">返回总览</un-button>
                <h1 class="idc3-title room-page__title">{{ title }}</h1>
            </div>
            <div class="room-page__views">
                <!-- 同站机房切换：数据源 = 站点楼层模型的房间列表（含辅助间，免退回总览） -->
                <un-select
                    v-if="siteRooms.length > 1"
                    :value="room && room.id"
                    size="mini"
                    popper-class="idc3-popper"
                    class="room-page__switch"
                    placeholder="切换机房"
                    @change="onSwitchRoom"
                >
                    <un-option v-for="r in siteRooms" :key="r.roomId" :label="r.name" :value="r.roomId" />
                </un-select>
                <!-- M7：定位机柜（模糊搜索，告警/预警柜置顶） -->
                <un-select
                    v-model="locateId"
                    size="mini"
                    filterable
                    popper-class="idc3-popper"
                    class="room-page__locate"
                    placeholder="定位机柜"
                    @change="onLocate"
                >
                    <un-option v-for="o in locateOptions" :key="o.id" :label="o.label" :value="o.id" />
                </un-select>
                <un-button
                    v-for="v in VIEW_PRESETS"
                    :key="v.name"
                    size="mini"
                    :type="view === v.name ? 'primary' : 'text'"
                    @click="setView(v.name)"
                >
                    {{ v.label }}
                </un-button>
                <span class="room-page__view-sep" />
                <!-- M5：布局编辑 / 导入导出 / 机柜腾挪 -->
                <un-button
                    size="mini"
                    :type="editing ? 'primary' : 'text'"
                    @click="toggleEditing"
                >
                    {{ editing ? '退出编辑' : '布局编辑' }}
                </un-button>
                <un-button size="mini" type="text" @click="ioDialogVisible = true">导入导出</un-button>
                <un-button size="mini" type="text" @click="transferDialogVisible = true">机柜腾挪</un-button>
            </div>
        </header>

        <div class="room-page__main">
            <section class="room-page__stage idc3-panel">
                <ThreeRoom
                    v-if="room && webgl2"
                    ref="three"
                    class="room-page__three"
                    :room="room"
                    @hover="onHover"
                    @select="onSelect"
                    @dblselect="onDblSelect"
                />
                <!-- 相机操作提示：pointer-events 关闭，不挡 3D 交互 -->
                <div v-if="room && webgl2" class="room-page__ops-hint">
                    左键 旋转 · 右键 平移 · 滚轮 缩放 · 单击查看详情 · 双击定位到 U 位
                </div>
                <!-- M6：WebGL2 不可用时优雅降级——舞台提示，侧栏功能（U 位/编辑器/导入导出）不受影响 -->
                <div v-if="room && !webgl2" class="room-page__mask">
                    <p>当前浏览器不支持 WebGL2，无法渲染三维视图</p>
                    <p class="room-page__mask-sub">建议使用较新版本的 Chrome / Edge；右侧机柜详情与数据功能仍可正常使用</p>
                </div>
                <!-- 悬停信息卡（跟随鼠标，pointer-events 关闭不挡交互） -->
                <div
                    v-if="hoverRack"
                    class="room-page__hover-card"
                    :style="{ left: hoverPos.x + 14 + 'px', top: hoverPos.y + 14 + 'px' }"
                >
                    <div class="room-page__hover-head">
                        <span class="room-page__hover-id">{{ hoverRack.id }}</span>
                        <span class="room-page__hover-status" :class="'is-' + hoverRack.status">
                            {{ statusLabel(hoverRack) }}
                        </span>
                    </div>
                    <div class="room-page__hover-row">{{ kindLabel(hoverRack) }}</div>
                    <div v-if="hoverRack.uTotal" class="room-page__hover-row">
                        U 位：{{ hoverRack.uUsed }}/{{ hoverRack.uTotal }}（{{ uPct(hoverRack) }}%）
                    </div>
                    <div v-if="hoverRack.powerKw != null" class="room-page__hover-row">
                        功率 {{ hoverRack.powerKw }} kW · 进风 {{ hoverRack.tempIn }}℃
                    </div>
                    <div class="room-page__hover-tip">点击查看机柜详情</div>
                </div>

                <!-- 未找到机房 -->
                <div v-if="!room && !loading" class="room-page__mask">
                    <p>未找到机房（{{ $route.query.room || '未指定' }}）</p>
                    <un-button size="small" type="primary" @click="goBack">返回总览</un-button>
                </div>
                <div v-if="loading" class="room-page__mask">机房数据加载中…</div>
            </section>

            <!-- 侧栏按需显隐：进房默认收起（3D 全幅），点机柜/定位后弹出，标题栏可主动收起；
                 编辑模式强制显示（编辑面板在侧栏里） -->
            <aside v-if="sideVisible || editing" class="room-page__side idc3-panel">
                <!-- M5：编辑模式显示布局编辑器，替代机柜详情面板 -->
                <template v-if="editing">
                    <div class="idc3-panel__title">布局编辑</div>
                    <RoomEditor :room="room" class="room-page__editor" @saved="onLayoutSaved" />
                </template>
                <template v-else>
                    <div class="room-page__side-head">
                        <div class="idc3-panel__title">机柜详情</div>
                        <un-button
                            size="mini"
                            type="text"
                            icon="el-icon-close"
                            title="收起面板"
                            @click="sideVisible = false"
                        />
                    </div>
                    <template v-if="selectedRack">
                        <div class="room-page__rack-head">
                            <span class="room-page__rack-id">{{ selectedRack.id }}</span>
                            <span class="room-page__hover-status" :class="'is-' + selectedRack.status">
                                {{ statusLabel(selectedRack) }}
                            </span>
                        </div>
                        <dl class="room-page__props">
                            <div class="room-page__prop">
                                <dt>类型</dt>
                                <dd>{{ kindLabel(selectedRack) }}</dd>
                            </div>
                            <div class="room-page__prop">
                                <dt>U 位占用</dt>
                                <dd>{{ selectedRack.uUsed || 0 }} / {{ selectedRack.uTotal || 0 }} U</dd>
                            </div>
                            <div class="room-page__prop" v-if="selectedRack.powerKw != null">
                                <dt>实时功率</dt>
                                <dd>{{ selectedRack.powerKw }} kW（{{ selectedRack.loadPct }}%）</dd>
                            </div>
                            <div class="room-page__prop" v-if="selectedRack.tempIn != null">
                                <dt>进风温度</dt>
                                <dd>{{ selectedRack.tempIn }} ℃</dd>
                            </div>
                        </dl>
                        <!-- M4：42U 位面板，点击设备块打开配件更换弹框 -->
                        <RackUPanel :rack="selectedRack" class="room-page__u-panel" @pick-device="onPickDevice" />
                    </template>
                    <div v-else class="room-page__empty">点击 3D 机柜查看详情</div>
                </template>
            </aside>
        </div>

        <!-- M4：设备详情 + 配件更换（更换确认事件走接口，见 DeviceDialog） -->
        <DeviceDialog
            :device="selectedDevice"
            :visible.sync="deviceDialogVisible"
            @replaced="onDeviceReplaced"
        />

        <!-- M5：导入导出（整房全量 / 按机柜增量，含校验与冲突策略） -->
        <DataIODialog
            v-if="room"
            :room="room"
            :visible.sync="ioDialogVisible"
            @imported="refreshRoom"
        />

        <!-- M5：机柜跨房腾挪（三步向导，见 TransferDialog） -->
        <TransferDialog
            v-if="room"
            :room="room"
            :visible.sync="transferDialogVisible"
            @done="refreshRoom"
        />
    </div>
</template>

<script>
/**
 * L3 机房三维页（M3 + M4 + M5）
 *
 * 数据流：路由 query.room（缺省取第一个机房）→ api.getRoom() 稀疏网格 Room 模型
 * （mock 直接产出教程第一章格式，无中间转换层）→ ThreeRoom 渲染；
 * 悬停/点击事件回传机柜对象驱动信息卡与侧栏。
 * M4：点击机柜 → 侧栏 42U 面板 → 点击 U 位设备 → 配件更换弹框 →
 * 接口成功后写回数据并局部刷新 3D 柜面（不丢相机视角）。
 * M5：布局编辑（RoomEditor）、导入导出（DataIODialog）、机柜跨房腾挪（TransferDialog）；
 * 保存/导入/腾挪后统一 refreshRoom()（重新 getRoom → 3D 整场景重建）。
 */
import Vue from 'vue';
import UnUI from '../components/un';
import ThreeRoom from './components/ThreeRoom.vue';
import RackUPanel from './components/RackUPanel.vue';
import DeviceDialog from './components/DeviceDialog.vue';
import RoomEditor from './components/RoomEditor.vue';
import DataIODialog from './components/DataIODialog.vue';
import TransferDialog from './components/TransferDialog.vue';
import { RACK_KIND_LABEL, STATUS_LABEL } from './model';
import { getRoom, getRooms, getFloor } from '../api';

Vue.use(UnUI); // 直接进入本路由时也保证 un-dialog/un-tag 等已注册（Vue.use 幂等）

const VIEW_PRESETS = [
    { name: 'overview', label: '总览' },
    { name: 'front', label: '正视' },
    { name: 'top', label: '俯视' },
];

export default {
    name: 'IdcThreeRoom',
    components: { ThreeRoom, RackUPanel, DeviceDialog, RoomEditor, DataIODialog, TransferDialog },
    data() {
        return {
            room: null,
            loading: true,
            view: 'overview',
            hoverRack: null,
            hoverPos: { x: 0, y: 0 },
            selectedRack: null,
            // 侧栏按需显隐：进房默认收起，点机柜/定位后弹出，标题栏可主动收起
            sideVisible: false,
            // 同站机房切换的数据源（站点楼层模型的房间列表，含辅助间）
            siteRooms: [],
            // M4：U 位设备弹框
            selectedDevice: null,
            deviceDialogVisible: false,
            // M5：编辑模式 / 导入导出 / 腾挪
            editing: false,
            ioDialogVisible: false,
            transferDialogVisible: false,
            // M7：定位机柜搜索
            locateId: '',
            // M6：WebGL2 能力检测（进页面时一次）
            webgl2: (() => {
                try {
                    const c = document.createElement('canvas');
                    return !!c.getContext('webgl2');
                } catch (e) {
                    return false;
                }
            })(),
            VIEW_PRESETS,
        };
    },
    computed: {
        title() {
            if (!this.room) return '三维机房';
            return `${this.room.siteName} · ${this.room.name}`;
        },
        /** M7：定位下拉选项——告警/预警柜置顶并带状态后缀（顺手当告警柜速查器） */
        locateOptions() {
            if (!this.room) return [];
            const order = { alarm: 0, warning: 1, offline: 2, normal: 3 };
            return this.room.racks
                .slice()
                .sort((a, b) => (order[a.status] || 3) - (order[b.status] || 3))
                .map(r => ({
                    id: r.id,
                    label: r.status === 'normal' ? r.id : `${r.id} · ${STATUS_LABEL[r.status]}`,
                }));
        },
    },
    watch: {
        // 同站机房下拉切换 → router.replace 更新 query → 这里接住换房
        // （同组件复用不走 mounted，必须 watch 路由；URL 同步保证刷新/分享正确）
        '$route.query.room'(id) {
            if (id && this.room && id !== this.room.id) this.loadRoom(id);
        },
    },
    mounted() {
        // query.room 缺省时取第一个机房
        let roomId = this.$route.query.room;
        if (!roomId) {
            const rooms = getRooms();
            if (rooms.length) roomId = rooms[0].id;
        }
        // M7：告警直达——query 携带 rack 时加载完成后自动定位到该机柜
        this.$nextTick(() => this.loadRoom(roomId, this.$route.query.rack));
    },
    methods: {
        /**
         * 加载/切换机房（mounted 与路由 query 变化共用）：
         * 重置选中与侧栏（换房回到「进房默认收起侧栏」的初始交互），
         * 并取同站房间列表供切换下拉（getFloor 含辅助间，城市点位图看不到的房间从这里也能切）。
         */
        loadRoom(roomId, rackId) {
            this.room = roomId ? getRoom(roomId) : null;
            this.loading = false;
            this.selectedRack = null;
            this.selectedDevice = null;
            this.editing = false;
            this.sideVisible = false;
            if (this.room) {
                const floor = getFloor(this.room.siteId);
                this.siteRooms = floor ? floor.rooms : [];
            }
            // nextTick：容器先完成布局，three 才能拿到正确宽高；定位再等一帧 ref 可用
            if (this.room && rackId) {
                this.$nextTick(() => this.$nextTick(() => this.locateRack(rackId)));
            }
        },
        /** 同站机房下拉选中 → replace 路由 query（watch 接住执行换房） */
        onSwitchRoom(roomId) {
            if (!roomId || !this.room || roomId === this.room.id) return;
            this.$router.replace({ path: '/idc-three/room', query: { room: roomId } });
        },
        statusLabel(rack) {
            return STATUS_LABEL[rack.status] || rack.status;
        },
        kindLabel(rack) {
            return RACK_KIND_LABEL[rack.kind] || rack.kind;
        },
        uPct(rack) {
            return rack.uTotal ? Math.round(((rack.uUsed || 0) / rack.uTotal) * 100) : 0;
        },
        /** M7：搜索下拉选中 → 定位（清空选择值以便连续搜索） */
        onLocate(id) {
            if (!id) return;
            this.locateRack(id);
            this.locateId = '';
        },
        /** M7：定位到某机柜——退出编辑态、选中（侧栏联动）、相机飞行；LOD 下选中自动出明细 */
        locateRack(rackId) {
            if (!this.room) return;
            const rack = this.room.racks.find(r => r.id === rackId);
            if (!rack) {
                this.$message.warning(`机房内未找到机柜「${rackId}」`);
                return;
            }
            this.editing = false;
            this.selectedRack = rack;
            this.sideVisible = true; // 定位到机柜 → 弹出详情侧栏（与点击机柜同交互）
            this.$nextTick(() => {
                if (this.$refs.three) {
                    this.$refs.three.selectRack(rackId); // 3D 选中高亮（LOD 下自动出明细）
                    this.$refs.three.focusRack(rackId); // 相机飞行
                }
            });
        },
        setView(name) {
            this.view = name;
            if (this.$refs.three) this.$refs.three.setView(name);
        },
        onHover(rack, x, y) {
            this.hoverRack = rack;
            if (rack) this.hoverPos = { x, y };
        },
        /** 单击机柜：选中 + 弹侧栏，视野不动（避免每次点选都飞相机打断观察） */
        onSelect(rack) {
            this.selectedRack = rack;
            if (rack) this.sideVisible = true;
        },
        /** 双击机柜：选中 + 弹侧栏 + 相机飞行到该柜前脸（U 位面） */
        onDblSelect(rack) {
            if (!rack) return;
            this.selectedRack = rack;
            this.sideVisible = true;
            if (this.$refs.three) this.$refs.three.focusRack(rack.id);
        },
        /** M4：点击 U 位设备 → 打开配件更换弹框 */
        onPickDevice(device) {
            this.selectedDevice = device;
            this.deviceDialogVisible = true;
        },
        /**
         * M4：配件更换成功 → 3D 柜面局部刷新（故障修复后设备色块从预警色回到类型色）。
         * RackUPanel 与弹框共享同一设备对象引用，Vue 响应式自动同步，无需手动刷新。
         */
        onDeviceReplaced({ device }) {
            if (device && this.$refs.three) this.$refs.three.refreshRack(device.rackId);
        },
        /**
         * M5：布局编辑器保存后 / 导入 / 腾挪后的统一刷新——
         * 重新 getRoom（含编辑记录）→ room prop 变化 → ThreeRoom 整场景重建。
         */
        refreshRoom() {
            this.room = getRoom(this.room.id);
            this.selectedRack = null;
            this.selectedDevice = null;
        },
        /** M5：进入/退出布局编辑模式（编辑时清空选中，避免侧栏面板错位） */
        toggleEditing() {
            this.editing = !this.editing;
            this.selectedRack = null;
        },
        onLayoutSaved() {
            this.editing = false;
            this.refreshRoom();
        },
        goBack() {
            this.$router.push('/idc-three');
        },
    },
};
</script>

<style lang="scss">
// 全局（非 scoped）：设计令牌 :root 变量 + 通用类。
// 本页可能被直接访问（不经过 L1），必须自行引入，否则 cssVar() 取不到令牌。
@import '../styles/index.scss';
</style>

<style scoped lang="scss">
.room-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 660px;
    padding: var(--idc3-gap-md) var(--idc3-gap-lg) var(--idc3-gap-lg);

    &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--idc3-gap-sm) 0 var(--idc3-gap-md);
    }

    &__title-wrap {
        display: flex;
        align-items: center;
        gap: var(--idc3-gap-md);
    }

    &__title {
        font-size: 18px;
        letter-spacing: 2px;
    }

    &__views {
        display: flex;
        gap: var(--idc3-gap-xs);
        align-items: center;
    }

    // 同站机房切换下拉
    &__switch {
        width: 130px;
    }

    // 侧栏标题行：标题 + 收起按钮（标题类自带底线，改由本行统一画避免错位）
    &__side-head {
        display: flex;
        flex-shrink: 0;
        align-items: stretch;
        padding-right: var(--idc3-gap-xs);
        border-bottom: 1px solid var(--idc3-border-block);

        ::v-deep .idc3-panel__title {
            flex: 1;
            border-bottom: none;
        }
    }

    // M7：定位机柜下拉
    &__locate {
        width: 150px;
        flex-shrink: 0;
    }

    &__view-sep {
        width: 1px;
        height: 14px;
        margin: 0 var(--idc3-gap-sm);
        background: var(--idc3-border-block);
    }

    &__main {
        display: flex;
        flex: 1;
        gap: var(--idc3-gap-md);
        min-height: 0;
    }

    &__stage {
        position: relative;
        flex: 1;
        min-width: 0;
        overflow: hidden;
    }

    &__three {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    // —— 悬停信息卡 ——
    &__hover-card {
        position: absolute;
        z-index: 4;
        min-width: 180px;
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        pointer-events: none;
        background: var(--idc3-tooltip-bg);
        border: 1px solid var(--idc3-tooltip-border);
        border-radius: var(--idc3-radius-sm);
        box-shadow: 0 4px 18px var(--idc3-title-glow);
    }

    // 相机操作提示（左下角常驻）：不接收鼠标事件，避免挡住 3D 画布的拖拽/拾取
    &__ops-hint {
        position: absolute;
        bottom: var(--idc3-gap-md);
        left: var(--idc3-gap-md);
        z-index: 3;
        padding: 4px var(--idc3-gap-md);
        pointer-events: none;
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text-dim);
        background: var(--idc3-tooltip-bg);
        border: 1px solid var(--idc3-border-block);
        border-radius: var(--idc3-radius-sm);
    }

    &__hover-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--idc3-gap-md);
    }

    &__hover-id {
        font-size: var(--idc3-font-md);
        font-weight: 600;
        color: var(--idc3-title);
    }

    &__hover-status {
        font-size: var(--idc3-font-xs);

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

    &__hover-row {
        margin-top: 2px;
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text);
    }

    &__hover-tip {
        margin-top: 4px;
        font-size: var(--idc3-font-xs);
        color: var(--idc3-text-dim);
    }

    &__mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 3;
        display: flex;
        flex-direction: column;
        gap: var(--idc3-gap-md);
        align-items: center;
        justify-content: center;
        padding: var(--idc3-gap-lg);
        color: var(--idc3-text-dim);
        text-align: center;
        background: var(--idc3-scene-bg);

        &-sub {
            font-size: var(--idc3-font-xs);
        }
    }

    // —— 右侧机柜详情 ——
    &__side {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        width: 340px;
        overflow-y: auto;
    }

    &__rack-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--idc3-gap-md);
        padding-bottom: var(--idc3-gap-sm);
    }

    &__rack-id {
        font-size: 18px;
        font-weight: 600;
        color: var(--idc3-title);
    }

    &__props {
        margin: 0;
        padding: 0 var(--idc3-gap-md);
    }

    &__prop {
        display: flex;
        justify-content: space-between;
        padding: var(--idc3-gap-sm) 0;
        font-size: var(--idc3-font-sm);
        border-bottom: 1px solid var(--idc3-border-block);

        dt {
            color: var(--idc3-text-dim);
        }

        dd {
            margin: 0;
            color: var(--idc3-text);
            font-variant-numeric: tabular-nums;
        }
    }

    // —— M5：布局编辑器（撑满侧栏，内部自滚动）——
    &__editor {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 0;
    }

    // —— M4：U 位面板（撑满剩余高度，内部自滚动）——
    &__u-panel {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 360px;
    }

    &__empty {
        padding: 32px var(--idc3-gap-md);
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text-dim);
        text-align: center;
    }
}
</style>
