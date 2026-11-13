<template>
    <div class="n-map">
        <div class="n-map__crumb">
            <un-breadcrumb separator="/">
                <un-breadcrumb-item>
                    <a class="n-map__link" @click="$emit('back')">全国</a>
                </un-breadcrumb-item>
                <un-breadcrumb-item v-if="site">{{ site.name }}</un-breadcrumb-item>
            </un-breadcrumb>
            <un-button v-if="site" size="mini" type="text" @click="$emit('back')">返回全国</un-button>
        </div>
        <div ref="mapEl" class="n-map__canvas"></div>
        <div v-if="loading" class="n-map__mask">地图数据加载中…</div>
        <div v-if="error" class="n-map__mask n-map__mask--error">{{ error }}</div>
    </div>
</template>

<script>
/**
 * 全国 → 城市 两级机房分布地图（M1：复用 idcMap GeoMap 的加载/下钻/patch 逻辑）
 *
 * 与 idcMap 版的差异（需求第 5 点）：
 * 1. 去掉骨干拓扑线 series（需求明确「平面地图上拓扑线可以不要」），
 *    随之去掉 hardClearLayers —— 链路 motionBlur 残影问题不复存在；
 * 2. 配色全部改走设计令牌（chartTheme()），组件内零颜色字面量；
 * 3. 面包屑/按钮改用 un- 组件。
 *
 * 【接口数据】
 * - getGeoJson(adcode)       地图底图边界，GET /idc/geo/{adcode}_full.json
 * - getMetricsSnapshot()     站点数据，GET /idc/metrics
 * - subscribeMetrics(cb)     每 2.5s 推送一次快照，等价 SSE 推送
 */
import echartsMixin, { echarts } from '../echartsMixin';
import { SEVERITY } from '../constants';
import { getGeoJson, getMetricsSnapshot, subscribeMetrics } from '../api';
import { chartTheme, withAlpha } from '../styles/tokens';

// 已注册过的地图，避免同一份 GeoJSON 反复 registerMap（模块级缓存，跨组件实例复用）
const registered = new Set();

