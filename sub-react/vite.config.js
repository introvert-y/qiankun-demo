import { defineConfig } from 'vite'
import qiankun from 'vite-plugin-qiankun'

// 环境变量
const isProduction = process.env.NODE_ENV === 'production'
const base = isProduction ? '/qiankun-demo/sub-react/' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qiankun('sub-react', {
      useDevMode: !isProduction,  // 生产环境关闭 devMode
    }),
  ],
  base,  // GitHub Pages 部署路径
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  server: {
    port: 7200,
    cors: true,
    origin: 'http://localhost:7200',
  },
})
