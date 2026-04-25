# Railway 部署 - 最简化版本
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY backend/package-simple.json ./package.json

# 安装依赖
RUN npm install --production

# 复制后端代码
COPY backend/railway-simple.js ./
COPY backend/server.js ./

# 创建public目录
RUN mkdir -p public

# 复制前端文件
COPY frontend/dist ./dist_temp/
RUN cp -r dist_temp/* public/ 2>/dev/null || true && rm -rf dist_temp

# 创建默认页面
RUN echo '<!DOCTYPE html><html><head><title>AI虚拟角色陪伴</title></head><body><h1>AI虚拟角色陪伴产品</h1><p>服务已启动</p></body></html>' > public/index.html

EXPOSE 3000

# 使用node进行健康检查（不依赖wget）
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# 启动服务
CMD ["node", "railway-simple.js"]