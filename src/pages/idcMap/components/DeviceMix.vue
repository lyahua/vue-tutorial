<template>
    <div class="device-mix idc-panel">
        <div class="idc-panel__title">设备构成</div>
        <div ref="chartEl" class="device-mix__canvas"></div>
    </div>
</template>

<script>
/**
 * 机房内设备类型构成（Vue2 + ECharts 4 版）
 * 按占用 U 数统计（比按台数更能反映空间消耗）。
 *
 * 【接口数据】props.racks 来自 GET /idc/room/floorplan 的 Floorplan.racks，
 * 每台机柜的 devices[] 含 { type, uSize }，组件只做聚合。
 */
import echartsMixin from '../echartsMixin';
import { CANVAS, DEVICE_COLOR, DEVICE_TYPE_LABEL } from '../constants';

export default {
    name: 'DeviceMix',
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
            const uByType = {};
            this.racks.forEach(r =>
                r.devices.forEach(d => {
                    uByType[d.type] = (uByType[d.type] || 0) + d.uSize;
                })
            );
            const data = Object.keys(uByType).map(type => ({
                name: DEVICE_TYPE_LABEL[type],
                value: uByType[type],
                itemStyle: { normal: { color: DEVICE_COLOR[type] } },
            }));

            this.setOption({
                tooltip: {
                    trigger: 'item',
                    backgroundColor: CANVAS.tooltipBg,
                    borderColor: CANVAS.border,
                    textStyle: { color: CANVAS.text, fontSize: 12 },
                    formatter: '{b}：{c} U（{d}%）',
                },
                legend: {
                    orient: 'vertical',
                    right: 8,
                    top: 'center',
                    itemWidth: 8,
                    itemHeight: 8,
                    textStyle: { color: CANVAS.text, fontSize: 11 },
                },
                series: [
                    {
                        id: 'device-mix',
                        type: 'pie',
                        radius: ['48%', '70%'],
                        center: ['32%', '50%'],
                        avoidLabelOverlap: true,
                        label: { normal: { show: false } },
                        labelLine: { normal: { show: false } },
                        itemStyle: { normal: { borderColor: CANVAS.bg, borderWidth: 2 } },
                        data,
                    },
                ],
            });
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.device-mix {
    flex: none;

    &__canvas {
        height: 150px;
    }
}
</style>
