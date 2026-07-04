// @ts-nocheck
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
} catch {}


const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'content/.vitepress/dist')
const manifest = JSON.parse(readFileSync(resolve(root, 'scripts/content-manifest.json'), 'utf8'))
const siteUrl = (process.env.SITE_URL?.trim() || 'https://docs.example.test').replace(/\/$/, '')
const buildCommand = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'pnpm'
const buildArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'pnpm run build'] : ['run', 'build']
const build = spawnSync(buildCommand, buildArgs, {
  cwd: root,
  env: { ...process.env, SITE_URL: siteUrl },
  stdio: 'inherit'
})

if (build.error) throw build.error
if (build.status !== 0) process.exit(build.status ?? 1)

const errors = []
const titles = new Map()
const descriptions = new Map()

function routeFor(page) {
  if (page.slug === '../index') return ''
  if (page.slug === '') return 'docs/'
  return `docs/${page.slug}`
}

function fileFor(page) {
  if (page.slug === '../index') return resolve(outDir, 'index.html')
  if (page.slug === '') return resolve(outDir, 'docs/index.html')
  return resolve(outDir, `docs/${page.slug}.html`)
}

function absoluteUrl(route) {
  return new URL(route, `${siteUrl}/`).toString()
}

function matches(html, pattern) {
  return [...html.matchAll(pattern)]
}

function metaContent(html, attribute, value) {
  const tags = matches(html, /<meta\s+[^>]*>/g).map(match => match[0])
  return tags
    .filter(tag => new RegExp(`${attribute}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(tag))
    .map(tag => tag.match(/content=["']([^"']*)["']/)?.[1] ?? '')
}

for (const page of manifest.pages) {
  const file = fileFor(page)
  if (!existsSync(file)) {
    errors.push(`缺少构建页面：${file}`)
    continue
  }

  const html = readFileSync(file, 'utf8')
  const route = routeFor(page)
  const expectedCanonical = absoluteUrl(route)
  const titleMatches = matches(html, /<title>([^<]+)<\/title>/g).map(match => match[1])
  const descriptionMatches = metaContent(html, 'name', 'description')
  const canonicalMatches = matches(html, /<link\s+[^>]*rel=["']canonical["'][^>]*>/g)
    .map(match => match[0].match(/href=["']([^"']+)["']/)?.[1] ?? '')
  const h1Count = matches(html, /<h1(?:\s|>)/g).length

  if (!/<html[^>]+lang="zh-CN"/.test(html)) errors.push(`${route || '/'} 缺少 lang=zh-CN`)
  if (titleMatches.length !== 1 || !titleMatches[0]) errors.push(`${route || '/'} title 数量不为 1`)
  if (descriptionMatches.length !== 1 || !descriptionMatches[0]) errors.push(`${route || '/'} description 数量不为 1`)
  if (canonicalMatches.length !== 1 || canonicalMatches[0] !== expectedCanonical) errors.push(`${route || '/'} canonical 不正确`)
  if (h1Count !== 1) errors.push(`${route || '/'} 构建后 H1 数量为 ${h1Count}`)

  const requiredMeta = [
    ['name', 'robots'], ['name', 'keywords'], ['property', 'og:locale'], ['property', 'og:site_name'],
    ['property', 'og:type'], ['property', 'og:title'], ['property', 'og:description'], ['property', 'og:url'],
    ['property', 'og:image'], ['property', 'og:image:alt'], ['name', 'twitter:card'], ['name', 'twitter:title'],
    ['name', 'twitter:description'], ['name', 'twitter:image'], ['name', 'twitter:image:alt']
  ]
  for (const [attribute, value] of requiredMeta) {
    if (metaContent(html, attribute, value).length !== 1) errors.push(`${route || '/'} 缺少或重复 ${value}`)
  }

  const jsonLdCount = matches(html, /<script type="application\/ld\+json">/g).length
  const expectedJsonLd = page.slug === '../index' ? 1 : 2
  if (jsonLdCount !== expectedJsonLd) errors.push(`${route || '/'} JSON-LD 数量为 ${jsonLdCount}`)

  for (const image of matches(html, /<img\s+[^>]*>/g).map(match => match[0])) {
    const alt = image.match(/alt=["']([^"']*)["']/)?.[1]
    if (!alt) errors.push(`${route || '/'} 存在缺少 alt 的图片`)
  }

  if (titleMatches[0]) {
    const duplicate = titles.get(titleMatches[0])
    if (duplicate) errors.push(`重复 title：${titleMatches[0]} (${duplicate}, ${route || '/'})`)
    titles.set(titleMatches[0], route || '/')
  }
  if (descriptionMatches[0]) {
    const duplicate = descriptions.get(descriptionMatches[0])
    if (duplicate) errors.push(`重复 description：${duplicate}, ${route || '/'}`)
    descriptions.set(descriptionMatches[0], route || '/')
  }
}

const sitemapPath = resolve(outDir, 'sitemap.xml')
if (!existsSync(sitemapPath)) {
  errors.push('缺少 sitemap.xml')
} else {
  const sitemap = readFileSync(sitemapPath, 'utf8')
  const locations = matches(sitemap, /<loc>([^<]+)<\/loc>/g).map(match => match[1].replace(/\/$/, ''))
  const expected = manifest.pages.map(page => absoluteUrl(routeFor(page)).replace(/\/$/, ''))
  if (locations.length !== manifest.pages.length) errors.push(`sitemap URL 数量为 ${locations.length}，预期 ${manifest.pages.length}`)
  for (const url of expected) if (!locations.includes(url)) errors.push(`sitemap 缺少 ${url}`)
}

const robotsPath = resolve(outDir, 'robots.txt')
if (!existsSync(robotsPath)) {
  errors.push('缺少 robots.txt')
} else {
  const robots = readFileSync(robotsPath, 'utf8')
  if (!robots.includes('User-agent: *') || !robots.includes('Allow: /')) errors.push('robots.txt 抓取规则不完整')
  if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) errors.push('robots.txt 未引用 sitemap')
}

const ogImage = resolve(outDir, 'og-image.png')
if (!existsSync(ogImage)) errors.push('缺少 og-image.png')
else if (statSync(ogImage).size > 500_000) errors.push('og-image.png 超过 500 KB')

const oversizedRuntimeAssets = readdirSync(resolve(outDir, 'assets'), { recursive: true })
  .filter(name => typeof name === 'string' && /\.(?:js|css)$/.test(name) && !name.includes('localSearchIndex'))
  .map(name => ({ name, size: statSync(resolve(outDir, 'assets', name)).size }))
  .filter(asset => asset.size > 250_000)
if (oversizedRuntimeAssets.length > 0) errors.push(`存在超过 250 KB 的 JS/CSS：${oversizedRuntimeAssets.map(asset => asset.name).join(', ')}`)

if (errors.length > 0) {
  console.error(errors.map(error => `- ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`SEO 检查通过：${manifest.pages.length} 个页面，canonical、社交标签、JSON-LD、sitemap 和 robots 均有效。`)
}
