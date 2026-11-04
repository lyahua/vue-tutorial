// iframe 父子页面通信协议（共享常量）
// 单独抽出来，父页面和子页面 import 同一份，避免两边 type 字符串拼写不一致。

// 只处理带该 namespace 的 message，防止被浏览器扩展 / 其它库的 message 干扰
export const NAMESPACE = 'vue-tutorial-iframe-demo';

export const MSG = {
  CHILD_READY: 'IFRAME_CHILD_READY', // 子 -> 父：我加载好了，可以给我发数据
  PING: 'IFRAME_PING', // 父 -> 子：探测
  PONG: 'IFRAME_PONG', // 子 -> 父：探测回应
  SET_TITLE: 'IFRAME_SET_TITLE', // 父 -> 子：设置标题
  OPEN_DIALOG: 'IFRAME_OPEN_DIALOG', // 父 -> 子：打开弹框
  CLOSE_DIALOG: 'IFRAME_CLOSE_DIALOG', // 父 -> 子：关闭弹框
  SUBMIT: 'IFRAME_SUBMIT', // 子 -> 父：弹框表单提交
  CHILD_LOG: 'IFRAME_CHILD_LOG', // 子 -> 父：普通消息

  // 方案A：让 iframe 内的弹框在父页面里"真·全屏居中"所需的状态协商
  REQUEST_OPEN: 'IFRAME_REQUEST_OPEN', // 子 -> 父：我要开弹框，请把 iframe 铺满全屏
  ACK_OPEN: 'IFRAME_ACK_OPEN', // 父 -> 子：已铺满并锁定滚动，可以显示弹框了
  DIALOG_CLOSED: 'IFRAME_DIALOG_CLOSED' // 子 -> 父：弹框关闭动画已结束，可以收起 iframe
};

// 统一打包消息体，父子收发都走这个结构
export function buildMessage(type, payload) {
  return {
    namespace: NAMESPACE,
    type,
    payload,
    timestamp: Date.now(),
  };
}
