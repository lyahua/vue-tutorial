<template>
  <div></div>
</template>

<script>
export default {
  mounted() {
    let obj = { name: 'lihua', age: 12, hobby: 'English' };
    Object.keys(obj).forEach((ele)=>{
      console.log('obj',ele,obj[ele])
    })
  },
};
</script>

<style lang="css" scoped>
</style>