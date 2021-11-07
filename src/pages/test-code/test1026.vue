<template>
  <div>

  </div>
</template>

<script>
  export default {
    mounted(){
      setTimeout(()=>{console.log('1222')},1000)
      new Promise((resolve)=>{
        setTimeout(()=>{resolve('123')},1000)
      }).then((res)=>{console.log('res',res)})

      new Promise((resolve,reject)=>{
        console.log('resolve',resolve)
        setTimeout(()=>{reject('123')},1000)
      }).then((res)=>{console.log('res',res)})

      new Promise((resolve,reject)=>{
        console.log('resolve',resolve)
        setTimeout(()=>{reject('123')},1000)
      }).then((res)=>{console.log('res',res)}).catch((e)=>{console.log('e',e)})

      // let p1=()=>new Promise((res,rej)=>{setTimeout(() => {
      //   console.log('rej',rej)
      //   res('12345')
      // }, 2000);})
      // async function q1(){
      //   var res=await p1()
      //   console.log('res',res)
      // }
    }
  }
</script>

<style lang="css" scoped>

</style>