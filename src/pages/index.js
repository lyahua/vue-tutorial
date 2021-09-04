import TableData from '@/pages/test-code/table-data.vue'
import TreeTest from '@/pages/test-code/tree-test.vue'
import Search from '@/pages/test-code/search.vue'
import Test0831 from '@/pages/test-code/test0831.vue'
import Test0901 from '@/pages/test-code/test0901.vue'
import Test0902 from '@/pages/test-code/test0902.vue'

const routes = [
  {
    id: 10,
    text: '首页',
    icon:'el-icon-location',
    arr: [
      {
        id: 1001,
        meta: {
          title: '首页',
        },
        path: '/',
        component: TableData,
      },
    ],
  },
  {
    id: 11,
    text: '树测试',
    icon:'el-icon-location',
    arr: [
      {
        id: 1101,
        meta: {
          title: '树测试',
        },
        path: '/tree',
        component: TreeTest,
      },
      {
        id: 1102,
        meta: {
          title: '搜索测试',
        },
        path: '/search',
        component: Search,
      },
      {
        id:1103,
        meta:{
          title:'0831'
        },
        path:'/0831',
        component:Test0831
      },
      {
        id:1104,
        meta:{
          title:'0901',
        },
        path:'/0901',
        component:Test0901
      },
      {
        id:1105,
        meta:{
          title:'0902'
        },
        path:'/0902',
        component:Test0902
      }
    ],
  },
]

export default routes