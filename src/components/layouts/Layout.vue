<template>
  <div class="layout">
    <Slider ></Slider>
    <Header></Header>
    <Content></Content> 
  </div>
</template>

<script>
import Slider from "./Slider.vue";
import Content from "./Content.vue";
import Header from "./Header.vue"

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