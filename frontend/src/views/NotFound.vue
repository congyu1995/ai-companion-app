<template>
  <div class="not-found">
    <div class="error-container">
      <span class="error-icon">🤖</span>
      <h1>404</h1>
      <p>哎呀，页面不见了！</p>
      <p class="hint">AI伙伴告诉我，你可能迷路了...</p>
      <button class="back-home" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f8f9ff 0%, #fff5f5 100%);
  padding: 20px;
}

.error-container {
  text-align: center;
}

.error-icon {
  font-size: 80px;
  display: block;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

h1 {
  font-size: 80px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
}

p {
  font-size: 18px;
  color: #666;
  margin-bottom: 8px;
}

.hint {
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
}

.back-home {
  padding: 14px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.back-home:active {
  transform: scale(0.95);
}
</style>