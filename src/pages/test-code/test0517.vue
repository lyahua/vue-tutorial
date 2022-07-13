<template>
  <div></div>
</template>

<script>
export default {
  created() {
    const arr = [
      [2, 3],
      [4, 5],
      [6, 7],
    ];
    let res = arr.reduce((pre, cur) => {
      return pre.concat(cur);
    }, []);
    console.log("res", res);

    const arr2 = [
      { name: "1", age: "1", children: [{ name: "1.1", age: "1.1" }] },
      { name: "2", age: "2" },
    ];
    function fn3(item) {
      const newarr = [];
      function fn2(list) {
        list.forEach((ele) => {
          if (ele.children) {
            fn2(ele.children);
          }
          newarr.push({ name: ele.name, age: ele.age });
        });
        return newarr;
      }
      return fn2(item);
    }

    console.log("res2", fn3(arr2));

    const arr3 = ["apple", "brannar", "apple", "pear"];
    let res3 = arr3.reduce((pre, cur) => {
      if (cur in pre) {
        pre[cur]++;
      } else {
        pre[cur] = 1;
      }
      return obj;
    }, {});
    console.log("res3", res3);

    const arr4 = [
      [2, 3],
      [4, 5],
      [6, 7, [7, 8]],
    ];
    function fn1(list) {
      return list.reduce((pre, cur) => {
        return pre.concat(cur instanceof Array ? fn1(cur) : cur);
      }, []);
    }
    console.log(fn1(arr4));

    function flatten(arr) {
      return arr.reduce((res, next) => {
        return res.concat(Array.isArray(next) ? flatten(next) : next);
      }, []);
    }
  },
};
</script>

<style lang="css" scoped></style>
