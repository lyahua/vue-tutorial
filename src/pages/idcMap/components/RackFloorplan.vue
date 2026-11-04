<template>
    <div class="floorplan">
        <div class="floorplan__bar">
            <el-radio-group v-model="colorMode" size="mini">
                <el-radio-button label="temp">温度</el-radio-button>
                <el-radio-button label="status">状态</el-radio-button>
                <el-radio-button label="u">U 位</el-radio-button>
            </el-radio-group>
            <div class="floorplan__legend">
                <template v-if="colorMode === 'temp'">
                    <span v-for="t in TEMP_LEGEND" :key="t.v" class="floorplan__legend-item">
                        <i :style="{ background: tempColor(t.v) }"></i>{{ t.label }}
                    </span>
                </template>
                <template v-if="colorMode === 'status'">
                    <span v-for="(c, k) in STATUS_COLOR" :key="k" class="floorplan__legend-item">
                        <i :style="{ background: c }"></i>{{ STATUS_LABEL[k] }}
                    </span>
                </template>
                <span class="floorplan__hint">滚轮缩放 / 拖拽平移 / 点击机柜看设备</span>
            </div>
        </div>
        <div ref="chartEl" class="floorplan__canvas"></div>
    </div>
</template>

<script>
/**
 * 机房平面布置图（Vue2 + ECharts 4 custom series）
 *
 * 坐标系用米制 value 轴：机柜坐标、通道、分区都按真实物理尺寸画，
 * 缩放平移交给 dataZoom，不需要自己实现变换矩阵。
 *
 * 【接口数据】props.plan 来自 GET /idc/room/floorplan?roomId=xxx，
 * 结构 { room:{w,d}, zones[], aisles[], racks[] }，由父级每 2.5s 重取一次。
 */
import echartsMixin from '../echartsMixin';
import { CANVAS, STATUS_COLOR, STATUS_LABEL, tempColor } from '../constants';
import { rackSize } from '../mock/runtime';

const TEMP_LEGEND = [
    { v: 22, label: '≤22℃' },
    { v: 25, label: '25℃' },
    { v: 27.5, label: '27℃' },
    { v: 30, label: '30℃' },
    { v: 32, label: '≥32℃' },
];

/** grid 内边距，与下面 option.grid 保持一致 */
const GRID = { left: 40, right: 18, top: 20, bottom: 30 };

/** 轴端点保留一位小数，避免浮点尾数直接出现在刻度标签上 */
function round1(n) {
    return Math.round(n * 10) / 10;
}

