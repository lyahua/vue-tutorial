<template>
    <div class="rank-panel idc3-panel">
        <div class="idc3-panel__title">机房机柜规模</div>
        <div ref="chartEl" class="rank-panel__canvas"></div>
    </div>
</template>

<script>
/**
 * 机房机柜规模横向条形榜（M1：改造自 idcMap RankPanel，颜色走设计令牌）
 * 同时用颜色标出该机房的状态；TOP1 用荣誉金三重标记（轴标签/描边/数值）。
 *
 * 【接口数据】props.sites 来自 GET /idc/metrics 的 Metrics.sites，
 * 组件内只做「展平机房 + 排序」，不取数。
 */
import echartsMixin from '../echartsMixin';
import { chartTheme, withAlpha } from '../styles/tokens';

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
            const t = chartTheme();
            const rows = [];
            this.sites.forEach(s => {
                s.rooms.forEach(r => rows.push(Object.assign({}, r, { siteName: s.name })));
            });
            // 按机柜数量进行排序
            rows.sort((a, b) => a.rackTotal - b.rackTotal);
            const topIndex = rows.length - 1;

            this.setOption({
                grid: { left: 96, right: 44, top: 8, bottom: 8 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: t.tooltipBg,
                    borderColor: t.tooltipBorder,
                    borderWidth: 1,
                    extraCssText: `box-shadow: 0 4px 18px ${withAlpha(t.glow, 0.28)};`,
                    textStyle: { color: t.text, fontSize: 12 },
                },
                xAxis: {
                    type: 'value',
                    splitLine: { lineStyle: { color: t.splitLine } },
                    axisLabel: { color: t.textDim, fontSize: 10 },
                },
                yAxis: {
                    type: 'category',
                    data: rows.map(r => r.name),
                    axisLine: { lineStyle: { color: t.border } },
                    axisTick: { show: false },
                    axisLabel: {
                        fontSize: 11,
                        color: t.text,
                        formatter: (v, idx) => (idx === topIndex ? `{g|${v}}` : v),
                        rich: { g: { color: t.gold, fontSize: 11, fontWeight: 600 } },
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
                            normal: { show: true, position: 'right', fontSize: 10, color: t.text },
                        },
                        // 描边只能挂在数据项上：itemStyle 里除 color 外的字段不支持回调，
                        // 写成函数会让整条 bar 拿不到样式而画不出来
                        data: rows.map((r, i) => ({
                            value: r.rackTotal,
                            itemStyle: {
                                normal: Object.assign(
                                    { color: t.status[r.status] || t.status.normal },
                                    i === topIndex ? { borderColor: t.gold, borderWidth: 1 } : null
                                ),
                            },
                            label: i === topIndex ? { normal: { color: t.gold, fontWeight: 700 } } : null,
                        })),
                    },
                ],
            });
        },
    },
};
</script>

<style scoped lang="scss">
.rank-panel {
    display: flex;
    flex-direction: column;

    &__canvas {
        // 12 个机房 12 行，太矮会让右侧数值上下叠在一起
        height: 244px;
    }
}
</style>
