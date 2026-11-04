// 引用计数版 body 滚动锁。
// 多个 iframe 弹框同时打开时，先关的那个不能把滚动解锁，
// 必须等最后一个释放才恢复，否则父页面会在还有弹框时可滚动。

let count = 0;
let savedOverflow = '';

export function lockBodyScroll() {
  if (count === 0) savedOverflow = document.body.style.overflow;
  count += 1;
  document.body.style.overflow = 'hidden';
}

export function unlockBodyScroll() {
  count -= 1;
  if (count <= 0) {
    count = 0;
    document.body.style.overflow = savedOverflow;
  }
}
