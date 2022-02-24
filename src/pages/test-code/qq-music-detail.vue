<template>
  <div>
    <div>mid:{{ midCache }}</div>
    <div>name:{{ nameCache }}</div>
    <div>{{ "singer:" + singerCache }}</div>

    <a-button type="primary" @click="goCompletePage">下一页</a-button>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";
export default {
  name: "QqMusicDetail",
  // created(){
  //     console.log('this.$route',this.$route)
  // },

  beforeRouteEnter(to, from, next) {
    if (from.name === "QqMusicComplete") {
      console.log("0-0-0-0-");
      to.meta.isBack = true;
    }
    next();
  },
  created() {
    console.log(" this.$route.meta.isBack", this.$route.meta.isBack);
    if (!this.$route.meta.isBack) {
      console.log("----");
      this.updateMid(this.mid);
      this.updateName(this.name);
      this.updateSinger(this.singer);
    }
    this.$route.meta.isBack = false; // 状态再进行重置
    // else {
    //   this.updateMid(this.mid);
    //   this.updateName(this.name);
    //   this.updateSinger(this.singer);
    // }
  },
  methods: {
    ...mapMutations("music", ["updateMid", "updateName", "updateSinger"]),
    goCompletePage() {
      this.$router.history.push({
        name: "QqMusicComplete",
        params: {
          name: this.name,
        },
      });
    },
  },
  computed: {
    ...mapState("music", ["midCache", "nameCache", "singerCache"]),
    mid() {
      return this.$route.params.mid;
    },
    name() {
      return this.$route.params.name;
    },
    singer() {
      return this.$route.params.singer;
    },
  },
};
</script>

<style lang="css" scoped>
</style>