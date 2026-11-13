<template>
    <div class="idc-deploy">
        <header class="idc-deploy__head">
            <h1 class="idc-deploy__title">机房平面布置图</h1>
            <div class="idc-deploy__tools">
                <el-select
                    v-model="roomId"
                    size="mini"
                    class="idc-deploy__select"
                    popper-class="idc-select-popper"
                    @change="onRoomChange"
                >
                    <el-option
                        v-for="r in rooms"
                        :key="r.id"
                        :label="r.siteName + ' · ' + r.name"
                        :value="r.id"
                    />
                </el-select>
                <span class="idc-deploy__clock">{{ clock }}</span>
                <el-button size="mini" type="text" @click="$router.push('/idc-map')">全国地图</el-button>
            </div>
        </header>

        <div class="idc-deploy__kpi">
            <IdcKpiBar :items="kpiItems" />
        </div>

        <div class="idc-deploy__main">
            <section class="idc-deploy__plan">
                <RackFloorplan :plan="plan" :selected-id="selectedRackId" @pick="onPick" />
            </section>
            <aside class="idc-deploy__side">
                <RackGauge :u-pct="uPct" :load-pct="loadPct" />
                <DeviceMix :racks="plan.racks" />
                <RowLoad :racks="plan.racks" />
            </aside>
        </div>

        <el-drawer
            :visible.sync="drawerVisible"
            :title="plan.roomName + ' 机柜详情'"
            direction="rtl"
            size="380px"
            custom-class="idc-deploy__drawer"
            append-to-body
        >
            <RackDrawer v-if="selectedRack" :rack="selectedRack" />
        </el-drawer>
    </div>
</template>

<script>
/**
 * 机房平面布置图（Vue2 Options API 版）
 *
 * 【接口数据】页面只从 ../api 取数：
 * - getRooms()            GET /idc/rooms            → [{ id, name, siteId, siteName }]
 * - getFloorplan(roomId)  GET /idc/room/floorplan   → { room, zones, aisles, racks }
 * - getMetricsSnapshot() / subscribeMetrics()       GET /idc/metrics 、SSE /idc/metrics/stream
 *
 * plan 每收到一次指标推送就整体重取：机柜坐标是静态的，
 * 温度/功率/状态跟着实时数据走，重新取比逐字段合并更不容易出错。
 */
import dayjs from 'dayjs';
import { getFloorplan, getMetricsSnapshot, getRooms, subscribeMetrics } from '../api';
import IdcKpiBar from '../components/IdcKpiBar.vue';
import RackFloorplan from '../components/RackFloorplan.vue';
import RackDrawer from '../components/RackDrawer.vue';
import RackGauge from '../components/RackGauge.vue';
import DeviceMix from '../components/DeviceMix.vue';
import RowLoad from '../components/RowLoad.vue';

/** 空值兜底，避免机房 id 非法时整页模板取值报错 */
const EMPTY_PLAN = {
    roomId: '',
    roomName: '-',
    siteId: '',
    siteName: '-',
    room: { w: 12, d: 8 },
    zones: [],
    aisles: [],
    racks: [],
};

