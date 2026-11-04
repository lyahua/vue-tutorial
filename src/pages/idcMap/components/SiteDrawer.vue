<template>
    <div class="site-drawer idc-panel">
        <div class="idc-panel__title">{{ site.name }}</div>
        <div class="site-drawer__body">
            <div class="site-drawer__meta">
                <span>{{ site.province }}{{ site.city }}</span>
                <el-tag size="small" :type="tagType">{{ statusLabel }}</el-tag>
            </div>
            <dl class="site-drawer__stats">
                <div v-for="s in stats" :key="s.label" class="site-drawer__stat">
                    <dt>{{ s.label }}</dt>
                    <dd>{{ s.value }}</dd>
                </div>
            </dl>
            <div class="site-drawer__rooms">
                <div class="site-drawer__rooms-title">机房</div>
                <div
                    v-for="r in site.rooms"
                    :key="r.id"
                    class="site-drawer__room"
                    @click="$emit('pick-room', r.id)"
                >
                    <span class="site-drawer__dot" :style="{ background: STATUS_COLOR[r.status] }"></span>
                    <span class="site-drawer__room-name">{{ r.name }}</span>
                    <span class="site-drawer__room-num">{{ r.rackTotal }} 台 / {{ r.powerKw }} kW</span>
                    <span class="site-drawer__arrow">›</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * 站点详情（Vue2 版）
 * 地图点击后展示该站点汇总与机房入口。
 *
 * 【接口数据】props.site 来自 GET /idc/metrics 的 Metrics.sites[i]，
 * 每 2.5s 由 SSE 覆盖一次，组件内只做文案映射。
 */
import { STATUS_COLOR, STATUS_LABEL } from '../constants';

const TAG_TYPE = {
    normal: 'success',
    warning: 'warning',
    alarm: 'danger',
    offline: 'info',
};

export default {
    name: 'SiteDrawer',
    props: {
        site: { type: Object, required: true },
    },
    data() {
        // 模板里要用状态色，挂到实例上暴露给渲染作用域
        return { STATUS_COLOR };
    },
    computed: {
        statusLabel() {
            return STATUS_LABEL[this.site.status];
        },
        tagType() {
            return TAG_TYPE[this.site.status];
        },
        stats() {
            const s = this.site;
            return [
                { label: '机柜', value: `${s.rackOnline}/${s.rackTotal} 台` },
                { label: 'U 位', value: `${s.uUsed}/${s.uTotal}` },
                { label: '功率', value: `${s.powerKw}/${s.ratedPowerKw} kW` },
                { label: 'PUE', value: String(s.pue) },
                { label: '平均进风', value: `${s.tempAvg} ℃` },
                { label: '湿度', value: `${s.humidity} %` },
            ];
        },
    },
};
</script>

<style scoped lang="less">
@import '../idc-theme.less';

.site-drawer {
    display: flex;
    flex-direction: column;
    min-height: 0;

    &__body {
        padding: @idc-gap-md;
        overflow-y: auto;
    }

    &__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: @idc-gap-sm;
        margin: @idc-gap-md 0;
    }

    &__stat {
        padding: @idc-gap-sm;
        background: @idc-panel-soft;
        border-radius: @idc-radius-sm;

        dt {
            font-size: @idc-font-xs;
            color: @idc-text-dim;
        }

        dd {
            margin-top: 2px;
            font-size: @idc-font-md;
            color: @idc-text;
            font-variant-numeric: tabular-nums;
        }
    }

    &__rooms-title {
        margin-bottom: @idc-gap-sm;
        font-size: @idc-font-sm;
        color: @idc-text-dim;
    }

    &__room {
        display: flex;
        align-items: center;
        width: 100%;
        padding: @idc-gap-sm;
        color: @idc-text;
        background: @idc-panel-soft;
        border: 1px solid @idc-border;
        border-radius: @idc-radius-sm;
        font-size: @idc-font-sm;
        cursor: pointer;
        transition: border-color 0.2s;

        & + & {
            margin-top: @idc-gap-sm;
        }

        &:hover {
            border-color: fade(@idc-primary, 65%);

            .site-drawer__arrow {
                color: @idc-primary-bright;
                transform: translateX(2px);
            }
        }
    }

    &__arrow {
        color: @idc-text-dim;
        transition: color 0.2s, transform 0.2s;
    }

    &__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex: none;
    }

    &__room-name {
        color: @idc-text;
    }

    &__room-num {
        margin-left: auto;
        color: @idc-text-dim;
        font-variant-numeric: tabular-nums;
    }
}

// element-ui 的 tag 默认浅底，在暗面板上像贴纸：改成同色系透明底 + 彩色描边文字
/deep/ .el-tag {
    .idc-ui-tag(@idc-text-dim);
}

/deep/ .el-tag--success {
    .idc-ui-tag(#22c55e);
}

/deep/ .el-tag--warning {
    .idc-ui-tag(#eab308);
}

/deep/ .el-tag--danger {
    .idc-ui-tag(#f87171);
}
</style>
