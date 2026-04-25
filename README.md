# AI Companion App

一个集成了**AI虚拟角色陪伴**和**心情漂流瓶**的完整前后端应用。

## 🌟 产品介绍

### 1. AI虚拟角色陪伴

为微博生态打造的人格化AI情感陪伴产品，满足用户情感陪伴、兴趣交流、日常倾诉等多元化需求。

**核心功能**：
- 🤖 多角色选择（罗伯特/萌宠）
- 💬 实时对话交互
- 💖 亲密度系统
- 📞 语音通话（演示）
- 📤 分享功能

### 2. 心情漂流瓶

小海星App内独立的匿名心情分享场景，不绑定真实身份，让用户安全表达情绪。

**核心功能**：
- 🌊 匿名心情投递
- 😊 四类心情分类（开心/焦虑/迷茫/吐槽）
- 💖 共鸣互动
- 🚩 举报机制
- 👁 浏览数统计
- 📊 今日统计

---

## 🏗️ 技术架构

### 前端技术
- **纯原生实现**：HTML5 + CSS3 + JavaScript
- **响应式设计**：适配移动端和桌面端
- **状态管理**：LocalStorage + 内存状态
- **动画效果**：CSS3 Animations

### 后端技术
- **运行环境**：Node.js >= 16.0.0
- **Web框架**：Express.js
- **数据库**：SQLite (better-sqlite3)
- **API设计**：RESTful API

---

## 📁 项目结构

```
ai-companion-app/
├── README.md                   # 项目说明文档
├── package.json                # 依赖配置
├── server.js                   # 后端主入口
├── database/
│   ├── init.js                # 数据库初始化脚本
│   └── app.db                 # SQLite数据库文件
├── routes/
│   ├── ai-companion.js        # AI陪伴相关API
│   └── mood-bottle.js         # 心情漂流瓶相关API
├── public/
│   ├── index.html             # 首页（产品导航）
│   ├── ai-companion/
│   │   └── index.html         # AI陪伴前端页面
│   └── mood-bottle/
│       └── index.html         # 心情漂流瓶前端页面
└── .gitignore                 # Git忽略配置
```

---

## 🚀 快速开始

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

### 4. 启动服务

```bash
# 生产模式
npm start

# 开发模式（自动重启）
npm run dev
```

### 5. 访问应用

打开浏览器访问：
- **首页**：http://localhost:3000
- **AI陪伴**：http://localhost:3000/ai-companion
- **心情漂流瓶**：http://localhost:3000/mood-bottle

---

## 📡 API文档

### AI陪伴相关API

#### 获取角色列表
```
GET /api/ai-companion/characters
```

#### 获取对话历史
```
GET /api/ai-companion/chat/:characterId
```

#### 发送消息
```
POST /api/ai-companion/chat
Body: {
  "characterId": "robert",
  "message": "你好",
  "sessionId": "session_xxx"
}
```

#### 更新亲密度
```
POST /api/ai-companion/intimacy
Body: {
  "characterId": "robert",
  "sessionId": "session_xxx"
}
```

### 心情漂流瓶相关API

#### 获取心情列表
```
GET /api/mood-bottle/moods?category=all&page=1&limit=10
```

#### 发布心情
```
POST /api/mood-bottle/moods
Body: {
  "content": "今天心情不错",
  "category": "happy"
}
```

#### 共鸣/取消共鸣
```
POST /api/mood-bottle/resonance
Body: {
  "moodId": "mood_xxx",
  "sessionId": "session_xxx"
}
```

#### 举报心情
```
POST /api/mood-bottle/report
Body: {
  "moodId": "mood_xxx",
  "sessionId": "session_xxx"
}
```

#### 获取统计数据
```
GET /api/mood-bottle/statistics
```

---

## 🎨 设计亮点

### AI陪伴产品
- ✅ 温暖治愈的设计风格
- ✅ 蓝紫/粉橘双色调
- ✅ 流畅的交互动画
- ✅ 亲密度成长系统

### 心情漂流瓶产品
- ✅ 匿名感清晰设计
- ✅ 状态持久化机制
- ✅ 浏览数去重统计
- ✅ 运营筛选视角

---

## 📊 数据模型

### AI陪伴数据表

#### users (用户表)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### chat_history (聊天历史)
```sql
CREATE TABLE chat_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  character_id TEXT,
  message TEXT,
  is_ai BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### intimacy (亲密度)
```sql
CREATE TABLE intimacy (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  character_id TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 心情漂流瓶数据表

#### moods (心情表)
```sql
CREATE TABLE moods (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  content TEXT,
  category TEXT,
  resonance_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_reported BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### user_interactions (用户交互记录)
```sql
CREATE TABLE user_interactions (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  mood_id TEXT,
  interaction_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 环境配置

### 开发环境
```bash
NODE_ENV=development
PORT=3000
```

### 生产环境
```bash
NODE_ENV=production
PORT=80
```

---

## 📝 更新日志

### v1.0.0 (2026-04-25)
- ✨ 初始版本发布
- ✨ AI虚拟角色陪伴功能
- ✨ 心情漂流瓶功能
- ✨ 完整的前后端实现
- ✨ SQLite数据库集成

---

## 👥 贡献指南

欢迎提交Issue和Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**Made with ❤️ by congyu1995**
