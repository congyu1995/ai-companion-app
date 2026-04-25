# 🌊 小海星·心情漂流瓶

一个匿名的情感表达平台，让用户安全地分享心情，获得共鸣与支持。

---

## ✨ 产品介绍

**小海星·心情漂流瓶**是微博生态内的一个独立匿名心情分享场景。用户可以投递匿名心情，让它随波逐流，找到共鸣的人。

### 核心特点

- 🎭 **完全匿名** - 随机昵称，无真实身份暴露
- 💖 **情感共鸣** - 为他人的心情点赞，建立情感连接
- 🏷️ **心情分类** - 开心/焦虑/迷茫/吐槽，精准表达情绪
- 🚩 **内容安全** - 举报机制保障平台健康
- 👁 **被看见感** - 浏览数统计，感受他人关注
- 📱 **移动优先** - 完美适配手机端体验

---

## 🎯 产品目标

### 匿名感清晰
- ✅ 随机昵称（漂流瓶#数字）
- ✅ 无头像设计
- ✅ 纯文本内容
- ✅ 漂流瓶隐喻

### 互动反馈明确
- ✅ 共鸣状态持久保留
- ✅ 举报标记清晰可见
- ✅ 浏览数实时更新
- ✅ 每个操作都有视觉反馈

### 内容状态可控
- ✅ LocalStorage状态持久化
- ✅ 切换分类状态保留
- ✅ 刷新页面状态不丢失
- ✅ 关闭浏览器重开状态保留

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/congyu1995/ai-companion-app.git
cd ai-companion-app

# 2. 安装依赖
npm install

# 3. 初始化数据库
npm run init-db

# 4. 启动服务
npm run dev

# 5. 访问应用
# http://localhost:3000
```

### 生产部署

```bash
# 使用PM2部署
pm2 start server.js --name mood-bottle

# 或使用Docker
docker build -t mood-bottle .
docker run -d -p 3000:3000 mood-bottle
```

---

## 📱 核心功能

### 1. 心情投递
- 输入心情内容（200字限制）
- 选择心情分类（开心/焦虑/迷茫/吐槽）
- 系统生成随机昵称
- 投递成功后显示提示并高亮新卡片

### 2. 心情浏览
- 列表展示所有心情
- 分类筛选（全部/开心/焦虑/迷茫/吐槽）
- 无限滚动加载
- 显示浏览数、共鸣数

### 3. 共鸣互动
- Toggle切换共鸣状态
- 共鸣按钮动画反馈
- 实时更新共鸣数
- 状态持久保留

### 4. 举报机制
- 二次确认弹窗
- 已举报标记显示
- 防止重复举报
- 不能举报自己的心情

### 5. 统计数据
- 今日新增心情数
- 总心情数
- 实时更新

---

## 🛠️ 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web框架
- **better-sqlite3** - SQLite数据库
- **uuid** - UUID生成

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式和动画
- **JavaScript** - 交互逻辑
- **LocalStorage** - 会话管理

### 数据库
- **SQLite** - 轻量级数据库
- **3张数据表** - moods, user_interactions, statistics
- **索引优化** - 提升查询性能

---

## 📊 数据模型

### 心情表 (moods)
```sql
CREATE TABLE moods (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,          -- 随机昵称
    content TEXT NOT NULL,           -- 心情内容
    category TEXT NOT NULL,          -- 分类
    resonance_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_reported BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 用户交互记录表 (user_interactions)
```sql
CREATE TABLE user_interactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,        -- 会话ID
    mood_id TEXT NOT NULL,           -- 心情ID
    interaction_type TEXT NOT NULL,  -- 交互类型
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, mood_id, interaction_type)
);
```

### 统计数据表 (statistics)
```sql
CREATE TABLE statistics (
    id TEXT PRIMARY KEY,
    stat_key TEXT UNIQUE NOT NULL,
    stat_value INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 API文档

### 获取心情列表
```
GET /api/mood-bottle/moods?category=all&page=1&limit=10&sessionId=xxx
```

### 发布心情
```
POST /api/mood-bottle/moods
Body: {
  "content": "今天心情不错",
  "category": "happy",
  "sessionId": "xxx"
}
```

### 共鸣/取消共鸣
```
POST /api/mood-bottle/resonance
Body: {
  "moodId": "mood_xxx",
  "sessionId": "xxx"
}
```

### 举报心情
```
POST /api/mood-bottle/report
Body: {
  "moodId": "mood_xxx",
  "sessionId": "xxx"
}
```

### 获取统计数据
```
GET /api/mood-bottle/statistics
```

---

## 🎨 设计特色

### 视觉风格
- 🌊 海洋蓝白色调
- ✨ 清新治愈风格
- 📱 移动端优先设计
- 🎭 圆角卡片，柔和阴影

### 交互体验
- 📝 底部抽屉式输入
- 💖 共鸣心跳动画
- 🎯 新卡片高亮脉冲
- 🔄 流畅的分类切换
- ∞ 无限滚动加载

---

## 📁 项目结构

```
ai-companion-app/
├── server.js                # 后端主入口
├── package.json             # 项目依赖
├── database/
│   └── init.js              # 数据库初始化
├── routes/
│   └── mood-bottle.js       # API路由
├── public/
│   └── index.html           # 前端页面
└── README.md                # 项目文档
```

---

## 🌐 在线访问

**生产环境**: https://ai-companion-app-production-3082.up.railway.app/

---

## 📝 环境配置

### 开发环境
```bash
NODE_ENV=development
PORT=3000
```

### 生产环境
```bash
NODE_ENV=production
PORT=3000
```

---

## 🎯 使用场景

1. **日常情绪宣泄** - 用户匿名分享当天的心情
2. **寻找情感共鸣** - 通过共鸣功能找到同类
3. **压力释放** - 吐槽生活中的不如意
4. **分享快乐** - 记录生活中的美好瞬间
5. **寻求支持** - 在迷茫中寻找建议

---

## 📊 项目统计

- **后端代码**: ~550行
- **前端代码**: ~1100行
- **数据库表**: 3张
- **API端点**: 6个
- **功能模块**: 5个

---

## 🔧 后续优化

### 功能优化
- [ ] 心情回复功能
- [ ] 心情标签系统
- [ ] 热门心情推荐
- [ ] 心情搜索功能
- [ ] 数据导出功能

### 性能优化
- [ ] API缓存机制
- [ ] 图片CDN加速
- [ ] 数据库索引优化
- [ ] 前端性能优化

### 安全优化
- [ ] 内容审核系统
- [ ] API限流机制
- [ ] XSS防护
- [ ] HTTPS强制

---

## 📄 许可证

MIT License

---

## 👥 贡献指南

欢迎提交Issue和Pull Request！

---

**Made with ❤️ for 微博**

**GitHub**: https://github.com/congyu1995/ai-companion-app
