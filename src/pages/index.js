// import TableData from '@/pages/test-code/table-data.vue'
import Home from "@/pages/test-code/home.vue";

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
];

export default routes;
