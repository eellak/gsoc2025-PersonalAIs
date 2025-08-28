FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip build-base git
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY pyproject.toml uv.lock ./


RUN uv sync
RUN source .venv/bin/activate

COPY . .

EXPOSE 3000

CMD ["/bin/sh", "-c", "source /app/.venv/bin/activate && npm run dev"]
