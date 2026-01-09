# Qiankun 微前端详细指南

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      主应用 (main-app)                       │
│  - 注册子应用                                                │
│  - 全局状态管理                                              │
│  - 路由控制                                                  │
├─────────────────────────────────────────────────────────────┤
│         #sub-container (子应用挂载点)                        │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   sub-vue       │    │   sub-react     │                 │
│  │   Vue 3 子应用  │    │   React 子应用  │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 2. 关键配置文件

### 主应用 main-app/src/main.jsx

```javascript
// 子应用入口配置
const getEntry = (appName) => {
  if (import.meta.env.PROD) {
    return { 'sub-vue': '/qiankun-demo/sub-vue/', 'sub-react': '/qiankun-demo/sub-react/' }[appName]
  } else {
    return { 'sub-vue': '//localhost:7100', 'sub-react': '//localhost:7200' }[appName]
  }
}

// 注册子应用
registerMicroApps([
  {
    name: 'sub-vue',
    entry: getEntry('sub-vue'),
    container: '#sub-container',
    activeRule: isProduction ? '/qiankun-demo/sub-vue' : '/sub-vue',
  },
])

// 启动配置
start({
  prefetch: true,
  sandbox: { experimentalStyleIsolation: true },
})
```

### 子应用 Vite 配置

**Vue 子应用：**
```javascript
// sub-vue/vite.config.js
export default defineConfig({
  plugins: [
    vue(),
    qiankun('sub-vue', { useDevMode: !isProduction }),
  ],
  base: isProduction ? '/qiankun-demo/sub-vue/' : '/',
})
```

**React 子应用：**
```javascript
// sub-react/vite.config.js
// 注意：不使用 @vitejs/plugin-react，避免 react-refresh 与 qiankun 冲突
export default defineConfig({
  plugins: [
    qiankun('sub-react', { useDevMode: !isProduction }),
  ],
  base: isProduction ? '/qiankun-demo/sub-react/' : '/',
  esbuild: {
    jsxInject: `import React from 'react'`,  // 用 esbuild 处理 JSX
  },
})
```

### 子应用生命周期

```javascript
// sub-vue/src/main.js
renderWithQiankun({
  bootstrap() { /* 初始化 */ },
  mount(props) { /* 挂载，接收 props */ },
  unmount() { /* 卸载，清理资源 */ },
  update(props) { /* 更新 */ },
})
```

## 3. 主子应用通信

支持两种通信方式：

### 方式一：qiankun initGlobalState（推荐）

适用于跨应用全局状态共享。

**主应用：**
```javascript
import { initGlobalState } from 'qiankun'

const actions = initGlobalState({
  user: { name: '游客', role: 'guest' },
  theme: 'light',
  count: 0,
})

actions.setGlobalState({ count: 1 })        // 修改状态
actions.onGlobalStateChange((state) => {})  // 监听变化
```

**子应用：**
```javascript
// props 中包含 onGlobalStateChange, setGlobalState, offGlobalStateChange
props.onGlobalStateChange((state) => {
  console.log('收到状态:', state)
}, true)  // true: 立即获取当前值
```

### 方式二：props 传递 + provide/inject

适用于主应用向子应用单向传递数据或方法。

**主应用注册时传递 props：**
```javascript
registerMicroApps([{
  name: 'sub-vue',
  props: {
    mainAppName: 'qiankun-main',
    utils: { formatDate, request },  // 可传递工具方法
  },
}])
```

**Vue 子应用（provide/inject）：**
```javascript
// main.js
function render(props = {}) {
  app = createApp(App)
  app.provide('qiankunProps', props)  // provide 注入
  app.mount(mountElement)
}

// App.vue
const qiankunProps = inject('qiankunProps', {})
console.log(qiankunProps.mainAppName)  // 'qiankun-main'
```

**React 子应用（props 传递）：**
```javascript
// main.jsx
root.render(<App qiankunProps={props} />)

// App.jsx
function App({ qiankunProps = {} }) {
  console.log(qiankunProps.mainAppName)  // 'qiankun-main'
}
```

## 4. 隔离机制

### JS 沙箱

