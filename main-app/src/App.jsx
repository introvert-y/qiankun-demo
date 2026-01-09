import { useState, useEffect } from 'react'
import { actions } from './main.jsx'
import './App.css'

// Hash 路由导航函数
const navigateTo = (hash) => {
  window.location.hash = hash
}

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash)

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

    // 监听 hash 变化
    const handleHashChange = () => {
      setCurrentHash(window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)

    // 组件卸载时取消监听
    return () => {
      actions.offGlobalStateChange()
      window.removeEventListener('hashchange', handleHashChange)
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
          <a href="#/" onClick={() => navigateTo('#/')}>首页</a>
          <a href="#/sub-vue" onClick={() => navigateTo('#/sub-vue')}>Vue 子应用</a>
          <a href="#/sub-react" onClick={() => navigateTo('#/sub-react')}>React 子应用</a>
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
        {(currentHash === '' || currentHash === '#' || currentHash === '#/') && (
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
