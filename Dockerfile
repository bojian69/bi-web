FROM golang:1.21-alpine AS builder

WORKDIR /app

# 设置Go代理和模块下载
RUN go env -w GOPROXY=https://goproxy.cn,direct

# 复制依赖文件并下载
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建二进制文件，添加优化标志
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -trimpath -o bi-web .

# 使用更小的运行时镜像
FROM alpine:3.18

# 安装必要的包并清理缓存
RUN apk --no-cache add ca-certificates tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

WORKDIR /app

# 创建非root用户和必要目录
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    mkdir -p /app/log && \
    chown -R appuser:appgroup /app

# 复制文件
COPY --from=builder --chown=appuser:appgroup /app/bi-web /app/
COPY --from=builder --chown=appuser:appgroup /app/static /app/static

# 切换到非root用户
USER appuser

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/ || exit 1

EXPOSE 8081

CMD ["./bi-web"]