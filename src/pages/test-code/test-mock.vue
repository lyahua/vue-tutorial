<template>
  <div>
    mock测试
    <div @click="btnClick" class="btn">这是测试</div>
    <h1>{{num}}</h1>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data(){
    return{
      num:'2'
    }
  },
  methods: {
    async btnClick() {
      const res = await axios.get("/user/list");
      console.log(res.data.data);
    },
  },
};
</script>

<style lang="css" scoped>
</style>