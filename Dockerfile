FROM golang:1.21-alpine AS builder

WORKDIR /app

# 设置Go代理和模块下载
RUN go env -w GOPROXY=https://goproxy.cn,direct

# 复制依赖文件并下载
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建二进制文件
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o bi-web .

# 运行时镜像
FROM alpine:latest

# 安装必要的包
RUN apk --no-cache add ca-certificates tzdata

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# 创建必要目录
RUN mkdir -p /app/log && \
    chown -R appuser:appgroup /app

# 复制文件
COPY --from=builder --chown=appuser:appgroup /app/bi-web /app/
COPY --from=builder --chown=appuser:appgroup /app/static /app/static
COPY --chown=appuser:appgroup .env.example /app/

# 切换到非root用户
USER appuser

EXPOSE 8081

CMD ["./bi-web"]