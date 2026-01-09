<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'

// 注入 qiankun props
const qiankunProps = inject('qiankunProps', {})

// 全局状态（从主应用同步）
const globalState = ref({
  user: { name: '游客', role: 'guest' },
  theme: 'light',
  count: 0,
})

// 是否在 qiankun 环境中
const isQiankun = ref(false)

// 沙箱测试：window 变量
const windowTestVar = ref(window.__TEST_VAR__ || '未设置')

onMounted(() => {
  if (qiankunProps.onGlobalStateChange) {
    isQiankun.value = true
    qiankunProps.onGlobalStateChange((state) => {
      console.log('[sub-vue] 收到全局状态:', state)
      globalState.value = { ...state }
    }, true)
  }

  // 不自动设置，只读取当前值（体现沙箱隔离）
  windowTestVar.value = window.__TEST_VAR__ || '未设置'
  console.log('[sub-vue] 读取 window.__TEST_VAR__ =', windowTestVar.value)
})

onUnmounted(() => {
  if (qiankunProps.offGlobalStateChange) {
    qiankunProps.offGlobalStateChange()
  }
})

// 修改 window 变量
const setWindowVar = (value) => {
  window.__TEST_VAR__ = value
  windowTestVar.value = value
  console.log('[sub-vue] 修改 window.__TEST_VAR__ =', value)
}

// 读取 window 变量
const readWindowVar = () => {
  windowTestVar.value = window.__TEST_VAR__ || '未设置'
  console.log('[sub-vue] 读取 window.__TEST_VAR__ =', windowTestVar.value)
}

// 修改全局状态的方法
const incrementCount = () => {
  if (qiankunProps.setGlobalState) {
    qiankunProps.setGlobalState({ count: globalState.value.count + 1 })
  }
}

const decrementCount = () => {
  if (qiankunProps.setGlobalState) {
    qiankunProps.setGlobalState({ count: globalState.value.count - 1 })
  }
}

const toggleTheme = () => {
  if (qiankunProps.setGlobalState) {
    qiankunProps.setGlobalState({
      theme: globalState.value.theme === 'light' ? 'dark' : 'light',
    })
  }
}
</script>

<template>
  <div class="sub-vue-app">
    <div class="app-header">
      <img src="./assets/vue.svg" class="logo" alt="Vue logo" />
      <h1>Vue 3 子应用</h1>
    </div>

    <div class="app-content">
      <p>这是一个 Vue 3 子应用，运行在 qiankun 微前端框架中</p>

      <!-- 沙箱测试区域 -->
      <div class="sandbox-test-box">
        <h3>🔒 JS 沙箱测试</h3>
        <div class="test-info">
          <span>window.__TEST_VAR__ = "{{ windowTestVar }}"</span>
        </div>
        <div class="test-actions">
          <button @click="setWindowVar('Vue-' + Date.now())">设置变量</button>
          <button @click="readWindowVar">读取变量</button>
        </div>
        <p class="test-tip">切换到 React 子应用，观察变量是否被隔离</p>
      </div>

      <!-- 全局状态显示 -->
      <div class="global-state-box" v-if="isQiankun">
        <h3>全局状态 (来自主应用)</h3>
        <div class="state-info">
          <span>用户: {{ globalState.user.name }}</span>
          <span>主题: {{ globalState.theme }}</span>
          <span>计数: {{ globalState.count }}</span>
        </div>
        <div class="state-actions">
          <button @click="decrementCount">计数 -1</button>
          <button @click="incrementCount">计数 +1</button>
          <button @click="toggleTheme">切换主题</button>
        </div>
      </div>

      <div class="standalone-tip" v-else>
        <p>当前为独立运行模式</p>
      </div>

      <p class="tech-stack">技术栈: Vue 3 + Vite + Composition API</p>
    </div>
  </div>
</template>

<style scoped>
.sub-vue-app {
  padding: 20px;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  border-radius: 8px;
  color: white;
  min-height: 300px;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.logo {
  height: 60px;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
}

.app-content {
  text-align: center;
}

/* 沙箱测试框 */
.sandbox-test-box {
  background: rgba(255, 255, 255, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
}

.sandbox-test-box h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.test-info {
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 16px;
  border-radius: 4px;
  font-family: monospace;
  margin-bottom: 12px;
}

.test-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.test-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #ffcc00;
  color: #333;
  cursor: pointer;
  font-weight: 500;
}

.test-tip {
  font-size: 12px;
  opacity: 0.8;
  margin: 8px 0 0 0;
}

/* 全局状态框 */
.global-state-box {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
}

.global-state-box h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
}

.state-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.state-info span {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.state-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.state-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: white;
  color: #42b883;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s;
}

.state-actions button:hover {
  transform: scale(1.05);
}

.standalone-tip {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
}

.tech-stack {
  margin-top: 24px;
  opacity: 0.8;
  font-size: 14px;
}
</style>
