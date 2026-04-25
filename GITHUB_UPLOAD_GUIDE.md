# 🚀 GitHub 上传指南

本指南将帮助您将 AI虚拟角色陪伴产品 上传到GitHub并部署到Railway。

---

## 📋 上传前检查清单

✅ **已包含文件（共34个）**

| 类别 | 文件数 | 说明 |
|------|--------|------|
| 配置文件 | 8 | Railway/Docker配置 |
| 后端代码 | 5 | Node.js后端服务 |
| 前端代码 | 12 | Vue3前端应用 |
| 数据库 | 2 | PostgreSQL初始化 |
| 文档 | 2 | README和部署指南 |
| 其他 | 5 | .gitignore等 |

---

## 🎯 方式一：GitHub CLI（最简单，推荐）

### 前提条件
- 已安装 [GitHub CLI](https://cli.github.com/)
- 已登录GitHub账号

### 操作步骤

#### 1. 安装GitHub CLI

**Mac:**
```bash
brew install gh
```

**Windows:**
```powershell
winget install --id GitHub.cli
```

**Linux:**
```bash
# Debian/Ubuntu
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

#### 2. 登录GitHub
```bash
gh auth login
```

按提示选择：
- GitHub.com
- HTTPS
- Yes (login with GitHub token)
- 粘贴您的Personal Access Token

#### 3. 一键上传
```bash
cd ai-companion-app

# 初始化Git
git init
git add .
git commit -m "🚀 AI虚拟角色陪伴产品 - 初始版本

✅ 功能特性:
- 用户注册/登录系统
- AI智能对话 (OpenAI GPT-3.5)
- 亲密度升级系统
- 语音通话界面
- 实时聊天功能

🚂 支持Railway一键部署"

# 创建GitHub仓库并推送
gh repo create ai-companion-app --public --source=. --push

echo "✅ 上传成功！"
echo "📎 仓库地址: https://github.com/$(gh api user -q .login)/ai-companion-app"
```

---

## 🎯 方式二：传统Git命令

### 操作步骤

#### 1. 在GitHub创建空仓库

访问：https://github.com/new

填写信息：
- **Repository name**: `ai-companion-app`
- **Description**: `AI虚拟角色陪伴产品 - 7x24小时情感陪伴`
- **Public** (公开)
- ❌ 不要勾选 "Add a README file"
- ❌ 不要勾选 "Add .gitignore"
- 点击 **Create repository**

#### 2. 上传代码

```bash
cd ai-companion-app

# 初始化Git
git init
git branch -M main

# 添加文件
git add .

# 提交
git commit -m "🚀 AI虚拟角色陪伴产品 - 初始版本"

# 设置远程仓库（替换YOUR_USERNAME为您的用户名）
git remote add origin https://github.com/YOUR_USERNAME/ai-companion-app.git

# 推送到GitHub
git push -u origin main

echo "✅ 上传成功！"
```

---

## 🎯 方式三：GitHub网页手动上传

如果不想使用命令行，可以直接在网页上传：

### 步骤1：创建仓库
1. 访问 https://github.com/new
2. Repository name: `ai-companion-app`
3. 选择 Public
4. ✅ 勾选 "Add a README file"
5. 点击 Create repository

### 步骤2：上传文件
1. 在仓库页面点击 "Add file" → "Upload files"
2. 将以下文件夹拖拽上传：
   - `backend/` 文件夹
   - `frontend/` 文件夹
   - `docker/` 文件夹
   - `Dockerfile.railway`
   - `railway.toml`
   - `railway.yaml`
   - `railway.json`
   - `README.md`
   - `RAILWAY_DEPLOY.md`
   - `.gitignore`

3. 在底部填写：
   - Commit message: `初始版本`
4. 点击 "Commit changes"

⚠️ 注意：网页上传需要多次操作，因为一次最多能上传100个文件。

---

## 📦 方式四：使用压缩包

### 步骤1：下载项目压缩包

项目文件位于：
```
/home/user/ai-companion-app/
```

### 步骤2：解压并上传
1. 下载 `ai-companion-app` 文件夹
2. 在GitHub创建新仓库
3. 使用GitHub网页上传（参考方式三）

---

## ✅ 验证上传成功

上传完成后，您的仓库应该包含以下结构：

```
ai-companion-app/
├── 📁 backend/              ✅ 后端代码
│   ├── server.js
│   ├── railway-entry.js
│   ├── package.json
│   └── Dockerfile
│
├── 📁 frontend/             ✅ 前端代码
│   ├── 📁 src/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── 📁 docker/               ✅ Docker配置
│   ├── docker-compose.yml
│   └── init.sql
│
├── 📄 Dockerfile.railway    ✅ Railway配置
├── 📄 railway.toml
├── 📄 railway.yaml
├── 📄 README.md
├── 📄 RAILWAY_DEPLOY.md
└── 📄 .gitignore
```

检查方法：
访问 `https://github.com/YOUR_USERNAME/ai-companion-app`

---

## 🚀 上传后立即部署到Railway

### 方法A：一键部署按钮

在您的仓库 README.md 中添加：

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/ai-companion-app)
```

### 方法B：手动部署

1. 访问 https://railway.app/new
2. 点击 "Deploy from GitHub repo"
3. 选择 `ai-companion-app` 仓库
4. 点击 Deploy
5. 添加 PostgreSQL 数据库（New → Database → PostgreSQL）
6. 等待构建完成（3-5分钟）
7. 🎉 产品上线！

---

## 🔗 生成部署链接

上传成功后，将 `YOUR_USERNAME` 替换为您的GitHub用户名，即可分享部署链接：

```
https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/ai-companion-app
```

---

## ❓ 常见问题

### Q1: git push 提示权限错误
**解决：**
1. 生成Personal Access Token: https://github.com/settings/tokens
2. 勾选 `repo` 权限
3. 在push时使用token作为密码

### Q2: 文件太大无法上传
**解决：** 单个文件不能超过100MB，本项目的所有文件都符合要求

### Q3: 想修改代码后重新上传
```bash
cd ai-companion-app
git add .
git commit -m "更新说明"
git push
```

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 具体错误信息截图
2. 您的操作系统
3. Git版本（运行 `git --version`）

---

**预计上传时间：2-5分钟**

选择最适合您的方式开始上传吧！🚀