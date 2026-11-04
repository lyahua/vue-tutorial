<template>
  <!--
    常驻全屏层：关闭态只把透明度和 pointer-events 归零。
    绝不能用 display:none / v-if，否则 iframe 会重新加载、丢失子页面状态。
  -->
  <iframe
    ref="frame"
    class="embed-frame-layer"
    :src="resolvedSrc"
    :style="frameStyle"
    frameborder="0"
  ></iframe>
</template>

<script>
import { MSG, NAMESPACE, buildMessage } from '../messages';
import { lockBodyScroll, unlockBodyScroll } from '../scroll-lock';

let seq = 0;

export default {
  name: 'IframeEmbed',
  props: {
    // 支持 '#/xxx?embed=1' 这种 hash 路由片段，也支持完整 URL
    src: { type: String, required: true },
    // 事件里用来区分是哪个弹框，建议显式传；不传则退化成自增序号
    id: { type: String, default: '' },
    label: { type: String, default: '' },
    origin: { type: String, default: () => window.location.origin },
    zIndex: { type: Number, default: 3000 },
    readyTimeout: { type: Number, default: 8000 },
  },

  data() {
    return {
      // 放在 data 里而不是 created 里赋值：下面的 state 是 immediate watcher，
      // 它在 initState 阶段就会跑一次并 emit，那时 created 还没执行
      uid: this.id || 'embed-' + ++seq,
      childReady: false,
      dialogOpen: false,
      opening: false,
      pendingOpen: false,
      openTimer: null,
    };
  },

  computed: {
    resolvedSrc() {
      return this.src.charAt(0) === '#'
        ? window.location.href.split('#')[0] + this.src
        : this.src;
    },
    frameStyle() {
      return {
        opacity: this.dialogOpen ? '1' : '0',
        pointerEvents: this.dialogOpen ? 'auto' : 'none',
        zIndex: String(this.zIndex),
      };
    },
    // 父页面要靠它渲染按钮的 loading/disabled，而 $refs 不是响应式的，
    // 所以状态只能通过事件往外抛
    state() {
      return {
        id: this.uid,
        label: this.label,
        ready: this.childReady,
        open: this.dialogOpen,
        opening: this.opening,
      };
    },
  },

  watch: {
    state: {
      immediate: true,
      handler(val) {
        this.$emit('state', val);
      },
    },
  },

  mounted() {
    window.addEventListener('message', this.onMessage);
  },

  beforeDestroy() {
    window.removeEventListener('message', this.onMessage);
    clearTimeout(this.openTimer);
    this.releaseScroll();
  },

  methods: {
    // 业务消息也走这里，组件不理解任何业务语义
    send(type, payload) {
      const frame = this.$refs.frame;
      if (!frame || !frame.contentWindow) {
        this.$emit('error', this.info({ reason: 'iframe 还没准备好' }));
        return false;
      }
      frame.contentWindow.postMessage(buildMessage(type, payload), this.origin);
      return true;
    },

    open() {
      if (this.dialogOpen) return;
      if (!this.childReady) {
        // iframe 加载 + 子页面注册监听需要时间，此时发消息会被直接丢弃。
        // 挂起请求，等 CHILD_READY 到达后补发。
        this.pendingOpen = true;
        this.opening = true;
        clearTimeout(this.openTimer);
        this.openTimer = setTimeout(() => {
          if (!this.pendingOpen) return;
          this.pendingOpen = false;
          this.opening = false;
          this.$emit('timeout', this.info());
        }, this.readyTimeout);
        return;
      }
      this.opening = true;
      this.send(MSG.OPEN_DIALOG, {});
    },

    close() {
      this.send(MSG.CLOSE_DIALOG, {});
    },

    onMessage(event) {
      if (event.origin !== this.origin) return;
      // 关键：只认自己这个 iframe 的窗口。
      // 同页多个 iframe 共用 namespace，不校验 source 就会互相串台。
      const frame = this.$refs.frame;
      if (!frame || event.source !== frame.contentWindow) return;

      const data = event.data;
      if (!data || data.namespace !== NAMESPACE) return;

      switch (data.type) {
        case MSG.CHILD_READY:
          this.childReady = true;
          this.$emit('ready', this.info(data.payload));
          // 就绪前被排队的打开请求，此刻补发
          if (this.pendingOpen) {
            this.clearPending();
            this.opening = true;
            this.send(MSG.OPEN_DIALOG, {});
          }
          break;

        // 子页面请求开弹框：先铺满全屏并锁滚动，再回 ACK 让它显示
        case MSG.REQUEST_OPEN:
          this.dialogOpen = true;
          this.opening = false;
          this.lockScroll();
          this.$nextTick(() => this.send(MSG.ACK_OPEN, {}));
          break;

        // 子页面关闭动画结束才收到，收起 iframe 不会打断动画
        case MSG.DIALOG_CLOSED:
          this.dialogOpen = false;
          this.opening = false;
          this.clearPending();
          this.releaseScroll();
          this.$emit('closed', this.info());
          break;

        default:
          break;
      }

      // 框架消息和业务消息统一透传
      this.$emit('message', Object.assign(this.info(), {
        type: data.type,
        payload: data.payload,
      }));
    },

    info(extra) {
      return Object.assign({ id: this.uid, label: this.label }, extra);
    },

    clearPending() {
      this.pendingOpen = false;
      clearTimeout(this.openTimer);
      this.openTimer = null;
    },

    // 幂等包装：DIALOG_CLOSED 和 beforeDestroy 可能都触发，不能双减计数
    lockScroll() {
      if (this._scrollLocked) return;
      this._scrollLocked = true;
      lockBodyScroll();
    },

    releaseScroll() {
      if (!this._scrollLocked) return;
      this._scrollLocked = false;
      unlockBodyScroll();
    },
  },
};
</script>

<style scoped>
/* 常驻全屏层：不用 display:none，避免 iframe 重新加载丢失子页面状态 */
.embed-frame-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  transition: opacity 0.2s;
}
</style>
