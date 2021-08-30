import TableData from '@/pages/table-data.vue'
import TreeTest from '@/pages/tree-test.vue'
import Search from '@/pages/search.vue'

 const routes=[
  {
    id: 10,
    text: '首页',
    arr: [
      {
        id:1001,
        meta: {
          title: '首页2',
        },
        path: '/',
        component: TableData,
      },
    ],
  },
  {
    id:11,
    text: '树测试',
    arr: [
      {
        id:1101,
        meta: {
          title: '树测试2',
        },
        path: '/tree',
        component: TreeTest,
      },
    ],
  },
  {
    id:12,
    text: '搜索测试',
    arr: [
      {
        id:1201,
        meta: {
          title: '搜索测试2',
        },
        path: '/search',
        component: Search,
      },
    ],
  },
]

export default routes