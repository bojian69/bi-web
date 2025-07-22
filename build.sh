#!/bin/bash

set -e

echo "🚀 开始构建 bi-web Docker镜像..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 构建Docker镜像
echo "📦 构建Docker镜像..."
docker build -t bi-web:latest .

# 显示镜像信息
echo "✅ 构建完成！"
echo "📊 镜像信息:"
docker images bi-web

echo ""
echo "🎯 使用方法:"
echo "  本地运行: docker run -p 8081:8081 --env-file .env bi-web:latest"
echo "  Compose: docker compose up -d"
echo "  访问地址: http://localhost:8081"

# 可选：标记为其他版本
if [ "$1" != "" ]; then
    echo "🏷️  标记版本: $1"
    docker tag bi-web:latest bi-web:$1
    echo "✅ 已标记为 bi-web:$1"
fi