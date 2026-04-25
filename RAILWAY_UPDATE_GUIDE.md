# 🚀 Railway部署更新指南

## ✅ 已完成的操作

1. ✅ 更新了所有代码为心情漂流瓶产品
2. ✅ 添加了Procfile（Railway启动配置）
3. ✅ 添加了railway.toml（Railway部署配置）
4. ✅ 更新了package.json（项目名称和描述）
5. ✅ 清理了所有旧的AI陪伴相关文件
6. ✅ 代码已推送到GitHub

---

## 📋 项目当前状态

### GitHub仓库
```
https://github.com/congyu1995/ai-companion-app
```

### Railway应用
```
https://ai-companion-app-production-3082.up.railway.app/
```

---

## 🔄 如何触发Railway重新部署

### 方法一：手动触发重新部署（推荐）

1. **访问Railway控制台**
   ```
   https://railway.app/
   ```

2. **登录并找到您的项目**
   - 点击您的项目 `ai-companion-app`

3. **触发重新部署**
   - 进入 `Deployments` 标签
   - 点击右上角的 `Redeploy` 按钮
   - 或者点击 `New Deployment` → `Deploy from GitHub`

4. **等待部署完成**
   - Railway会自动拉取最新代码
   - 构建并启动服务
   - 部署完成后状态会变为 `SUCCESS`

---

### 方法二：通过环境变量触发

1. 在Railway项目中，进入 `Variables` 标签
2. 添加一个环境变量：
   ```
   FORCE_REDEPLOY=true
   ```
3. 保存后，Railway会自动触发重新部署

---

### 方法三：修改代码触发（已自动完成）

✅ 已完成！我们刚刚推送了新代码，Railway应该会自动检测并部署。

---

## 🔍 检查部署状态

### 1. 查看Railway日志

在Railway项目中：
1. 点击 `Deployments` 标签
2. 点击最新的部署
3. 查看 `Build Logs` 和 `Deploy Logs`

### 2. 检查健康状态

访问健康检查端点：
```
https://ai-companion-app-production-3082.up.railway.app/api/health
```

期望返回：
```json
{
  "status": "ok",
  "product": "小海星·心情漂流瓶",
  ...
}
```

---

## 📦 项目文件结构

```
ai-companion-app/
├── Procfile                    # Railway启动命令
├── railway.toml                # Railway部署配置
├── package.json                # 项目依赖（心情漂流瓶）
├── server.js                   # 后端服务器
├── database/
│   └── init.js                 # 数据库初始化
├── routes/
│   └── mood-bottle.js          # 心情漂流瓶API
└── public/
    └── index.html              # 心情漂流瓶前端
```

---

## ⚠️ 常见问题解决

### 问题1：还是看到旧的AI陪伴界面

**解决方案**：
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 硬刷新页面（Ctrl+F5）
3. 或使用无痕模式访问

### 问题2：Railway部署失败

**检查步骤**：
1. 查看Build Logs错误信息
2. 确认Node.js版本 >= 16.0.0
3. 确认所有依赖已正确安装

**可能的错误**：
- `better-sqlite3` 编译失败 → 需要Python环境
- 解决方法：Railway通常会自动处理

### 问题3：页面无法访问

**检查清单**：
- ✅ Railway部署状态是否为SUCCESS
- ✅ PORT环境变量是否正确（Railway自动设置）
- ✅ 健康检查端点是否正常

---

## 🎯 验证部署成功

### 1. 访问主页
```
https://ai-companion-app-production-3082.up.railway.app/
```

**期望看到**：
- 🌊 标题：心情漂流瓶
- 副标题：悄悄说出你的心事，让大海带走烦恼
- 两个统计卡片：今日新增、总心情数

### 2. 测试API
```
https://ai-companion-app-production-3082.up.railway.app/api/health
```

**期望返回**：
```json
{
  "status": "ok",
  "product": "小海星·心情漂流瓶"
}
```

### 3. 测试心情列表API
```
https://ai-companion-app-production-3082.up.railway.app/api/mood-bottle/moods?category=all&page=1&limit=10
```

---

## 📊 Railway部署配置说明

### Procfile
```
web: node server.js
```
告诉Railway启动命令

### railway.toml
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node server.js"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### package.json
- 名称：mood-bottle
- 启动脚本：`npm start` → `node server.js`
- 依赖：express, better-sqlite3, cors, uuid

---

## 🔧 手动操作Railway部署（如果自动部署未触发）

1. **访问Railway**
   ```
   https://railway.app/project/ai-companion-app
   ```

2. **找到服务**
   - 点击您的服务

3. **触发部署**
   - 点击 `Deployments` 标签
   - 点击 `Redeploy` 按钮

4. **监控日志**
   - 查看实时构建日志
   - 确认部署成功

---

## ✨ 部署成功后的操作

### 1. 测试功能
- ✅ 查看心情列表
- ✅ 发布新心情
- ✅ 测试共鸣功能
- ✅ 测试举报功能

### 2. 检查数据
- 访问统计API确认数据库已初始化
- 发布几条测试心情

### 3. 分享链接
```
https://ai-companion-app-production-3082.up.railway.app/
```

---

## 📞 如果还是看不到更新

### 方案A：手动触发重新部署
1. 登录Railway
2. 找到项目 → Deployments
3. 点击 `Redeploy`

### 方案B：检查Railway配置
1. 确认GitHub仓库连接正确
2. 确认分支是 `main`
3. 确认自动部署已开启

### 方案C：联系支持
- Railway Discord: https://discord.gg/railway
- Railway文档: https://docs.railway.app/

---

## 🎊 总结

✅ **代码已推送到GitHub**
✅ **Railway配置已添加**
✅ **项目已更新为心情漂流瓶**

**下一步**：
1. 登录Railway检查部署状态
2. 如果需要，手动触发重新部署
3. 清除浏览器缓存后访问应用

**预期结果**：
访问 `https://ai-companion-app-production-3082.up.railway.app/` 应该看到心情漂流瓶界面，而不是AI陪伴界面。

---

**更新时间**: 2026-04-25 19:47
**状态**: ✅ 代码已推送，等待Railway自动部署或手动触发
