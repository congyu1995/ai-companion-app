<template>
  <div class="chat-page">
    <!-- 顶部导航 -->
    <header class="chat-header" :style="headerStyle">
      <button class="back-btn" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </button>
      
      <div class="header-title">
        <span class="character-name">{{ character?.name }}</span>
        <div v-if="intimacyLevel > 0" class="intimacy-badge">
          <span class="heart">💖</span>
          <span class="level">Lv.{{ intimacyLevel }}</span>
        </div>
      </div>

      <button class="share-btn" @click="openShare">
        <van-icon name="share" size="20" />
      </button>
    </header>

    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
      <div v-if="chatStore.isLoading && messages.length === 0" class="loading-more">
        <van-loading type="spinner" size="24px" />
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="msg.id"
        class="message"
        :class="[`message-${msg.role}`, character?.color_theme]"
      >
        <div v-if="msg.role === 'assistant'" class="message-avatar">
          <span>{{ character?.avatar }}</span>
        </div>
        
        <div 
          class="message-content"
          @touchstart="startLongPress($event, msg)"
          @touchend="endLongPress"
          @mousedown="startLongPress($event, msg)"
          @mouseup="endLongPress"
        >
          <p>{{ msg.content }}</p>
          <span class="message-time">{{ formatTime(msg.created_at) }}</span>
        </div>
      </div>

      <div v-if="chatStore.isSending" class="message message-assistant">
        <div class="message-avatar">
          <span>{{ character?.avatar }}</span>
        </div>
        <div class="message-content typing">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入区 -->
    <div class="chat-input-area">
      <div class="input-row">
        <button class="voice-btn" @click="toggleVoiceInput">
          <van-icon name="volume-o" size="22" />
        </button>
        
        <div class="input-wrapper">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="输入消息..."
            @keypress.enter="sendMessage"
            @focus="showActions = false"
          />
        </div>

        <button 
          class="send-btn"
          :class="{ active: inputMessage.trim() }"
          :disabled="!inputMessage.trim() || chatStore.isSending"
          @click="sendMessage"
        >
          <van-icon name="guide-o" size="20" />
        </button>
      </div>

      <div class="action-row">
        <button class="action-btn" @click="goToCall">
          <van-icon name="phone-o" size="22" />
          <span>语音通话</span>
        </button>
        <button class="action-btn" @click="showImagePicker">
          <van-icon name="photograph" size="22" />
          <span>图片</span>
        </button>
        <button class="action-btn" @click="goToProfile">
          <van-icon name="user-circle-o" size="22" />
          <span>主页</span>
        </button>
      </div>
    </div>

    <!-- 亲密度升级提示 -->
    <transition name="fade">
      <div v-if="showIntimacyToast" class="intimacy-toast">
        <span class="heart">💖</span>
        <span>亲密度 +1</span>
      </div>
    </transition>

    <!-- 消息操作菜单 -->
    <van-action-sheet
      v-model:show="showMessageMenu"
      :actions="menuActions"
      @select="handleMenuSelect"
      cancel-text="取消"
    />

    <!-- 分享弹窗 -->
    <van-popup v-model:show="showShare" position="center" round style="width: 80%;">
      <div class="share-modal">
        <h3>分享对话</h3>
        <div class="share-preview">
          <div class="share-character">
            <span class="share-avatar">{{ character?.avatar }}</span>
            <span class="share-name">{{ character?.name }}</span>
          </div>
          <p class="share-content">{{ lastMessage?.content || '暂无对话内容' }}</p>
        </div>
        <p class="share-hint">分享这段有趣的对话到微博吧！</p>
        <div class="share-actions">
          <button class="cancel-btn" @click="showShare = false">取消</button>
          <button class="confirm-btn" @click="shareToWeibo">分享发博</button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'
import { showToast, showDialog } from 'vant'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const userStore = useUserStore()

const messagesContainer = ref(null)
const inputMessage = ref('')
const showActions = ref(false)
const showIntimacyToast = ref(false)
const showMessageMenu = ref(false)
const showShare = ref(false)
const selectedMessage = ref(null)
const longPressTimer = ref(null)

const characterId = computed(() => route.params.characterId)
const character = computed(() => chatStore.currentCharacter)
const messages = computed(() => chatStore.messages)
const intimacyLevel = computed(() => chatStore.currentIntimacy.intimacy_level)
const lastMessage = computed(() => messages.value.filter(m => m.role === 'user').pop())

const headerStyle = computed(() => {
  if (!character.value) return {}
  const colors = {
    'blue-purple': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'pink-orange': 'background: linear-gradient(135deg, #ff9a9e 0%, #ff6b9d 100%)'
  }
  return colors[character.value.color_theme] || colors['blue-purple']
})

