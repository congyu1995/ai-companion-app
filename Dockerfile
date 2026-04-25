# Railway 部署配置 - 稳健版
FROM node:18-alpine

# 安装工具
RUN apk add --no-cache wget bash

WORKDIR /app

# 第一步：复制package文件并安装依赖
COPY backend/package-simple.json ./package.json
RUN npm install --production

# 第二步：复制后端代码
COPY backend/railway-simple.js ./
COPY backend/server.js ./

# 第三步：创建public目录（用于前端）
RUN mkdir -p public

# 第四步：复制前端文件（如果存在）
COPY frontend/dist ./dist_temp/
RUN if [ -d "dist_temp" ] && [ "$(ls -A dist_temp 2>/dev/null)" ]; then \
      cp -r dist_temp/* public/; \
    fi && \
    rm -rf dist_temp

# 第五步：创建默认页面（如果public为空）
RUN if [ ! "$(ls -A public 2>/dev/null)" ]; then \
      echo '<!DOCTYPE html><html><head><title>AI虚拟角色陪伴</title></head><body><h1>AI虚拟角色陪伴产品</h1><p>服务已启动，请访问API接口</p></body></html>' > public/index.html; \
    fi

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动服务
CMD ["node", "railway-simple.js"]