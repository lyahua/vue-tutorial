import axios from 'axios'

// 生产环境
// 测试环境
// 开发环境
const baseURL = 'http://localhost:8080'

// 创建一个axios实例
const instance = axios.create({
  baseURL,
  timeout: 7000,
  headers: {}
})

// 封装请求拦截器
instance.interceptors.request.use(function (config) {
  // 在请求被send出去之前，你可以在这里做一些事儿
  // 加token
<<<<<<< HEAD
=======
  // console.log('请求拦截器', config)
>>>>>>> liuyahuaTest02
  console.log('请求拦截器', config)
  return config
}, function (error) {
  return Promise.reject(error)
})

// 封装响应拦截器
instance.interceptors.response.use(function (res) {
<<<<<<< HEAD
  let response = null
  // 当后端返回数据，抵达客户端之前时
  // 要数据过滤
  // 对后端响应的错误信息进行处理
  console.log('响应拦截器', res)
  if (res.status===200) {
    if(res.data && res.data.code===0) {
      response = res.data.data
    } else {
      console.log('调接口失败')
    }
  } else {
    console.log('调接口失败')
  }
  return response
=======
  return res
>>>>>>> liuyahuaTest02
}, function (error) {
  return Promise.reject(error)
})


export default instance
