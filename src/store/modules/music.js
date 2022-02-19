import { getNewQqMusic } from "@/utils/api";

export default {
  namespaced: true,
  state: {
    str: "hello world",
    musicList: [],
    cacheMusicList: {}, // 测试缓存的musiclist
  },
  getters: {},
  mutations: {
    updateMusicList(state, payload) {
      state.musicList = payload;
    },
    // 根据条件更新缓存music，有则用，无则更新
    updateCacheMusicList(state, payload) {
      state.cacheMusicList[payload.k] = payload.v;
      state.cacheMusicList=JSON.parse(JSON.stringify(state.cacheMusicList))
    },
  },
  actions: {
    getQqMusicInterface(store, payload) {
      getNewQqMusic(payload).then((res) => {
        // console.log('res store',res)
        store.commit("updateMusicList", res.data.data.song.itemlist);
      });
    },
    // 测试缓存
    getCacheQqMusicInterface(store, params) {
      getNewQqMusic(params).then((res) => {
        // console.log("payload", payload, "rs", res);
        let payload = { k: params.key, v: res.data.data.song.itemlist };
        store.commit("updateCacheMusicList", payload);
      });
    },
  },
};
