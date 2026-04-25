# Railway 部署 - 完整版（包含前端界面）
FROM node:18-alpine

WORKDIR /app

# 复制package文件并重命名为package.json
COPY backend/package-simple.json ./package.json

# 安装依赖
RUN npm install --production

# 复制后端代码
COPY backend/railway-simple.js ./

# 创建public目录并复制完整前端界面
RUN mkdir -p public
COPY frontend/index.html ./public/index.html

EXPOSE 3000

CMD ["node", "railway-simple.js"]