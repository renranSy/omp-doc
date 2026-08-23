import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// 加载 .env
try {
  const envFile = readFileSync(resolve(import.meta.dirname, '..', '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0 && !line.startsWith('#')) {
      const key = line.slice(0, eq).trim()
      const value = line.slice(eq + 1).trim()
      if (key && !process.env[key]) process.env[key] = value
    }
  }
} catch {
  // .env 为可选文件；本地构建不需要公开站点地址。
}


const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'content/.vitepress/dist')
const rawSiteUrl = process.env.SITE_URL?.trim()

/** @param {string | undefined} value */
function normalizeSiteUrl(value) {
  if (!value) return undefined
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error('SITE_URL 必须使用 https://')
  url.hash = ''
  url.search = ''
  return url.toString().replace(/\/$/, '')
}

const siteUrl = normalizeSiteUrl(rawSiteUrl)
const lines = ['User-agent: *', 'Allow: /']

if (siteUrl) {
  const sitemapPath = resolve(outDir, 'sitemap.xml')
  if (!existsSync(sitemapPath)) throw new Error('设置 SITE_URL 后未生成 sitemap.xml')
  lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
}

writeFileSync(resolve(outDir, 'robots.txt'), `${lines.join('\n')}\n`)
writeFileSync(resolve(outDir, 'seo-build.json'), `${JSON.stringify({ siteUrl: siteUrl ?? null }, null, 2)}\n`)
console.log(siteUrl ? `SEO 构建地址：${siteUrl}` : '未设置 SITE_URL：跳过 canonical 与 sitemap，仅生成基础 robots.txt。')
