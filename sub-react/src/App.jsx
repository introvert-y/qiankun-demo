import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import styles from './App.module.css'

function App({ qiankunProps = {} }) {
  // 全局状态
  const [globalState, setGlobalState] = useState({
    user: { name: '游客', role: 'guest' },
    theme: 'light',
    count: 0,
  })

  // 沙箱测试：window 变量
  const [windowTestVar, setWindowTestVar] = useState(window.__TEST_VAR__ || '未设置')

  // 是否在 qiankun 环境中
  const isQiankun = !!qiankunProps.onGlobalStateChange

  useEffect(() => {
    if (qiankunProps.onGlobalStateChange) {
      qiankunProps.onGlobalStateChange((state) => {
        console.log('[sub-react] 收到全局状态:', state)
        setGlobalState({ ...state })
      }, true)
    }

    // 不自动设置，只读取当前值（体现沙箱隔离）
    const currentValue = window.__TEST_VAR__ || '未设置'
    setWindowTestVar(currentValue)
    console.log('[sub-react] 读取 window.__TEST_VAR__ =', currentValue)

    return () => {
      if (qiankunProps.offGlobalStateChange) {
        qiankunProps.offGlobalStateChange()
      }
    }
  }, [qiankunProps])

  // 修改 window 变量
  const handleSetWindowVar = () => {
    const value = 'React-' + Date.now()
    window.__TEST_VAR__ = value
    setWindowTestVar(value)
    console.log('[sub-react] 修改 window.__TEST_VAR__ =', value)
  }

  // 读取 window 变量
  const handleReadWindowVar = () => {
    const value = window.__TEST_VAR__ || '未设置'
    setWindowTestVar(value)
    console.log('[sub-react] 读取 window.__TEST_VAR__ =', value)
  }

  // 修改全局状态
  const incrementCount = () => {
    if (qiankunProps.setGlobalState) {
      qiankunProps.setGlobalState({ count: globalState.count + 1 })
    }
  }

  const decrementCount = () => {
    if (qiankunProps.setGlobalState) {
      qiankunProps.setGlobalState({ count: globalState.count - 1 })
    }
  }

  const toggleTheme = () => {
    if (qiankunProps.setGlobalState) {
      qiankunProps.setGlobalState({
        theme: globalState.theme === 'light' ? 'dark' : 'light',
      })
    }
  }

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <img src={reactLogo} className={styles.logo} alt="React logo" />
        <h1>React 子应用</h1>
      </div>

      <div className={styles.content}>
        <p>这是一个 React 子应用，运行在 qiankun 微前端框架中</p>

        {/* 沙箱测试区域 */}
        <div className={styles.sandboxTest}>
          <h3>🔒 JS 沙箱测试</h3>
          <div className={styles.testInfo}>
            <span>window.__TEST_VAR__ = "{windowTestVar}"</span>
          </div>
          <div className={styles.testActions}>
            <button onClick={handleSetWindowVar}>设置变量</button>
            <button onClick={handleReadWindowVar}>读取变量</button>
          </div>
          <p className={styles.testTip}>切换到 Vue 子应用，观察变量是否被隔离</p>
        </div>

        {/* 全局状态显示 */}
        {isQiankun ? (
          <div className={styles.stateBox}>
            <h3>全局状态 (来自主应用)</h3>
            <div className={styles.stateInfo}>
              <span>用户: {globalState.user.name}</span>
              <span>主题: {globalState.theme}</span>
              <span>计数: {globalState.count}</span>
            </div>
            <div className={styles.stateActions}>
              <button onClick={decrementCount}>计数 -1</button>
              <button onClick={incrementCount}>计数 +1</button>
              <button onClick={toggleTheme}>切换主题</button>
            </div>
          </div>
        ) : (
          <div className={styles.standaloneTip}>
            <p>当前为独立运行模式</p>
          </div>
        )}

        <p className={styles.techStack}>技术栈: React 18 + Vite + CSS Modules</p>
      </div>
    </div>
  )
}

export default App
