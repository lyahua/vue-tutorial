<template>
  <div>
    <h1>test async await语法</h1>
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
import { testCnode, topicDetail, getNewQqMusic } from "@/utils/api";
export default {
  data() {
    return {
      musicList: [],
    };
  },
  created() {
    // testCnode().then(res=>{
    //     console.log('res',res)
    // })
    // this.init().then(res=>{
    //     console.log('res',res)
    // })
    // topicDetail().then(res=>{
    //     console.log('res',res)
    // })
    // this.init();

    // 数组重组
    const fn1 = (arrlist) => {
      arrlist.sort(() => Math.random() - 0.5);
      return arrlist;
    };
    let arr = [1, 2, 3, 4, 5];
    console.log(fn1(arr), "fn1(arr)");

    // async/await
    // 1.使用async关键字可以让函数具有异步特征，但总体上其代码仍然是同步求值的，
    // async function foo(){
    //   console.log(1)
    // }

    // foo();
    // console.log(2);
    // //1
    // //2
    // //////////////////
    // // 2.异步函数如果使用return 关键字返回了值(如果没有return会返回undefined)，这个值会被Promise.resolve()包装成一个期约对象。在这个函数外部可以得到它返回的期约
    // async function foo(){
    //   console.log(1)
    //   return 3;
    // }
    // // 给返回的期约添加一个解决处理程序
    // foo().then(console.log);
    // console.log(2);
    // // 1
    // // 2
    // // 3

    // // 直接返回一个期约对象也是一样的
    // async function foo(){
    //   console.log(1);
    //   return Promise.resolve(3)
    // }
    // // 给返回的期约添加一个解决处理程序
    // foo().then(console.log);
    // console.log(2);
    // // 1
    // // 2
    // // 3

    // // 3.使用await关键字之后的区别其实比看上去的还是微妙一些，比如下面的例子
    // async function foo(){
    //   console.log(await Promise.resolve('foo'))
    // }
    // async function bar(){
    //   console.log(await 'bar')
    // }
    // async function baz(){
    //   console.log('baz')
    // }
    // // baz 
    // // bar
    // // foo

    // // async/await中真正起作用的是await。async关键字，无论从哪个方面来看，都不过是一个标识符。毕竟，异步函数如果不包含await关键字，其执行的顺序和普通函数没有什么区别
    // async function foo(){
    //   console.log('2')
    // }
    // console.log('1')
    // foo();
    // console.log('3')
    // // 1
    // // 2
    // // 3
  },
  methods: {
    async init() {
      const res = await testCnode();
      const topicsLength = res.data.data.length;
      const res2 = await topicDetail({ key: topicsLength }); // 95
      const detailLength = res2.data.data.replies.length;
      console.log("detailLength", detailLength);
      console.log("topicsLength", topicsLength);
      //   return res;
    },

    async onSearch(val) {
      let str =
        "_=1645232392501&cv=4747474&ct=24&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=1&uin=1251271810&g_tk_new_20200303=2085573607&g_tk=2085573607&hostUin=0&is_xml=0&key=%E5%91%A8%E6%9D%B0";
      let params = {};
      str.split("&").map((ele) => {
        let arr = ele.split("=");
        params[arr[0]] = arr[1];
      });
      //   params.key = decodeURI(params.key);
      params.key = val;
      await getNewQqMusic(params).then((res) => {
        console.log("res", res);
        this.musicList = res.data.data.song.itemlist;
      });
    },
  },
};
</script>

<style lang="css" scoped>
.search-content {
  width: 200px;
  height: 400px;
  background: #ccc;
  /* float: left; */
}
</style>