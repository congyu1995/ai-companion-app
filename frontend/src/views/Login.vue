<template>
  <div class="login-page">
    <div class="login-header">
      <h1 class="logo">✨ AI虚拟角色</h1>
      <p class="subtitle">你的专属陪伴伙伴</p>
    </div>

    <div class="login-form">
      <div class="form-item">
        <label>手机号</label>
        <div class="input-wrapper">
          <span class="prefix">+86</span>
          <input
            v-model="phone"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
            @input="validatePhone"
          />
        </div>
      </div>

      <div class="form-item">
        <label>验证码</label>
        <div class="code-wrapper">
          <input
            v-model="code"
            type="number"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <button
            class="code-btn"
            :disabled="!canSendCode || countdown > 0"
            @click="sendCode"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>
      </div>

      <button
        class="login-btn"
        :disabled="!canLogin || isLoading"
        @click="handleLogin"
      >
        <span v-if="isLoading">登录中...</span>
        <span v-else>立即登录</span>
      </button>

      <p class="agreement">
        登录即表示您同意
        <a href="#">用户协议</a>
        和
        <a href="#">隐私政策</a>
      </p>
    </div>

    <div class="login-footer">
      <p>还没有账号？立即登录自动创建</p>
    </div>

    <!-- 展示用验证码提示 -->
    <van-popup v-model:show="showDevCode" position="center" round style="padding: 20px;">
      <p style="text-align: center;">开发环境验证码: <strong>{{ devCode }}</strong></p>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../stores/user'
import { sendVerifyCode } from '../utils/api'

const router = useRouter()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const isLoading = ref(false)
const countdown = ref(0)
const showDevCode = ref(false)
const devCode = ref('')

const canSendCode = computed(() => {
  return phone.value.length === 11 && /^1[3-9]\d{9}$/.test(phone.value)
})

const canLogin = computed(() => {
  return canSendCode.value && code.value.length === 6
})

const validatePhone = () => {
  phone.value = phone.value.replace(/\D/g, '').slice(0, 11)
}

const sendCode = async () => {
  try {
    const response = await sendVerifyCode(phone.value)
    showToast('验证码已发送')
    
    // 开发环境显示验证码
    if (response.data.code) {
      devCode.value = response.data.code
      showDevCode.value = true
    }
    
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    showToast('发送失败，请重试')
  }
}

const handleLogin = async () => {
  if (!canLogin.value) return
  
  isLoading.value = true
  try {
    const result = await userStore.login(phone.value, code.value)
    if (result.success) {
      showToast('登录成功')
      router.push('/')
    } else {
      showToast(result.error)
    }
  } catch (error) {
    showToast('登录失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 40px 24px;
}

.login-header {
  text-align: center;
  margin-top: 60px;
  margin-bottom: 40px;
}

.logo {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.login-form {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 0 16px;
  height: 50px;
}

.prefix {
  font-size: 15px;
  color: #999;
  margin-right: 12px;
  border-right: 1px solid #ddd;
  padding-right: 12px;
}

.input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

.code-wrapper {
  display: flex;
  gap: 12px;
}

.code-wrapper input {
  flex: 1;
  background: #f5f7fa;
  border: none;
  border-radius: 12px;
  padding: 0 16px;
  height: 50px;
  font-size: 16px;
  outline: none;
}

.code-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 20px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn:not(:disabled):active {
  transform: scale(0.98);
}

.agreement {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
}

.agreement a {
  color: #667eea;
  text-decoration: none;
}

.login-footer {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
}

.login-footer p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}
</style>