export default {
    name: 'RackFloorplan',
    mixins: [echartsMixin],
    props: {
        plan: { type: Object, required: true },
        selectedId: { type: String, default: '' },
    },
    data() {
        return {
            colorMode: 'temp',
            TEMP_LEGEND,
            STATUS_COLOR,
            STATUS_LABEL,
            tempColor,
        };
    },
    watch: {
        plan: { deep: true, handler: 'render' },
        selectedId: 'render',
        colorMode: 'render',
    },
    mounted() {
        this.initChart(this.$refs.chartEl, {
            click: params => {
                if (params.componentType === 'series' && params.data && params.data.rack) {
                    this.$emit('pick', params.data.rack);
                }
            },
        });
        this.render();
    },
    methods: {
        rackColor(r) {
            if (this.colorMode === 'status' || r.status === 'offline') return STATUS_COLOR[r.status];
            if (this.colorMode === 'u') {
                const p = r.uTotal ? r.uUsed / r.uTotal : 0;
                return `hsl(${210 - p * 180}, 70%, ${38 + p * 14}%)`;
            }
            return tempColor(r.tempIn);
        },

        renderItem(params, api) {
            // 直接用 dataIndex 回查原始对象，避免依赖「value 数组里塞对象」这种非官方写法
            const rack = this.plan.racks[params.dataIndex];
            if (!rack) return;
            const selected = rack.id === this.selectedId;
            const [cx, cy] = api.coord([rack.x, -rack.z]);
            // 两轴各自换算像素：x 轴铺满绘图区宽度，机柜才会呈扁平矩形而非方块
            const wPx = api.size([rackSize.w, 0])[0];
            const hPx = api.size([0, rackSize.d])[1];

            const rect = {
                type: 'rect',
                shape: {
                    x: cx - wPx / 2,
                    y: cy - hPx / 2,
                    width: wPx,
                    height: hPx,
                    r: 2,
                },
                style: api.style(),
                styleEmphasis: api.styleEmphasis(),
            };
            const text = {
                type: 'text',
                style: {
                    x: cx,
                    y: cy,
                    text: rack.id,
                    textAlign: 'center',
                    textVerticalAlign: 'middle',
                    fill: CANVAS.bg,
                    fontSize: Math.max(9, Math.min(13, hPx * 0.5)),
                    fontWeight: 600,
                },
                silent: true,
            };
            const children = [rect, text];
            // 选中描边单独叠一层，不改 rect 的 style，避免整条 series 重绘
            if (selected) {
                children.push({
                    type: 'rect',
                    shape: Object.assign({}, rect.shape, { r: 3 }),
                    style: { fill: 'transparent', stroke: '#f8fafc', lineWidth: 2 },
                    silent: true,
                });
            }
            return { type: 'group', children };
        },

        /** 功能分区、墙体与通道：静态底图，不参与交互 */
        renderStructure(api) {
            const p = this.plan;
            const children = [];
            // 外墙
            children.push({
                type: 'rect',
                shape: {
                    x: api.coord([-p.room.w / 2, 0])[0],
                    y: api.coord([0, -p.room.d / 2])[1],
                    width: api.coord([p.room.w / 2, 0])[0] - api.coord([-p.room.w / 2, 0])[0],
                    height: api.coord([0, p.room.d / 2])[1] - api.coord([0, -p.room.d / 2])[1],
                },
                style: { fill: 'transparent', stroke: CANVAS.wall, lineWidth: 2 },
            });
            // 分区：虚线框 + 左侧标签。标签靠左是因为主机区与机柜行同高，
            // 居中会把文字压在机柜上，机房左侧本就留有一条空白走道
            p.zones.forEach(z => {
                const bx0 = api.coord([z.x0, -z.z1])[0];
                const by0 = api.coord([z.x0, -z.z1])[1];
                const bx1 = api.coord([z.x1, -z.z0])[0];
                const by1 = api.coord([z.x1, -z.z0])[1];
                children.push({
                    type: 'rect',
                    shape: { x: bx0, y: by0, width: bx1 - bx0, height: by1 - by0 },
                    style: { fill: 'transparent', stroke: CANVAS.zone, lineWidth: 1, lineDash: [4, 4] },
                });
                children.push({
                    type: 'text',
                    style: {
                        x: bx0 + 6,
                        y: (by0 + by1) / 2,
                        text: z.label,
                        textAlign: 'left',
                        textVerticalAlign: 'middle',
                        fill: CANVAS.zoneLabel,
                        fontSize: 11,
                    },
                });
            });
            // 通道底色：冷热通道交替，帮助判断风向组织
            p.aisles.forEach(a => {
                const half = a.width / 2 - 0.15;
                const x0 = api.coord([-p.room.w / 2 + 0.4, 0])[0];
                const x1 = api.coord([p.room.w / 2 - 0.4, 0])[0];
                const y0 = api.coord([0, -(a.at + half)])[1];
                const y1 = api.coord([0, -(a.at - half)])[1];
                children.push({
                    type: 'rect',
                    shape: { x: x0, y: Math.min(y0, y1), width: x1 - x0, height: Math.abs(y1 - y0) },
                    // 冷通道跟随交互蓝，热通道保持告警红语义
                    style: {
                        fill: a.label === '冷通道' ? 'rgba(64,158,255,0.08)' : 'rgba(239,68,68,0.05)',
                    },
                });
            });
            return { type: 'group', children };
        },

        render() {
            if (!this.chart) return;
            const plan = this.plan;
            const pad = 1.5;

            // 两轴各自按物理尺寸铺满绘图区：不再做等比反推，
            // 否则宽扁容器会把 y 轴范围撑大，机柜被压成正方形小块
            const xSpan = plan.room.w + pad * 2;
            const ySpan = plan.room.d + pad * 2;

            const renderItem = (params, api) => this.renderItem(params, api);
            const renderStructure = (params, api) => this.renderStructure(api);

            this.setOption({
                // 渐变底由 .idc-deploy__plan 容器提供，图表铺实色会把它盖掉
                backgroundColor: CANVAS.transparent,
                animation: false,
                grid: Object.assign({}, GRID, { containLabel: false }),
                tooltip: {
                    backgroundColor: CANVAS.tooltipBg,
                    borderColor: CANVAS.border,
                    textStyle: { color: CANVAS.text, fontSize: 12 },
                    formatter: p => {
                        const r = p.data && p.data.rack;
                        if (!r) return '';
                        return [
                            `<b>${r.id}</b>（${STATUS_LABEL[r.status]}）`,
                            `进风/出风：${r.tempIn}℃ / ${r.tempOut}℃`,
                            `功率：${r.powerKw}/${r.ratedPowerKw} kW（${r.loadPct}%）`,
                            `U 位：${r.uUsed}/${r.uTotal}（设备 ${r.devices.length} 台）`,
                        ].join('<br/>');
                    },
                },
                xAxis: {
                    type: 'value',
                    min: round1(-xSpan / 2),
                    max: round1(xSpan / 2),
                    interval: xSpan > 26 ? 6 : 4,
                    axisLabel: {
                        color: CANVAS.textDim,
                        fontSize: 10,
                        formatter: v => `${round1(v)}m`,
                    },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: CANVAS.splitLine } },
                },
                yAxis: {
                    type: 'value',
                    min: round1(-ySpan / 2),
                    max: round1(ySpan / 2),
                    interval: ySpan > 26 ? 6 : 4,
                    axisLabel: { color: CANVAS.textDim, fontSize: 10, formatter: v => `${round1(v)}` },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: CANVAS.splitLine } },
                },
                dataZoom: [
                    { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
                    { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
                ],
                series: [
                    {
                        id: 'structure',
                        type: 'custom',
                        coordinateSystem: 'cartesian2d',
                        silent: true,
                        z: 1,
                        renderItem: renderStructure,
                        data: [0],
                    },
                    {
                        id: 'racks',
                        type: 'custom',
                        coordinateSystem: 'cartesian2d',
                        z: 2,
                        renderItem,
                        data: plan.racks.map(r => ({
                            // y 取负值：平面图 z 轴向前，转换成 ECharts 向上的屏幕坐标
                            value: [r.x, -r.z],
                            rack: r,
                            itemStyle: {
                                normal: {
                                    color: this.rackColor(r),
                                    borderColor: CANVAS.bg,
                                    borderWidth: 1,
                                    opacity: r.status === 'offline' ? 0.45 : 1,
                                },
                            },
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

.floorplan {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;

    &__bar {
        display: flex;
        align-items: center;
        padding: @idc-gap-sm @idc-gap-md;
        border-bottom: 1px solid @idc-border;
        flex: none;
    }

    &__legend {
        display: flex;
        align-items: center;
        flex: 1;
        margin-left: @idc-gap-lg;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__legend-item {
        display: inline-flex;
        align-items: center;
        margin-right: @idc-gap-md;

        i {
            width: 10px;
            height: 10px;
            margin-right: 4px;
            border-radius: 2px;
        }
    }

    &__hint {
        margin-left: auto;
        font-size: @idc-font-xs;
    }

    &__canvas {
        flex: 1;
        min-height: 360px;
    }
}

/deep/ .el-radio-group {
    line-height: 1;
}

/deep/ .el-radio-button__inner {
    color: @idc-text;
    background: @idc-panel-soft;
    border-color: @idc-border;
}

/deep/ .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    color: @idc-bg;
    background: @idc-accent;
    border-color: @idc-accent;
    box-shadow: -1px 0 0 0 @idc-accent;
}
</style>
