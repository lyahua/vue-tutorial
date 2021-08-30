/*
 2 * 路由对象模块
 3 * */
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

import arr from '../pages/index'
let routes=[];
arr.map(ele=>{
  routes=[...routes,...ele.arr]
})

export default new VueRouter({
  routes: [
    ...routes,
    { path: '/*', redirect: '/' },
  ],
})
