<template>
  <div>
    <h1 class="title"></h1>
  </div>
</template>

<script>
export default {
  mounted() {
    this.$nextTick(() => {
      let res = document.getElementsByClassName('title')[0];
      console.log('res', res);
      res.innerHTML = '数组对象求和';
    });

    // let list = [
    //   { stove1: '12', stove2: '13', stove3: '14' },
    //   { stove1: '12', stove2: '13', stove3: '14' },
    //   { stove1: '12', stove2: '13', stove3: '14' },
    // ];
    // let resStove1 = list.reduce((pre, current) => {
    //   return pre + Number(current.stove1);
    // }, 0);
    // console.log('resStove1',resStove1)
    let arr=[1,2,3,4,5]
    arr.reduce((pre,ele,index)=>{
      console.log('pre',pre,'ele',ele,'index',index)
    },0)
  },
};
</script>

<style lang="css" scoped>
</style>