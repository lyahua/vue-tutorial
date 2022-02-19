<template>
  <div>
    <div class="search-content">
      <a-input-search
        placeholder="input search text"
        enter-button
        @search="onSearch"
      />
      <div v-for="item in musicList" :key="item.docid">
        <span>{{ item.name }}</span>
        <span>=====</span>
        <span>{{ item.singer }}</span>
      </div>
    </div>
  </div>
</template>

<script>
// import { getNewQqMusic, getKgMusic } from "@/utils/api";
import { mapActions, mapState } from "vuex";
export default {
  name: "MusicList",
  data() {
    return {
      //   musicList: [],
    };
  },
  created() {
    // let kgstr =
    //   "callback=callback123&keyword=%E7%8E%8B&page=1&pagesize=30&bitrate=0&isfuzzy=0&tag=em&inputtype=0&platform=WebFilter&userid=0&clientver=2000&iscorrection=1&privilege_filter=0&token=&srcappid=2919&clienttime=1645233911726&mid=1645233911726&uuid=1645233911726&dfid=-&signature=51E9A39538A5C1D5F01E073EFC3FA575";

    // let params2 = {};
    // kgstr.split("&").map((ele) => {
    //   let arr = ele.split("=");
    //   params2[arr[0]] = arr[1];
    // });
    // params2.keyword = decodeURI(params2.keyword);
    // getKgMusic(params2).then((res) => {
    //   console.log("res酷狗", res);
    // });
    console.log("this.$stroe", this.$store);
  },
  methods: {
    ...mapActions("music", ["getQqMusicInterface"]), // 接口
    onSearch(val) {
      let str =
        "_=1645232392501&cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=1&uin=1251271810&g_tk_new_20200303=2085573607&g_tk=2085573607&hostUin=0&is_xml=0&key=%E5%91%A8%E6%9D%B0";
      let params = {};
      str.split("&").map((ele) => {
        let arr = ele.split("=");
        params[arr[0]] = arr[1];
      });
      //   params.key = decodeURI(params.key);
      params.key = val;
      //   getNewQqMusic(params).then((res) => {
      //     console.log("res", res);
      //     this.musicList = res.data.data.song.itemlist;
      //   });
      this.getQqMusicInterface(params);
    },
  },
  computed: {
    ...mapState("music", ["musicList"]),
  },
};
</script>

<style lang="css" scoped>
.search-content {
  width: 200px;
}
</style>