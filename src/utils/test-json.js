// const path = require("path");
// const _ = require('lodash');
const fs = require('fs');
const path=require('path')

class TestJson {
  constructor() {
    this.users = this.loadUsers()
    console.log(`用户数量：${this.users.length}`)
    console.log(`用户数量：${JSON.stringify(JSON.stringify(this.users)) }`)
  }

  loadUsers() {
    try {
      let content = fs.readFileSync(path.resolve(__dirname,'../docs/user.json'), 'utf8')
      return JSON.parse(content)
    } catch (err) {
      console.error(err)
      return []
    }
  }

  /**
   * @TODO: 测试lodash数组操作-过滤
   * 要求：从this.users列表中，过滤得到所有在岗女性列表
   * status字段：1为在岗；0为离岗；
   * sex字段：0为男性；1为女性；
   */
  // findFemaleEmployees() {
  //   return _.filter(this.users, {'sex': 1, 'status': 1})
  // }

  /**
   * @TODO: 测试lodash数组操作-排序
   * 要求：将this.users按照姓名字母顺序排序
   */
  // sortByUserName() {
  //   return _.sortBy(this.users, 'username')
  // }

  /**
   * @TODO: 测试lodash数组操作-Map/Reduce操作
   * 要求：计算所有用户username字段长度并得到username长度的平均值（结果用toFixed函数取整）
   */
  // calcUsernameAvgLength() {
  //   let total = _.chain(this.users).map(user => user['username'].length).reduce((sum, item) => sum + item, 0)
  //   return parseInt((total / this.users.length).toFixed(0))
  // }

  /**
   * @TODO: 测试lodash数组操作-转换成Object
   * 要求：将this.users转换成 {xxxx: {id: xxxx, username: '胡'}} 的Object形式
   */
  // getUserMap() {
  //   return _.keyBy(this.users, 'id')
  // }

  /**
   * @TODO: 测试lodash链式操作-使用chain
   * 要求：从this.users中计算得到姓李的男性数量和姓李的女性数量。返回结果格式为：[8, 9]，8为男性数量；9为女性数量；
   * 请使用一行代码实现
   */
  // countNumUsingChain() {
  //   return _.chain(this.users)
  //     .filter(user => user['realname'] && user['realname'].indexOf('李') === 0)
  //     .groupBy('sex').values()
  //     .map('length').value()
  // }

  /**
   * @TODO: 测试lodash字符串操作-命名格式转换
   * 要求：将输入的内容，转换成大写驼峰格式。例如，输入 abc-def_ghi，返回AbcDefGhi
   */
  // toUpperCamelCase(inputStr) {
  //   return _.chain(inputStr).camelCase().upperFirst().value()
  // }
}

new TestJson ();
module.exports = TestJson
