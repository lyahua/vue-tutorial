<template>
  <div>
    <h1>Hello World</h1>
    <h2>当努力成为常态，生活便充满了希望</h2>
    <a-button type='primary' @click="goQqMusicPage">去qq音乐页面</a-button>
  </div>
</template>

<script>
import { fetchQqMusic } from '@/utils/api';
export default {
  mounted() {
    let str =
      'ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=69020128776265001&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=10&w=%E5%91%A8%E6%9D%B0&g_tk_new_20200303=5381&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0';

    let params = {};
    str.split('&').map(ele => {
      let arr = ele.split('=');
      params[arr[0]] = arr[1];
    });
    params.w='周杰伦'
    params.n='10'
    fetchQqMusic(params).then(res => {
      console.log('res,res',res);
    });
  },
  methods:{
    goQqMusicPage(){
      this.$router.history.push('/0219')
    }
  }
};
</script>

<style lang="css" scoped>
</style>