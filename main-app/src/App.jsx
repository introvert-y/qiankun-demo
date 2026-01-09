import { useState, useEffect } from 'react'
import { actions } from './main.jsx'
import './App.css'

// 根据环境获取路由前缀
const BASE_PATH = import.meta.env.PROD ? '/qiankun-demo' : ''

// 客户端导航函数（不刷新页面）
const navigateTo = (path, e) => {
  e?.preventDefault()
  history.pushState(null, '', path)
  // 触发 popstate 事件，让 qiankun 响应路由变化
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  // 本地状态，用于触发重新渲染
  const [globalState, setGlobalState] = useState({
    user: { name: '游客', role: 'guest' },
    theme: 'light',
    count: 0,
  })

  useEffect(() => {
    // 监听全局状态变化，同步到本地状态
    actions.onGlobalStateChange((state) => {
      console.log('[主应用 App] 收到状态更新:', state)
      setGlobalState({ ...state })
    }, true) // true 表示立即执行一次，获取初始值

    // 监听路由变化，更新当前路径
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)

    // 组件卸载时取消监听
    return () => {
      actions.offGlobalStateChange()
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // 修改用户信息
  const handleLogin = () => {
    actions.setGlobalState({
      user: { name: '张三', role: 'admin' },
    })
  }

  const handleLogout = () => {
    actions.setGlobalState({
      user: { name: '游客', role: 'guest' },
    })
  }

  // 修改主题
  const toggleTheme = () => {
    actions.setGlobalState({
      theme: globalState.theme === 'light' ? 'dark' : 'light',
    })
  }

  // 修改计数
  const incrementCount = () => {
    actions.setGlobalState({
      count: globalState.count + 1,
    })
  }

  return (
    <div className={`main-app ${globalState.theme}`}>
      {/* 主应用头部导航 */}
      <header className="main-header">
        <h1>Qiankun 主应用</h1>
        <nav className="main-nav">
          <a href={`${BASE_PATH}/`} onClick={(e) => navigateTo(`${BASE_PATH}/`, e)}>首页</a>
          <a href={`${BASE_PATH}/sub-vue`} onClick={(e) => navigateTo(`${BASE_PATH}/sub-vue`, e)}>Vue 子应用</a>
          <a href={`${BASE_PATH}/sub-react`} onClick={(e) => navigateTo(`${BASE_PATH}/sub-react`, e)}>React 子应用</a>
        </nav>
        <div className="user-info">
          {globalState.user.name} ({globalState.user.role})
        </div>
      </header>

      {/* 全局状态控制面板 */}
      <div className="global-state-panel">
        <h3>全局状态控制 (主应用)</h3>
        <div className="state-display">
          <span>用户: {globalState.user.name}</span>
          <span>主题: {globalState.theme}</span>
          <span>计数: {globalState.count}</span>
        </div>
        <div className="state-actions">
          {globalState.user.role === 'guest' ? (
            <button onClick={handleLogin}>登录 (张三)</button>
          ) : (
            <button onClick={handleLogout}>退出登录</button>
          )}
          <button onClick={toggleTheme}>
            切换主题 ({globalState.theme === 'light' ? '深色' : '浅色'})
          </button>
          <button onClick={incrementCount}>计数 +1</button>
        </div>
      </div>

      {/* 主应用内容区域 */}
      <main className="main-content">
        {/* 主应用首页内容 */}
        {(currentPath === '/' || currentPath === `${BASE_PATH}/` || currentPath === BASE_PATH) && (
          <div className="home-content">
            <h2>欢迎使用 Qiankun 微前端示例</h2>
            <p>点击上方导航切换子应用，观察全局状态同步</p>
          </div>
        )}

        {/* 子应用挂载点 */}
        <div id="sub-container"></div>
      </main>
    </div>
  )
}

export default App
