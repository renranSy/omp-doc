// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'content/.vitepress/dist')
const manifest = JSON.parse(readFileSync(resolve(root, 'scripts/content-manifest.json'), 'utf8'))
const errors = []

if (!existsSync(dist)) {
  throw new Error('未找到构建产物；请先运行 pnpm build。')
}

for (const page of manifest.pages) {
  const htmlPath = page.slug === '../index'
    ? 'index.html'
    : page.slug === ''
      ? 'docs/index.html'
      : `docs/${page.slug}.html`
  const folderPath = page.slug === '../index'
    ? 'index.html'
    : page.slug === ''
      ? 'docs/index.html'
      : `docs/${page.slug}/index.html`

  for (const path of new Set([htmlPath, folderPath])) {
    const file = resolve(dist, path)
    if (!existsSync(file)) {
      errors.push(`缺少渲染页面：${path}`)
      continue
    }
    const html = readFileSync(file, 'utf8')
    const hasMain = page.slug === '../index'
      ? /<div\b[^>]*id="VPContent"[^>]*role="main"/i.test(html)
      : /<main\b[^>]*class="main"/i.test(html)
    if (!hasMain) errors.push(`页面缺少主内容区域：${path}`)
    if (page.slug !== '../index' && !/<h1\b[^>]*>/i.test(html)) errors.push(`页面缺少 H1 正文：${path}`)
    if (page.slug !== '../index' && html.replace(/<[^>]+>/g, '').length < 500) errors.push(`页面正文疑似过短：${path}`)
  }
}

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`渲染完整性检查通过：${manifest.pages.length} 个页面均包含可访问的正文入口。`)
