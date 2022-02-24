<template>
  <div class="music-page">
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
    <div class="cache-content">
      <div class="title-content">
        <div
          v-for="item in songerName"
          :key="item.id"
          class="songer-name"
          @click="searchSong(item.name)"
        >
          {{ item.name }}
        </div>
      </div>
      <div class="content">
        <div
          v-for="item in cacheMusicList[activeName]"
          :key="item.id"
          @click="goMusicDetail(item.name, item.singer, item.mid)"
        >
          <span>{{ item.name }}</span>
          <span>===</span>
          <span>{{ item.singer }}</span>
          <span>===</span>
          <span>{{ item.mid }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { message } from "ant-design-vue";
// import { getNewQqMusic, getKgMusic } from "@/utils/api";
import { mapActions, mapMutations, mapState } from "vuex";
export default {
  name: "MusicList",
  data() {
    return {
      //   musicList: [],
      songerName: [
        { id: 1, name: "王菲" },
        { id: 2, name: "王力宏" },
        { id: 3, name: "小猫" },
        { id: 4, name: "王狗" },
      ],
      // activeName: "",
    };
  },
  // 如果是从音乐详情页面过来的话，就把目标页面的isBack改为true
  beforeRouteEnter(to, from, next) {
    if (from.name === "QqMusicDetail") {
      to.meta.isBack = true;
    }
    next();
  },
  created() {
    console.log("this.$stroe", this.$store);
    // 取反可以判断出页面是否需要缓存
    if (!this.$route.meta.isBack) {
      // 清空缓存的数据
      this.updateActiveName(null);
      this.updateCacheMusicList(null);
    }
    this.$route.meta.isBack = false; // 状态再进行重置
  },
  methods: {
    ...mapActions("music", ["getQqMusicInterface", "getCacheQqMusicInterface"]), // 接口
    ...mapMutations("music", ["updateActiveName", "updateCacheMusicList"]),
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
      if (params.key?.trim()) {
        this.getQqMusicInterface(params);
      } else {
        message.warning("请输入要搜索的文字");
      }
    },
    // 点击名字搜索音乐
    searchSong(name) {
      //   console.log("name", name);
      let str =
        "_=1645232392501&cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=1&uin=1251271810&g_tk_new_20200303=2085573607&g_tk=2085573607&hostUin=0&is_xml=0&key=%E5%91%A8%E6%9D%B0";
      let params = {};
      str.split("&").map((ele) => {
        let arr = ele.split("=");
        params[arr[0]] = arr[1];
      });
      params.key = name;
      // this.activeName = name;
      this.updateActiveName(name);
      // console.log("params", params);
      let lst = this.cacheMusicList[name];
      if (!(lst && lst.length > 0)) {
        this.getCacheQqMusicInterface(params);
      }
    },
    goMusicDetail(name, singer, mid) {
      console.log("name", name, "singer", singer, "mid", mid);
      this.$router.history.push({
        name: "QqMusicDetail",
        params: {
          name,
          singer,
          mid,
        },
      });
    },
  },
  computed: {
    ...mapState("music", ["musicList", "cacheMusicList", "activeName"]),
  },
};
</script>

<style lang="css" scoped>
.music-page {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: #fff;
  display: flex;
}
.search-content {
  width: 200px;
  height: 400px;
  background: #ccc;
  /* float: left; */
}
.cache-content {
  width: 400px;
  height: 400px;
  background: red;
  display: flex;
}
.title-content {
  width: 60px;
  height: 400px;
  background: greenyellow;
}
.content {
  width: 340px;
  height: 400px;
  background: #ccc;
}
.songer-name {
  line-height: 42px;
  background: orange;
  text-align-last: justify;
}
.songer-name:nth-child(2n) {
  background: goldenrod;
}
</style>