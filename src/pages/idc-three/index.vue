<template>
    <div class="idc3-page n-page">
        <header class="n-page__head">
            <h1 class="idc3-title">全国机房态势总览</h1>
            <div class="n-page__tools">
                <!-- 需求 11：下钻站点后的视图切换（默认市区点位图，可切机房建模图） -->
                <div v-if="activeSite" class="n-page__drill-switch">
                    <un-button
                        size="mini"
                        :type="drillView === 'map' ? 'primary' : 'text'"
                        @click="setDrillView('map')"
                    >
                        市区点位图
                    </un-button>
                    <un-button
                        size="mini"
                        :type="drillView === 'floor' ? 'primary' : 'text'"
                        @click="setDrillView('floor')"
                    >
                        机房建模图
                    </un-button>
                </div>
                <span class="n-page__clock">{{ clock }}</span>
            </div>
        </header>

        <!-- 指标显示 -->
        <div class="n-page__kpi">
            <NationalKpi :summary="metrics.summary" />
        </div>

        <div class="n-page__main">
            <section class="n-page__map idc3-panel">
                <!-- 需求 11：市区点位图（现状）/ 机房建模图（站点楼层 3D 沙盘）就地切换。
                     v-show 保留 echarts 实例，切回免重建；FloorView 异步组件按需加载 three chunk -->
                <NationalMap
                    v-show="drillView === 'map'"
                    :site-adcode="activeAdcode"
                    @drill="onDrill"
                    @back="goNational"
                    @pick-room="onPickRoom"
                />
                <FloorView
                    v-if="drillView === 'floor' && floorModel"
                    :floor="floorModel"
                    @pick-room="onPickRoom"
                />
            </section>

            <aside class="n-page__side">
                <!-- 机房机柜规模 -->
                <RankPanel :sites="metrics.sites" class="n-page__rank" />
                <!-- 实时告警 -->
                <AlarmFeed :alarms="metrics.alarms" class="n-page__alarm" @pick="onAlarmPick" />
            </aside>
        </div>
    </div>
</template>

<script>
/**
 * L1 全国总览（M1：令牌体系 + un- 组件层 + 地图换肤去拓扑线）
 *
 * 【接口数据】页面只从 ./api 取数，自身不持有业务状态：
 * - getMetricsSnapshot()  首屏同步拿一份快照，避免挂载瞬间空白
 * - subscribeMetrics()    每 2.5s 推送一次 Metrics，整体覆盖 metrics
 *
 * 后续里程碑：L2 点击机房点位 → L3 三维机房（路由 /idc-three/room，M3 起交付）。
 */
import Vue from 'vue';
import dayjs from 'dayjs';
import UnUI from './components/un';
import { getMetricsSnapshot, subscribeMetrics, getFloor } from './api';
console.log('全国地图页面数据---', getMetricsSnapshot())
import NationalKpi from './components/NationalKpi.vue';
import NationalMap from './components/NationalMap.vue';
import RankPanel from './components/RankPanel.vue';
import AlarmFeed from './components/AlarmFeed.vue';
// 需求 11：楼层 3D 视图异步组件——只有切到「机房建模图」才加载含 three 的 chunk
const FloorView = () => import('./floor/FloorView.vue');

// un- 组件层：随本页 chunk 加载时注册（main.js 已注册 un-button/un-input/un-select，
// 插件内部会跳过同名项，只补齐 breadcrumb / tooltip / tag 等缺口）
Vue.use(UnUI);

