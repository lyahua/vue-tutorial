// import TableData from '@/pages/test-code/table-data.vue'
import Home from "@/pages/test-code/home.vue";
import TreeTest from "@/pages/test-code/tree-test.vue";
import Search from "@/pages/test-code/search.vue";
import Test0831 from "@/pages/test-code/test0831.vue";
import Test0901 from "@/pages/test-code/test0901.vue";
import Test0902 from "@/pages/test-code/test0902.vue";
import Test0905 from "@/pages/test-code/test0905.vue";
import Test0914 from "@/pages/test-code/test0914.vue";

import Test0904 from "@/pages/git-operation/test0904.vue";
import Test0923 from "@/pages/test-code/test0923.vue";
import Test0925 from "@/pages/test-code/test0925.vue";
import Test1018 from "@/pages/test-code/test1018.vue";
import Test1026 from "@/pages/test-code/test1026.vue";
import Test1028 from "@/pages/test-code/test1028.vue";
import QqMusic from "@/pages/test-code/qq-music.vue";
import QqMusicDetail from "@/pages/test-code/qq-music-detail.vue";
import QqMusicComplete from "@/pages/test-code/qq-music-complete.vue";
import Test0226 from "@/pages/test-code/test0226.vue";

import Test1102 from "@/pages/test-code/test1102.vue"; // 多个数据字典转换
import Test1103 from "@/pages/test-code/test1103.vue"; // 对象循环键和值

import Prototype from "@/pages/es6-js/prototype.vue";
import Test0428 from "@/pages/test-code/test0428.vue";
import TestMock from "@/pages/test-code/test-mock.vue";
import Test0510 from "@/pages/test-code/test0510.vue";

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
        name: "Home",
      },
    ],
  },
  {
    id: 11,
    text: "树测试",
    icon: "el-icon-location",
    arr: [
      {
        id: 1101,
        meta: {
          title: "树测试",
        },
        path: "/tree",
        component: TreeTest,
      },
      {
        id: 1102,
        meta: {
          title: "搜索测试",
        },
        path: "/search",
        component: Search,
      },
      {
        id: 1103,
        meta: {
          title: "0831",
        },
        path: "/0831",
        component: Test0831,
      },
      {
        id: 1104,
        meta: {
          title: "0901",
        },
        path: "/0901",
        component: Test0901,
      },
      {
        id: 1105,
        meta: {
          title: "0902",
        },
        path: "/0902",
        component: Test0902,
      },
      {
        id: 1106,
        meta: {
          title: "0905",
        },
        path: "/0905",
        component: Test0905,
      },
      {
        id: 1107,
        meta: {
          title: "0914",
        },
        path: "/0914",
        component: Test0914,
      },
      {
        id: 1108,
        meta: {
          title: "0923",
        },
        path: "/0923",
        component: Test0923,
      },
      {
        id: 1109,
        meta: {
          title: "0925",
        },
        path: "/0925",
        component: Test0925,
      },
      {
        id: 1110,
        meta: {
          title: "1018",
        },
        path: "/1018",
        component: Test1018,
      },
      {
        id: 1111,
        meta: {
          title: "1026",
        },
        path: "/1026",
        component: Test1026,
      },
      {
        id: 1112,
        meta: {
          title: "1028",
        },
        path: "/1028",
        component: Test1028,
      },
      {
        id: 1113,
        meta: {
          title: "0219",
          isBack: false,
        },
        path: "/0219",
        component: QqMusic,
      },

      {
        id: 11132,
        meta: {
          title: "1102",
        },
        path: "/1102",
        component: Test1102,
      },
      {
        id: 1114,
        meta: {
          title: "1103",
        },
        path: "/1103",
        component: Test1103,
      },
      {
        id: 1115,
        meta: {
          title: "0222",
          isBack: false,
        },
        path: "/0222",
        component: QqMusicDetail,
        name: "QqMusicDetail",
        isNotNav: true,
      },
      {
        id: 1116,
        meta: {
          title: "0223",
          isBack: false,
        },
        path: "/0223",
        component: QqMusicComplete,
        name: "QqMusicComplete",
        isNotNav: true,
      },
      {
        id: 1117,
        meta: {
          title: "0226",
          isBack: false,
        },
        path: "/0226",
        component: Test0226,
        name: "Test0226",
      },
    ],
  },
  {
    id: 12,
    text: "git基本操作",
    icon: "el-icon-location",
    arr: [
      {
        id: 1201,
        meta: {
          title: "git操作",
        },
        path: "/test0904",
        component: Test0904,
      },
    ],
  },
  {
    id: 13,
    text: "es6",
    icon: "el-icon-location",
    arr: [
      {
        id: 1301,
        meta: {
          title: "prototype",
        },
        path: "/prototype",
        component: Prototype,
      },
      {
        id: 1302,
        meta: {
          title: "test0428",
        },
        path: "/test0428",
        component: Test0428,
      },
      {
        id: 1303,
        meta: {
          title: "testmock",
        },
        path: "/testmock",
        component: TestMock,
      },
      {
        id: 1304,
        meta: {
          title: "test0510",
        },
        path: "/test0510",
        component: Test0510,
      },
    ],
  },
];

export default routes;
