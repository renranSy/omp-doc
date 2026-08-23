import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'content/.vitepress/dist')
/** @type {string[]} */
const files = []

/** @param {string} directory */
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) collect(path)
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path)
  }
}

if (!existsSync(outDir)) throw new Error('找不到构建产物；请先运行 vitepress build。')

collect(outDir)
let count = 0
for (const file of files) {
  if (file === resolve(outDir, 'index.html')) continue
  const directoryIndex = resolve(file.slice(0, -'.html'.length), 'index.html')
  mkdirSync(resolve(directoryIndex, '..'), { recursive: true })
  copyFileSync(file, directoryIndex)
  count += 1
}

console.log(`已生成 ${count} 个 clean URL 目录入口。`)
