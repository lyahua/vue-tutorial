<template>
    <div class="n-kpi">
        <div v-for="k in items" :key="k.label" class="n-kpi__item" :style="{ '--kpi-color': k.color }">
            <KpiIcon :name="k.icon" class="n-kpi__icon" />
            <div class="n-kpi__label">{{ k.label }}</div>
            <div class="n-kpi__value">
                {{ k.value }}<span class="n-kpi__unit">{{ k.unit }}</span>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * 顶部全国指标条（M1：改造自 idcMap KpiBar，颜色全部走设计令牌）
 *
 * 【接口数据】数值全部来自 props.summary（GET /idc/metrics 的 Metrics.summary），
 * 组件内不做任何业务取数，只做百分比换算与展示。
 * 颜色经 styles/tokens.js 现读 CSS 变量 —— 单一来源 _tokens.scss。
 */
import KpiIcon from './KpiIcon.vue';
import { cssVar } from '../styles/tokens';

export default {
    name: 'NationalKpi',
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
                { label: '机房', value: s.roomTotal, unit: ' 个', color: cssVar('--idc3-glow'), icon: 'building' },
                {
                    label: '机柜在线',
                    value: `${s.rackOnline}/${s.rackTotal}`,
                    unit: ' 台',
                    color: cssVar('--idc3-glow'),
                    icon: 'rack',
                },
                {
                    label: 'U 位占用',
                    value: s.uTotal ? Math.round((s.uUsed / s.uTotal) * 100) : 0,
                    unit: '%',
                    color: cssVar('--idc3-kpi-teal'),
                    icon: 'gauge',
                },
                {
                    label: '总功耗',
                    value: s.powerKw,
                    unit: ' kW',
                    color: cssVar('--idc3-kpi-cyan'),
                    icon: 'bolt',
                },
                { label: '平均 PUE', value: s.avgPue, unit: '', color: cssVar('--idc3-status-warning'), icon: 'trend' },
                {
                    label: '告警',
                    value: s.alarmCount,
                    unit: ' 条',
                    color: cssVar('--idc3-status-alarm'),
                    icon: 'warning',
                },
                {
                    label: '离线机柜',
                    value: s.offlineCount,
                    unit: ' 台',
                    color: cssVar('--idc3-status-offline'),
                    icon: 'power',
                },
            ];
        },
    },
};
</script>

<style scoped lang="scss">
// 需求 27 行：指标小块标题 #fff、边框 rgb(5,69,158) —— 均走 :root 令牌
.n-kpi {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--idc3-gap-md);

    &__item {
        position: relative;
        padding: var(--idc3-gap-md);
        // 左侧语义竖条 + 角标仪表框，颜色跟随该指标的 --kpi-color
        overflow: hidden;
        background: var(--idc3-panel);
        border: 1px solid var(--idc3-border-block);
        border-left: 3px solid var(--kpi-color);
        border-radius: var(--idc3-radius-md);
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

        // 角标线只做「仪表框」的暗示，只用一组对角，四角都画会抢数值
        &::before,
        &::after {
            content: '';
            position: absolute;
            width: 12px;
            height: 12px;
            opacity: 0.55;
            pointer-events: none;
        }

        &::before {
            top: 6px;
            right: 6px;
            border-top: 1px solid var(--kpi-color);
            border-right: 1px solid var(--kpi-color);
        }

        &::after {
            bottom: 6px;
            left: 6px;
            border-bottom: 1px solid var(--kpi-color);
            border-left: 1px solid var(--kpi-color);
        }

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 14px -6px var(--kpi-color);

            .n-kpi__icon {
                opacity: 0.55;
                transform: translate(-3px, -3px) scale(1.12);
            }
        }
    }

    // 水印压在右下角，颜色跟随指标语义色；pointer-events 必须关掉，否则挡住 hover
    &__icon {
        position: absolute;
        right: -2px;
        bottom: -4px;
        width: 46px;
        height: 46px;
        color: var(--kpi-color);
        opacity: 0.34;
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
    }

    &__label {
        font-size: var(--idc3-font-sm);
        color: var(--idc3-block-title);
    }

    &__value {
        margin-top: 4px;
        font-size: 20px;
        font-weight: 600;
        color: var(--kpi-color);
        font-variant-numeric: tabular-nums;
    }

    &__unit {
        font-size: var(--idc3-font-sm);
        font-weight: 400;
        color: var(--idc3-text-dim);
    }
}
</style>
