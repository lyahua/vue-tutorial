<script>
  export default {
    methods:{
      RegPractice(){
        /* 
          1.利用RegExp new RegExp('expression' [,options])
          2.利用反斜杆 /expression/[options]
            options 的取值有以下两种：i，忽略大小写，g，匹配全局

          
        */
       // 【.】 匹配任意【一个】字符
       let reg1=/a.b/
       console.log(reg1.test('aHb')) // true
       console.log(reg1.test('aHHb')) // false

      // 【*】把*前的字符匹配0次或多次
      let reg2=/a*b/
      console.log(reg2.test('b')) // true
      console.log(reg2.test('ab')) // true
      console.log(reg2.test('aaab')) // true

      // 【+】前面的字符匹配1次或多次，等效于/aa*b/
      let reg3=/a+b/
      console.log('reg3',reg3.test('b')) // false

      // 【？】 表示前面的字符匹配0次或1次
      let reg4=/a?b/
      console.log('reg4',reg4.test('b')) // true
      console.log('reg4',reg4.test('aaab')) // false
      }
    },

    mounted(){
      this.RegPractice()
    },

    render(){
      return(
        <div>
          <h1>JavaScript正则表达式整理</h1>
          <div>
            {
              
            //  ` 作用：
            //     1.验证字符串是否符合规则 
            //     2.从字符串里面获取一部分符合规则的内容 
            //   语法：
            //     1.字面量创建
            //         var reg=/****/;
            //         区别：(1) 不能进行字符串拼接
            //               (2) 书写基础元字符直接写\
            //     2.内置构造函数创建
            //         var reg=new RegExp('*****')
            //         区别：(1) 可以字符串拼接
            //               (2) 书写基础元字符需要写\
                
            //     基础元字符：
            //     1.\s 表示一个空格
            //     2.\S 表示一个非空格
            //     3.\t 表示一个制表符(tab键)
            //     4.\d 表示一个数字
            //     5.\D 表示一个非数字
            //     6.\w 表示一个数字或字母或下划线
            //     7.\W 表示一个非数字或字母或下划线
            //     8.. 表示一个非换行符(除了\n外的任意字符)
            //     9.\ 斜杆表示转义符：把没意义的内容转成有意义的内容；把有意义的内容转成没有意义的内容。注：字符串的 / 也表示转义
            //     10.\\u,匹配中文，后面带上中文的四位unicode编码，[\u4e00-\u9f5a]表示任意一个中文字符

            //     边界元字符：
                  //  1.^ 表示字符串开始
                  //  2.$ 表示字符串结尾
              
            }
          </div>
        </div>
      )
    }
  }
</script>

<style lang="css" scoped>

</style>