| 类型 | 原理 | 多实例 |
|------|------|--------|
| SnapshotSandbox | 快照 diff | 不支持 |
| LegacySandbox | 单 Proxy | 不支持 |
| ProxySandbox | 多 Proxy | 支持 (默认) |

### CSS 隔离

| 方案 | 配置 | 说明 |
|------|------|------|
| experimentalStyleIsolation | `sandbox: { experimentalStyleIsolation: true }` | 添加选择器前缀 |
| strictStyleIsolation | `sandbox: { strictStyleIsolation: true }` | Shadow DOM |
| CSS Modules | `.module.css` | 源码级隔离 |
| Vue scoped | `<style scoped>` | 源码级隔离 |

## 5. 常用命令

```bash
# 主应用目录下执行

npm run install:all      # 安装所有依赖
npm run build:all        # 构建所有应用
npm run preview:prod     # 构建并预览生产版本

# 单独构建
npm run build            # 主应用
npm run build:sub-vue    # Vue 子应用
npm run build:sub-react  # React 子应用
```

## 6. 端口配置

| 应用 | 开发端口 | 说明 |
|------|---------|------|
| main-app | 3000 | 主应用 |
| sub-vue | 7100 | Vue 子应用 |
| sub-react | 7200 | React 子应用 |
| preview | 4000 | 生产预览 |

## 7. 部署注意事项

### GitHub Pages

1. **base 路径**: 必须与仓库名一致 (`/qiankun-demo/`)
2. **客户端路由**: 使用 `history.pushState` 避免页面刷新
3. **404.html**: 复制 index.html 处理 SPA 路由
4. **.nojekyll**: 禁用 Jekyll 处理
5. **子应用独立访问重定向**: 见下方说明

### 子应用直接访问处理

**问题**：直接访问 `/qiankun-demo/sub-vue/` 会加载子应用的 `index.html`，而不是主应用。

**原因**：子应用目录下有独立的 `index.html`，GitHub Pages 会直接返回该文件。

**解决方案**：部署时删除子应用的 `index.html`：

```yaml
# .github/workflows/deploy.yml
- name: Create 404.html for SPA routing
  run: |
    cp ./dist/index.html ./dist/404.html
    touch ./dist/.nojekyll
    # 删除子应用 index.html
    rm -f ./dist/sub-vue/index.html
    rm -f ./dist/sub-react/index.html
```

**工作原理**：
- 删除子应用 `index.html` 后，访问 `/qiankun-demo/sub-vue/` 返回 404
- GitHub Pages 的 `404.html` 是主应用的副本
- 主应用加载后，qiankun 根据路由激活对应子应用
- qiankun 通过 fetch 加载子应用资源（JS/CSS），不依赖 `index.html`

### .nojekyll 文件作用

GitHub Pages 默认使用 Jekyll 处理站点，会导致：
- 忽略 `_` 开头的文件/目录（如 `_assets`）
- 对文件进行不必要的处理

创建空的 `.nojekyll` 文件告诉 GitHub Pages 直接提供静态文件，不经过 Jekyll 处理。

### 跨域部署 CORS 配置

如果子应用部署在不同域名：

```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
add_header Access-Control-Allow-Headers 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
```

## 8. 常见问题

| 问题 | 解决方案 |
|------|---------|
| 子应用样式污染主应用 | CSS Modules / scoped + experimentalStyleIsolation |
| 子应用切换后状态丢失 | unmount 保存状态，mount 恢复 |
| Vite 开发模式样式隔离不生效 | 依赖源码级隔离（Vite ESM 绕过 qiankun） |
| React 子应用 @react-refresh 错误 | 移除 @vitejs/plugin-react，用 esbuild |
| 点击导航主应用消失 | 使用 history.pushState 客户端路由 |
| 直接访问子应用 URL 不加载主应用 | 子应用 index.html 添加重定向脚本 |

## 9. 性能优化

- **预加载**: `prefetch: true` 空闲时预加载
- **按需加载**: `prefetch: ['critical-app']` 只预加载关键应用
- **优先级**: 使用 `criticalAppNames` / `minorAppNames` 分级加载
