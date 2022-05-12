<template>
  <div>
    mock测试
    <div @click="btnClick" class="btn">这是测试</div>
    <h1>{{ num }}</h1>

    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <text x="0" y="15" fill="red">I love SVG</text>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <text x="0" y="15" fill="red" transform="rotate(30 20,40)">
        I love SVG
      </text>
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <circle
        cx="100"
        cy="50"
        r="40"
        stroke="black"
        stroke-width="2"
        fill="red"
      />
    </svg>

    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <ellipse
        cx="300"
        cy="80"
        rx="100"
        ry="50"
        style="fill: yellow; stroke: purple; stroke-width: 2"
      />
    </svg>

    <svg height="210" width="500">
      <polygon
        points="200,10 250,190 160,210"
        style="fill: lime; stroke: purple; stroke-width: 1"
      />
    </svg>

    <!--  -->
    <svg height="210" width="500">
      <polygon
        points="100,10 40,198 190,78 10,78 160,198"
        style="fill: lime; stroke: purple; stroke-width: 5; fill-rule: nonzero"
      />
    </svg>

    <svg height="210" width="500">
      <polygon
        points="100,10 40,198 190,78 10,78 160,198"
        style="fill: lime; stroke: purple; stroke-width: 5; fill-rule: evenodd"
      />
    </svg>

    <!-- 矩形 <rect>
    圆形 <circle>
    椭圆 <ellipse>
    线 <line>
    折线 <polyline>
    多边形 <polygon>
    路径 <path> -->
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      num: "2",
    };
  },
  created() {
    // this.fn1().then(res=>{
    //   console.log('res',res)
    // })

    // let promise=new Promise((resolve)=>{
    //   console.log('first Promise')
    //   resolve()
    // })
    // promise.then(()=>{
    //   console.log('reovled')
    // })
    // console.log('hi')

    this.getJSON("/posts.json").then(
      function (json) {
        console.log("Contents: " + json);
      },
      function (error) {
        console.error("出错了", error);
      }
    );
  },
  methods: {
    async btnClick() {
      const res = await axios.get("/user/list");
      console.log(res.data.data);
    },
    fn1() {
      return new Promise((resolve) => {
        resolve(100);
      });
    },
    getJSON(url) {
      const promise = new Promise((resolve, reject) => {
        const handler = function () {
          if (this.readyState !== 4) {
            return;
          }
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error(this.statusText));
          }
        };
        const client = new XMLHttpRequest();
        client.open("GET", url);
        client.onreadystatechange = handler;
        client.responseType = "json";
        client.setRequestHeader("Accept", "application/json");
        client.send();
      });
      return promise;
    },
  },
};
</script>

<style lang="css" scoped>
</style>