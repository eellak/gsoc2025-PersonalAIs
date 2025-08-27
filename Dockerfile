# 使用 Node.js 官方镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 Python3、pip 和构建工具
RUN apk add --no-cache python3 py3-pip build-base git

# 用 pip 安装 uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 安装 pnpm 并安装 Node.js 依赖
RUN npm install -g pnpm

# 复制 Node.js 依赖文件
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 复制 Python pyproject.toml 和 uv.lock
COPY pyproject.toml uv.lock ./

# 使用 uv sync 安装 Python 依赖
RUN uv sync
RUN source .venv/bin/activate

# 复制整个项目
COPY . .

# 暴露 Node.js dev server 端口
EXPOSE 3000

# 默认启动命令

CMD ["/bin/sh", "-c", "source /app/.venv/bin/activate && npm run dev"]