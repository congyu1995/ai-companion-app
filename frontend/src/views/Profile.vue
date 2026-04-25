<template>
  <div class="profile-page">
    <header class="profile-header">
      <div class="header-bg"></div>
      <div class="user-info">
        <div class="avatar-wrapper">
          <span class="avatar">👤</span>
          <button class="edit-avatar" @click="editAvatar">
            <van-icon name="photograph" />
          </button>
        </div>
        <h2 class="nickname">{{ userStore.user?.nickname || '用户' }}</h2>
        <p class="phone">{{ maskPhone(userStore.user?.phone) }}</p>
      </div>
    </header>

    <div class="profile-content">
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-value">{{ totalChats }}</span>
          <span class="stat-label">对话次数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalMinutes }}分钟</span>
          <span class="stat-label">陪伴时长</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ maxIntimacy }}</span>
          <span class="stat-label">最高亲密度</span>
        </div>
      </div>

      <!-- 功能列表 -->
      <div class="profile-menu">
        <van-cell-group>
          <van-cell title="编辑资料" is-link @click="showEditProfile = true">
            <template #icon>
              <span class="menu-icon" style="background: #e3f2fd;">✏️</span>
            </template>
          </van-cell>
          <van-cell title="通话记录" is-link to="/calls">
            <template #icon>
              <span class="menu-icon" style="background: #fce4ec;">📞</span>
            </template>
          </van-cell>
          <van-cell title="我的收藏" is-link @click="showToast('功能开发中')">
            <template #icon>
              <span class="menu-icon" style="background: #fff8e1;">⭐</span>
            </template>
          </van-cell>
          <van-cell title="设置" is-link @click="showToast('功能开发中')">
            <template #icon>
              <span class="menu-icon" style="background: #f3e5f5;">⚙️</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </router-link>
      <router-link to="/calls" class="nav-item">
        <span class="nav-icon">📞</span>
        <span class="nav-text">通话</span>
      </router-link>
      <router-link to="/profile" class="nav-item active">
        <span class="nav-icon">👤</span>
        <span class="nav-text">我的</span>
      </router-link>
    </nav>

    <!-- 编辑资料弹窗 -->
    <van-popup v-model:show="showEditProfile" position="bottom" round style="height: 50%;">
      <div class="edit-modal">
        <div class="modal-header">
          <h3>编辑资料</h3>
          <button class="close-btn" @click="showEditProfile = false">
            <van-icon name="cross" />
          </button>
        </div>
        
        <div class="form-group">
          <label>昵称</label>
          <input 
            v-model="editNickname" 
            type="text" 
            placeholder="请输入昵称"
            maxlength="20"
          />
        </div>

        <button class="save-btn" :disabled="!editNickname.trim()" @click="saveProfile">
          保存
        </button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useChatStore } from '../stores/chat'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

const showEditProfile = ref(false)
const editNickname = ref('')
const totalChats = ref(0)
const totalMinutes = ref(0)
const maxIntimacy = ref(1)

const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const editAvatar = () => {
  showToast('头像上传功能开发中')
}

const saveProfile = async () => {
  if (!editNickname.value.trim()) return
  
  try {
    await userStore.updateProfile({ nickname: editNickname.value })
    showToast('保存成功')
    showEditProfile.value = false
  } catch (error) {
    showToast('保存失败')
  }
}

const handleLogout = () => {
  showDialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
    showCancelButton: true
  }).then(() => {
    userStore.logout()
    router.push('/login')
    showToast('已退出登录')
  }).catch(() => {})
}

const loadStats = async () => {
  // 加载统计数据
  await chatStore.fetchCharacters()
  
  // 计算统计数据
  const intimacies = Object.values(chatStore.intimacyData)
  if (intimacies.length > 0) {
    maxIntimacy.value = Math.max(...intimacies.map(i => i.intimacy_level))
    totalChats.value = intimacies.reduce((sum, i) => sum + i.intimacy_points, 0)
  }
  
  totalMinutes.value = Math.floor(totalChats.value * 2 / 60)
}

onMounted(() => {
  loadStats()
  editNickname.value = userStore.user?.nickname || ''
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.profile-header {
  position: relative;
  padding: 40px 20px 60px;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 0 30px 30px;
}

.user-info {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.edit-avatar {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nickname {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}

.phone {
  font-size: 14px;
  opacity: 0.8;
}

.profile-content {
  padding: 0 16px;
}

.stats-cards {
  display: flex;
  gap: 12px;
  margin-top: -30px;
  position: relative;
  z-index: 2;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.profile-menu {
  margin-top: 20px;
}

.menu-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 12px;
}

.logout-btn {
  width: 100%;
  margin-top: 30px;
  padding: 16px;
  background: white;
  border: 1px solid #ff6b6b;
  border-radius: 12px;
  color: #ff6b6b;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
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

/* 编辑弹窗 */
.edit-modal {
  padding: 20px;
  height: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  height: 48px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  outline: none;
}

.form-group input:focus {
  border-color: #667eea;
}

.save-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>