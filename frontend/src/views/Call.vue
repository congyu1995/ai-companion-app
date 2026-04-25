<template>
  <div class="call-page" :class="character?.color_theme">
    <div class="call-background">
      <span class="bg-avatar">{{ character?.avatar }}</span>
    </div>

    <div class="call-content">
      <div class="call-avatar" :style="avatarStyle">
        <span>{{ character?.avatar }}</span>
      </div>

      <h2 class="call-character-name">{{ character?.name }}</h2>

      <div class="call-status" :class="{ listening: isListening }">
        <p class="status-text">{{ statusText }}</p>
        <p class="status-hint">{{ statusHint }}</p>
      </div>

      <div class="voice-wave" v-if="isListening">
        <span v-for="i in 9" :key="i" :style="{ animationDelay: `${i * 0.1}s` }"></span>
      </div>

      <div class="call-duration" v-if="duration > 0">
        {{ formatDuration(duration) }}
      </div>

      <div class="call-controls">
        <button class="control-btn mute-btn" @click="toggleMute">
          <van-icon :name="isMuted ? 'volume-cross' : 'volume'" size="24" />
        </button>

        <button class="control-btn interrupt-btn" @click="interrupt">
          <van-icon name="pause-circle-o" size="24" />
        </button>

        <button class="control-btn hangup-btn" @click="endCall">
          <van-icon name="phone-circle-o" size="32" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()

const characterId = computed(() => route.params.characterId)
const character = computed(() => chatStore.currentCharacter)

const isListening = ref(false)
const isMuted = ref(false)
const duration = ref(0)
const startTime = ref(null)
const timer = ref(null)

const avatarStyle = computed(() => {
  if (!character.value) return {}
  const colors = {
    'blue-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'pink-orange': 'linear-gradient(135deg, #ff9a9e 0%, #ff6b9d 100%)'
  }
  return { background: colors[character.value.color_theme] || colors['blue-purple'] }
})

const statusText = computed(() => {
  if (isListening.value) return '正在听...'
  return '你可以开始说话'
})

const statusHint = computed(() => {
  if (isListening.value) return '说话或点击打断'
  return '点击麦克风图标开始语音对话'
})

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const startListening = () => {
  isListening.value = true
  showToast('开始语音输入')
  
  // 模拟语音识别
  setTimeout(() => {
    if (isListening.value) {
      showToast('收到语音："今天天气真不错"')
      setTimeout(() => {
        showToast('AI回复："是的呢！适合出去走走～"')
      }, 1000)
    }
  }, 3000)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  showToast(isMuted.value ? '已静音' : '已取消静音')
}

const interrupt = () => {
  isListening.value = false
  showToast('已打断')
}

const endCall = async () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  // 记录通话
  if (character.value) {
    await chatStore.recordCall(character.value.id, duration.value, 'completed')
  }
  
  router.back()
}

onMounted(() => {
  startTime.value = Date.now()
  timer.value = setInterval(() => {
    duration.value = Math.floor((Date.now() - startTime.value) / 1000)
  }, 1000)
  
  // 延迟开始语音输入演示
  setTimeout(() => {
    startListening()
  }, 1500)
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<style scoped>
.call-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  color: white;
  position: relative;
}

.call-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
  pointer-events: none;
}

.bg-avatar {
  font-size: 300px;
}

.call-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.call-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  margin-bottom: 20px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.call-character-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 40px;
}

.call-status {
  text-align: center;
  margin-bottom: 40px;
}

.status-text {
  font-size: 18px;
  margin-bottom: 8px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.call-status.listening .status-text {
  animation: none;
  color: #ffd700;
}

.status-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.voice-wave {
  display: flex;
  gap: 5px;
  height: 60px;
  align-items: flex-end;
  margin-bottom: 40px;
}

.voice-wave span {
  width: 5px;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 3px;
  animation: wave 1s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { height: 20%; }
  50% { height: 100%; }
}

.call-page.pink-orange .voice-wave span {
  background: linear-gradient(to top, #ff9a9e, #ff6b9d);
}

.call-duration {
  font-size: 48px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  margin-bottom: 60px;
  color: rgba(255, 255, 255, 0.9);
}

.call-controls {
  display: flex;
  gap: 40px;
}

.control-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.control-btn:active {
  transform: scale(0.95);
}

.mute-btn {
  background: rgba(255, 255, 255, 0.2);
}

.mute-btn.muted {
  background: #ff6b6b;
}

.interrupt-btn {
  background: rgba(255, 255, 255, 0.2);
}

.hangup-btn {
  background: #ff4444;
  width: 72px;
  height: 72px;
}

.hangup-btn:active {
  background: #ff3333;
}
</style>