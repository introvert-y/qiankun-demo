import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 环境变量：生产环境使用 GitHub Pages 路径
const isProduction = process.env.NODE_ENV === 'production'
const base = isProduction ? '/qiankun-demo/' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,  // GitHub Pages 部署路径
  server: {
    port: 3000,
  },
})
