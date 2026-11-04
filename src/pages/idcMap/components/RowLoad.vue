<template>
    <div class="row-load idc-panel">
        <div class="idc-panel__title">排列负载与温度</div>
        <div ref="chartEl" class="row-load__canvas"></div>
    </div>
</template>

<script>
/**
 * 按排列聚合的负载率与进风温度（Vue2 + ECharts 4 版）
 *
 * 用柱+折线双轴：柱子看哪一排快撑满，折线看温度是否跟着抬升，
 * 两者同时高的排列就是需要优先扩容/整风的排列。
 *
 * 【接口数据】props.racks 来自 GET /idc/room/floorplan 的 Floorplan.racks，
 * 组件只做按 row 聚合求均值。
 */
import echartsMixin from '../echartsMixin';
import { CANVAS } from '../constants';

const avg = list => (list.length ? Math.round(list.reduce((s, v) => s + v, 0) / list.length) : 0);

export default {
    name: 'RowLoad',
    mixins: [echartsMixin],
    props: {
        racks: { type: Array, default: () => [] },
    },
    watch: {
        racks: { deep: true, handler: 'render' },
    },
    mounted() {
        this.initChart(this.$refs.chartEl);
        this.render();
    },
    methods: {
        render() {
            if (!this.chart) return;
            const rows = {};
            this.racks.forEach(r => {
                if (r.status === 'offline') return;
                const bucket = rows[r.row] || { load: [], temp: [] };
                bucket.load.push(r.loadPct);
                bucket.temp.push(r.tempIn);
                rows[r.row] = bucket;
            });

            const names = Object.keys(rows).sort();
            const loadList = names.map(n => avg(rows[n].load));
            const tempList = names.map(n => {
                const t = rows[n].temp;
                return t.length ? Math.round((t.reduce((s, v) => s + v, 0) / t.length) * 10) / 10 : 0;
            });

            this.setOption({
                grid: { left: 34, right: 34, top: 26, bottom: 22 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    backgroundColor: CANVAS.tooltipBg,
                    borderColor: CANVAS.border,
                    textStyle: { color: CANVAS.text, fontSize: 12 },
                },
                legend: {
                    top: 0,
                    right: 0,
                    itemWidth: 10,
                    itemHeight: 8,
                    textStyle: { color: CANVAS.textDim, fontSize: 11 },
                    data: ['平均负载率', '平均进风温度'],
                },
                xAxis: {
                    type: 'category',
                    data: names.map(n => `${n} 排`),
                    axisLine: { lineStyle: { color: CANVAS.border } },
                    axisTick: { show: false },
                    axisLabel: { color: CANVAS.text, fontSize: 11 },
                },
                yAxis: [
                    {
                        type: 'value',
                        max: 100,
                        axisLabel: { color: CANVAS.textDim, fontSize: 10, formatter: '{value}%' },
                        splitLine: { lineStyle: { color: CANVAS.splitLine } },
                    },
                    {
                        type: 'value',
                        min: 18,
                        max: 34,
                        axisLabel: { color: CANVAS.textDim, fontSize: 10, formatter: '{value}℃' },
                        splitLine: { show: false },
                    },
                ],
                series: [
                    {
                        id: 'load',
                        name: '平均负载率',
                        type: 'bar',
                        barWidth: 16,
                        itemStyle: { normal: { barBorderRadius: [3, 3, 0, 0] } },
                        // 阈值色挂到数据项上：ECharts 4 的 itemStyle.color 回调
                        // 在部分 merge 场景下拿不到 value，逐项着色更稳
                        data: loadList.map(v => ({
                            value: v,
                            itemStyle: { normal: { color: v >= 90 ? '#ef4444' : v >= 75 ? '#eab308' : CANVAS.accent } },
                        })),
                    },
                    {
                        id: 'temp',
                        name: '平均进风温度',
                        type: 'line',
                        yAxisIndex: 1,
                        smooth: true,
                        symbolSize: 6,
                        lineStyle: { normal: { color: '#f97316', width: 2 } },
                        itemStyle: { normal: { color: '#f97316' } },
                        data: tempList,
                    },
                ],
            });
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.row-load {
    flex: none;

    &__canvas {
        height: 180px;
    }
}
</style>
