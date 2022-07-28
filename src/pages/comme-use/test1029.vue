<template>
  <div></div>
</template>

<script>
export default {
  mounted() {
    let a=10;
    let b=20;
    [a,b]=[b,a];
    console.log('a',a,'b',b)
    function fn() {
      let arr=[1,2,6,5,9,7];
      for(let i=0;i<arr.length;i++){
          for(let j=i+1;j<arr.length;j++){
              if(arr[i]<arr[j]){
                  [arr[i],arr[j]]=[arr[j],arr[i]]
              }
          }
      }
      console.log('arr',arr)
    }
    fn();
  },
};
</script>

<style lang="css" scoped>
</style>