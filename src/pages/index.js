// import TableData from '@/pages/test-code/table-data.vue'
import Home from "@/pages/test-code/home.vue";

import RegTest1113 from '@/pages/reg-test/reg-test1113.vue'
import CssTest from '@/pages/reg-test/css-test.vue'
import Test1130 from '@/pages/reg-test/test1130.vue'
import Test1201 from '@/pages/reg-test/test1201.vue'
import Test1213 from '@/pages/reg-test/test1213.vue'

const routes = [
  {
    id: 10,
    text: "首页",
    icon: "el-icon-location",
    arr: [
      {
        id: 1001,
        meta: {
          title: "首页",
        },
        path: "/",
        component: Home,
      },
    ],
  },
  {
    id: 50,
    text: "正则",
    icon: "el-icon-location",
    arr: [
      {
        id: 5001,
        meta: {
          title: "正则匹配",
        },
        path: "/regTest1113",
        component: RegTest1113,
      },
      {
        id:5002,
        meta:{
          title:'样式'
        },
        path:'/css-test',
        component:CssTest,
      },{
        id:5003,
        meta:{
          title:'百度新闻'
        },
        path:'/test1130',
        component:Test1130,
      },{
        id:5004,
        meta:{
          title:'数组对象去重'
        },
        path:'/test1201',
        component:Test1201,
      },{
        id:5005,
        meta:{
          title:'数组对象求和'
        },
        path:'/test1213',
        component:Test1213,
      }
    ],
  }
];

export default routes;
