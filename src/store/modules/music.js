import { getNewQqMusic } from "@/utils/api";

export default {
  namespaced: true,
  state: {
    str: "hello world",
    musicList: [],
    cacheMusicList: {}, // 测试缓存的musiclist
    activeName: "", // 当前选中的歌手名字
    midCache: "", // music-detail
    nameCache: "", // music-name,
    singerCache: "", // music-singer
  },
  getters: {},
  mutations: {
    updateMusicList(state, payload) {
      state.musicList = payload;
    },
    // 根据条件更新缓存music，有则用，无则更新
    updateCacheMusicList(state, payload) {
      if (payload !== null) {
        state.cacheMusicList[payload?.k] = payload?.v;
        state.cacheMusicList = JSON.parse(JSON.stringify(state.cacheMusicList));
      } else {
        state.cacheMusicList = {};
      }
    },
    // 更新当前选中的name
    updateActiveName(state, payload) {
      state.activeName = payload;
    },
    // 更新mid
    updateMid(state, payload) {
      if (payload !== null) {
        state.midCache = payload;
      } else {
        state.midCache = null;
      }
    },
    // 更新name
    updateName(state, payload) {
      if (payload !== null) {
        state.nameCache = payload;
      } else {
        state.nameCache = null;
      }
    },
    // 更新singer
    updateSinger(state, payload) {
      if (payload !== null) {
        state.singerCache = payload;
      } else {
        state.singerCache = null;
      }
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
