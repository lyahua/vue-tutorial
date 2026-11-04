<template>
    <div class="geo-map">
        <div class="geo-map__crumb">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <a class="geo-map__link" @click="$emit('back')">全国</a>
                </el-breadcrumb-item>
                <el-breadcrumb-item v-if="site">{{ site.name }}</el-breadcrumb-item>
            </el-breadcrumb>
            <el-button v-if="site" size="mini" type="text" @click="$emit('back')">返回全国</el-button>
        </div>
        <div ref="mapEl" class="geo-map__canvas"></div>
        <div v-if="loading" class="geo-map__mask">地图数据加载中…</div>
        <div v-if="error" class="geo-map__mask geo-map__mask--error">{{ error }}</div>
    </div>
</template>

<script>
/**
 * 全国 → 城市 两级机房分布地图（Vue2 + ECharts 4 版）
 *
 * 【接口数据】
 * - getGeoJson(adcode)          地图底图边界，GET /idc/geo/{adcode}_full.json
 * - getMetricsSnapshot()        站点/链路/省份底色数据，GET /idc/metrics
 * - subscribeMetrics(cb)        每 2.5s 推送一次快照，等价 SSE 推送
 *
 * 地图数据来自 public/geo 下的本地 GeoJSON，不请求外网：
 * 内网部署拿不到 DataV 的 CDN，外链地图必然白屏。
 */
import echartsMixin, { echarts } from '../echartsMixin';
import { getGeoJson, getMetricsSnapshot, subscribeMetrics } from '../api';
import { BRAND, brandAlpha, CANVAS, SEVERITY, STATUS_COLOR } from '../constants';

// 已注册过的地图，避免同一份 GeoJSON 反复 registerMap（模块级缓存，跨组件实例复用）
const registered = new Set();

