# bi-web

🚀 **数据分析Web平台** - 基于Go语言的MySQL数据查询可视化工具

[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://mysql.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-green.svg)](https://docker.com)

## 🎯 项目概述

一个轻量级、高性能的数据可视化平台，专为快速SQL查询和数据分析而设计。支持多种图表类型，提供直观的数据洞察。

## 🏗️ 技术架构

### 核心特性
- **🔧 前后端分离**: 前端HTML/CSS/JS + 后端Go服务
- **🛡️ 中间件架构**: 日志记录、错误恢复、可视化处理
- **📦 模块化设计**: 清晰的代码组织和职责分离
- **🐳 容器化部署**: Docker + Docker Compose支持
- **⚡ 高性能**: Go语言原生性能优势

### 项目结构

```
bi-web/
├── api/                    # 🔌 API处理层
│   ├── query.go           # SQL查询处理
│   └── merge.go           # 数据合并处理
├── config/                 # ⚙️ 配置管理
│   └── config.go          # 环境配置加载
├── db/                     # 🗄️ 数据库层
│   └── database.go        # MySQL连接和操作
├── frontend/               # 🎨 前端模板
│   └── templates.go       # HTML模板渲染
├── middleware/             # 🛡️ 中间件层
│   ├── logger.go          # 请求日志记录
│   └── visualization.go   # 可视化处理
├── static/                 # 📁 静态资源
│   ├── css/               # 样式文件
│   │   ├── modern.css     # 现代化UI样式
│   │   └── style.css      # 基础样式
│   └── js/                # JavaScript文件
│       ├── chart.min.js   # Chart.js图表库
│       ├── main.js        # 主要交互逻辑
│       ├── data-analyzer.js # 数据分析器
│       └── [其他图表组件]
├── utils/                  # 🔧 工具函数
│   └── logger.go          # 日志工具
├── log/                    # 📝 日志目录
├── .env                    # 🔐 环境变量
├── Dockerfile             # 🐳 Docker构建
├── docker-compose.yml     # 🐳 容器编排
└── main.go                # 🚀 程序入口
```

## ✨ 核心功能

### 🔍 数据查询
- **MySQL 8.0+** 数据库连接
- **实时SQL执行** 支持复杂查询
- **查询历史** 记录和重用
- **错误处理** 友好的错误提示

### 📊 数据可视化
- **📋 表格视图** - 原始数据展示
- **📊 柱状图** - 分类数据对比
- **📈 折线图** - 趋势分析
- **🥧 饼图** - 占比分析
- **🖼️ 图表导出** - PNG格式下载
- **🔄 多查询对比** - 并排数据分析

### 🛠️ 系统特性
- **🚀 高性能** - Go语言原生性能
- **🔒 安全性** - SQL注入防护
- **📝 日志系统** - 完整的操作记录
- **🐳 容器化** - Docker一键部署
- **🔧 中间件** - 模块化请求处理

## 📊 数据可视化指南

系统智能识别数据类型，自动推荐最适合的可视化方式。

### 📋 表格展示
**适用场景**: 所有查询结果的原始数据展示
- ✅ 支持所有数据类型
- ✅ 分页和排序功能
- ✅ 数据导出功能

### 📊 柱状图 (Bar Chart)
**适用场景**: 分类数据对比分析

**数据要求**:
- 📏 至少2列数据
- 🏷️ 第1列: 分类标签 (X轴)
- 📈 第2+列: 数值数据 (Y轴)

**示例SQL**:
```sql
-- 部门员工统计
SELECT department, COUNT(*) as employee_count 
FROM employees 
GROUP BY department;

-- 月度销售对比
SELECT MONTH(date) as month, SUM(amount) as total_sales
FROM sales 
WHERE YEAR(date) = 2024
GROUP BY MONTH(date);
```

### 📈 折线图 (Line Chart)
**适用场景**: 趋势分析和时间序列数据

**数据要求**:
- 📏 至少2列数据
- ⏰ 第1列: 时间/序列值 (X轴)
- 📊 第2+列: 数值数据 (Y轴)

**示例SQL**:
```sql
-- 日收入趋势
SELECT DATE(created_at) as date, SUM(revenue) as daily_revenue
FROM orders 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date;

-- 用户增长趋势
SELECT DATE(created_at) as date, COUNT(*) as new_users
FROM users
GROUP BY DATE(created_at)
ORDER BY date;
```

### 🥧 饼图 (Pie Chart)
**适用场景**: 占比和构成分析

**数据要求**:
- 📏 恰好2列数据
- 🏷️ 第1列: 分类标签
- 🔢 第2列: 正数值 (占比计算)

**示例SQL**:
```sql
-- 支出类别占比
SELECT category, SUM(amount) as total_amount
FROM expenses 
WHERE YEAR(date) = 2024
GROUP BY category;

-- 产品销量占比
SELECT product_name, SUM(quantity) as total_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY product_name;
```

## 🚀 快速开始

### 📋 环境要求
- **Go**: 1.21+
- **MySQL**: 8.0+
- **Docker**: 20.10+ (可选)

### 🔧 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd bi-web
```

2. **配置环境**
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件
vim .env
```

3. **安装依赖并运行**
```bash
# 下载Go模块
go mod tidy

# 启动服务
go run main.go
```

4. **访问应用**
```
🌐 http://localhost:8081
```

### 🐳 Docker部署

#### 多架构镜像构建和推送

```bash
# 本地多架构构建 (支持 linux/amd64 和 linux/arm64)
./scripts/build-multiarch.sh

# 指定标签
./scripts/build-multiarch.sh v1.0.0

# 推送多架构镜像到远程仓库
./scripts/push-docker.sh bojianli69 v25.7.23

# 指定自定义仓库
./scripts/push-docker.sh registry.example.com/myuser v1.0.0
```

#### 单容器部署

##### 基本部署
```bash
# 构建镜像
docker build -t bi-web:latest .

# 运行容器 (使用.env文件)
docker run -d \
  --name bi-web \
  -p 8081:8081 \
  --env-file .env \
  -v $(pwd)/log:/app/log \
  --restart unless-stopped \
  bi-web:latest
```

##### 直接指定环境变量
```bash
# 运行容器 (直接指定环境变量)
docker run -d \
  --name bi-web \
  -p 8081:8081 \
  -e DB_HOST=mysql-server \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=bi_database \
  -e PORT=8081 \
  -v $(pwd)/log:/app/log \
  --restart unless-stopped \
  bi-web:latest
```

##### 连接宿主机MySQL
```bash
# 运行容器 (连接宿主机MySQL)
docker run -d \
  --name bi-web \
  -p 8081:8081 \
  --env-file .env \
  -e DB_HOST=host.docker.internal \
  -v $(pwd)/log:/app/log \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  bi-web:latest
```

##### 使用网络模式
```bash
# 创建网络
docker network create bi-network

# 运行 MySQL
docker run -d \
  --name bi-mysql \
  --network bi-network \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=bi_database \
  -e MYSQL_USER=biuser \
  -e MYSQL_PASSWORD=bipassword \
  -v mysql_data:/var/lib/mysql \
  mysql:8.0

# 运行应用
docker run -d \
  --name bi-web \
  --network bi-network \
  -p 8081:8081 \
  -e DB_HOST=bi-mysql \
  -e DB_USER=biuser \
  -e DB_PASSWORD=bipassword \
  -e DB_NAME=bi_database \
  -v $(pwd)/log:/app/log \
  --restart unless-stopped \
  bi-web:latest
```

#### Docker Compose部署 (推荐)

##### docker-compose.yml 示例
```yaml
version: '3.8'

services:
  bi-web:
    build: .
    image: ${DOCKER_REGISTRY:-localhost}/bi-web:${TAG:-latest}  # 支持远程仓库部署
    container_name: bi-web
    restart: unless-stopped
    ports:
      - "8081:8081"
    # 同时支持从.env文件和环境变量读取配置
    env_file:
      - .env
    # 这里的环境变量会覆盖.env文件中的同名变量
    environment:
      - DB_HOST=${DB_HOST:-mysql}  # 默认使用容器服务名，可被.env或环境变量覆盖
      - DB_PORT=${DB_PORT:-3306}
      - DB_USER=${DB_USER:-biuser}
      - DB_PASSWORD=${DB_PASSWORD:-bipassword}
      - DB_NAME=${DB_NAME:-bi_database}
      - PORT=${PORT:-8081}
    volumes:
      - ./log:/app/log
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    container_name: bi-mysql
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=bi_database
      - MYSQL_USER=biuser
      - MYSQL_PASSWORD=bipassword
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

##### 常用命令
```bash
# 一键启动 (包含MySQL)
docker compose up -d

# 查看日志
docker compose logs -f

# 仅查看应用日志
docker compose logs -f bi-web

# 停止服务
docker compose down

# 停止服务并删除卷
docker compose down -v

# 重新构建并启动
docker compose up -d --build
```

##### 生产环境部署提示
- 生产环境中请修改默认密码
- 考虑使用外部数据库或数据卷备份策略
- 配置反向代理(如Nginx)以启用HTTPS

## ⚙️ 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 | 必填 |
|--------|------|--------|------|
| `DB_HOST` | MySQL主机地址 | `localhost` | ✅ |
| `DB_PORT` | MySQL端口 | `3306` | ❌ |
| `DB_USER` | 数据库用户名 | `root` | ✅ |
| `DB_PASSWORD` | 数据库密码 | - | ✅ |
| `DB_NAME` | 数据库名称 | `test` | ✅ |
| `PORT` | Web服务端口 | `8081` | ❌ |

### 配置优先级

配置加载顺序（优先级从高到低）：

1. 命令行环境变量（如 `docker run -e DB_HOST=custom-host ...`）
2. docker-compose.yml 中的 environment 变量
3. .env 文件中的变量
4. 应用程序默认值

### 配置文件示例

```env
# .env 文件配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=bojian
DB_PASSWORD=your_password
DB_NAME=pro_baseline
PORT=8081
```

## 🔧 开发指南

### 项目依赖
```go
// go.mod
module bi-web

go 1.21

require github.com/go-sql-driver/mysql v1.7.1
```

### API接口

#### 查询接口
```http
POST /api/query
Content-Type: application/json

{
  "query": "SELECT * FROM users LIMIT 10"
}
```

#### 合并接口
```http
POST /api/merge
Content-Type: application/json

{
  "queries": [
    "SELECT department, COUNT(*) FROM employees GROUP BY department",
    "SELECT status, COUNT(*) FROM orders GROUP BY status"
  ]
}
```

## 🎯 AI优化建议

### 🚀 性能优化
1. **连接池优化**: 实现数据库连接池管理
2. **查询缓存**: 添加Redis缓存层
3. **异步处理**: 大查询异步执行
4. **分页优化**: 智能分页和虚拟滚动

### 🔒 安全增强
1. **SQL注入防护**: 参数化查询
2. **访问控制**: JWT认证和权限管理
3. **查询限制**: 查询超时和资源限制
4. **审计日志**: 完整的操作审计

### 📊 功能扩展
1. **更多图表类型**: 散点图、热力图、仪表盘
2. **数据源支持**: PostgreSQL、MongoDB等
3. **实时数据**: WebSocket实时更新
4. **报表系统**: 定时报表和邮件推送

### 🛠️ 架构改进
1. **微服务化**: 查询服务、可视化服务分离
2. **配置中心**: 动态配置管理
3. **监控告警**: Prometheus + Grafana
4. **CI/CD**: 自动化部署流水线

### 🎨 用户体验
1. **响应式设计**: 移动端适配
2. **主题切换**: 深色/浅色模式
3. **快捷操作**: 键盘快捷键
4. **智能提示**: SQL语法提示和自动补全

## 📝 更新日志

### v1.0.0 (当前版本)
- ✅ 基础SQL查询功能
- ✅ 多种图表可视化
- ✅ Docker容器化部署
- ✅ 中间件架构
- ✅ 日志记录系统

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目链接: [GitHub Repository](https://github.com/bojian69/bi-web)
- 问题反馈: [Issues](https://github.com/bojian69/bi-web/issues)

---

⭐ 如果这个项目对你有帮助，请给个星标支持！