import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

import router from "./router/index";
// console.log("roter",router)

import './utils/styles/common.css'

// 组件
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
Vue.use(ElementUI);

import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
Vue.use(Antd);

// un- 前缀组件别名：un-xxx = el-xxx（真实项目即对 el-button 等的封装）
Vue.component('un-button', ElementUI.Button)
Vue.component('un-input', ElementUI.Input)
Vue.component('un-select', ElementUI.Select)

// 图片
import img from "@/utils/img.js";
Vue.prototype.$img = img;

// vuex
import store from "./store";

// Mock
import "@/mock/index.js";

import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

import BaseSelect from '@/components/y-ui-v2/base-components/b-select/index.vue'

Vue.component('base-select',BaseSelect)

Vue.use(VXETable)

new Vue({
  render: (h) => h(App),
  router,
  store,
}).$mount("#app");
