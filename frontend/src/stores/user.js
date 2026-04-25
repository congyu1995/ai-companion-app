import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const setUser = (userData) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const login = async (phone, code) => {
    try {
      const response = await api.post('/auth/login', { phone, code })
      setToken(response.data.token)
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '登录失败'
      }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  const checkAuth = () => {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile')
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/user/profile', data)
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      throw error
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    login,
    logout,
    checkAuth,
    fetchProfile,
    updateProfile
  }
})