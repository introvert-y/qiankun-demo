# Qiankun 微前端示例

基于 qiankun 的微前端 Demo，包含一个主应用和两个子应用。

## 项目结构

```
qiankun-demo/
├── main-app/          # 主应用 (React + Vite)
├── sub-vue/           # Vue 子应用 (Vue 3 + Vite)
├── sub-react/         # React 子应用 (React + Vite)
├── docs/              # 详细文档
└── .github/workflows/ # GitHub Actions 部署配置
```

## 快速开始

### 开发模式

```bash
# 1. 安装所有依赖
cd main-app && npm run install:all

# 2. 启动所有应用（需要3个终端）
# 终端1 - 主应用
cd main-app && npm run dev      # http://localhost:3000

# 终端2 - Vue 子应用
cd sub-vue && npm run dev       # http://localhost:7100

# 终端3 - React 子应用
cd sub-react && npm run dev     # http://localhost:7200

# 3. 访问 http://localhost:3000
```

### 生产构建预览

```bash
cd main-app
npm run preview:prod    # 构建并预览，访问 http://localhost:4000/qiankun-demo/
```

## 核心功能

| 功能 | 说明 |
|------|------|
| 子应用加载 | HTML Entry 方式加载 |
| 全局状态 | initGlobalState 跨应用通信 |
| JS 沙箱 | ProxySandbox 隔离 |
| CSS 隔离 | experimentalStyleIsolation |
| 预加载 | 按优先级预加载子应用 |

## 部署

推送到 GitHub 后自动部署到 GitHub Pages：

```bash
git add . && git commit -m "deploy" && git push
```

访问：`https://<username>.github.io/qiankun-demo/`

## 文档

详细文档请查看 [docs/guide.md](./docs/guide.md)
