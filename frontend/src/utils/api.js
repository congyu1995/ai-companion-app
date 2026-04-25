import axios from 'axios'
import { showToast } from 'vant'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          showToast('登录已过期，请重新登录')
          window.location.href = '/login'
          break
        case 403:
          showToast('没有权限执行此操作')
          break
        case 404:
          showToast('请求的资源不存在')
          break
        case 429:
          showToast('请求过于频繁，请稍后再试')
          break
        case 500:
          showToast('服务器错误，请稍后再试')
          break
        default:
          showToast(response.data?.error || '请求失败')
      }
    } else {
      showToast('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default api

// 发送验证码
export const sendVerifyCode = async (phone) => {
  return api.post('/auth/send-code', { phone })
}

// 登录
export const login = async (phone, code) => {
  return api.post('/auth/login', { phone, code })
}

// 获取用户信息
export const getUserProfile = async () => {
  return api.get('/user/profile')
}

// 更新用户信息
export const updateUserProfile = async (data) => {
  return api.put('/user/profile', data)
}