export default {
    name: 'IdcDeploy',
    components: { IdcKpiBar, RackFloorplan, RackDrawer, RackGauge, DeviceMix, RowLoad },
    data() {
        const rooms = getRooms();
        const q = this.$route.query.room;
        const hit = typeof q === 'string' ? rooms.find(r => r.id === q) : undefined;
        return {
            rooms,
            roomId: hit ? hit.id : rooms.length ? rooms[0].id : '',
            metrics: getMetricsSnapshot(),
            // 从告警列表跳转过来时直接展开该机柜
            selectedRackId: typeof this.$route.query.rack === 'string' ? this.$route.query.rack : '',
            drawerVisible: false,
            unsubscribe: null,
        };
    },
    computed: {
        /**
         * 每次指标推送都整体重取平面图
         *
         * 机柜坐标是静态的，但温度/功率/状态在实时数据里持续变化，
         * 依赖 metrics.ts 触发重新计算比逐字段合并更不容易漏更新。
         */
        plan() {
            void this.metrics.ts;
            return getFloorplan(this.roomId) || EMPTY_PLAN;
        },
        selectedRack() {
            return this.plan.racks.find(r => r.id === this.selectedRackId);
        },
        kpiItems() {
            const p = this.plan;
            const online = p.racks.filter(r => r.status !== 'offline');
            return [
                { label: '所属站点', value: p.siteName, color: '#409eff', icon: 'location' },
                { label: '机柜', value: p.racks.length, unit: ' 台', color: '#409eff', icon: 'rack' },
                {
                    label: '在线',
                    value: online.length,
                    unit: ' 台',
                    color: online.length === p.racks.length ? '#22c55e' : '#eab308',
                    icon: 'check',
                },
                {
                    label: 'U 位',
                    value: `${p.racks.reduce((s, r) => s + r.uUsed, 0)}`,
                    unit: ' U',
                    color: '#8b5cf6',
                    icon: 'gauge',
                },
                {
                    label: '总功率',
                    value: Math.round(online.reduce((s, r) => s + r.powerKw, 0)),
                    unit: ' kW',
                    color: '#22c55e',
                    icon: 'bolt',
                },
                {
                    label: '平均进风',
                    value: online.length
                        ? Math.round((online.reduce((s, r) => s + r.tempIn, 0) / online.length) * 10) / 10
                        : 0,
                    unit: ' ℃',
                    color: '#f97316',
                    icon: 'temp',
                },
                {
                    label: '告警机柜',
                    value: p.racks.filter(r => r.status === 'alarm').length,
                    unit: ' 台',
                    color: '#ef4444',
                    icon: 'warning',
                },
            ];
        },
        uPct() {
            const total = this.plan.racks.reduce((s, r) => s + r.uTotal, 0);
            return total ? Math.round((this.plan.racks.reduce((s, r) => s + r.uUsed, 0) / total) * 100) : 0;
        },
        loadPct() {
            const online = this.plan.racks.filter(r => r.status !== 'offline');
            if (!online.length) return 0;
            return Math.round(online.reduce((s, r) => s + r.loadPct, 0) / online.length);
        },
        clock() {
            return dayjs(this.metrics.ts).format('YYYY-MM-DD HH:mm:ss');
        },
    },
    watch: {
        selectedRackId(val) {
            if (val) this.drawerVisible = true;
        },
    },
    mounted() {
        this.unsubscribe = subscribeMetrics(m => {
            this.metrics = m;
        });
        if (this.selectedRackId) this.drawerVisible = true;
    },
    beforeDestroy() {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = null;
    },
    methods: {
        onPick(rack) {
            this.selectedRackId = rack.id;
            this.drawerVisible = true;
        },
        onRoomChange(id) {
            this.selectedRackId = '';
            this.drawerVisible = false;
            this.$router.replace({ path: '/idc-deploy', query: { room: id } });
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.idc-deploy {
    display: flex;
    flex-direction: column;
    // 同全国地图页：撑满外层内容区，不写 100vh
    height: 100%;
    min-height: 620px;
    padding: @idc-gap-sm @idc-gap-md @idc-gap-md;
    background: @idc-bg-page;
    overflow: hidden;

    &__head {
        display: flex;
        align-items: center;
        height: 48px;
        flex: none;
        padding-bottom: @idc-gap-sm;
    }

    &__title {
        flex: 1;
        margin: 0;
        padding-left: 13px;
        font-size: @idc-font-lg;
        font-weight: 500;
        line-height: 1.4;
        color: @idc-text;
        background-image: linear-gradient(180deg, @idc-primary-bright, @idc-primary, @idc-primary-deep);
        background-repeat: no-repeat;
        background-position: left center;
        background-size: 3px 100%;
    }

    &__tools {
        display: flex;
        align-items: center;
    }

    &__select {
        width: 200px;
    }

    &__clock {
        margin: 0 @idc-gap-md;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
        font-variant-numeric: tabular-nums;
    }

    &__kpi {
        margin-bottom: @idc-gap-md;
        flex: none;
    }

    &__main {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: @idc-gap-md;
        flex: 1;
        min-height: 0;
    }

    &__plan {
        .idc-panel();
        // 同地图页主视觉区：换成弱渐变，RackFloorplan 的 backgroundColor 走 transparent
        background: @idc-bg-viz;
        overflow: hidden;
    }

    &__side {
        display: flex;
        flex-direction: column;
        gap: @idc-gap-md;
        min-height: 0;
        overflow-y: auto;
    }
}
</style>

<style lang="less">
// 抽屉与下拉浮层都挂到 body 下，scoped 选择器够不到，统一放非 scoped 块
@import '../idc-theme.less';

.idc-deploy__drawer {
    background: @idc-bg-page;

    .el-drawer__header {
        margin-bottom: 0;
        padding: @idc-gap-md;
        color: @idc-text;
        background: @idc-panel;
        border-bottom: 1px solid @idc-border;
    }

    .el-drawer__body {
        padding: 0;
        height: 100%;
        background: transparent;
        overflow: hidden;
    }
}

// el-select 的输入框与下拉浮层默认浅底，在暗头部上是一块白斑。
// 输入框在组件内部，用页面类名限定作用域，避免影响项目其他页面
.idc-deploy__select {
    .el-input__inner {
        color: @idc-text;
        background: @idc-panel-soft;
        border-color: @idc-border;

        &:hover,
        &:focus {
            border-color: @idc-accent;
        }
    }

    .el-input__icon {
        color: @idc-text-dim;
    }
}

.idc-select-popper {
    &.el-select-dropdown {
        background: @idc-panel;
        border-color: @idc-border;
    }

    .el-select-dropdown__item {
        color: @idc-text;

        &.hover,
        &:hover {
            background: @idc-panel-soft;
        }

        &.selected {
            color: @idc-accent;
        }
    }

    .popper__arrow,
    .popper__arrow::after {
        border-top-color: @idc-border !important;
        border-bottom-color: @idc-border !important;
    }
}
</style>
