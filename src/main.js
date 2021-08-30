import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

import router from "./router/index"
// console.log("roter",router)


import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
Vue.use(Antd);

import img from '@/utils/img.js'
Vue.prototype.$img=img

import store from './store';

new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app')
