<script>
export default {
  methods: {
    testArr() {
      const arr = [
        {
          width: '160',
          thick: '160',
        },
        {
          width: '150',
          thick: '160',
        },
        {
          width: '158',
          thick: '160',
        },
        {
          width: '160',
          thick: '160',
        },
      ];
      let res = arr.map(ele => {
        return { s: ele.width + '*' + ele.thick };
      });

      // 数组reduce方法详解
      // reduce接收两个参数，一个回调函数，一个为accumulator的初始值[initialValue]
      // 回调函数接收四个参数，accumulator[必需] , currentvalue[必需] , index , array
      // 回调函数第一次执行时，accumulator和currentValue有两种情况，如果reduce提供了initialValue，那么accumulator为initialValue
      // currenValue取数组的第一个值，如果没有提供initialValue，那么accumulator取数组第一个值，currentValue取数组第二个值。
      // 如果没有提供initialValue，reduce会从索引为1的地方开始执行回调，
      res.reduce((accumulator, current, index, arr) => {
        console.log('accumulator', accumulator);
        console.log('current', current);
        console.log('index', index);
        console.log('arr', arr);
      });
      console.log('res', res);

      // 用法一：求和
      const arr2 = [1, 2, 3, 4, 5];
      let res2 = arr2.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      });
      console.log('res2', res2); // 15

      // 用法二：二维数组转化为一维数组
      const arr3 = [
        [2, 3],
        [4, 5],
      ];
      let res3 = arr3.reduce((accumulator, currentValue) => {
        return accumulator.concat(currentValue);
      }, []);
      console.log('res3', res3);

      // // 用法三：数组去重
      const arr4 = [2, 3, 4, 5, 6, 7, 2, 3];
      let res4 = arr4.reduce((accumulator, currentValue) => {
        if (accumulator.includes(currentValue)) {
          return accumulator;
        }
        return accumulator.concat(currentValue);
      }, []);
      console.log(res4);

      // 数组的includes方法
      // 可以使用includes方法来判断一个数组中是否包含某个元素，如果包含则返回true，否则返回false
      // console.log(res.includes('s:160*160'))
    },

    testObj(){

    }
  },

  mounted() {
    this.testArr();
    this.testObj();
  },

  render() {
    return (
      <div>
        <div>hello world</div>
      </div>
    );
  },
};
</script>

<style lang="css" scoped>
</style>