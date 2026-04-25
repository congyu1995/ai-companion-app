import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'
import api from '../utils/api'
import { useUserStore } from './user'

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore()
  
  // State
  const characters = ref([])
  const messages = ref([])
  const currentCharacter = ref(null)
  const intimacyData = ref({})
  const isLoading = ref(false)
  const isSending = ref(false)
  const socket = ref(null)
  const isConnected = ref(false)

  // Getters
  const currentIntimacy = computed(() => {
    if (!currentCharacter.value) return { intimacy_level: 1, intimacy_points: 0 }
    return intimacyData.value[currentCharacter.value.id] || { intimacy_level: 1, intimacy_points: 0 }
  })

  // Actions
  const initSocket = () => {
    if (socket.value) return

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
    socket.value = io(socketUrl)

    socket.value.on('connect', () => {
      isConnected.value = true
      // 加入用户房间
      if (userStore.user) {
        socket.value.emit('join', userStore.user.id)
      }
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
    })

    socket.value.on('new_message', (data) => {
      messages.value.push(data.userMessage)
      messages.value.push(data.aiMessage)
      
      // 更新亲密度
      if (currentCharacter.value) {
        intimacyData.value[currentCharacter.value.id] = {
          ...intimacyData.value[currentCharacter.value.id],
          intimacy_level: data.intimacyLevel
        }
      }
    })
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  const fetchCharacters = async () => {
    try {
      isLoading.value = true
      const response = await api.get('/characters')
      characters.value = response.data.characters
      
      // 更新亲密度数据
      response.data.characters.forEach(char => {
        intimacyData.value[char.id] = char.intimacy
      })
      
      return characters.value
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentCharacter = (character) => {
    currentCharacter.value = character
    messages.value = [] // 清空消息
  }

  const fetchMessages = async (characterId, params = {}) => {
    try {
      isLoading.value = true
      const response = await api.get(`/chat/${characterId}`, { params })
      messages.value = response.data.messages
      return messages.value
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const sendMessage = async (content, type = 'text') => {
    if (!currentCharacter.value || isSending.value) return

    try {
      isSending.value = true
      
      // 乐观更新：先添加用户消息
      const tempMessage = {
        id: Date.now(),
        content,
        role: 'user',
        message_type: type,
        created_at: new Date().toISOString()
      }
      messages.value.push(tempMessage)

      const response = await api.post(`/chat/${currentCharacter.value.id}`, {
        content,
        type
      })

      // 更新真实消息
      const index = messages.value.findIndex(m => m.id === tempMessage.id)
      if (index !== -1) {
        messages.value[index] = response.data.userMessage
      }
      
      messages.value.push(response.data.aiMessage)

      // 更新亲密度
      intimacyData.value[currentCharacter.value.id] = {
        ...intimacyData.value[currentCharacter.value.id],
        intimacy_level: response.data.intimacyLevel
      }

      return response.data
    } catch (error) {
      // 移除失败的消息
      messages.value = messages.value.filter(m => m.id !== tempMessage.id)
      throw error
    } finally {
      isSending.value = false
    }
  }

  const deleteMessage = async (messageId) => {
    // 本地删除，后端可以实现软删除
    messages.value = messages.value.filter(m => m.id !== messageId)
  }

  const recordCall = async (characterId, duration, status = 'completed') => {
    try {
      await api.post(`/calls/${characterId}`, { duration, status })
    } catch (error) {
      console.error('记录通话失败:', error)
    }
  }

  return {
    characters,
    messages,
    currentCharacter,
    intimacyData,
    isLoading,
    isSending,
    isConnected,
    currentIntimacy,
    initSocket,
    disconnectSocket,
    fetchCharacters,
    setCurrentCharacter,
    fetchMessages,
    sendMessage,
    deleteMessage,
    recordCall
  }
})