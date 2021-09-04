<script>
export default {
  methods:{
    arrayTestCode(){
      const salad=['西红柿','蘑菇','黄瓜','胡萝卜','花菜'];
      let len=salad.length;

      // 复用数据长度来遍历数组
      for(let i=0;i<len;i++){
        console.log(`Element at index ${i} is ${salad[i]}`)
      }

      console.log('==============')

      // 复用数组长度反向遍历数组
      for (let i=len;i>0;i--){
        console.log(`Element at index ${i} is ${salad[i-1]}`)
      }

      // 如何向数组中添加元素
      let lastAdd=salad.push('末尾添加') // 返回值：向末尾添加的元素
      console.log('lastAdd',lastAdd)
      console.log('salad 末尾添加',salad)

      let headAdd= salad.unshift('头部添加') // 返回值：向头部添加的元素
      console.log('headAdd',headAdd)
      console.log('salad 头部添加',salad)

      let lastRemove=salad.pop() // 返回值：从末尾移除的元素
      console.log('lastRemove',lastRemove)
      console.log('salad 尾部删除',salad)

      let headRemove=salad.shift() // 返回值：从头部移除的元素
      console.log('headRemove',headRemove)
      console.log('salad 头部删除',salad)

      // 如何克隆数组
      const saladCopy=salad.slice();
      console.log('saladCopy',saladCopy)
      console.log(saladCopy===salad) // false

      // 数组解构
      // 解构语法有助于减少代码量，极大提高生产力
      let [tomato, mushroom,carrot]=['西红柿','蘑菇','胡萝卜'];
      console.log('tomato',tomato,'mushroom',mushroom,'carrot',carrot)

      // let vegetables=['西红柿','蘑菇','胡萝卜']
      // let tomato=vegetables[0]
      // let mushroom=vegetables[1]
      // let carrot=vegetables[2]

      // 如何为变量指定默认值
      let [tomato1,mushroom1='蘑菇']=['西红柿']
      console.log('tomato1',tomato1)
      console.log('mushroom1',mushroom1)

      // 如何跳过某个数组元素
      // 使用解构获取数组元素时，可以跳过某个元素。比如说，你可能只关注数组的部分元素，这时候这个语法就派上用场了
      let [tomato2,,carrot2]=['西红柿','蘑菇','胡萝卜']
      console.log('tomato2',tomato2)
      console.log('carrot2',carrot2)

      // 如何使用展开语法和剩余参数
      // 使用剩余参数时，...出现在解构语法表达式的左边
      // 使用展开语法时，...出现在解构语法表达式的右边
      // 通过剩余参数，可以将剩下的元素映射到一个新的数组中。剩余参数必须是解构语法的最后一个变量，下面的例子，我们把前两个参数分别映射到了tomato3和mushroom3，剩下的元素则用...映射到了res变量中
      const [tomato3,mushroom3,...rest]=['西红柿','蘑菇','花菜','黄瓜','玉米']
      console.log('tomato3',tomato3); // 西红柿
      console.log('mushroom3',mushroom3); // 蘑菇
      console.log('rest',rest); // ["花菜", "黄瓜", "玉米"]
    }
  },
  mounted(){
    this.arrayTestCode();
  },
  render() {
    return (
      <div>
        <div>0831</div>
      </div>
    );
  },
};
</script>

<style lang="css" scoped>
</style>