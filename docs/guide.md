# Qiankun 微前端详细指南

## 1. 微前端核心概念

### 什么是微前端

```
传统单体应用的问题：
├── 代码量大，构建慢
├── 技术栈升级困难
├── 团队协作冲突多
└── 无法独立部署

微前端的解决思路：
├── 拆分成多个独立子应用
├── 子应用独立开发、部署
├── 主应用负责调度、集成
└── 运行时动态加载
```

### 核心概念

| 概念 | 说明 |
|------|------|
| 主应用（基座） | 负责子应用的注册、调度、公共功能 |
| 子应用 | 独立的前端应用，可以使用不同技术栈 |
| 应用加载 | 如何获取子应用的资源（HTML/JS/CSS） |
| 应用隔离 | JS 沙箱、CSS 隔离，防止应用间冲突 |
| 应用通信 | 主子应用、子应用之间如何传递数据 |

### qiankun 与 single-spa 的关系

```
qiankun = single-spa + 以下增强
    │
    ├── import-html-entry（HTML Entry 加载）
    ├── JS 沙箱（ProxySandbox / LegacySandbox）
    ├── CSS 隔离（Shadow DOM / Scoped CSS）
    ├── 预加载（prefetch）
    └── 全局状态管理（initGlobalState）
```

## 2. 架构概览

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

// Hash 路由匹配函数
const hashActiveRule = (hash) => (location) => location.hash.startsWith(hash)

// 注册子应用
registerMicroApps([
  {
    name: 'sub-vue',
    entry: getEntry('sub-vue'),
    container: '#sub-container',
    activeRule: hashActiveRule('#/sub-vue'),
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

每个子应用必须导出以下生命周期函数（single-spa 核心约定）：

```javascript
// sub-vue/src/main.js
renderWithQiankun({
  bootstrap() { /* 初始化，只执行一次 */ },
  mount(props) { /* 挂载，每次激活都执行 */ },
  unmount() { /* 卸载，每次离开都执行 */ },
  update(props) { /* 更新 */ },
})
```

### 应用状态流转

```
NOT_LOADED → LOADING_SOURCE_CODE → NOT_BOOTSTRAPPED
                                         ↓
                                    BOOTSTRAPPING
                                         ↓
              UNMOUNTING ← MOUNTED ← MOUNTING ← NOT_MOUNTED
                   ↓          ↑
                   └──────────┘
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

**ProxySandbox 原理（推荐）**：
```javascript
// 每个子应用有独立的 fakeWindow
class ProxySandbox {
  constructor() {
    const fakeWindow = {};
    this.proxy = new Proxy(fakeWindow, {
      get(target, key) {
        // 优先从 fakeWindow 取，否则从真实 window 取
        return key in target ? target[key] : window[key];
      },
      set(target, key, value) {
        // 所有修改都写入 fakeWindow，不污染真实 window
        target[key] = value;
        return true;
      },
    });
  }
}
```

### CSS 隔离

| 方案 | 配置 | 说明 |
|------|------|------|
| experimentalStyleIsolation | `sandbox: { experimentalStyleIsolation: true }` | 添加选择器前缀 |
| strictStyleIsolation | `sandbox: { strictStyleIsolation: true }` | Shadow DOM |
| CSS Modules | `.module.css` | 源码级隔离 |
| Vue scoped | `<style scoped>` | 源码级隔离 |

**Scoped CSS 原理**：
```css
/* 原始 */
.btn { color: red; }

/* 转换后 */
div[data-qiankun="sub-vue"] .btn { color: red; }
```

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
2. **Hash 路由**: 使用 `#/sub-vue` 格式避免服务器路由问题
3. **404.html**: 复制 index.html 处理 SPA 路由（备用）
4. **.nojekyll**: 禁用 Jekyll 处理

### Hash 路由（推荐）

本项目使用 Hash 路由模式，彻底避免 GitHub Pages 静态文件服务的路由问题。

**URL 格式**：
- 首页：`/qiankun-demo/#/`
- Vue 子应用：`/qiankun-demo/#/sub-vue`
- React 子应用：`/qiankun-demo/#/sub-react`

**优势**：
- `#` 后的内容不会发送到服务器，GitHub Pages 始终返回主应用
- 无需处理 404.html 回退、子应用重定向等复杂逻辑
- 直接访问 `/qiankun-demo/#/sub-vue` 可正确加载主应用和子应用

**配置方式**：
```javascript
// main.jsx
const hashActiveRule = (hash) => (location) => location.hash.startsWith(hash)

registerMicroApps([
  {
    name: 'sub-vue',
    activeRule: hashActiveRule('#/sub-vue'),
    // ...
  },
])

// App.jsx 导航
<a href="#/sub-vue">Vue 子应用</a>
```

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
| GitHub Pages 直接访问子应用路径失败 | 使用 Hash 路由 (`#/sub-vue`) |

## 9. 性能优化

- **预加载**: `prefetch: true` 空闲时预加载
- **按需加载**: `prefetch: ['critical-app']` 只预加载关键应用
- **优先级**: 使用 `criticalAppNames` / `minorAppNames` 分级加载

## 10. qiankun 核心原理

### HTML Entry（import-html-entry）

```
传统 single-spa：需要手动指定 JS 入口
qiankun：直接用 HTML 作为入口

工作流程：
1. fetch 子应用 HTML
2. 解析 HTML，提取 <script>、<style>、<link>
3. 执行 JS，获取生命周期函数
4. 将 HTML 模板插入容器
```

### 子应用加载流程

```javascript
// qiankun 内部简化逻辑
const html = await fetch(entry).then(res => res.text());
const { template, scripts, styles } = parseHTML(html);

// 加载样式
styles.forEach(loadStyle);

// 执行脚本，获取生命周期
const lifecycles = await execScripts(scripts);
```

## 11. 常见误区

| 误区 | 正确认识 |
|------|----------|
| 必须精通 single-spa | 了解核心概念即可，qiankun 已封装 |
| 微前端能解决所有问题 | 有额外复杂性，简单项目不需要 |
| 子应用必须用不同框架 | 相同框架也可以，主要是解耦 |
| CSS 隔离能完美解决样式冲突 | 仍需规范，特别是全局样式 |

## 12. 学习资源

### 官方资源

| 资源 | 链接 |
|------|------|
| qiankun 官方文档 | https://qiankun.umijs.org/zh |
| single-spa 文档 | https://single-spa.js.org/ |
| import-html-entry | https://github.com/kuitos/import-html-entry |

### 源码阅读顺序

```
1. single-spa 核心（约 500 行）
   └── src/applications/app.js

2. import-html-entry
   └── src/index.js

3. qiankun 核心
   ├── src/apis.ts          # 注册、启动 API
   ├── src/sandbox/         # 沙箱实现
   │   └── proxySandbox.ts
   └── src/loader.ts        # 应用加载
```
