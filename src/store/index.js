import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import music from "./modules/music";
import routeGenertate from "./modules/route-genertate";

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    music,
    routeGenertate,
  },
});
