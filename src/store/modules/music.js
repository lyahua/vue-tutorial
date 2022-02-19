import { getNewQqMusic } from "@/utils/api";

export default {
  namespaced: true,
  state: {
    str: "hello world",
    musicList: [],
  },
  getters: {},
  mutations: {
    updateMusicList(state, payload) {
      state.musicList = payload;
    },
  },
  actions: {
    getQqMusicInterface(store, payload) {
      getNewQqMusic(payload).then((res) => {
        // console.log('res store',res)
        store.commit("updateMusicList", res.data.data.song.itemlist);
      });
    },
  },
};
