# Railway 部署 - 超简化版本（避免所有可能的错误）
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制并安装依赖
COPY backend/package-simple.json ./
RUN npm install --production

# 复制后端代码
COPY backend/railway-simple.js ./

# 创建public目录
RUN mkdir -p public

# 复制前端文件（如果存在）
COPY frontend/dist/index.html ./public/index.html

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "railway-simple.js"]