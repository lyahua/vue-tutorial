<template>
    <div class="kpi-bar">
        <div
            v-for="k in items"
            :key="k.label"
            class="kpi-bar__item"
            :class="{ 'is-marked': k.marked }"
            :style="{ '--kpi-color': k.color }"
        >
            <KpiIcon :name="k.icon" class="kpi-bar__icon" />
            <div class="kpi-bar__label">{{ k.label }}</div>
            <div class="kpi-bar__value">
                {{ k.value }}<span class="kpi-bar__unit">{{ k.unit }}</span>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * 顶部指标条（Vue2 版）
 * 【接口数据】数值全部来自 props.summary，即 GET /idc/metrics 返回的 Metrics.summary，
 * 组件内不做任何业务取数，只做百分比换算与展示。
 */
import KpiIcon from './KpiIcon.vue';

export default {
    name: 'KpiBar',
    components: { KpiIcon },
    props: {
        // Metrics.summary：{ siteTotal, roomTotal, rackTotal, rackOnline,
        // uUsed, uTotal, powerKw, ratedPowerKw, avgPue, alarmCount, offlineCount }
        summary: { type: Object, required: true },
    },
    computed: {
        items() {
            const s = this.summary;
            return [
                { label: '机房', value: s.roomTotal, unit: ' 个', color: '#409eff', marked: false, icon: 'building' },
                {
                    label: '机柜在线',
                    value: `${s.rackOnline}/${s.rackTotal}`,
                    unit: ' 台',
                    color: '#409eff',
                    marked: false,
                    icon: 'rack',
                },
                {
                    label: 'U 位占用',
                    value: s.uTotal ? Math.round((s.uUsed / s.uTotal) * 100) : 0,
                    unit: '%',
                    color: '#8b5cf6',
                    marked: false,
                    icon: 'gauge',
                },
                { label: '总功耗', value: s.powerKw, unit: ' kW', color: '#22c55e', marked: true, icon: 'bolt' },
                { label: '平均 PUE', value: s.avgPue, unit: '', color: '#22d3ee', marked: false, icon: 'trend' },
                { label: '告警', value: s.alarmCount, unit: ' 条', color: '#ef4444', marked: false, icon: 'warning' },
                {
                    label: '离线机柜',
                    value: s.offlineCount,
                    unit: ' 台',
                    color: '#64748b',
                    marked: false,
                    icon: 'power',
                },
            ];
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.kpi-bar {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: @idc-gap-md;

    // 立体感靠「受光面 + 投影 + 边缘明暗线」三件套，全部用 background/box-shadow 叠出来，
    // 不额外加 DOM：
    // 1) 上亮下暗的竖向渐变当受光面，左上角再压一层该指标色的柔光当光源方向
    // 2) 外投影让卡片浮出 @idc-bg
    // 3) inset 顶边高光 + inset 底边暗线，勾出厚度方向
    &__item {
        position: relative;
        padding: @idc-gap-md;
        background:
            radial-gradient(120% 90% at 12% 0%, fade(@idc-panel, 0%) 40%, fade(@idc-bg, 55%) 100%),
            radial-gradient(90% 120% at 100% 100%, fade(@idc-accent, 16%), transparent 62%),
            repeating-linear-gradient(0deg, fade(@idc-accent, 5%) 0 1px, transparent 1px 12px),
            repeating-linear-gradient(90deg, fade(@idc-accent, 5%) 0 1px, transparent 1px 12px),
            linear-gradient(180deg, lighten(@idc-panel, 5%), @idc-panel 55%, darken(@idc-panel, 3%));
        border: 1px solid @idc-border;
        border-left: 3px solid var(--kpi-color, @idc-accent);
        border-radius: @idc-radius-md;
        box-shadow:
            0 6px 16px -8px fade(@idc-bg, 90%),
            0 1px 0 fade(#ffffff, 4%) inset,
            0 -8px 16px -12px #000 inset;
        // 水印超出右下角会被圆角切出直角，必须裁掉
        overflow: hidden;
        transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-top-color 0.2s,
            border-right-color 0.2s,
            border-bottom-color 0.2s;

        // 角标线只做「仪表框」的暗示，只用一组对角，四角都画会抢数值
        &::before,
        &::after {
            content: '';
            position: absolute;
            width: 12px;
            height: 12px;
            opacity: 0.5;
            pointer-events: none;
        }

        &::before {
            top: 6px;
            right: 6px;
            border-top: 1px solid var(--kpi-color, @idc-accent);
            border-right: 1px solid var(--kpi-color, @idc-accent);
        }

        &::after {
            bottom: 6px;
            left: 6px;
            border-bottom: 1px solid var(--kpi-color, @idc-accent);
            border-left: 1px solid var(--kpi-color, @idc-accent);
        }

        // hover 抬升 2px 并把投影推远，读成「被拿起来」；
        // 只改上右下三边，border-color 会连左侧语义竖条一起覆盖掉
        &:hover {
            transform: translateY(-2px);
            border-top-color: fade(@idc-primary, 55%);
            border-right-color: fade(@idc-primary, 55%);
            border-bottom-color: fade(@idc-primary, 55%);
            box-shadow:
                0 14px 26px -10px fade(@idc-bg, 95%),
                0 0 14px -6px var(--kpi-color),
                0 1px 0 fade(#ffffff, 7%) inset,
                0 -8px 16px -12px #000 inset;

            .kpi-bar__icon {
                opacity: 0.55;
                transform: translate(-3px, -3px) scale(1.12);
            }
        }
    }

    // 水印压在对角线上，颜色跟随该指标的语义色，hover 提亮并朝卡内轻浮。
    // 指针事件必须关掉，否则会挡住卡片本身的 hover 与点击
    &__icon {
        position: absolute;
        right: -2px;
        bottom: -4px;
        width: 46px;
        height: 46px;
        color: var(--kpi-color, @idc-accent);
        opacity: 0.34;
        pointer-events: none;
        filter: drop-shadow(0 2px 3px fade(#000, 55%));
        transition: opacity 0.25s ease, transform 0.25s ease;
    }

    &__label {
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__value {
        margin-top: 4px;
        font-size: 20px;
        font-weight: 600;
        color: var(--kpi-color, @idc-accent);
        font-variant-numeric: tabular-nums;
    }

    &__unit {
        font-size: @idc-font-sm;
        font-weight: 400;
        color: @idc-text-dim;
    }

    // 成绩指标只加一条极窄下划线做衬底，数值本身的颜色保持语义不变。
    // 渐变尾端收在金色上：靛蓝单独出现容易被读成「交互色」，配金才读成「规模/成绩」
    &__item.is-marked .kpi-bar__value {
        position: relative;
        display: inline-block;
        padding-bottom: 4px;

        &::after {
            content: '';
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 2px;
            border-radius: 1px;
            background: linear-gradient(90deg, @idc-primary, @idc-gold);
        }
    }
}
</style>
