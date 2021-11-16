<template>
  <div>

  </div>
</template>

<script>
  export default {
    mounted(){
      const reg=/a.*b/
      console.log(reg.test('abcb'))
      /*
        * + ?的匹配属于贪婪模式：
        比如需要用 /a.*b/去匹配abcccccbcc的话，贪婪模式的意思就是会尽可能多的匹配，
        正则中的*是符合贪婪模式的
        
       */
      const res='abcccccbcc'.replace(/a.*b/,'Q')
      console.log('res',res) // Qcc

      /**
          常用正则：
          1.正整数正则：
          let posPattern=/^\d+$/
          2.负整数正则：
          let negPattern=/^-\d+$/
          3.整数正则：
          let intPattern=/^-?\d+$/

          可以是整数也可以是浮点数：
          正数正则：
          var posPattern=/^\d*\.?\d+$/
          负数正则：
          var negPattern=/^-\d.?\d+$/
          数字正则：
          var numPattern=/^-?\d\.?+$/      
       */
    }
  }
</script>

<style lang="css" scoped>

</style>