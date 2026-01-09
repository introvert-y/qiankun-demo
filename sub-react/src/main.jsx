import { createRoot } from 'react-dom/client'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import './index.css'
import App from './App.jsx'

let root = null

/**
 * 渲染函数
 * @param {Object} props - qiankun 传递的 props
 */
function render(props = {}) {
  const { container } = props
  const mountElement = container
    ? container.querySelector('#root')
    : document.getElementById('root')

  root = createRoot(mountElement)
  // 将 qiankun props 传递给 App 组件
  root.render(<App qiankunProps={props} />)
}

// 使用 vite-plugin-qiankun 提供的 renderWithQiankun
renderWithQiankun({
  mount(props) {
    console.log('[sub-react] mount, props:', props)
    render(props)
  },
  bootstrap() {
    console.log('[sub-react] bootstrap')
  },
  unmount() {
    console.log('[sub-react] unmount')
    if (root) {
      root.unmount()
      root = null
    }
  },
  update(props) {
    console.log('[sub-react] update', props)
  },
})

// 独立运行时直接渲染
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}
