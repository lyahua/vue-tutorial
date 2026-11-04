<template>
    <div class="alarm-feed idc-panel">
        <div class="idc-panel__title">
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
 * 告警滚动列表（Vue2 版）
 * 点击某条可直接跳到对应机柜。
 *
 * 【接口数据】props.alarms 来自 GET /idc/metrics 的 Metrics.alarms，
 * 每项 { id, siteId, siteName, roomId, rackId, level, title, detail, ts }，
 * 由 SSE 每 2.5s 覆盖一次。
 */
import moment from 'moment';

export default {
    name: 'AlarmFeed',
    props: {
        alarms: { type: Array, default: () => [] },
    },
    methods: {
        fmt(ts) {
            return moment(ts).format('HH:mm:ss');
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.alarm-feed {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &__count {
        margin-left: @idc-gap-sm;
        padding: 0 6px;
        font-size: @idc-font-sm;
        font-weight: 400;
        color: @idc-text-dim;
        border: 1px solid @idc-border;
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
        padding: @idc-gap-sm @idc-gap-md;
        border-bottom: 1px solid @idc-border;
        cursor: pointer;

        &:hover {
            background: @idc-panel-soft;
        }

        &.is-critical .alarm-feed__title {
            color: #f87171;
        }

        &.is-warning .alarm-feed__title {
            color: #fbbf24;
        }
    }

    &__head {
        display: flex;
        align-items: center;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__rack {
        color: @idc-accent;
    }

    &__time {
        margin-left: auto;
        font-variant-numeric: tabular-nums;
    }

    &__title {
        margin-top: 2px;
        font-size: @idc-font-md;
        color: @idc-text;
    }

    &__detail {
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__empty {
        padding: 24px;
        text-align: center;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }
}
</style>
