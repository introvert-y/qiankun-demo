import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerMicroApps, start, initGlobalState } from 'qiankun'
import './index.css'
import App from './App.jsx'

// ============================================================
// 0. 环境配置
// ============================================================
const isProduction = import.meta.env.PROD

// 子应用入口地址 - 使用条件表达式确保 Vite 正确处理
const getEntry = (appName) => {
  if (import.meta.env.PROD) {
    // 生产环境：相对路径
    const entries = {
      'sub-vue': '/qiankun-demo/sub-vue/',
      'sub-react': '/qiankun-demo/sub-react/',
    }
    return entries[appName]
  } else {
    // 开发环境：本地服务
    const entries = {
      'sub-vue': '//localhost:7100',
      'sub-react': '//localhost:7200',
    }
    return entries[appName]
  }
}

// ============================================================
// 1. 性能监控工具
// ============================================================
const performanceMonitor = {
  // 存储各子应用的加载时间点
  timings: {},

  // 记录开始时间
  markStart(appName, phase) {
    const key = `${appName}-${phase}`
    this.timings[key] = performance.now()
  },

  // 计算并输出耗时
  markEnd(appName, phase) {
    const key = `${appName}-${phase}`
    const startTime = this.timings[key]
    if (startTime) {
      const duration = (performance.now() - startTime).toFixed(2)
      console.log(`📊 [性能] ${appName} ${phase}: ${duration}ms`)
      return parseFloat(duration)
    }
    return 0
  },

  // 输出完整报告
  report(appName) {
    console.log(`\n📈 ===== ${appName} 加载性能报告 =====`)
    const loadTime = this.timings[`${appName}-load`]
      ? (this.timings[`${appName}-mount-end`] - this.timings[`${appName}-load`]).toFixed(2)
      : 'N/A'
    console.log(`   总加载时间: ${loadTime}ms`)
    console.log(`   ================================\n`)
  }
}

// ============================================================
// 2. 初始化全局状态
// ============================================================
const initialState = {
  user: { name: '游客', role: 'guest' },
  theme: 'light',
  count: 0,
}

const actions = initGlobalState(initialState)

actions.onGlobalStateChange((state, prev) => {
  console.log('[主应用] 状态变化:', state)
})

export { actions }

// ============================================================
// 3. 渲染主应用
// ============================================================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ============================================================
// 4. 防止 HMR 重复初始化
// ============================================================
if (window.__QIANKUN_STARTED__) {
  console.log('⚠️  [qiankun] 已初始化，跳过重复启动')
} else {
  window.__QIANKUN_STARTED__ = true
  initQiankun()
}

function initQiankun() {
// ============================================================
// 5. 子应用配置（带优先级标记）
// ============================================================
const microApps = [
  {
    name: 'sub-vue',
    entry: getEntry('sub-vue'),  // 根据环境自动获取入口地址
    container: '#sub-container',
    activeRule: isProduction ? '/qiankun-demo/sub-vue' : '/sub-vue',
    props: {
      mainAppName: 'qiankun-main',
    },
    priority: 'high',
  },
  {
    name: 'sub-react',
    entry: getEntry('sub-react'),
    container: '#sub-container',
    activeRule: isProduction ? '/qiankun-demo/sub-react' : '/sub-react',
    props: {
      mainAppName: 'qiankun-main',
    },
    priority: 'low',
  },
]

// ============================================================
// 5. 注册子应用（带性能监控的生命周期钩子）
// ============================================================
registerMicroApps(
  microApps,
  {
    // 加载前 - 开始计时
    beforeLoad: (app) => {
      console.log(`\n🚀 [${app.name}] 开始加载...`)
      performanceMonitor.markStart(app.name, 'load')
      performanceMonitor.timings[`${app.name}-load`] = performance.now()
      return Promise.resolve()
    },

    // 挂载前
    beforeMount: (app) => {
      performanceMonitor.markEnd(app.name, 'load')
      console.log(`📦 [${app.name}] 资源加载完成，准备挂载...`)
      performanceMonitor.markStart(app.name, 'mount')
      return Promise.resolve()
    },

    // 挂载后 - 结束计时
    afterMount: (app) => {
      performanceMonitor.markEnd(app.name, 'mount')
      performanceMonitor.timings[`${app.name}-mount-end`] = performance.now()
      console.log(`✅ [${app.name}] 挂载完成!`)
      performanceMonitor.report(app.name)
      return Promise.resolve()
    },

    // 卸载后
    afterUnmount: (app) => {
      console.log(`🗑️  [${app.name}] 已卸载`)
      return Promise.resolve()
    },
  }
)

// ============================================================
// 6. 启动 qiankun（预加载最佳实践配置）
// ============================================================
console.log('🎯 [qiankun] 启动微前端框架...')

start({
  // ============ 预加载策略（最佳实践） ============
  // 根据子应用优先级进行差异化预加载
  prefetch: (apps) => {
    // 高优先级应用：立即预加载（用户最可能访问的）
    const criticalAppNames = apps
      .filter(app => app.priority === 'high')
      .map(app => app.name)

    // 低优先级应用：浏览器空闲时预加载
    const minorAppNames = apps
      .filter(app => app.priority === 'low')
      .map(app => app.name)

    // 只在首次调用时打印日志
    if (!window.__PREFETCH_LOGGED__) {
      window.__PREFETCH_LOGGED__ = true
      console.log('📥 [预加载] 高优先级(立即):', criticalAppNames)
      console.log('📥 [预加载] 低优先级(空闲):', minorAppNames)
    }

    return {
      criticalAppNames,  // 立即预加载
      minorAppNames,     // requestIdleCallback 时预加载
    }
  },

  // ============ 沙箱配置 ============
  sandbox: {
    experimentalStyleIsolation: true,
  },

  // ============ 单例模式 ============
  // singular: true,  // 同时只能有一个子应用处于激活状态（默认 true）
})

console.log('✨ [qiankun] 微前端框架启动完成!')
} // end of initQiankun
