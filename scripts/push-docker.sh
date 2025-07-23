#!/bin/bash
# 推送Docker镜像到远程仓库的脚本

# 设置变量
DOCKER_REGISTRY=${1:-"docker.io/yourusername"}  # 默认为Docker Hub，可以替换为私有仓库
TAG=${2:-"latest"}                              # 默认标签为latest
IMAGE_NAME="bi-web"                             # 镜像名称

# 显示配置信息
echo "======================================"
echo "Docker镜像推送配置"
echo "======================================"
echo "仓库地址: $DOCKER_REGISTRY"
echo "镜像名称: $IMAGE_NAME"
echo "镜像标签: $TAG"
echo "完整镜像: $DOCKER_REGISTRY/$IMAGE_NAME:$TAG"
echo "======================================"

# 确认操作
read -p "是否继续推送? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "操作已取消"
    exit 1
fi

# 构建镜像
echo "正在构建镜像..."
docker build -t $IMAGE_NAME:$TAG .

# 标记镜像
echo "正在标记镜像..."
docker tag $IMAGE_NAME:$TAG $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# 登录到Docker仓库
echo "请登录到Docker仓库..."
docker login

# 推送镜像
echo "正在推送镜像到 $DOCKER_REGISTRY..."
docker push $DOCKER_REGISTRY/$IMAGE_NAME:$TAG

# 完成
echo "======================================"
echo "镜像推送完成!"
echo "镜像地址: $DOCKER_REGISTRY/$IMAGE_NAME:$TAG"
echo "======================================"