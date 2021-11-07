<template>
  <div>

  </div>
</template>

<script>
  export default {
    mounted(){
      let codeItem=[
        {id:1,code:'a',value:'大'},
        {id:1,code:'b',value:'道'},
        {id:1,code:'c',value:'至'},
        {id:1,code:'d',value:'简'},
      ]
      let str='a,b,c,d';
      let arr=str.split(',');
      let newStr=''
      arr.forEach((ele,idx)=>{
        newStr=newStr+codeItem.find((x)=>x.code===ele)?.value
        if(idx<arr.length-1){
          newStr=newStr+', '
        }
      })
    console.log('newStr',newStr)
    }
  }
</script>

<style lang="css" scoped>

</style>