import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// 环境变量
const isProduction = process.env.NODE_ENV === 'production'
const base = isProduction ? '/qiankun-demo/sub-vue/' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    qiankun('sub-vue', {
      useDevMode: !isProduction,  // 生产环境关闭 devMode
    }),
  ],
  base,  // GitHub Pages 部署路径
  server: {
    port: 7100,
    cors: true,
    origin: 'http://localhost:7100',
  },
})
