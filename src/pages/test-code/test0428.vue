<template>
  <div></div>
</template>

<script>
import { fetchQqMusic, testCnode } from "@/utils/api";
export default {
  created() {
    // testCnode().then((res) => {
    //   console.log("res2", res);
    // });

    // let str =
    //   "ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=69020128776265001&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=10&w=%E5%91%A8%E6%9D%B0&g_tk_new_20200303=5381&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0";

    // let params = {};
    // str.split("&").map((ele) => {
    //   let arr = ele.split("=");
    //   params[arr[0]] = arr[1];
    // });
    // params.w = "周杰伦";
    // params.n = "10";
    // fetchQqMusic(params).then((res) => {
    //   console.log("res,res", res);
    // });
    // this.init();

    /* 
        逻辑或 ||
        值1   值2   结果
        true  true  true
        true  false true
        false true  true
        false false false

        规则:如果第一个操作数是对象，则返回第一个操作数
            :如果第一个操作数是false，则返回第二个操作数
            :如果两个操作数都是对象，则返回第一个操作数
            :如果两个数都是null，则返回null
            :如果两个数都是NaN,则返回NaN
            :如果两个数都是undefined,则返回undefined

        逻辑或的短路特性:如果第一个操作数的true的话，第二个操作数就不会再进行求值了
        例：
        let a=true;
        let result=(a||b);
        console.log('result',result);

        如果把a改成false，则会报错，因为b没有定义

        逻辑或的这种特性经常用于赋值上，这样可以避免值出现null或undefined的情况
    */
  },
  methods: {
    async init() {
      await testCnode().then((res) => {
        console.log("res2", res);
      });

      let str =
        "ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=69020128776265001&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=10&w=%E5%91%A8%E6%9D%B0&g_tk_new_20200303=5381&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0";

      let params = {};
      str.split("&").map((ele) => {
        let arr = ele.split("=");
        params[arr[0]] = arr[1];
      });
      params.w = "周杰伦";
      params.n = "10";
      fetchQqMusic(params).then((res) => {
        console.log("res,res", res);
      });
    },
  },
};
</script>

<style lang="css" scoped>
</style>