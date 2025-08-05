#!/bin/bash
# 本地多架构构建脚本

set -e

IMAGE_NAME="bi-web"
TAG=${1:-"latest"}
BUILDER_NAME="bi-web-builder"
PLATFORMS="linux/amd64,linux/arm64"

echo "🚀 开始多架构构建..."
echo "镜像: $IMAGE_NAME:$TAG"
echo "平台: $PLATFORMS"
echo "========================================"

# 检查并创建buildx构建器
echo "🔧 检查Docker buildx构建器..."
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "创建新的buildx构建器: $BUILDER_NAME"
    docker buildx create --name $BUILDER_NAME --driver docker-container --bootstrap
fi

# 使用构建器
echo "🔄 切换到构建器: $BUILDER_NAME"
docker buildx use $BUILDER_NAME

# 构建多架构镜像（不推送，仅本地）
echo "📦 构建多架构镜像..."
docker buildx build \
    --platform $PLATFORMS \
    --tag $IMAGE_NAME:$TAG \
    --load \
    .

echo "✅ 多架构构建完成!"
echo "📊 镜像信息:"
docker images $IMAGE_NAME

echo ""
echo "💡 提示:"
echo "  - 本地构建完成，镜像已加载到本地Docker"
echo "  - 如需推送到远程仓库，请使用: ./scripts/push-docker.sh"