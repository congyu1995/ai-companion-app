<template>
  <div class="home-page">
    <header class="home-header">
      <h1>✨ AI虚拟角色</h1>
      <p>选择你的专属陪伴伙伴</p>
    </header>

    <div class="character-list">
      <div
        v-for="char in chatStore.characters"
        :key="char.id"
        class="character-card"
        :class="char.color_theme"
        @click="startChat(char)"
      >
        <div class="card-content">
          <div class="avatar-wrapper">
            <span class="avatar">{{ char.avatar }}</span>
            <div v-if="char.intimacy.intimacy_level > 1" class="intimacy-badge">
              <span class="heart">💖</span>
              <span class="level">Lv.{{ char.intimacy.intimacy_level }}</span>
            </div>
          </div>
          
          <div class="character-info">
            <h3 class="character-name">{{ char.name }}</h3>
            <p class="character-desc">{{ char.description }}</p>
            <div class="intimacy-bar" v-if="char.intimacy.intimacy_level > 1">
              <div class="bar-bg">
                <div 
                  class="bar-fill" 
                  :style="{ width: (char.intimacy.intimacy_points % 100) + '%' }"
                ></div>
              </div>
              <span class="intimacy-text">亲密度 {{ getIntimacyText(char.intimacy.intimacy_level) }}</span>
            </div>
          </div>
        </div>

        <button 
          class="chat-btn"
          :style="getButtonStyle(char.color_theme)"
          @click.stop="startChat(char)"
        >
          {{ char.last_message ? '继续对话' : '开始对话' }}
        </button>
      </div>
    </div>

    <nav class="bottom-nav">
      <router-link to="/" class="nav-item active">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </router-link>
      <router-link to="/calls" class="nav-item">
        <span class="nav-icon">📞</span>
        <span class="nav-text">通话</span>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <span class="nav-icon">👤</span>
        <span class="nav-text">我的</span>
      </router-link>
    </nav>

    <van-loading v-if="chatStore.isLoading" type="spinner" class="loading" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'
import { showToast } from 'vant'

const router = useRouter()
const chatStore = useChatStore()

const getButtonStyle = (theme) => {
  const styles = {
    'blue-purple': 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'pink-orange': 'background: linear-gradient(135deg, #ff9a9e 0%, #ff6b9d 100%)'
  }
  return styles[theme] || styles['blue-purple']
}

const getIntimacyText = (level) => {
  const texts = {
    1: '初识',
    2: '熟悉',
    3: '亲密',
    4: '挚友',
    5: '灵魂伴侣'
  }
  return texts[level] || `Lv.${level}`
}

const startChat = (character) => {
  chatStore.setCurrentCharacter(character)
  router.push(`/chat/${character.id}`)
}

onMounted(() => {
  chatStore.fetchCharacters().catch(() => {
    showToast('获取角色列表失败')
  })
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9ff 0%, #fff5f5 100%);
  padding: 20px;
  padding-bottom: 80px;
}

.home-header {
  text-align: center;
  padding: 30px 0 20px;
}

.home-header h1 {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.home-header p {
  color: #888;
  font-size: 14px;
  margin-top: 8px;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.character-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.character-card:active {
  transform: scale(0.98);
}

.card-content {
  display: flex;
  gap: 15px;
  margin-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.character-card.pink-orange .avatar {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.intimacy-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.heart {
  font-size: 10px;
}

.character-info {
  flex: 1;
}

.character-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.character-card.blue-purple .character-name {
  color: #667eea;
}

.character-card.pink-orange .character-name {
  color: #ff6b9d;
}

.character-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 10px;
}

.intimacy-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-bg {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffaa00);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.intimacy-text {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.chat-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 22px;
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
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

.loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>