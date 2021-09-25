// import TableData from '@/pages/test-code/table-data.vue'
import Home from '@/pages/test-code/home.vue'
import TreeTest from '@/pages/test-code/tree-test.vue'
import Search from '@/pages/test-code/search.vue'
import Test0831 from '@/pages/test-code/test0831.vue'
import Test0901 from '@/pages/test-code/test0901.vue'
import Test0902 from '@/pages/test-code/test0902.vue'
import Test0905 from '@/pages/test-code/test0905.vue'
import Test0914 from '@/pages/test-code/test0914.vue'

import Test0904 from '@/pages/git-operation/test0904.vue'
import Test0923 from '@/pages/test-code/test0923.vue'

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
        component: Home,
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
      },
      {
        id:1106,
        meta:{
          title:'0905'
        },
        path:'/0905',
        component:Test0905
      },
      {
        id:1107,
        meta:{
          title:'0914'
        },
        path:'/0914',
        component:Test0914
      },{
        id:1108,
        meta:{
          title:'0923'
        },
        path:'/0923',
        component:Test0923
      }
    ],
  },
  {
    id:12,
    text:'git基本操作',
    icon:'el-icon-location',
    arr:[
      {
        id: 1201,
        meta: {
          title: 'git操作',
        },
        path: '/test0904',
        component: Test0904,
      },
    ]
  }
]

export default routes