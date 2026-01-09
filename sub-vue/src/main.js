import { createApp } from 'vue'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import './style.css'
import App from './App.vue'

let app = null

/**
 * 渲染函数
 * @param {Object} props - qiankun 传递的 props
 */
function render(props = {}) {
  const { container } = props
  const mountElement = container
    ? container.querySelector('#app')
    : document.getElementById('app')

  app = createApp(App)

  // 将 qiankun props 注入到全局，供组件使用
  // 包含 onGlobalStateChange, setGlobalState 等方法
  app.config.globalProperties.$qiankunProps = props

  // 也可以通过 provide 注入
  app.provide('qiankunProps', props)

  app.mount(mountElement)
}

// 使用 vite-plugin-qiankun 提供的 renderWithQiankun
renderWithQiankun({
  mount(props) {
    console.log('[sub-vue] mount, props:', props)
    render(props)
  },
  bootstrap() {
    console.log('[sub-vue] bootstrap')
  },
  unmount() {
    console.log('[sub-vue] unmount')
    if (app) {
      app.unmount()
      app = null
    }
  },
  update(props) {
    console.log('[sub-vue] update', props)
  },
})

// 独立运行时直接渲染
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
