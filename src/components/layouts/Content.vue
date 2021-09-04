<template>
  <div class="content">
    <router-view name="default"></router-view>
  </div>
</template>

<script>
export default {};
</script>

<style lang="css" scoped>
.content {
  position: absolute;
  left: 150px;
  right: 0;
  top: 42px;
  bottom: 0;
  background: #eee;
  overflow: auto;
}
</style>