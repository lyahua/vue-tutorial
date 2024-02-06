// 只要修改了vue.config.js这个配置文件，都要重启项目
const path = require('path')
module.exports = {
  devServer: {
    // 用代理的方式来解决浏览器同源策略对ajax的限制
    proxy: {
      '/soso': {
        target: 'https://c.y.qq.com',  // 目标远程服务器
        ws: true,
        changeOrigin: true   // 允许改变“域”
      },
      '/api': {
        target: 'https://cnodejs.org',
        ws: true,
        changeOrigin: true
      },
      '/splcloud': {
        target: 'https://c.y.qq.com',
        ws: true,
        changeOrigin: true
      },
      '/v2': {
        target: 'https://complexsearch.kugou.com',
        ws: true,
        changeOrigin: true
      },

    }
  },
  // 官方文档上只找到一个一个变量定义的写法
  // css: {
  //   loaderOptions: {
  //     less: {
  //       globalVars: {
  //         color: '#fff'
  //       }
  //     }
  //   }
  // },

  // 下载安装 style-resources-loader和vue-cli-plugin-style-resources-loader 支持less全局引入
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'less',
      patterns: [
        path.resolve(__dirname, './src/utils/styles/common.less')
      ]
    }
  },

  // scss配置
  css:{
    loaderOptions:{
      // 给 sass-loader 传递选项
      sass: {
        // @/ 是 src/ 的别名
        // 所以这里假设你有 `src/variables.sass` 这个文件
        // 注意：在 sass-loader v8 中，这个选项名是 "prependData"
        // additionalData: `@import "~@/variables.sass"`
      },
      // 默认情况下 `sass` 选项会同时对 `sass` 和 `scss` 语法同时生效
      // 因为 `scss` 语法在内部也是由 sass-loader 处理的
      // 但是在配置 `prependData` 选项的时候
      // `scss` 语法会要求语句结尾必须有分号，`sass` 则要求必须没有分号
      // 在这种情况下，我们可以使用 `scss` 选项，对 `scss` 语法进行单独配置
      scss: {
        additionalData: `@import "~@/utils/styles/common.scss";`
      },
    }
  }
}
