import axios from 'axios'

// 生产环境
// 测试环境
// 开发环境
const baseURL = 'http://localhost:8082'

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
  // console.log('请求拦截器', config)
  return config
}, function (error) {
  return Promise.reject(error)
})

// 封装响应拦截器
instance.interceptors.response.use(function (res) {
  return res
}, function (error) {
  return Promise.reject(error)
})


export default instance
