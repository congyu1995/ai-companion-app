# 🚀 快速启动指南

## 本地开发

### 1. 克隆项目
```bash
git clone https://github.com/congyu1995/ai-companion-app.git
cd ai-companion-app
```

### 2. 安装依赖
```bash
npm install
```

### 3. 初始化数据库
```bash
npm run init-db
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问应用
打开浏览器访问：
- **首页**: http://localhost:3000
- **AI陪伴**: http://localhost:3000/ai-companion
- **心情漂流瓶**: http://localhost:3000/mood-bottle

---

## 📦 生产部署

### 使用PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name ai-companion-app

# 查看日志
pm2 logs ai-companion-app

# 重启应用
pm2 restart ai-companion-app

# 停止应用
pm2 stop ai-companion-app
```

### 使用Docker部署
```bash
# 构建镜像
docker build -t ai-companion-app .

# 运行容器
docker run -d -p 3000:3000 --name ai-companion-app ai-companion-app
```

---

## 🔧 环境配置

创建 `.env` 文件（可选）：
```bash
NODE_ENV=production
PORT=3000
```

---

## 📱 功能测试

### AI陪伴测试流程
1. 访问 http://localhost:3000/ai-companion
2. 选择角色（罗伯特或萌宠）
3. 发送消息进行对话
4. 观察亲密度提升

### 心情漂流瓶测试流程
1. 访问 http://localhost:3000/mood-bottle
2. 点击右下角"写心情"按钮
3. 输入内容并选择分类
4. 点击"投入大海"发布
5. 切换分类查看不同心情
6. 点击共鸣按钮测试互动
7. 点击举报按钮测试举报功能

---

## 🐛 故障排查

### 数据库错误
```bash
# 重新初始化数据库
rm database/app.db
npm run init-db
```

### 端口占用
```bash
# 查看端口占用
lsof -i:3000

# 杀掉进程
kill -9 <PID>
```

### 依赖问题
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 API测试

### 使用curl测试API

#### AI陪伴API
```bash
# 获取角色列表
curl http://localhost:3000/api/ai-companion/characters

# 发送消息
curl -X POST http://localhost:3000/api/ai-companion/chat \
  -H "Content-Type: application/json" \
  -d '{
    "characterId": "robert",
    "message": "你好",
    "sessionId": "test-session-123"
  }'
```

#### 心情漂流瓶API
```bash
# 获取心情列表
curl "http://localhost:3000/api/mood-bottle/moods?category=all&page=1&limit=10&sessionId=test-session-123"

# 发布心情
curl -X POST http://localhost:3000/api/mood-bottle/moods \
  -H "Content-Type: application/json" \
  -d '{
    "content": "今天心情不错",
    "category": "happy",
    "sessionId": "test-session-123"
  }'

# 获取统计数据
curl http://localhost:3000/api/mood-bottle/statistics
```

---

## 🔗 GitHub仓库

https://github.com/congyu1995/ai-companion-app

---

## 📝 更新日志

### v1.0.0 (2026-04-25)
- ✨ 初始版本发布
- ✨ AI虚拟角色陪伴功能
- ✨ 心情漂流瓶功能
- ✨ 完整的前后端实现
- ✨ SQLite数据库集成