export default {
    name: 'IdcThree',
    components: { NationalKpi, NationalMap, RankPanel, AlarmFeed, FloorView },
    data() {
        return {
            metrics: getMetricsSnapshot(),
            // 当前下钻的行政区划码，空串表示全国
            activeAdcode: '',
            // 需求 11：下钻后的视图模式——'map' 市区点位图（默认）| 'floor' 机房建模图
            drillView: 'map',
            // api.getFloor() 产物（切到 floor 模式时按需加载）
            floorModel: null,
            unsubscribe: null,
        };
    },
    computed: {
        clock() {
            return dayjs(this.metrics.ts).format('YYYY-MM-DD HH:mm:ss');
        },
        /** 当前下钻到的站点（activeAdcode 即站点 adcode；全国视图为 null） */
        activeSite() {
            if (!this.activeAdcode) return null;
            return this.metrics.sites.find(s => s.adcode === this.activeAdcode) || null;
        },
    },
    watch: {
        // 换了下钻站点：回默认地图视图，楼层模型按需重取。
        // ⚠️ 监听 id（字符串）而不是 activeSite 对象：metrics 每 2.5s 推送会整体
        // 替换 sites 数组（对象引用全变，id 不变），监听对象会误触发把视图重置——
        // 「切到机房建模图后过 2.5s 自动跳回市区图」的根因
        'activeSite.id'() {
            this.drillView = 'map';
            this.floorModel = null;
        },
    },
    mounted() {
        this.unsubscribe = subscribeMetrics(m => {
            this.metrics = m;
        });
    },
    beforeDestroy() {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = null;
    },
    methods: {
        onDrill(adcode) {
            this.activeAdcode = adcode;
        },
        /** 返回全国（重置下钻与视图模式） */
        goNational() {
            this.activeAdcode = '';
            this.drillView = 'map';
            this.floorModel = null;
        },
        /** 切换下钻视图；floor 模式首次进入时拉取楼层模型 */
        setDrillView(view) {
            this.drillView = view;
            if (view === 'floor' && this.activeSite && !this.floorModel) {
                this.floorModel = getFloor(this.activeSite.id);
            }
        },
        /** 城市视图/楼层视图点击机房 → 进入三维机房页（query 携带 roomId） */
        onPickRoom(roomId) {
            this.$router.push({ path: '/idc-three/room', query: { room: roomId } });
        },
        /** 点告警直接下钻到对应站点的城市视图 */
        /** M7：告警条目点击 → 直达三维机房并自动定位到告警机柜（query 携带 room + rack） */
        onAlarmPick(alarm) {
            this.$router.push({
                path: '/idc-three/room',
                query: { room: alarm.roomId, rack: alarm.rackId },
            });
        },
    },
};
</script>

<style scoped lang="scss">
// 布局尺寸只在本块；颜色 / 面板 / 虚线网格背景走全局令牌类（styles/index.scss）
.n-page {
    display: flex;
    flex-direction: column;
    // 目标项目外层是 absolute 定位的内容区（自带滚动），
    // 这里撑满内容区高度即可，不能写 100vh，否则会多出整页滚动条
    height: 100%;
    min-height: 660px;
    padding: var(--idc3-gap-md) var(--idc3-gap-lg) var(--idc3-gap-lg);

    &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--idc3-gap-sm) 0 var(--idc3-gap-md);
    }

    &__tools {
        display: flex;
        align-items: center;
        gap: var(--idc3-gap-md);
    }

    // 需求 11：下钻后的视图切换组（市区点位图 / 机房建模图）
    &__drill-switch {
        display: flex;
        gap: var(--idc3-gap-xs);
        align-items: center;
        padding: 2px var(--idc3-gap-sm);
        background: var(--idc3-panel-soft);
        border: 1px solid var(--idc3-border-block);
        border-radius: var(--idc3-radius-sm);
    }

    &__clock {
        font-size: var(--idc3-font-md);
        font-variant-numeric: tabular-nums;
        color: var(--idc3-text);
    }

    &__kpi {
        flex-shrink: 0;
    }

    &__main {
        display: flex;
        gap: var(--idc3-gap-md);
        flex: 1;
        min-height: 0;
        margin-top: var(--idc3-gap-md);
    }

    &__map {
        flex: 1;
        min-width: 0;
        // 面板自带边框圆角，内部地图容器贴边渲染
        padding: 0;
        overflow: hidden;
    }

    &__side {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        width: 320px;
        gap: var(--idc3-gap-md);
        min-height: 0;
    }

    &__rank {
        flex-shrink: 0;
    }

    &__alarm {
        flex: 1;
        min-height: 0;
    }
}
</style>

<style lang="scss">
// 全局（非 scoped）：设计令牌 :root 变量 + 页面底/虚线网格/面板通用类 + un- 暗色适配。
// 必须非 scoped：:root 与浮层（tooltip 等）无法被组件 scoped 命中。
@import './styles/index.scss';
</style>