const menuActions = [
  { name: '复制', value: 'copy' },
  { name: '回复', value: 'reply' },
  { name: '删除', value: 'delete', color: '#ee0a24' }
]

const formatTime = (time) => {
  return dayjs(time).format('HH:mm')
}

const loadChat = async () => {
  if (!characterId.value) return
  
  try {
    await chatStore.fetchCharacters()
    
    const char = chatStore.characters.find(c => c.id === parseInt(characterId.value))
    if (!char) {
      showToast('角色不存在')
      router.push('/')
      return
    }
    
    chatStore.setCurrentCharacter(char)
    await chatStore.fetchMessages(characterId.value)
    
    // 添加欢迎消息
    if (messages.value.length === 0) {
      chatStore.messages.push({
        id: 0,
        role: 'assistant',
        content: char.welcome_message,
        created_at: new Date().toISOString()
      })
    }
    
    scrollToBottom()
    chatStore.initSocket()
  } catch (error) {
    showToast('加载聊天记录失败')
  }
}

const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || chatStore.isSending) return
  
  inputMessage.value = ''
  
  try {
    await chatStore.sendMessage(content)
    scrollToBottom()
    
    // 显示亲密度提升
    showIntimacyToast.value = true
    setTimeout(() => {
      showIntimacyToast.value = false
    }, 1500)
  } catch (error) {
    showToast('发送失败，请重试')
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleScroll = () => {
  // 可以在这里实现加载更多历史消息
}

const goBack = () => {
  router.push('/')
}

const goToCall = () => {
  router.push(`/call/${characterId.value}`)
}

const goToProfile = () => {
  router.push('/profile')
}

const toggleVoiceInput = () => {
  showToast('语音输入功能开发中')
}

const showImagePicker = () => {
  showToast('图片发送功能开发中')
}

// 长按菜单
const startLongPress = (e, message) => {
  selectedMessage.value = message
  longPressTimer.value = setTimeout(() => {
    showMessageMenu.value = true
  }, 500)
}

const endLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const handleMenuSelect = (action) => {
  showMessageMenu.value = false
  
  switch (action.value) {
    case 'copy':
      navigator.clipboard.writeText(selectedMessage.value.content)
      showToast('已复制')
      break
    case 'reply':
      inputMessage.value = `回复: ${selectedMessage.value.content.slice(0, 20)}... `
      break
    case 'delete':
      showDialog({
        title: '确认删除',
        message: '确定要删除这条消息吗？',
        showCancelButton: true
      }).then(() => {
        chatStore.deleteMessage(selectedMessage.value.id)
      }).catch(() => {})
      break
  }
}

// 分享功能
const openShare = () => {
  showShare.value = true
}

const shareToWeibo = () => {
  showToast('已生成分享卡片')
  showShare.value = false
}

onMounted(() => {
  loadChat()
})

onUnmounted(() => {
  chatStore.disconnectSocket()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .share-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
}

.header-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.character-name {
  font-size: 17px;
  font-weight: 600;
}

.intimacy-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 4px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 140px;
}

.loading-more {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: messageIn 0.3s ease;
}

@keyframes messageIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 10px;
  flex-shrink: 0;
}

.message.blue-purple .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message.pink-orange .message-avatar {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: white;
  word-wrap: break-word;
  position: relative;
}

.message-user .message-content {
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-assistant .message-content {
  border-bottom-left-radius: 4px;
}

.message.blue-purple .message-content {
  background: linear-gradient(135deg, #e8ecff, #f0e8ff);
}

.message.pink-orange .message-content {
  background: linear-gradient(135deg, #ffe8eb, #fef0f5);
}

.message-content p {
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  margin: 0;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  display: block;
}

.typing {
  padding: 16px 20px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 10px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f7fa;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
}

.input-wrapper {
  flex: 1;
}

.input-wrapper input {
  width: 100%;
  height: 44px;
  border: 1px solid #e8e8e8;
  border-radius: 22px;
  padding: 0 16px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  border-color: #667eea;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #e0e0e0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-row {
  display: flex;
  justify-content: space-around;
  padding: 10px 0 5px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
}

.intimacy-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 分享弹窗 */
.share-modal {
  padding: 20px;
}

.share-modal h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.share-preview {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f5 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.share-character {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.share-avatar {
  font-size: 32px;
}

.share-name {
  font-weight: 600;
  font-size: 16px;
}

.share-content {
  font-size: 14px;
  color: #666;
  background: white;
  padding: 12px;
  border-radius: 12px;
  line-height: 1.5;
}

.share-hint {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.share-actions {
  display: flex;
  gap: 12px;
}

.share-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background: #f5f7fa;
  color: #666;
}

.confirm-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  color: white;
}
</style>