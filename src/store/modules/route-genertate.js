// 路由生成tab的状态管理
export default {
  namespaced: true,
  state: {
    tagRoute: [{ path: "/", title: "首页" }],
  },
  mutations: {
    // 生成路由，判断数组里面是否有， 没有的话就直接插入
    addRoutesToTab(state, payload) {
      let flag = true;
      for (let i = 0; i < state.tagRoute.length; i++) {
        if (state.tagRoute[i].path === payload.path) {
          flag = false;
          break;
        }
      }
      if (flag) state.tagRoute.push(payload);
    },

    // 关闭标签
    removeRoutesInTab(state, payload) {
      state.tagRoute = state.tagRoute.filter((ele) => {
        return ele.path != payload;
      });
    },
  },
};
