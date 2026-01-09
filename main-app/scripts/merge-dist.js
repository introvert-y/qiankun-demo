/**
 * 合并所有应用的构建产物
 * 创建 dist/qiankun-demo/ 目录结构，模拟 GitHub Pages 部署
 */
import { cpSync, mkdirSync, existsSync, writeFileSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const originalDistDir = resolve(rootDir, 'dist')
const previewDir = resolve(rootDir, 'preview')  // 预览目录
const targetDir = resolve(previewDir, 'qiankun-demo')  // 模拟 GitHub Pages 路径

console.log('📦 开始合并构建产物...\n')

// 1. 确保主应用 dist 目录存在
if (!existsSync(originalDistDir)) {
  console.log('❌ 主应用 dist 目录不存在，请先运行 npm run build')
  process.exit(1)
}

// 2. 清理并创建预览目录
if (existsSync(previewDir)) {
  rmSync(previewDir, { recursive: true, force: true })
}
mkdirSync(targetDir, { recursive: true })

// 3. 复制主应用到 preview/qiankun-demo/
cpSync(originalDistDir, targetDir, { recursive: true })
console.log('✅ 主应用已复制到 preview/qiankun-demo/')

// 4. 复制 Vue 子应用
const vueDistDir = resolve(rootDir, '../sub-vue/dist')
const vueTargetDir = resolve(targetDir, 'sub-vue')

if (existsSync(vueDistDir)) {
  mkdirSync(vueTargetDir, { recursive: true })
  cpSync(vueDistDir, vueTargetDir, { recursive: true })
  console.log('✅ Vue 子应用已复制到 preview/qiankun-demo/sub-vue/')
} else {
  console.log('⚠️  Vue 子应用 dist 目录不存在，跳过')
}

// 5. 复制 React 子应用
const reactDistDir = resolve(rootDir, '../sub-react/dist')
const reactTargetDir = resolve(targetDir, 'sub-react')

if (existsSync(reactDistDir)) {
  mkdirSync(reactTargetDir, { recursive: true })
  cpSync(reactDistDir, reactTargetDir, { recursive: true })
  console.log('✅ React 子应用已复制到 preview/qiankun-demo/sub-react/')
} else {
  console.log('⚠️  React 子应用 dist 目录不存在，跳过')
}

// 6. 创建根目录的 index.html 重定向
const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/qiankun-demo/">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="/qiankun-demo/">/qiankun-demo/</a></p>
</body>
</html>`
writeFileSync(resolve(previewDir, 'index.html'), redirectHtml)
console.log('✅ 根目录重定向已创建')

// 7. 复制 index.html 到 404.html（SPA 路由支持）
const indexHtml = resolve(targetDir, 'index.html')
if (existsSync(indexHtml)) {
  cpSync(indexHtml, resolve(previewDir, '404.html'))
  console.log('✅ 404.html 已创建（SPA 路由支持）')
}

// 8. 创建 .nojekyll 文件
writeFileSync(resolve(previewDir, '.nojekyll'), '')
console.log('✅ .nojekyll 已创建')

console.log('\n🎉 构建产物合并完成！')
console.log('\n📁 目录结构:')
console.log('   preview/')
console.log('   ├── index.html (重定向)')
console.log('   ├── 404.html')
console.log('   ├── .nojekyll')
console.log('   └── qiankun-demo/')
console.log('       ├── index.html')
console.log('       ├── assets/')
console.log('       ├── sub-vue/')
console.log('       └── sub-react/')
console.log('\n🚀 访问: http://localhost:4000/qiankun-demo/')
