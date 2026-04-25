# 🤖 AI虚拟角色陪伴产品

一个完整的、可实际使用的AI情感陪伴产品，包含后端API、前端界面、数据库和实时通讯功能。

## ✨ 功能特性

- **角色系统**: 罗伯特(蓝)、萌宠(粉) 两个AI陪伴角色
- **智能对话**: 基于OpenAI GPT的智能回复系统
- **亲密度系统**: 互动升级机制，建立长期情感连接
- **实时通讯**: WebSocket支持即时消息推送
- **语音通话**: 模拟语音通话界面
- **用户系统**: 手机号验证码登录，JWT认证
- **多端适配**: 完美适配移动端H5/小程序

## 🏗️ 技术栈

### 后端
- Node.js + Express
- PostgreSQL 数据库
- Redis 缓存
- WebSocket (Socket.io)
- OpenAI API
- Docker容器化

### 前端
- Vue 3 + Composition API
- Vite 构建工具
- Pinia 状态管理
- Vant UI组件库
- Socket.io-client

## 🚀 快速启动

### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-companion-app

# 2. 配置环境变量
cp docker/.env.example docker/.env
# 编辑 .env 文件，设置 OPENAI_API_KEY

# 3. 启动服务
cd docker
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost
# 后端API: http://localhost:3000/api
```

### 方式二：本地开发

#### 后端启动
```bash
cd backend
npm install
npm run dev
```

#### 前端启动
```bash
cd frontend
npm install
npm run dev
```

## 📁 项目结构

```
ai-companion-app/
├── backend/                 # 后端服务
│   ├── server.js           # 主服务入口
│   ├── package.json
│   └── Dockerfile
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── stores/         # Pinia状态管理
│   │   ├── utils/          # 工具函数
│   │   └── router/         # 路由配置
│   ├── package.json
│   └── Dockerfile
├── docker/                 # Docker配置
│   ├── docker-compose.yml
│   └── init.sql           # 数据库初始化
└── README.md
```

## 🔌 API接口

### 认证接口
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/login` - 验证码登录

### 用户接口
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息

### 角色接口
- `GET /api/characters` - 获取角色列表（含亲密度）

### 聊天接口
- `GET /api/chat/:characterId` - 获取聊天记录
- `POST /api/chat/:characterId` - 发送消息

### 通话接口
- `GET /api/calls` - 获取通话记录
- `POST /api/calls/:characterId` - 记录通话

### WebSocket
- 连接: `/socket.io`
- 事件: `new_message` - 新消息推送

## 🎨 界面预览

1. **登录页** - 手机号验证码登录
2. **首页** - 角色选择，显示亲密度等级
3. **聊天页** - 实时对话，支持发送消息、语音通话
4. **通话页** - 语音通话界面，动态音波效果
5. **个人页** - 用户信息、统计数据、设置

## 🔐 环境变量

### 后端 (.env)
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@localhost:5432/aicompanion
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
```

### 前端 (.env)
```
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## 🛠️ 开发计划

- [x] 基础架构搭建
- [x] 用户认证系统
- [x] AI对话功能
- [x] 亲密度系统
- [x] 语音通话界面
- [ ] 真实语音输入/播报
- [ ] 图片发送功能
- [ ] 分享到微博
- [ ] 多轮对话上下文
- [ ] 情感分析优化

## 📄 许可证

MIT License