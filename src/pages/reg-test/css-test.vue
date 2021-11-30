<template>
  <div>
    <ul>
      <li>大道至简</li>
      <li>菩提</li>
      <li>只可意会</li>
      <li>不可言</li>
    </ul>

    <div class="box"></div>
  </div>
</template>

<script>
export default {
  mounted() {
    const array = [1, 2, 3, 4, 5, 6];
    array.sort(function () {
      return Math.random() - 0.5;
    });
    console.log('array', array);

    // function isNum(n) {
    //   return !isNaN(parseInt(n)) && isFinite(n);
    // }

    function isStr(value) {
      return typeof value === 'string';
    }

    console.log(isStr(3));

    function isNull(value) {
      return value === null || value === undefined;
    }
    console.log(isNull(123));

    // map() 方法对数组每一项运行给定函数，返回每次函数调用的结果组成的数组
    let users = [
      { name: 't1', email: 't1@163.com' },
      { name: 't2', email: 't2@163.com' },
      { name: 't3', email: 't3@163.com' },
    ];
    let userRes = users.map(ele => {
      return ele.email;
    });
    console.log('userRes', userRes);
  },
};
</script>

<style lang="css" scoped>
ul {
  float: left;
}
ul li {
  width: 80px;
  height: 30px;
  list-style-type: none;
  background: orange;
  line-height: 30px;
  margin: 5px 0;
  padding: 0 10px;
  box-sizing: border-box;
  text-align-last: justify;
}

/* .box{
  width:200px;
  height:200px;
  background: orange;
  resize: both;
  
} */
</style>