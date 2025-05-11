# 使用 Node.js 镜像
FROM node:18

# 创建工作目录
WORKDIR /app

# 复制依赖声明
COPY package*.json ./

# 安装依赖
RUN npm install --omit=dev

# 复制全部代码
COPY . .

# 打包前端项目
RUN npm run build

# 启动 Node.js 服务器（server.js）
CMD ["node", "server.js"]

# 暴露端口（兼容 Railway）
EXPOSE 8080
