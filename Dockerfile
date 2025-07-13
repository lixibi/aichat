FROM node:22-alpine AS base

FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json yarn.lock ./

# 设置多个Yarn镜像源并尝试安装（POSIX兼容写法）
RUN set -e; \
    registries="https://registry.npmmirror.com/ https://registry.npmjs.org/ https://registry.yarnpkg.com/"; \
    success=0; \
    for registry in $registries; do \
        echo "尝试Yarn镜像源: $registry"; \
        yarn config set registry "$registry"; \
        if yarn install --network-timeout 300000; then \
            echo "成功使用镜像源: $registry"; \
            success=1; \
            break; \
        else \
            echo "镜像源 $registry 失败，尝试下一个..."; \
            yarn cache clean; \
        fi; \
    done; \
    if [ $success -ne 1 ]; then echo "所有镜像源尝试失败"; exit 1; fi

# 安装sharp时设置多个npm镜像源（POSIX兼容写法）
RUN set -e; \
    registries="https://registry.npmmirror.com/ https://registry.npmjs.org/ https://registry.yarnpkg.com/"; \
    success=0; \
    for registry in $registries; do \
        echo "尝试npm镜像源: $registry"; \
        npm config set registry "$registry"; \
        if npm install sharp; then \
            echo "成功使用镜像源安装sharp: $registry"; \
            success=1; \
            break; \
        else \
            echo "镜像源 $registry 安装sharp失败，尝试下一个..."; \
            npm cache clean --force; \
        fi; \
    done; \
    if [ $success -ne 1 ]; then echo "所有sharp安装尝试失败"; exit 1; fi

FROM base AS builder

RUN apk update && apk add --no-cache git

ENV OPENAI_API_KEY=""
ENV GOOGLE_API_KEY=""
ENV CODE=""

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

FROM base AS runner
WORKDIR /app

RUN apk add git proxychains-ng

ENV PROXY_URL=""
ENV OPENAI_API_KEY=""
ENV GOOGLE_API_KEY=""
ENV CODE=""

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

EXPOSE 3000

CMD if [ -n "$PROXY_URL" ]; then \
    export HOSTNAME="0.0.0.0"; \
    protocol=$(echo $PROXY_URL | cut -d: -f1); \
    host=$(echo $PROXY_URL | cut -d/ -f3 | cut -d: -f1); \
    port=$(echo $PROXY_URL | cut -d: -f3); \
    conf=/etc/proxychains.conf; \
    echo "strict_chain" > $conf; \
    echo "proxy_dns" >> $conf; \
    echo "remote_dns_subnet 224" >> $conf; \
    echo "tcp_read_time_out 15000" >> $conf; \
    echo "tcp_connect_time_out 8000" >> $conf; \
    echo "localnet 127.0.0.0/255.0.0.0" >> $conf; \
    echo "localnet ::1/128" >> $conf; \
    echo "[ProxyList]" >> $conf; \
    echo "$protocol $host $port" >> $conf; \
    cat /etc/proxychains.conf; \
    proxychains -f $conf node server.js; \
    else \
    node server.js; \
    fi
