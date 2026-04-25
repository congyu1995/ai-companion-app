# 🚂 Railway 一键部署指南

## 📋 前置准备

1. 注册 [Railway](https://railway.app/) 账号（支持GitHub登录）
2. 准备 OpenAI API Key（可选，没有则使用模拟回复）

---

## 🚀 部署步骤

### 方式一：一键部署按钮（最简单）

点击以下按钮直接部署：

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/ai-companion-app)

> ⚠️ 注意：如果显示404，请先Fork此仓库到你的GitHub，然后使用方式二部署

---

### 方式二：从GitHub部署（推荐）

#### 第1步：创建GitHub仓库

1. 打开 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 仓库名：`ai-companion-app`
4. 选择 `Public`
5. 点击 `Create repository`

#### 第2步：上传代码

```bash
# 在本地项目的根目录执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/ai-companion-app.git
git push -u origin main
```

#### 第3步：在Railway部署

1. 访问 [Railway Dashboard](https://railway.app/dashboard)
2. 点击 `New Project`
3. 选择 `Deploy from GitHub repo`
4. 选择你的 `ai-companion-app` 仓库
5. 点击 `Add Variables`，添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API密钥（可选） | `sk-xxxxxxxx...` |
| `JWT_SECRET` | JWT密钥（自动生成即可） | `任意随机字符串` |

6. 点击 `Deploy`
7. 等待构建完成（约3-5分钟）

#### 第4步：添加数据库

1. 在项目页面点击 `New` → `Database` → `Add PostgreSQL`
2. 等待数据库启动

#### 第5步：访问应用

1. 点击顶部域名链接（如 `ai-companion-app-production.up.railway.app`）
2. 您的产品已上线！🎉

---

## 📁 Railway配置文件说明

项目已包含以下Railway配置文件：

| 文件 | 作用 |
|------|------|
| `railway.toml` | Railway主配置文件 |
| `Dockerfile.railway` | 构建Docker镜像 |
| `backend/railway-entry.js` | Railway专用入口 |

---

## ⚙️ 环境变量配置

### 必需变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | PostgreSQL连接地址 | Railway自动提供 |
| `REDIS_URL` | Redis连接地址 | Railway自动提供 |

### 可选变量

| 变量 | 说明 | 建议 |
|------|------|------|
| `OPENAI_API_KEY` | AI回复功能 | 建议配置，体验更佳 |
| `JWT_SECRET` | 认证密钥 | 不设置则自动生成 |
| `NODE_ENV` | 环境模式 | `production` |

---

## 🔧 常见问题

### 1. 部署后页面显示404
**解决**：检查 `Dockerfile.railway` 是否正确复制了前端构建文件

### 2. 数据库连接失败
**解决**：在Railway项目页面点击数据库 → Variables，确认 `DATABASE_URL` 已自动添加到项目

### 3. 验证码收不到
**解决**：这是演示功能，验证码会显示在响应中。生产环境需接入短信服务商。

### 4. 免费额度
- Railway 提供 $5/月 免费额度
- 足够支撑小型应用运行
- PostgreSQL 和 Redis 都包含在内

---

## 🎨 自定义配置

### 修改品牌信息

编辑 `backend/railway-entry.js` 中的角色配置：

```javascript
// 第200行附近
INSERT INTO characters (name, avatar, description, ...) VALUES
('你的角色名', '🎭', '角色描述', ...)
```

### 接入真实短信服务

修改 `railway-entry.js` 中的发送验证码逻辑：
- 阿里云短信
- 腾讯云短信
- 七牛云短信

---

## 📞 技术支持

如有问题：
1. 查看 Railway 日志：`项目 → Deployments → 最新部署 → View Logs`
2. 检查环境变量是否正确设置
3. 确认数据库已启动

---

**预计部署时间：5-10分钟**

现在就开始部署您的AI陪伴产品吧！ ✨