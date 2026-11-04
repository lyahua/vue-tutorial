// 被 iframe 嵌入的子页面通用逻辑：脱框架、握手、开关弹框的状态协商。
//
// 命名约定：内部成员一律用 embed 前缀。mixin 的同名成员会被组件静默覆盖
// 且不报错，业务侧不要复用 embed 开头的名字。
//
// 业务侧只需要：
//   mixins: [embedChild]
//   embedHandlers: { [MSG.SET_TITLE](payload) {...} }   // 声明自己关心的业务消息
//   模板上 :visible.sync="dialogVisible" @closed="embedOnDialogClosed"

import { MSG, NAMESPACE, buildMessage } from '../messages';
import { ensureEmbedStyles } from '../embed-styles';

// ?embed / ?embed=1 / ?embed=true 生效，其它值（含 0、false）视为不启用
function isEmbedQuery(query) {
  if (!query || !('embed' in query)) return false;
  const v = query.embed; // ?embed 不带值时 vue-router 解析成空字符串
  return v === '' || v === '1' || v === 'true';
}

export default {
  data() {
    // 两个判断含义不同，别混用：
    //  embed    —— 我要不要摘掉后台框架（由 URL 参数控制，App.vue 不参与）
    //  inIframe —— 我到底有没有被嵌套（决定能否 postMessage、要不要透明背景）
    const embed = isEmbedQuery(this.$route.query);
    const inIframe = window.self !== window.top;
    return {
      embed,
      inIframe,
      // 被嵌入时先不显示：等父页面铺满全屏并回 ACK 再显示，
      // 否则弹框会先在 420px 小框里动画一次再跳全屏。独立访问时直接显示。
      dialogVisible: !inIframe,
    };
  },

  computed: {
    // 握手时顺手带出去，父页面想要就用。业务可覆盖同名 computed
    embedHandshakeTitle() {
      return '';
    },
    // 同源用 origin 最安全；跨域时由父页面通过 ?parentOrigin=https://parent.com 告知
    embedTargetOrigin() {
      return this.$route.query.parentOrigin || window.location.origin;
    },
  },

  mounted() {
    if (this.inIframe) {
      ensureEmbedStyles();
      // iframe 默认白底，必须让子文档透明，父页面才能透过 iframe 看到自己的内容
      document.documentElement.classList.add('iframe-embed');
      // 摘掉侧边栏/头部，只留纯净内容区
      if (this.embed) document.documentElement.classList.add('embed-bare');
    }
    window.addEventListener('message', this.embedOnMessage);
    // 握手：告诉父页面"我准备好了"，父页面收到后再下发数据，避免消息丢失
    this.embedPost(MSG.CHILD_READY, { title: this.embedHandshakeTitle });
  },

  beforeDestroy() {
    window.removeEventListener('message', this.embedOnMessage);
    document.documentElement.classList.remove('iframe-embed', 'embed-bare');
  },

  methods: {
    // 统一出口：向父页面发消息
    embedPost(type, payload) {
      if (!this.inIframe) {
        console.log('[embed-child] 未处于 iframe 中，消息未发送:', type, payload);
        return;
      }
      window.parent.postMessage(buildMessage(type, payload), this.embedTargetOrigin);
    },

    // 开弹框必须先申请：让父页面把 iframe 铺满全屏，等 ACK 回来再真正显示
    embedRequestOpen() {
      if (!this.inIframe) {
        this.dialogVisible = true;
        return;
      }
      this.embedPost(MSG.REQUEST_OPEN, {});
    },

    // 必须绑在 el-dialog 的 @closed（关闭动画结束），绑 @close 会打断动画
    embedOnDialogClosed() {
      this.embedPost(MSG.DIALOG_CLOSED, {});
    },

    embedOnMessage(event) {
      // 校验来源 + 协议命名空间，生产环境必须做（跨域时改成白名单）
      // 期望的父级源就是 embedTargetOrigin：同源时等于自己，跨源时由 ?parentOrigin= 声明
      if (event.origin !== this.embedTargetOrigin) return;
      // 只认直接父级：挡掉孙级 iframe 伪造 ACK_OPEN 强行显示弹框
      if (event.source !== window.parent) return;

      const data = event.data;
      if (!data || data.namespace !== NAMESPACE) return;

      switch (data.type) {
        case MSG.PING:
          this.embedPost(MSG.PONG, { from: 'child' });
          break;
        case MSG.ACK_OPEN:
          // 父页面已铺满全屏并锁定其滚动，此刻显示弹框即为居中效果
          this.dialogVisible = true;
          break;
        case MSG.OPEN_DIALOG:
          this.embedRequestOpen();
          break;
        case MSG.CLOSE_DIALOG:
          this.dialogVisible = false;
          break;
        default:
          // 框架不认识的 type 交给业务声明的 embedHandlers
          this.embedDispatch(data);
          break;
      }
    },

    embedDispatch(data) {
      const handlers = this.$options.embedHandlers;
      const fn = handlers && handlers[data.type];
      if (fn) fn.call(this, data.payload, data);
    },
  },
};
