# 使用Node.js 20 LTS作为基础镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# 复制package.json
COPY package*.json ./

# 安装依赖（使用npm install而不是npm ci）
RUN npm install --omit=dev

# 复制应用代码
COPY . .

# 初始化数据库
RUN node database/init.js

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "server.js"]