export default {
    name: 'NationalMap',
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
                // immediate 在 created 阶段触发，此时图表还没 init（chart 为 null），
                // 首帧统一交给 mounted，这里只处理运行期切换
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

        onClick(params) {
            const data = params.data || {};
            // 机房散点优先级最高：城市视图里直接下钻机房（M3 交付三维视图）
            if (params.componentType === 'series' && data.roomId) {
                this.$emit('pick-room', data.roomId);
                return;
            }
            if (params.componentType === 'series' && data.adcode) {
                this.$emit('drill', String(data.adcode));
                return;
            }
            // 省份点击只能拿到名称，用名称反查 adcode，命中站点所在省才下钻；
            // 无机房省份不提示、无响应（需求方确认）
            if (params.componentType === 'geo') {
                const hit = getMetricsSnapshot().sites.find(s => s.province === params.name);
                if (hit) this.$emit('drill', hit.adcode);
            }
        },

        /**
         * 站点散点：异常站点单独走 effectScatter（涟漪），正常站点用普通 scatter
         * 【接口数据】sites 来自 GET /idc/metrics 的 Metrics.sites
         */
        sitePoints(sites, t) {
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
                    // 核心站点是「等级」不是「状态」：荣誉用金色描边表达，红色仍只属于告警
                    ...(s.level === 'core'
                        ? {
                              symbol: 'circle',
                              itemStyle: {
                                  borderColor: t.gold,
                                  borderWidth: 2,
                                  shadowColor: withAlpha(t.glow, 0.6),
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
        siteRegions(sites, t) {
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
                        areaColor: withAlpha(t.status[status], 0.35),
                        borderColor: t.status[status],
                        borderWidth: 1.2,
                    },
                });
            });
            return out;
        },

        /** 【接口数据】城市视图的机房散点，数据来自 Metrics.sites[i].rooms */
        roomPoints(site, t) {
            // 辅助房间（UPS间/配电间等）不出现在城市点位图——它们的 lng/lat 与
            // 主机房相同（物理上就在同层），全部画出来点位重叠、标签叠成一片；
            // 进「机房建模图」（楼层视图）才见这些房间
            return site.rooms.filter(r => !r.auxiliary).map(r => ({
                name: r.name,
                value: [r.lng, r.lat, r.rackTotal],
                roomId: r.id,
                status: r.status,
                uPct: this.pct(r.uUsed, r.uTotal),
                powerKw: r.powerKw,
                tempAvg: r.tempAvg,
                itemStyle: {
                    color: t.status[r.status] || t.status.normal,
                    borderColor: t.mapArea,
                    borderWidth: 1,
                },
            }));
        },

        tooltipBase(t) {
            return {
                trigger: 'item',
                // 浮层底色比地图底深一档，青色描边 + 外发光 —— 在同色系地图上拉开层次
                backgroundColor: t.tooltipBg,
                borderColor: t.tooltipBorder,
                borderWidth: 1,
                extraCssText: `box-shadow: 0 4px 18px ${withAlpha(t.glow, 0.28)};`,
                textStyle: { color: t.text, fontSize: 12 },
            };
        },

        /** 全国视图：省份底色 + 站点散点（无拓扑线） */
        async renderNational() {
            this.loading = true;
            this.error = '';
            // 必须在这里清掉：面包屑末级和「返回全国」都挂 v-if="site"
            this.site = null;
            try {
                if (!registered.has('100000')) {
                    echarts.registerMap('100000', await getGeoJson('100000'));
                    registered.add('100000');
                }
                const m = getMetricsSnapshot();
                const t = chartTheme();
                const { normal, bad } = this.sitePoints(m.sites, t);

                this.setOption(
                    {
                        // 底色由外层 .n-map 容器（令牌）负责，图表铺实色会盖掉
                        backgroundColor: t.transparent,
                        tooltip: Object.assign(this.tooltipBase(t), {
                            formatter: params => {
                                const d = params.data || {};
                                if (params.componentType === 'series') {
                                    return [
                                        `<b>${params.name}</b>`,
                                        `机柜：${(d.value || [])[2] || '-'} 台`,
                                        `U 位占用：${d.uPct || '-'}%`,
                                        `告警：${d.alarmCount || 0} 条`,
                                        `<span style="color:${t.textDim}">点击进入城市视图</span>`,
                                    ].join('<br/>');
                                }
                                return params.name;
                            },
                        }),
                        geo: {
                            map: '100000',
                            roam: true,
                            // 首屏聚焦站点带（成都—西安—京津—杭州—上海—珠海），
                            // 全国全图比例会把站点挤成一小簇，放大到 2 倍并居中
                            zoom: 2,
                            center: [112.5, 31],
                            label: { show: false },
                            itemStyle: {
                                // 参考图配色：省份面 #1E4E8C、边界亮青 #3DE0FF 勾边发光
                                // —— geo 的 shadow 沿每块边界向两侧虚化，即「亮青描边发光」效果
                                areaColor: t.mapArea,
                                borderColor: t.provinceBorder,
                                borderWidth: 1,
                                shadowColor: withAlpha(t.glow, 0.6),
                                shadowBlur: 18,
                            },
                            emphasis: {
                                label: { show: true, color: t.text, fontSize: 11 },
                                itemStyle: {
                                    areaColor: t.mapAreaEmphasis,
                                    borderColor: withAlpha(t.glow, 0.8),
                                },
                            },
                            // 有站点的省份按状态着色。用 regions 而不是另挂 series，
                            // 避免地图被覆盖后点不中区域
                            regions: this.siteRegions(m.sites, t),
                        },
                        series: [
                            {
                                id: 'site-normal',
                                type: 'scatter',
                                coordinateSystem: 'geo',
                                geoIndex: 0,
                                zlevel: 2,
                                symbolSize: v => 8 + Math.min(14, (v[2] || 0) / 6),
                                itemStyle: {
                                    color: t.status.normal,
                                    borderColor: t.mapArea,
                                    borderWidth: 1,
                                },
                                label: {
                                    show: true,
                                    position: 'right',
                                    formatter: '{b}',
                                    color: t.text,
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
                                itemStyle: {
                                    color: t.status.alarm,
                                    borderColor: t.mapArea,
                                    borderWidth: 1,
                                },
                                label: {
                                    show: true,
                                    position: 'right',
                                    formatter: '{b}',
                                    color: t.status.alarm,
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
                const t = chartTheme();

                this.setOption(
                    {
                        backgroundColor: t.transparent,
                        tooltip: Object.assign(this.tooltipBase(t), {
                            formatter: params => {
                                const d = params.data || {};
                                if (!d.roomId) return params.name;
                                return [
                                    `<b>${params.name}</b>`,
                                    `机柜：${(d.value || [])[2] || '-'} 台`,
                                    `U 位占用：${d.uPct}%`,
                                    `功率：${d.powerKw} kW`,
                                    `平均进风：${d.tempAvg}℃`,
                                    `<span style="color:${t.textDim}">点击进入三维机房</span>`,
                                ].join('<br/>');
                            },
                        }),
                        geo: {
                            map: adcode,
                            roam: true,
                            zoom: 1.12,
                            label: { show: true, color: t.textDim, fontSize: 10 },
                            itemStyle: {
                                areaColor: t.mapArea,
                                borderColor: t.provinceBorder,
                                borderWidth: 1,
                                shadowColor: withAlpha(t.glow, 0.4),
                                shadowBlur: 14,
                            },
                            emphasis: {
                                label: { show: true, color: t.text },
                                itemStyle: {
                                    areaColor: t.mapAreaEmphasis,
                                    borderColor: withAlpha(t.glow, 0.8),
                                },
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
                                    color: t.text,
                                    fontSize: 11,
                                },
                                data: this.roomPoints(hit, t),
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
            const t = chartTheme();
            if (!this.siteAdcode) {
                const { normal, bad } = this.sitePoints(m.sites, t);
                this.setOption({
                    geo: { regions: this.siteRegions(m.sites, t) },
                    series: [
                        { id: 'site-normal', data: normal },
                        { id: 'site-bad', data: bad },
                    ],
                });
                return;
            }
            const hit = m.sites.find(s => s.adcode === this.siteAdcode);
            if (!hit) return;
            this.site = hit;
            this.setOption({ series: [{ id: 'rooms', data: this.roomPoints(hit, t) }] });
        },
    },
};
</script>

<style scoped lang="scss">
.n-map {
    position: relative;
    height: 100%;
    min-height: 420px;
    // 地图背景需求色（令牌）由容器负责，图表自身 transparent
    background: var(--idc3-bg-map);
    border-radius: var(--idc3-radius-md);

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
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--idc3-text-dim);
        background: var(--idc3-bg-map);

        &--error {
            color: var(--idc3-status-alarm);
        }
    }
}
</style>
