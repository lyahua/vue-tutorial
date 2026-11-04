<template>
    <div class="rack-gauge idc-panel">
        <div class="idc-panel__title">机房容量</div>
        <div ref="chartEl" class="rack-gauge__canvas"></div>
    </div>
</template>

<script>
/**
 * U 位占用与功率负载双仪表（Vue2 + ECharts 4 版）
 * 阈值配色与告警口径一致。
 *
 * 【接口数据】props 由父级从 GET /idc/room/floorplan 的 racks 聚合而来，
 * 组件内不做取数。
 *
 * ECharts 4 的 gauge 没有 v5 的 progress/roundCap，
 * 这里用 axisLine.color 的分段色带表现「已用 / 余量」，视觉等价。
 */
import echartsMixin from '../echartsMixin';
import { BRAND, CANVAS } from '../constants';

const gaugeColor = v => (v >= 90 ? '#ef4444' : v >= 75 ? '#eab308' : '#22c55e');

export default {
    name: 'RackGauge',
    mixins: [echartsMixin],
    props: {
        uPct: { type: Number, default: 0 },
        loadPct: { type: Number, default: 0 },
    },
    watch: {
        uPct: 'render',
        loadPct: 'render',
    },
    mounted() {
        this.initChart(this.$refs.chartEl);
        this.render();
    },
    methods: {
        base(value) {
            const color = gaugeColor(value);
            const ratio = Math.max(0, Math.min(100, value)) / 100;
            return {
                type: 'gauge',
                startAngle: 210,
                endAngle: -30,
                min: 0,
                max: 100,
                radius: '82%',
                // 前段是已用量，后段留底色；分段边界即「进度条」末端
                axisLine: {
                    lineStyle: {
                        width: 10,
                        color: [
                            [Math.max(ratio, 0.001), color],
                            [1, CANVAS.border],
                        ],
                    },
                },
                // 刻度画在 axisLine 外侧：内环已被阈值色占满，只有外圈是纯装饰区
                axisTick: {
                    show: true,
                    distance: 4,
                    length: 3,
                    lineStyle: { color: BRAND.base, width: 1, opacity: 0.5 },
                },
                splitLine: {
                    show: true,
                    distance: 4,
                    length: 7,
                    lineStyle: { color: BRAND.base, width: 2, opacity: 0.9 },
                },
                axisLabel: { show: false },
                pointer: { show: false },
                title: { offsetCenter: [0, '32%'], color: CANVAS.textDim, fontSize: 11 },
                detail: {
                    offsetCenter: [0, -4],
                    color,
                    fontSize: 16,
                    fontWeight: 600,
                    formatter: '{value}%',
                },
            };
        },
        render() {
            if (!this.chart) return;
            const u = Object.assign(this.base(this.uPct), {
                id: 'u',
                center: ['27%', '52%'],
                data: [{ value: this.uPct, name: 'U 位占用' }],
            });
            const power = Object.assign(this.base(this.loadPct), {
                id: 'power',
                center: ['73%', '52%'],
                data: [{ value: this.loadPct, name: '功率负载' }],
            });
            this.setOption({ series: [u, power] });
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.rack-gauge {
    flex: none;

    &__canvas {
        height: 140px;
    }
}
</style>
