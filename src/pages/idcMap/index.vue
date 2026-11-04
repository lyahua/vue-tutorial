<template>
    <div class="idc-map">
        <header class="idc-map__head">
            <h1 class="idc-map__title">全国机房分布总览</h1>
            <div class="idc-map__tools">
                <span class="idc-map__clock">{{ clock }}</span>
                <el-button size="small" type="text" @click="goDeploy()">平面布置图</el-button>
            </div>
        </header>

        <div class="idc-map__kpi">
            <KpiBar :summary="metrics.summary" />
        </div>

        <div class="idc-map__main">
            <section class="idc-map__map">
                <GeoMap
                    :site-adcode="activeAdcode"
                    @drill="onDrill"
                    @back="activeAdcode = ''"
                    @pick-room="openFloorplan"
                />
            </section>

            <aside class="idc-map__side">
                <SiteDrawer
                    v-if="activeSite"
                    :site="activeSite"
                    class="idc-map__site"
                    @pick-room="openFloorplan"
                />
                <div class="idc-map__rank">
                    <RankPanel :sites="metrics.sites" />
                </div>
                <AlarmFeed class="idc-map__alarm" :alarms="metrics.alarms" @pick="onAlarmPick" />
            </aside>
        </div>
    </div>
</template>

<script>
/**
 * 全国机房分布总览（Vue2 Options API 版）
 *
 * 【接口数据】页面只从 ./api 取数，自身不持有业务状态：
 * - getMetricsSnapshot()  首屏同步拿一份快照，避免挂载瞬间空白
 * - subscribeMetrics()    每 2.5s 推送一次 Metrics，整体覆盖 metrics
 *
 * 返回结构 Metrics：
 * { summary, sites[], links[], alarms[], ts }
 */
import moment from 'moment';
import { getMetricsSnapshot, subscribeMetrics } from './api';
import KpiBar from './components/KpiBar.vue';
import GeoMap from './components/GeoMap.vue';
import RankPanel from './components/RankPanel.vue';
import AlarmFeed from './components/AlarmFeed.vue';
import SiteDrawer from './components/SiteDrawer.vue';

export default {
    name: 'IdcMap',
    components: { KpiBar, GeoMap, RankPanel, AlarmFeed, SiteDrawer },
    data() {
        return {
            metrics: getMetricsSnapshot(),
            // 当前下钻的行政区划码，空串表示全国
            activeAdcode: '',
            // 点选机房后固定展示的站点；为空时按地图下钻的 adcode 推断
            activeSiteId: '',
            unsubscribe: null,
        };
    },
    computed: {
        activeSite() {
            const byId = this.metrics.sites.find(s => s.id === this.activeSiteId);
            if (byId) return byId;
            return this.metrics.sites.find(s => s.adcode === this.activeAdcode);
        },
        clock() {
            return moment(this.metrics.ts).format('YYYY-MM-DD HH:mm:ss');
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
            this.activeSiteId = '';
        },
        openFloorplan(roomId) {
            this.goDeploy(roomId);
        },
        onAlarmPick(alarm) {
            this.goDeploy(alarm.roomId, alarm.rackId);
        },
        goDeploy(room, rack) {
            this.$router.push({ path: '/idc-deploy', query: { room, rack } });
        },
    },
};
</script>

<style scoped lang="less">
@import './idc-theme.less';

.idc-map {
    display: flex;
    flex-direction: column;
    // 目标项目外层是 absolute 定位的内容区（自带滚动），
    // 这里撑满内容区高度即可，不能写 100vh，否则会多出整页滚动条
    height: 100%;
    min-height: 660px;
    padding: @idc-gap-sm @idc-gap-md @idc-gap-md;
    background: @idc-bg-page;
    // 页面按满屏设计，任何子项溢出都不该顶出页面级滚动条
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
        // 左侧 3px 竖条改用背景绘制：border-left 无法渐变
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

    &__clock {
        margin-right: @idc-gap-md;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
        font-variant-numeric: tabular-nums;
    }

    &__kpi {
        margin: @idc-gap-md 0;
        flex: none;
    }

    &__main {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: @idc-gap-md;
        flex: 1;
        min-height: 0;
    }

    &__map {
        .idc-panel();
        // 主视觉区盖掉 .idc-panel 的实色底，换成弱渐变；
        // GeoMap 的 option.backgroundColor 必须 transparent 才透得出来
        background: @idc-bg-viz;
        overflow: hidden;
    }

    &__side {
        display: flex;
        flex-direction: column;
        gap: @idc-gap-md;
        min-height: 0;
        // 下钻后侧栏是「站点详情 + 规模榜 + 实时告警」三块，
        // 矮屏下总高必然超过可用高度，只能让侧栏自己滚，
        // 否则会顶出页面级滚动条
        overflow-y: auto;
    }

    &__site {
        // 详情面板内部 __body 自带滚动，所以允许它收缩；
        // 不给 min-height 会被压到只剩标题，给了 132px 至少留出一行指标
        flex: 0 1 auto;
        min-height: 132px;
    }

    &__rank {
        flex: none;
    }

    &__alarm {
        // 不写 flex: 1 是因为矮屏下它会被压到几像素，列表整块看不见，
        // 内容溢出面板后还会顶出页面级滚动条
        flex: 1 1 160px;
        min-height: 160px;
    }
}
</style>
