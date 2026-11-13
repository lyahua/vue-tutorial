/**
 * un- 前缀组件层（见 开发文档.md 6.2）
 *
 * 用法：页面入口模块 `import Vue from 'vue'; import UnUI from './components/un'; Vue.use(UnUI);`
 * 之后业务模板统一写 <un-button> / <un-breadcrumb> 等。
 *
 * 与 main.js 的关系：main.js 已全局注册 un-button / un-input / un-select
 * （直接指向 element-ui 组件）。本插件注册封装版时跳过同名组件，
 * 避免路由懒加载 chunk 覆盖全局注册行为；
 * 已有的三个直接别名与封装版对外行为一致（$attrs/$listeners 透传），可共存。
 *
 * 扩展新组件：拷一份同构的 Un*.vue（改 name 和内部 el- 标签），
 * 加进下面 wrappers 数组即可。
 *
 * ⚠️ 透传边界：本模式只转发普通插槽（$slots）。像 el-table-column 这类
 * 依赖 scoped slot 的组件，需要额外转发 $scopedSlots（模板里
 * `<template v-for="(_, name) in $scopedSlots" :slot="name" slot-scope="scope">`），
 * 等真正用到 un-table 时再按需实现。
 */
import UnButton from './UnButton.vue';
import UnBreadcrumb from './UnBreadcrumb.vue';
import UnBreadcrumbItem from './UnBreadcrumbItem.vue';
import UnTooltip from './UnTooltip.vue';
import UnTag from './UnTag.vue';
import UnDialog from './UnDialog.vue';
import UnOption from './UnOption.vue';

const wrappers = [UnButton, UnBreadcrumb, UnBreadcrumbItem, UnTooltip, UnTag, UnDialog, UnOption];

export default {
    install(Vue) {
        wrappers.forEach(c => {
            if (Vue.options.components[c.name]) return; // 已注册（如 main.js 的直接别名）则跳过
            Vue.component(c.name, c);
        });
    },
};
