// import TableData from '@/pages/test-code/table-data.vue'
import Home from "@/pages/test-code/home.vue";

import RegTest1113 from '@/pages/reg-test/reg-test1113.vue'

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
    id: 20,
    text: "正则",
    icon: "el-icon-location",
    arr: [
      {
        id: 2001,
        meta: {
          title: "正则匹配",
        },
        path: "/regTest1113",
        component: RegTest1113,
      },
    ],
  }
];

export default routes;
