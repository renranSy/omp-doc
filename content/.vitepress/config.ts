import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type HeadConfig } from 'vitepress'

interface ManifestPage {
  description?: string
  group: string
  keywords?: string[]
  slug: string
  sourceTitle: string
  summary?: string
  title: string
}

interface Manifest {
  pages: ManifestPage[]
}

// 加载 .env 以设置 process.env.SITE_URL（VitePress 配置需要直接读 process.env）
import { resolve } from 'node:path'
try {
  const envFile = readFileSync(resolve(import.meta.dirname, '..', '..', '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0 && !line.startsWith('#')) {
      const key = line.slice(0, eq).trim()
      const value = line.slice(eq + 1).trim()
      if (key && !process.env[key]) process.env[key] = value
    }
  }
} catch {}


const manifestPath = fileURLToPath(new URL('../../scripts/content-manifest.json', import.meta.url))
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest
const documentPages = manifest.pages.filter(page => page.slug !== '../index')
const groups = [...new Set(documentPages.map(page => page.group))]
const rawSiteUrl = process.env.SITE_URL?.trim()

function normalizeSiteUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error('SITE_URL 必须使用 https://')
  url.hash = ''
  url.search = ''
  return url.toString().replace(/\/$/, '')
}

const siteUrl = normalizeSiteUrl(rawSiteUrl)
const siteBase = siteUrl
  ? `/${new URL(siteUrl).pathname.split('/').filter(Boolean).join('/')}${new URL(siteUrl).pathname === '/' ? '' : '/'}`
  : '/'

function pageRoute(relativePath: string): string {
  if (relativePath === 'index.md') return ''
  if (relativePath.endsWith('/index.md')) return relativePath.replace(/index\.md$/, '')
  return relativePath.replace(/\.md$/, '')
}

function absoluteUrl(route: string): string | undefined {
  if (!siteUrl) return undefined
  return new URL(route.replace(/^\//, ''), `${siteUrl}/`).toString()
}

function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

const sidebar = groups.map(group => ({
  text: group,
  collapsed: false,
  items: documentPages
    .filter(page => page.group === group)
    .map(page => ({
      text: page.title,
      link: page.slug === '' ? '/docs/' : `/docs/${page.slug}`
    }))
}))

export default defineConfig({
  base: siteBase,
  lang: 'zh-CN',
  title: 'omp 中文文档',
  titleTemplate: ':title | omp 中文文档',
  description: 'omp 中文文档提供终端 AI 编程智能体的安装、配置、模型 Provider、会话、工具、扩展与 SDK 完整指南。',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0f766e' }],
    ['meta', { name: 'author', content: 'omp 中文文档' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${siteBase}favicon.svg` }]
  ],
  ...(siteUrl ? { sitemap: { hostname: siteUrl } } : {}),
  transformHead({ pageData, title, description }) {
    const route = pageRoute(pageData.relativePath)
    const canonical = absoluteUrl(route)
    const image = absoluteUrl('og-image.png')
    const isHome = route === ''
    const pageTitle = isHome
      ? String(pageData.frontmatter.title ?? title)
      : `${String(pageData.frontmatter.title ?? title)} | omp 中文文档`
    const summary = String(pageData.frontmatter.summary ?? description)
    const keywords = Array.isArray(pageData.frontmatter.keywords)
      ? pageData.frontmatter.keywords.map(String)
      : []
    const head: HeadConfig[] = [
      ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
      ['meta', { name: 'keywords', content: keywords.join(', ') }],
      ['meta', { property: 'og:locale', content: 'zh_CN' }],
      ['meta', { property: 'og:site_name', content: 'omp 中文文档' }],
      ['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: description }]
    ]

    if (!canonical || !image) return head

    head.push(
      ['link', { rel: 'canonical', href: canonical }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: 'omp 中文文档：与 IDE 深度联动的终端编程智能体' }],
      ['meta', { name: 'twitter:image', content: image }],
      ['meta', { name: 'twitter:image:alt', content: 'omp 中文文档：与 IDE 深度联动的终端编程智能体' }]
    )

    if (isHome) {
      head.push(['script', { type: 'application/ld+json' }, jsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'omp 中文文档',
        url: canonical,
        description,
        inLanguage: 'zh-CN',
        image
      })])
      return head
    }

    const breadcrumbs = [
      { '@type': 'ListItem', position: 1, name: '首页', item: absoluteUrl('') },
      { '@type': 'ListItem', position: 2, name: '文档', item: absoluteUrl('docs/') }
    ]
    if (route !== 'docs/') {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 3,
        name: String(pageData.frontmatter.title),
        item: canonical
      })
    }

    head.push(
      ['script', { type: 'application/ld+json' }, jsonLd({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: String(pageData.frontmatter.title),
        description,
        abstract: summary,
        inLanguage: 'zh-CN',
        mainEntityOfPage: canonical,
        image,
        author: { '@type': 'Organization', name: 'omp', url: 'https://github.com/can1357/oh-my-pi' },
        isPartOf: { '@type': 'WebSite', name: 'omp 中文文档', url: absoluteUrl('') }
      })],
      ['script', { type: 'application/ld+json' }, jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs
      })]
    )
    return head
  },
  transformHtml(html) {
    return html
      .replace(
        '<div class="VPContent is-home" id="VPContent"',
        '<div class="VPContent is-home" id="VPContent" role="main"'
      )
      .replaceAll(
        '<button class="VPSwitch VPSwitchAppearance"',
        '<button aria-label="切换深浅色主题" class="VPSwitch VPSwitchAppearance"'
      )
  },
  themeConfig: {
    logo: { src: '/logo.svg', alt: 'omp' },
    siteTitle: 'omp 中文文档',
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/docs/' },
      { text: '原站', link: 'https://omp.sh/' },
      { text: 'GitHub', link: 'https://github.com/can1357/oh-my-pi' }
    ],
    sidebar: { '/docs/': sidebar },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档 K' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/can1357/oh-my-pi' }],
    footer: {
      message: '本文档为 omp.sh 的非官方中文翻译。',
      copyright: '原项目采用 MIT License'
    }
  }
})
