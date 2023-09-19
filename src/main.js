import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = false;

import router from "./router/index";
// console.log("roter",router)

// 组件
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
Vue.use(ElementUI);

import Antd from "ant-design-vue";
import "ant-design-vue/dist/antd.css";
Vue.use(Antd);

// 图片
import img from "@/utils/img.js";
Vue.prototype.$img = img;

// vuex
import store from "./store";

// Mock
import "@/mock/index.js";

import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'

Vue.use(VXETable)

new Vue({
  render: (h) => h(App),
  router,
  store,
}).$mount("#app");
