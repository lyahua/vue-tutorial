import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)



export default new Vuex.Store({
  state: {
    tagRoute: [{path:'/',title:'首页'}],
  },
  getters: {

  },
  mutations: {
    // 生成路由，判断数组里面是否有， 没有的话就直接插入
    addRoutesToTab(state, payload) {
      // console.log('state',state);
      // console.log('payload',payload);
      // console.log('this.state.tagRoute',this.state.tagRoute)
      let flag = true;
      for (let i = 0; i < state.tagRoute.length; i++) {
        if (state.tagRoute[i].path === payload.path) {
          flag = false
          break
        }
      }
      if (flag) state.tagRoute.push(payload);
    },

    // 关闭标签
    removeRoutesInTab(state,payload){
      state.tagRoute=state.tagRoute.filter(ele=>{
        return ele.path!=payload
      })
    }
  },
  actions: {}
})