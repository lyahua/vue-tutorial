<template>
  <div class="layout">
    <Slider ></Slider>
    <Header></Header>
    <Content></Content> 
    <!-- <el-container>
      <SliderCopy />
      <el-main>
        <el-header>
          <TagCopy />
        </el-header>
        <el-main class="el-main-content">
          <router-view></router-view>
        </el-main>
      </el-main>
    </el-container> -->
  </div>
</template>

<script>
import Slider from "@/layouts/Slider.vue";
import Content from "@/layouts/Content.vue";
import Header from "@/layouts/Header.vue"

export default {
  components: {
    Slider,
    Content,
    Header

  },
};
</script>

<style lang="css" scoped>
.layout {
  height: 100%;
}
</style>