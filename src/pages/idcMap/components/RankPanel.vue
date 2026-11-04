<template>
    <div class="rank-panel idc-panel">
        <div class="idc-panel__title">机房机柜规模</div>
        <div ref="chartEl" class="rank-panel__canvas"></div>
    </div>
</template>

<script>
/**
 * 机房机柜规模横向条形榜（Vue2 + ECharts 4 版）
 * 同时用颜色标出该机房的状态。
 *
 * 【接口数据】props.sites 来自 GET /idc/metrics 的 Metrics.sites，
 * 组件内只做「展平机房 + 排序」，不取数。
 */
import echartsMixin from '../echartsMixin';
import { BRAND, CANVAS, STATUS_COLOR } from '../constants';

/** 荣誉标记用金色描边 + TOP 角标，条的填充色始终留给状态色 */
const GOLD = BRAND.gold;

export default {
    name: 'RankPanel',
    mixins: [echartsMixin],
    props: {
        sites: { type: Array, default: () => [] },
    },
    watch: {
        sites: { deep: true, handler: 'render' },
    },
    mounted() {
        this.initChart(this.$refs.chartEl);
        this.render();
    },
    methods: {
        render() {
            if (!this.chart) return;
            let rows = [];
            this.sites.forEach(s => {
                s.rooms.forEach(r => rows.push(Object.assign({}, r, { siteName: s.name })));
            });
            rows.sort((a, b) => a.rackTotal - b.rackTotal);
            const topIndex = rows.length - 1;

            this.setOption({
                grid: { left: 96, right: 44, top: 8, bottom: 8 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: CANVAS.tooltipBg,
                    borderColor: CANVAS.border,
                    textStyle: { color: CANVAS.text, fontSize: 12 },
                },
                xAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { color: CANVAS.splitLine } },
                    axisLabel: { color: CANVAS.textDim, fontSize: 10 },
                },
                yAxis: {
                    type: 'category',
                    data: rows.map(r => r.name),
                    axisLine: { lineStyle: { color: CANVAS.border } },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 11,
                        color: CANVAS.text,
                        formatter: (v, idx) => (idx === topIndex ? `{g|${v}}` : v),
                        rich: { g: { color: GOLD, fontSize: 11, fontWeight: 600 } },
                    },
                },
                series: [
                    {
                        id: 'rack-total',
                        type: 'bar',
                        // 12 个机房挤在 244px 里，条宽必须小于 244/12≈20 才不会让右侧数值互相压叠
                        barWidth: 8,
                        // ECharts 4 的圆角字段是 barBorderRadius（v5 才改名 borderRadius）
                        itemStyle: { normal: { barBorderRadius: [0, 4, 4, 0] } },
                        label: {
                            normal: { show: true, position: 'right', fontSize: 10, color: CANVAS.text },
                        },
                        // 描边只能挂在数据项上：itemStyle 里除 color 外的字段不支持回调，
                        // 写成函数会让整条 bar 拿不到样式而画不出来。
                        // 荣誉标记靠「金色轴标签 + 金色描边 + 金色数值」三重表达
                        data: rows.map((r, i) => ({
                            value: r.rackTotal,
                            itemStyle: {
                                normal: Object.assign(
                                    { color: STATUS_COLOR[r.status] },
                                    i === topIndex ? { borderColor: GOLD, borderWidth: 1 } : null
                                ),
                            },
                            label: i === topIndex ? { normal: { color: GOLD, fontWeight: 700 } } : null,
                        })),
                    },
                ],
            });
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.rank-panel {
    &__canvas {
        // 站点从 3 城扩到 6 城后机房数翻倍到 12 行，
        // 168px 放 12 行会让右侧数值上下叠在一起
        height: 244px;
    }
}
</style>
