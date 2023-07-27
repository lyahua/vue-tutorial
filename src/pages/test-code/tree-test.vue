<template>
  <div>
    <!-- <a-input-search
      style="margin-bottom: 8px;"
      placeholder="Search"
      @change="onChange"
    /> -->
    <a-tree :tree-data="gData">
      <!-- <template slot="title" slot-scope="{ title }">
        <span v-if="title.indexOf(searchValue) > -1">
          {{ title.substr(0, title.indexOf(searchValue)) }}
          <span style="color: #f50;">{{ searchValue }}</span>
          {{ title.substr(title.indexOf(searchValue) + searchValue.length) }}
        </span>
        <span v-else>{{ title }}</span>
      </template> -->
    </a-tree>
  </div>
</template>

<script>
const x = 2 // 树最外层父节点个数
const y = 1 // 有子节点的父节点个数
const z = 0; // 树的深度
const gData = []

const generateData = (_level, _preKey, _tns) => {
  // debugger
  const preKey = _preKey || '0'
  const tns = _tns || gData
  const children = []
  for (let i = 0; i < x; i++) {
    const key = `${preKey}-${i}`
    tns.push({ title: key, key, scopedSlots: { title: 'title' } })
    if (i < y) {
      children.push(key)
    }
  }
  // console.log('tns',tns)
  // if (_level < 0) {
  //   return tns
  // }
  // const level = _level - 1
  // children.forEach((key, index) => {
  //   tns[index].children = []
  //   return generateData(level, key, tns[index].children)
  // })
}
generateData(z)
// console.log("res树",res)

// const dataList = []
// const generateList = (data) => {
//   for (let i = 0; i < data.length; i++) {
//     const node = data[i]
//     const key = node.key
//     dataList.push({ key, title: key })
//     if (node.children) {
//       generateList(node.children)
//     }
//   }
// }
// generateList(gData)
// // console.log("res2",res2)
// // console.log("dataList",dataList)

// const getParentKey = (key, tree) => {
//   let parentKey
//   for (let i = 0; i < tree.length; i++) {
//     const node = tree[i]
//     if (node.children) {
//       if (node.children.some((item) => item.key === key)) {
//         parentKey = node.key
//       } else if (getParentKey(key, node.children)) {
//         parentKey = getParentKey(key, node.children)
//       }
//     }
//   }
//   return parentKey
// }


export default {
  data() {
    return {
      expandedKeys: [],
      searchValue: '',
      autoExpandParent: true,
      gData,
    }
  },
  created() {
    const treeData = [];
    let children = [];
    for (let i = 0; i < 3; i++) {
      const key = `0-${i}`;
      treeData.push({ title: key, key })
      if (i < 2) {
        children.push(key)
      }
    }
    console.log('treedata', treeData, children)
  },
  methods: {
    initTree(deep, node0) {
      const treeData = [];
      let children = [];
      let preKey = '0' || node0;

      for (let i = 0; i < 3; i++) {
        const key = `${preKey}-${i}`;
        treeData.push({ title: key, key })
        if (i < 2) {
          children.push(key)
        }
      }

      if (deep < 0) {
        return treeData
      }

      const _deep = deep - 1;
      children.forEach((e) => {
        treeData.children = [];
        return this.initTree(_deep, e)
      })
    },
    onExpand(expandedKeys) {
      this.expandedKeys = expandedKeys
      this.autoExpandParent = false
    },
    // onChange(e) {
    //   const value = e.target.value
    //   const expandedKeys = dataList
    //     .map((item) => {
    //       if (item.title.indexOf(value) > -1) {
    //         return getParentKey(item.key, gData)
    //       }
    //       return null
    //     })
    //     .filter((item, i, self) => item && self.indexOf(item) === i)
    //   Object.assign(this, {
    //     expandedKeys,
    //     searchValue: value,
    //     autoExpandParent: true,
    //   })
    // },
  },
}
</script>

<style lang="css" scoped></style>

