// 子页面脱框架所需的全局样式。
// mixin 无法携带 <style>（<style> 是 SFC 编译期产物，不是运行时选项），
// 所以由模块加载时注入一次。所有规则都挂在 html 的类下，
// 类不加就等于不存在，因此可以全局常驻，不会影响其它页面。

const STYLE_ID = 'iframe-embed-styles';

const CSS = `
html.iframe-embed,
html.iframe-embed body {
  background: transparent !important;
  overflow: hidden;
}

/*
  脱框架：等效于父页面往子文档注入样式，但由页面自己完成，
  所以跨域场景同样生效（同源策略只限制父页面读子文档）。
*/
html.embed-bare .slider,
html.embed-bare .header {
  display: none !important;
}
html.embed-bare .content {
  left: 0 !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}
html.embed-bare .layout,
html.embed-bare .content,
html.embed-bare #app {
  background: transparent !important;
}
`;

export function ensureEmbedStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}
