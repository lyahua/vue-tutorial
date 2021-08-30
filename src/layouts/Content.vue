<template>
  <div class="content">
    <!-- <el-tabs v-model="editableTabsValue" type="card" editable>
      <el-tab-pane :key="item.name" v-for="item in editableTabs" :label="item.title" :name="item.name">
        <router-view></router-view>
      </el-tab-pane>
    </el-tabs> -->
    <router-view name='default'></router-view>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // editableTabsValue: '1',
      // editableTabs: [
      //   {
      //     title: 'Tab 1',
      //     name: '1',
      //     content: 'Tab 1 content',
      //   },
      //   // {
      //   //   title: 'Tab 2',
      //   //   name: '2',
      //   //   content: 'Tab 2 content',
      //   // },
      // ],
      // tabIndex: 2,
    };
  },
  methods: {},
};
</script>

<style lang="css" scoped>
.content {
  position: absolute;
  left: 150px;
  right: 0;
  top:60px;
  bottom: 0;
  background: #eee;
  overflow: auto;
}
</style>