<template>
  <div></div>
</template>

<script>
export default {
  created() {
    this.testArrayNum();
  },
  methods: {
    testString() {
      /* 
        substring() 方法返回一个字符串在开始索引到结束索引之间的一个子集，或从开始索引直到字符串的末尾的一个子集。
        str.substring(indexStart[,indexEnd])

        substring 提取从indexStart到indexEnd（不包括）之间的字符。特别地：
        如果indexStart等于indexEnd,substring返回一个空字符串。
        如果省略indexEnd,substring提取字符一直到字符串末尾
        如果任一参数小于0或为NaN，则被当作0
        如果任一参数大于stringName.length，则被当作stringName.length。
        如果indexStart大于indexEnd，则substring的执行效果就像两个参数调换了一样
        */
      /* 
       reduce(function(previousValue,currentValue,currentIndex,array){},initalValue)
       参数详解：
       previousValue:上一次调用callbackFn时的返回值。在第一次调用时，若指定了初始值initialValue,其值为initialValue,否则为数组索引为0的元素array[0]
       currentValue:数组中正在处理的元素，在第一次调用时，若指定了初始值initialValue，其值为数组索引为0的元素array[0]，否则为array[1]
       currentIndex:数组中正在处理的元素的索引。若指定了初始值initaialValue，则起始索引号为0，否则从索引1开始
       array:用于遍历的数组
       initialValue:作为第一次调用callback函数时参数previousValue的值。若指定了初始值initialValue,则currentValue则将使用数组第一个元素;否则previousValue将使用数组第一个元素，而currentValue将使用数组第二个元素
       
       */
    },
    testArrayNum() {
      const arrObject = [
        { a: 1, b: 2, c: 3 },
        { a: 2, b: 2, c: 3 },
        { a: 3, b: 3, c: 3 },
      ];
      let res = arrObject.reduce(
        (pre, cur) => {
          Object.keys(pre).forEach((ele) => {
            pre[ele] = pre[ele] + cur[ele];
          });
          return pre;
        },
        { a: 0, b: 0, c: 0 }
      );
      console.log("re", res);
    },
  },
};
</script>

<style lang="css" scoped>
</style>