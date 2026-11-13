import * as echarts from 'echarts';

/**
 * ECharts 4 通用挂载逻辑（Vue2 mixin，自包含副本）
 *
 * 只做三件事：创建实例、跟随窗口 resize、销毁。
 * 组件在 mounted 里调用 this.initChart(dom, events)，
 * 之后用 this.setOption(option, opts) 更新配置。
 */
export default {
    data() {
        return {
            chart: null,
        };
    },
    methods: {
        /**
         * @param {HTMLElement} el 图表容器
         * @param {object} [events] 事件表，如 { click(params){} }
         */
        initChart(el, events) {
            if (!el || this.chart) return this.chart;
            this.chart = echarts.init(el);
            if (events) {
                Object.keys(events).forEach(name => this.chart.on(name, events[name]));
            }
            this.__chartResize = () => this.chart && this.chart.resize();
            window.addEventListener('resize', this.__chartResize);
            return this.chart;
        },
        setOption(option, opts) {
            if (this.chart) this.chart.setOption(option, opts);
        },
        /** 容器高度由外部异步撑开时，手动补一次 resize */
        resizeChart() {
            if (this.chart) this.chart.resize();
        },
    },
    beforeDestroy() {
        if (this.__chartResize) window.removeEventListener('resize', this.__chartResize);
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    },
};

export { echarts };