export default {
    name: 'GeoMap',
    mixins: [echartsMixin],
    props: {
        // 当前下钻的行政区划码，空串表示全国视图
        siteAdcode: { type: String, default: '' },
    },
    data() {
        return {
            loading: false,
            error: '',
            site: null,
            /**
             * 已成功渲染的地图名
             *
             * subscribeMetrics 订阅时会同步回调一次，此时 GeoJSON 还在 fetch，
             * 直接 setOption 会报 "Map not exists" 并打断首帧渲染，必须靠它拦掉。
             */
            drawnMap: '',
            unsubscribe: null,
        };
    },
    watch: {
        siteAdcode: {
            immediate: true,
            handler(adcode) {
                // immediate 在 created 阶段触发，此时图表还没 init（chart 为 null）。
                // 若在此渲染：地图已缓存时 renderNational 不会 await，会同步把 drawnMap
                // 置成目标值，导致 mounted 里 patch 提前对空图表 setOption 报
                // "series.type should be specified"。首帧统一交给 mounted。
                if (!this.chart) return;
                if (!adcode) this.renderNational();
                else this.renderCity(adcode);
            },
        },
    },
    mounted() {
        this.initChart(this.$refs.mapEl, { click: this.onClick });
        this.unsubscribe = subscribeMetrics(this.patch);
        // watch immediate 在 created 阶段跑过一次，那时图表还没初始化，这里补渲染
        if (!this.drawnMap) {
            this.siteAdcode ? this.renderCity(this.siteAdcode) : this.renderNational();
        }
    },
    beforeDestroy() {
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = null;
    },
    methods: {
        pct(a, b) {
            return b ? Math.round((a / b) * 100) : 0;
        },

        /**
         * 切图前硬清所有 zlevel 画布层
         *
         * 链路开了 effect.trailLength，zrender 会给该层配 motionBlur，
         * 而 Layer.clear() 在 motionBlur 下会把上一帧按 lastFrameAlpha(0.935)
         * 重新贴回画布。链路 series 一旦被移除，该层不再重绘，冻结的尾迹
         * 就永久留在图上（实测下钻珠海后 zlevel=1 仍残留整片拓扑线像素）。
         * 必须传 clearAll=true 绕开动态模糊分支，chart.clear() 走的是默认分支，
         * 单独调用无效。
         */
        hardClearLayers() {
            if (!this.chart) return;
            this.chart.getZr().painter.eachBuiltinLayer(layer => layer.clear(true));
        },

        onClick(params) {
            const data = params.data || {};
            // 机房散点优先级最高：城市视图里直接进平面布置图
            if (params.componentType === 'series' && data.roomId) {
                this.$emit('pick-room', data.roomId);
                return;
            }
            if (params.componentType === 'series' && data.adcode) {
                this.$emit('drill', String(data.adcode));
                return;
            }
            // 省份点击只能拿到名称，用名称反查 adcode，命中站点所在省才下钻
            if (params.componentType === 'geo') {
                const hit = getMetricsSnapshot().sites.find(s => s.province === params.name);
                if (hit) this.$emit('drill', hit.adcode);
            }
        },

        /**
         * 站点散点：异常站点单独走 effectScatter，正常站点用普通 scatter
         * 【接口数据】sites 来自 GET /idc/metrics 的 Metrics.sites
         */
        sitePoints(sites) {
            const normal = [];
            const bad = [];
            // 全国比例下京津两地几乎重叠，按「更靠北的近邻数量」错开标签方位
            const northNear = s =>
                sites.filter(
                    o => o.id !== s.id && o.lat > s.lat && o.lat - s.lat < 1.5 && Math.abs(o.lng - s.lng) < 2
                ).length;
            sites.forEach(s => {
                const item = {
                    name: s.name,
                    value: [s.lng, s.lat, s.rackTotal],
                    adcode: s.adcode,
                    status: s.status,
                    uPct: this.pct(s.uUsed, s.uTotal),
                    alarmCount: s.alarmCount,
                    label: { position: northNear(s) % 2 ? 'bottom' : 'right' },
                    // 核心站点是「等级」不是「状态」，所以荣誉用金色实环表达，
                    // 品牌红只做外发光。这样站点转为告警时红色仍占主导，两者不会混读
                    ...(s.level === 'core'
                        ? {
                              symbol: 'circle',
                              itemStyle: {
                                  borderColor: BRAND.gold,
                                  borderWidth: 2,
                                  shadowColor: brandAlpha(0.6),
                                  shadowBlur: 10,
                              },
                          }
                        : null),
                };
                (s.status === 'alarm' || s.status === 'warning' ? bad : normal).push(item);
            });
            return { normal, bad };
        },

        /**
         * 有站点省份的高亮底色
         *
         * 同一省份被多个站点命中时取最严重状态，避免后写入的 region 覆盖前一个。
         */
        siteRegions(sites) {
            const byProvince = new Map();
            sites.forEach(s => {
                const prev = byProvince.get(s.province);
                if (!prev || SEVERITY[s.status] > SEVERITY[prev]) byProvince.set(s.province, s.status);
            });
            const out = [];
            byProvince.forEach((status, name) => {
                out.push({
                    name,
                    itemStyle: {
                        areaColor: `${STATUS_COLOR[status]}66`,
                        borderColor: STATUS_COLOR[status],
                        borderWidth: 1.2,
                    },
                });
            });
            return out;
        },

        /** 【接口数据】链路折线，数据来自 Metrics.links + Metrics.sites 的经纬度 */
        linkLines(sites, links) {
            const byId = new Map(sites.map(s => [s.id, s]));
            const out = [];
            links.forEach(l => {
                const a = byId.get(l.from);
                const b = byId.get(l.to);
                if (!a || !b) return;
                out.push({
                    coords: [
                        [a.lng, a.lat],
                        [b.lng, b.lat],
                    ],
                    link: l,
                    lineStyle: { color: STATUS_COLOR[l.status] },
                });
            });
            return out;
        },

        /** 【接口数据】城市视图的机房散点，数据来自 Metrics.sites[i].rooms */
        roomPoints(site) {
            return site.rooms.map(r => ({
                name: r.name,
                value: [r.lng, r.lat, r.rackTotal],
                roomId: r.id,
                status: r.status,
                uPct: this.pct(r.uUsed, r.uTotal),
                powerKw: r.powerKw,
                tempAvg: r.tempAvg,
                itemStyle: {
                    color: STATUS_COLOR[r.status] || STATUS_COLOR.normal,
                    borderColor: CANVAS.bg,
                    borderWidth: 1,
                },
            }));
        },

        tooltipBase() {
            return {
                trigger: 'item',
                backgroundColor: CANVAS.tooltipBg,
                borderColor: CANVAS.border,
                textStyle: { color: CANVAS.text, fontSize: 12 },
            };
        },

        /** 全国视图：省份底色 + 站点散点 + 骨干链路 */
        async renderNational() {
            this.loading = true;
            this.error = '';
            // 必须在这里清掉：面包屑末级和「返回全国」都挂 v-if="site"，
            // 不清就会从城市视图返回后继续显示，点一次还会再 emit 一次 back
            this.site = null;
            try {
                if (!registered.has('100000')) {
                    echarts.registerMap('100000', await getGeoJson('100000'));
                    registered.add('100000');
                }
                const m = getMetricsSnapshot();
                const { normal, bad } = this.sitePoints(m.sites);

                // 见 hardClearLayers：不清掉的话上一级拓扑线会冻结在画布上
                this.hardClearLayers();

                this.setOption(
                    {
                        // 渐变底由外层容器负责，图表铺实色会把渐变盖掉
                        backgroundColor: CANVAS.transparent,
                        tooltip: Object.assign(this.tooltipBase(), {
                            formatter: params => {
                                const d = params.data || {};
                                if (params.seriesType === 'lines') {
                                    const l = d.link || {};
                                    return `带宽：${(l.bwMbps / 1000).toFixed(0)} Gbps<br/>利用率：${l.usedPct}%`;
                                }
                                if (params.componentType === 'series') {
                                    return [
                                        `<b>${params.name}</b>`,
                                        `机柜：${(d.value || [])[2] || '-'} 台`,
                                        `U 位占用：${d.uPct || '-'}%`,
                                        `告警：${d.alarmCount || 0} 条`,
                                        `<span style="color:${CANVAS.textDim}">点击进入城市视图</span>`,
                                    ].join('<br/>');
                                }
                                return params.name;
                            },
                        }),
                        geo: {
                            map: '100000',
                            roam: true,
                            // 首屏聚焦站点带（成都—西安—京津—杭州—珠海），
                            // 用全国全图比例会把六个点挤成一小簇
                            zoom: 2,
                            center: [112.5, 31],
                            label: { show: false },
                            itemStyle: {
                                areaColor: CANVAS.geoArea,
                                borderColor: CANVAS.geoBorder,
                                borderWidth: 1,
                                shadowColor: brandAlpha(0.35),
                                shadowBlur: 12,
                            },
                            emphasis: {
                                label: { show: true, color: '#f1f5f9', fontSize: 11 },
                                itemStyle: { areaColor: CANVAS.geoAreaEmphasis },
                            },
                            // 有站点的省份按状态着色。用 regions 而不是另挂 series，
                            // 避免地图被覆盖后点不中区域。同省多站点时取最严重状态
                            regions: this.siteRegions(m.sites),
                        },
                        series: [
                            {
                                id: 'links',
                                type: 'lines',
                                coordinateSystem: 'geo',
                                geoIndex: 0,
                                zlevel: 1,
                                effect: {
                                    show: true,
                                    period: 5,
                                    trailLength: 0.35,
                                    symbolSize: 4,
                                    color: CANVAS.accent,
                                },
                                lineStyle: { width: 1.4, opacity: 0.7, curveness: 0.22 },
                                data: this.linkLines(m.sites, m.links),
                            },
                            {
                                id: 'site-normal',
                                type: 'scatter',
                                coordinateSystem: 'geo',
                                geoIndex: 0,
                                zlevel: 2,
                                symbolSize: v => 8 + Math.min(14, (v[2] || 0) / 6),
                                itemStyle: { color: STATUS_COLOR.normal, borderColor: CANVAS.bg, borderWidth: 1 },
                                label: {
                                    show: true,
                                    position: 'right',
                                    formatter: '{b}',
                                    color: CANVAS.text,
                                    fontSize: 11,
                                },
                                data: normal,
                            },
                            {
                                id: 'site-bad',
                                type: 'effectScatter',
                                coordinateSystem: 'geo',
                                geoIndex: 0,
                                zlevel: 3,
                                rippleEffect: { brushType: 'stroke', scale: 3.2 },
                                symbolSize: v => 10 + Math.min(14, (v[2] || 0) / 6),
                                label: {
                                    show: true,
                                    position: 'right',
                                    formatter: '{b}',
                                    color: '#fca5a5',
                                    fontSize: 11,
                                },
                                data: bad,
                            },
                        ],
                    },
                    // 切图必须 notMerge，否则上一级 series 会残留在新地图上
                    { notMerge: true }
                );
                this.drawnMap = '100000';
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },

        /** 城市视图：区县底图 + 机房散点 */
        async renderCity(adcode) {
            this.loading = true;
            this.error = '';
            try {
                const hit = getMetricsSnapshot().sites.find(s => s.adcode === adcode);
                if (!hit) {
                    this.error = `暂无 ${adcode} 的机房数据`;
                    return;
                }
                if (!registered.has(adcode)) {
                    echarts.registerMap(adcode, await getGeoJson(adcode));
                    registered.add(adcode);
                }
                this.site = hit;

                // 同 renderNational：清掉冻结在链路层上的上一级拓扑线
                this.hardClearLayers();

                this.setOption(
                    {
                        backgroundColor: CANVAS.transparent,
                        tooltip: Object.assign(this.tooltipBase(), {
                            formatter: params => {
                                const d = params.data || {};
                                if (!d.roomId) return params.name;
                                return [
                                    `<b>${params.name}</b>`,
                                    `机柜：${(d.value || [])[2] || '-'} 台`,
                                    `U 位占用：${d.uPct}%`,
                                    `功率：${d.powerKw} kW`,
                                    `平均进风：${d.tempAvg}℃`,
                                    `<span style="color:${CANVAS.textDim}">点击进入平面布置图</span>`,
                                ].join('<br/>');
                            },
                        }),
                        geo: {
                            map: adcode,
                            roam: true,
                            zoom: 1.12,
                            label: { show: true, color: CANVAS.textDim, fontSize: 10 },
                            itemStyle: {
                                areaColor: CANVAS.geoArea,
                                borderColor: CANVAS.geoBorder,
                                borderWidth: 1,
                                shadowColor: brandAlpha(0.3),
                                shadowBlur: 10,
                            },
                            emphasis: {
                                label: { show: true, color: '#f1f5f9' },
                                itemStyle: { areaColor: CANVAS.geoAreaEmphasis },
                            },
                        },
                        series: [
                            {
                                id: 'rooms',
                                type: 'effectScatter',
                                coordinateSystem: 'geo',
                                geoIndex: 0,
                                rippleEffect: { brushType: 'stroke', scale: 3 },
                                symbolSize: v => 12 + Math.min(16, (v[2] || 0) / 3),
                                label: {
                                    show: true,
                                    position: 'right',
                                    formatter: '{b}',
                                    color: CANVAS.text,
                                    fontSize: 11,
                                },
                                data: this.roomPoints(hit),
                            },
                        ],
                    },
                    { notMerge: true }
                );
                this.drawnMap = adcode;
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },

        /**
         * 定时刷新只替换 series 数据（merge 模式，按 series.id 命中）。
         * 整图 notMerge 重设会把用户缩放平移过的视角弹回初始状态。
         */
        patch() {
            if (!this.chart) return;
            // 目标地图尚未画好（首帧 GeoJSON 还在加载 / 正在切换），等渲染完成后自然带上最新数据
            if (this.drawnMap !== (this.siteAdcode || '100000')) return;
            const m = getMetricsSnapshot();
            if (!this.siteAdcode) {
                const { normal, bad } = this.sitePoints(m.sites);
                this.setOption({
                    geo: { regions: this.siteRegions(m.sites) },
                    series: [
                        { id: 'links', data: this.linkLines(m.sites, m.links) },
                        { id: 'site-normal', data: normal },
                        { id: 'site-bad', data: bad },
                    ],
                });
                return;
            }
            const hit = m.sites.find(s => s.adcode === this.siteAdcode);
            if (!hit) return;
            this.site = hit;
            this.setOption({ series: [{ id: 'rooms', data: this.roomPoints(hit) }] });
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.geo-map {
    position: relative;
    height: 100%;
    min-height: 420px;
    // 底色由 .idc-map__map 容器提供渐变，这里再铺实色就把渐变盖掉了
    background: transparent;

    &__canvas {
        width: 100%;
        height: 100%;
    }

    &__crumb {
        position: absolute;
        top: 12px;
        left: 16px;
        z-index: 2;
        display: flex;
        align-items: center;
    }

    &__link {
        cursor: pointer;
    }

    &__mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: @idc-text-dim;
        background: fade(@idc-bg, 60%);

        &--error {
            color: #f87171;
        }
    }
}

/deep/ .el-breadcrumb__inner,
/deep/ .el-breadcrumb__inner a {
    color: @idc-text-dim;
}

/deep/ .el-breadcrumb__item:last-child .el-breadcrumb__inner {
    color: @idc-text;
}
</style>
