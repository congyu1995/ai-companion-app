<template>
  <div class="history-page">
    <van-nav-bar
      title="通话记录"
      left-arrow
      @click-left="goBack"
    />

    <div class="history-list">
      <div v-if="calls.length === 0" class="empty-state">
        <span class="empty-icon">📞</span>
        <p>暂无通话记录</p>
        <p class="hint">快和AI伙伴来一场语音通话吧</p>
      </div>

      <div
        v-for="call in calls"
        :key="call.id"
        class="call-item"
        :class="call.character_color"
        @click="callAgain(call.character_id)"
      >
        <div class="call-avatar">
          <span>{{ call.character_avatar }}</span>
        </div>
        <div class="call-info">
          <h4>{{ call.character_name }}</h4>
          <p class="call-time">{{ formatTime(call.started_at) }}</p>
          <p class="call-duration">
            <van-icon name="clock-o" />
            {{ formatDuration(call.duration) }}
          </p>
        </div>
        <van-icon name="arrow" class="arrow-icon" />
      </div>
    </div>

    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </router-link>
      <router-link to="/calls" class="nav-item active">
        <span class="nav-icon">📞</span>
        <span class="nav-text">通话</span>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <span class="nav-icon">👤</span>
        <span class="nav-text">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'
import dayjs from 'dayjs'

const router = useRouter()
const calls = ref([])

const formatTime = (time) => {
  return dayjs(time).format('MM月DD日 HH:mm')
}

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}秒`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

const goBack = () => {
  router.push('/')
}

const callAgain = (characterId) => {
  router.push(`/call/${characterId}`)
}

const loadCalls = async () => {
  try {
    const response = await api.get('/calls')
    calls.value = response.data.calls
  } catch (error) {
    console.error('加载通话记录失败:', error)
  }
}

onMounted(() => {
  loadCalls()
})
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.history-list {
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 8px;
}

.hint {
  font-size: 14px;
  color: #bbb;
}

.call-item {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.call-item:active {
  transform: scale(0.98);
}

.call-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.call-item.blue-purple .call-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.call-item.pink-orange .call-avatar {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.call-info {
  flex: 1;
}

.call-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.call-time {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.call-duration {
  font-size: 13px;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 4px;
}

.arrow-icon {
  color: #ccc;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #999;
  padding: 4px 20px;
  transition: color 0.2s;
}

.nav-item.active {
  color: #667eea;
}

.nav-icon {
  font-size: 24px;
}

.nav-text {
  font-size: 12px;
}
</style>