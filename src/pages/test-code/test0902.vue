<template>
  <div>
    <div> JavaScript正则</div>
    1.match() <br/>
    match()与字符串一起使用以检查字符串和正则表达式之间的匹配，以正则表达式为参数<br/>
    语法：str.match(regex);<br/>
    返回值：<br/>
    1.如果正则表达式包含一个g标记，全局匹配，它将返回一个包含所有匹配项的数组，没捕获数组信息<br/>
    2.如果正则表达式没有g标记，它将返回一个包含第一个匹配项和其相关的捕获的数组<br/>
    3.如果根本没有匹配项，则返回null<br/>
    groups:一个命名捕获组的对象，其键是名称，值为捕获组，如果未定义命名捕获组，则为undefined<br/>

    2.test()<br/>
    test用于测试指定字符串和正则表达式是否匹配，接受一个字符串作为其参数，并根据是否匹配返回true或false;<br/>

  </div>
</template>

<script>
  export default {
    methods:{
      includesG(){
        const strTest="Hello China";
        const reg=/[A-Z]/g; // 大写字母正则表达式
        console.log(strTest.match(reg)); // ["H", "C"]
      },

      notIncludesG(){
        const strText='Hello China';
        const reg=/[A-Z]/;
        console.log(strText.match(reg)); // ["H", index: 0, input: "Hello China", groups: undefined]
      },

      testReg(){
        const str='hello china';
        const reg=/china/;
        console.log(reg.text(str))
      }
      
    },

    mounted(){
      this.includesG();

      this.notIncludesG();
    }
  }
</script>

<style lang="css" scoped>

</style>