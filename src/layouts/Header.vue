<template>
  <div class="header">
    <div class="tag-container">
      <Tabs></Tabs>
    </div>
  </div>
</template>

<script>
import Tabs from './Tabs.vue';
export default {
  components: {
    Tabs,
  },
};
</script>

<style lang="css" scoped>
.header {
  position: absolute;
  top: 0;
  left: 150px;
  height: 60px;
  right: 0;
  background: #fff;
}
.tag {
  width: 60px;
  height: 35px;
  border: 1px solid red;
}
.tag-container {
  height: 100%;
  display: flex;

  align-items: flex-end;
}
.tag-container /deep/ .el-tabs__header {
  margin-bottom: 0;
}
</style>