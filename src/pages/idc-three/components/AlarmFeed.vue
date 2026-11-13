<template>
    <div class="alarm-feed idc3-panel">
        <div class="idc3-panel__title">
            实时告警
            <span class="alarm-feed__count">{{ alarms.length }}</span>
        </div>
        <ul class="alarm-feed__list">
            <li
                v-for="a in alarms"
                :key="a.id"
                class="alarm-feed__item"
                :class="'is-' + a.level"
                @click="$emit('pick', a)"
            >
                <div class="alarm-feed__head">
                    <span class="alarm-feed__site">{{ a.siteName }}</span>
                    <span class="alarm-feed__rack">{{ a.rackId }}</span>
                    <span class="alarm-feed__time">{{ fmt(a.ts) }}</span>
                </div>
                <div class="alarm-feed__title">{{ a.title }}</div>
                <div class="alarm-feed__detail">{{ a.detail }}</div>
            </li>
            <li v-if="!alarms.length" class="alarm-feed__empty">当前无告警</li>
        </ul>
    </div>
</template>

<script>
/**
 * 告警滚动列表（M1：改造自 idcMap AlarmFeed，颜色走设计令牌）
 * 点击某条下钻到对应站点城市视图。
 *
 * 【接口数据】props.alarms 来自 GET /idc/metrics 的 Metrics.alarms，
 * 每项 { id, siteId, siteName, roomId, rackId, level, title, detail, ts }，
 * 由 SSE 每 2.5s 覆盖一次。时间统一 dayjs（需求 4.6）。
 */
import dayjs from 'dayjs';

export default {
    name: 'AlarmFeed',
    props: {
        alarms: { type: Array, default: () => [] },
    },
    methods: {
        fmt(ts) {
            return dayjs(ts).format('HH:mm:ss');
        },
    },
};
</script>

<style scoped lang="scss">
.alarm-feed {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &__count {
        margin-left: var(--idc3-gap-sm);
        padding: 0 6px;
        font-size: var(--idc3-font-sm);
        font-weight: 400;
        color: var(--idc3-text-dim);
        border: 1px solid var(--idc3-border-block);
        border-radius: 10px;
    }

    &__list {
        flex: 1;
        overflow-y: auto;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    &__item {
        padding: var(--idc3-gap-sm) var(--idc3-gap-md);
        border-bottom: 1px solid var(--idc3-border-block);
        cursor: pointer;

        &:hover {
            background: var(--idc3-panel-soft);
        }

        &.is-critical .alarm-feed__title {
            color: var(--idc3-status-alarm);
        }

        &.is-warning .alarm-feed__title {
            color: var(--idc3-status-warning);
        }
    }

    &__head {
        display: flex;
        align-items: center;
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text-dim);
    }

    &__rack {
        color: var(--idc3-glow);
    }

    &__time {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
    }

    &__title {
        margin-top: 2px;
        font-size: var(--idc3-font-md);
        color: var(--idc3-text);
    }

    &__detail {
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text-dim);
    }

    &__empty {
        padding: 24px;
        text-align: center;
        font-size: var(--idc3-font-sm);
        color: var(--idc3-text-dim);
    }
}
</style>
