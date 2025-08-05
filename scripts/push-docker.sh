#!/bin/bash
# 推送Docker镜像到远程仓库的脚本 - 支持多架构构建

set -e

# 设置变量
DOCKER_REGISTRY=${1:-"docker.io/yourusername"}  # 默认为Docker Hub
TAG=${2:-"latest"}                              # 默认标签为latest
IMAGE_NAME="bi-web"                             # 镜像名称
BUILDER_NAME="bi-web-builder"                   # buildx构建器名称

# 支持的平台
PLATFORMS="linux/amd64,linux/arm64"

# 显示配置信息
echo "======================================"
echo "Docker多架构镜像推送配置"
echo "======================================"
echo "仓库地址: $DOCKER_REGISTRY"
echo "镜像名称: $IMAGE_NAME"
echo "镜像标签: $TAG"
echo "支持平台: $PLATFORMS"
echo "完整镜像: $DOCKER_REGISTRY/$IMAGE_NAME:$TAG"
echo "======================================"

# 确认操作
read -p "是否继续推送多架构镜像? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "操作已取消"
    exit 1
fi

# 检查并创建buildx构建器
echo "🔧 检查Docker buildx构建器..."
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "创建新的buildx构建器: $BUILDER_NAME"
    docker buildx create --name $BUILDER_NAME --driver docker-container --bootstrap
fi

# 使用构建器
echo "🔄 切换到构建器: $BUILDER_NAME"
docker buildx use $BUILDER_NAME

# 登录到Docker仓库
echo "🔐 请登录到Docker仓库..."
docker login

# 构建并推送多架构镜像
echo "🚀 正在构建并推送多架构镜像..."
echo "平台: $PLATFORMS"
docker buildx build \
    --platform $PLATFORMS \
    --tag $DOCKER_REGISTRY/$IMAGE_NAME:$TAG \
    --push \
    .

# 验证镜像
echo "🔍 验证推送的镜像..."
docker buildx imagetools inspect $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# 完成
echo "======================================"
echo "✅ 多架构镜像推送完成!"
echo "📦 镜像地址: $DOCKER_REGISTRY/$IMAGE_NAME:$TAG"
echo "🏗️  支持架构: $PLATFORMS"
echo "======================================"
echo ""
echo "📋 使用方法:"
echo "  docker run -p 8081:8081 $DOCKER_REGISTRY/$IMAGE_NAME:$TAG"
echo "  docker pull $DOCKER_REGISTRY/$IMAGE_NAME:$TAG"