// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

const root = resolve(import.meta.dirname, '..')
/** @typedef {{ description: string, group: string, keywords: string[], slug: string, sourceTitle: string, summary: string, title: string }} ManifestPage */
/** @type {{ pages: ManifestPage[] }} */
const manifest = JSON.parse(readFileSync(resolve(root, 'scripts/content-manifest.json'), 'utf8'))
const audit = JSON.parse(readFileSync(resolve(root, 'scripts/content-audit.json'), 'utf8'))
const errors = []
const titles = new Map()
const descriptions = new Map()

function parseScalar(value) {
  const trimmed = value.trim()
  if (trimmed.startsWith('"')) return JSON.parse(trimmed)
  return trimmed
}

function parseFrontmatter(markdown) {
  const block = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const get = key => {
    const value = block.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'))?.[1] ?? ''
    return parseScalar(value)
  }
  const keywordBlock = block.match(/^keywords:[ \t]*\r?\n((?:[ \t]+- .*(?:\r?\n|$))+)/m)?.[1] ?? ''
  const keywords = [...keywordBlock.matchAll(/^[ \t]+-[ \t]+(.+)$/gm)].map(match => parseScalar(match[1]))
  return { title: get('title'), description: get('description'), summary: get('summary'), keywords }
}

function stripNonProse(markdown) {
  return markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
    .replace(/^([ \t]*)```[^\n]*\r?\n[\s\S]*?^\1```[ \t]*$/gm, '')
}

if (manifest.pages.length !== 47) errors.push(`内容清单应包含 47 页，当前为 ${manifest.pages.length} 页`)

const slugs = new Set()
for (const page of manifest.pages) {
  if (slugs.has(page.slug)) errors.push(`重复路由：${page.slug}`)
  slugs.add(page.slug)

  const file = page.slug === '../index'
    ? resolve(root, 'content/index.md')
    : page.slug === ''
      ? resolve(root, 'content/docs/index.md')
      : resolve(root, `content/docs/${page.slug}.md`)

  if (!existsSync(file)) {
    errors.push(`缺少页面：${page.slug || '/docs'} (${file})`)
    continue
  }

  const markdown = readFileSync(file, 'utf8')
  const prose = stripNonProse(markdown)
  const metadata = parseFrontmatter(markdown)
  if (/\b(?:TODO|TBD|TRANSLATE_ME)\b/.test(prose)) errors.push(`页面含未完成标记：${file}`)
  if (metadata.title !== page.title) errors.push(`frontmatter title 与清单不一致：${file}`)
  if (metadata.description !== page.description) errors.push(`frontmatter description 与清单不一致：${file}`)
  if (metadata.summary !== page.summary) errors.push(`frontmatter summary 与清单不一致：${file}`)
  if (JSON.stringify(metadata.keywords) !== JSON.stringify(page.keywords)) errors.push(`frontmatter keywords 与清单不一致：${file}`)

  const titleLength = [...metadata.title].length
  const descriptionLength = [...metadata.description].length
  const summaryLength = [...metadata.summary].length
  if (titleLength < 2 || titleLength > 40) errors.push(`title 长度不合理 (${titleLength})：${file}`)
  if (descriptionLength < 45 || descriptionLength > 100) errors.push(`description 应为 45–100 字符 (${descriptionLength})：${file}`)
  if (summaryLength < 50 || summaryLength > 180) errors.push(`summary 应为 50–180 字符 (${summaryLength})：${file}`)
  if (metadata.keywords.length < 3 || metadata.keywords.length > 6) errors.push(`keywords 应为 3–6 个：${file}`)
  if (new Set(metadata.keywords).size !== metadata.keywords.length) errors.push(`keywords 存在重复：${file}`)

  const duplicateTitle = titles.get(metadata.title)
  if (duplicateTitle) errors.push(`重复 title：${metadata.title} (${duplicateTitle}, ${file})`)
  titles.set(metadata.title, file)
  const duplicateDescription = descriptions.get(metadata.description)
  if (duplicateDescription) errors.push(`重复 description：${duplicateDescription}, ${file}`)
  descriptions.set(metadata.description, file)

  if (page.slug !== '../index') {
    const headings = [...prose.matchAll(/^(#{1,3})[ \t]+(.+)$/gm)].map(match => ({ level: match[1].length, text: match[2] }))
    const h1Count = headings.filter(heading => heading.level === 1).length
    if (h1Count !== 1) errors.push(`页面应只有一个 H1，当前为 ${h1Count}：${file}`)
    if (!headings.some(heading => heading.level === 2)) errors.push(`页面缺少 H2：${file}`)
    for (let index = 1; index < headings.length; index += 1) {
      if (headings[index].level > headings[index - 1].level + 1) {
        errors.push(`标题层级跳跃：${headings[index - 1].text} -> ${headings[index].text} (${file})`)
      }
    }
  }

  for (const image of markdown.matchAll(/!\[([^\]]*)\]\([^)]+\)/g)) {
    if (!image[1].trim()) errors.push(`Markdown 图片缺少 alt：${file}`)
  }
  for (const image of markdown.matchAll(/<img\s+[^>]*>/g)) {
    const alt = image[0].match(/alt=["']([^"']*)["']/)?.[1]
    if (!alt) errors.push(`HTML 图片缺少 alt：${file}`)
  }

  const expected = audit.pages[page.slug]
  if (expected) {
    const blocks = [...markdown.matchAll(/^([ \t]*)```[^\n]*\r?\n([\s\S]*?)^\1```[ \t]*$/gm)].map(match => {
      const indent = match[1]
      return match[2]
        .split(/\r?\n/)
        .map(line => line.startsWith(indent) ? line.slice(indent.length) : line)
        .join('\n')
        .replace(/\n$/, '')
    })
    const digest = createHash('sha256').update(blocks.join('\n---\n')).digest('hex')
    if (blocks.length !== expected.codeBlocks || digest !== expected.codeDigest) {
      errors.push(`代码块与抓取源不一致：${file}`)
    }
  }
}

if (Object.keys(audit.pages).length !== 44) errors.push(`代码审计应覆盖 44 个自动迁移页面，当前为 ${Object.keys(audit.pages).length}`)

const markdownFiles = manifest.pages.map(page => page.slug === '../index'
  ? resolve(root, 'content/index.md')
  : page.slug === ''
    ? resolve(root, 'content/docs/index.md')
    : resolve(root, `content/docs/${page.slug}.md`))

for (const file of markdownFiles.filter(existsSync)) {
  const markdown = readFileSync(file, 'utf8')
  for (const match of markdown.matchAll(/\]\((\/docs(?:\/[a-z0-9-]+)?)(?:#[^)]+)?\)/g)) {
    const route = match[1].replace(/^\/docs\/?/, '')
    if (!slugs.has(route)) errors.push(`内部链接指向未知页面：${match[1]} (${file})`)
  }
}

if (errors.length > 0) {
  console.error(errors.map(error => `- ${error}`).join('\n'))
  process.exitCode = 1
} else {
  console.log(`内容检查通过：${manifest.pages.length} 个页面，路由与文件均完整。`)
}
