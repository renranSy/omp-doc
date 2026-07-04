# omp 中文文档

[omp](https://github.com/can1357/oh-my-pi) 是一款终端优先的 AI 编程智能体。它在本地运行，原生支持 LSP 代码智能、DAP 调试、子智能体协作、计划模式与会话分支，并通过 Hashline 锚点编辑与可追溯规则保障安全。

本站是 [omp.sh](https://omp.sh/) 官方文档的完整中文翻译，涵盖安装、配置、Provider、会话、工具、LSP/DAP、子智能体、扩展开发与 SDK 等 46 篇文档，由 VitePress 驱动并做了完整的 SEO 优化。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 检查与构建

```sh
pnpm lint            # ESLint 检查
pnpm typecheck       # TypeScript 类型检查
pnpm check:content   # 内容完整性检查
pnpm check:seo       # SEO 元数据检查（title、OG、JSON-LD、sitemap 等）
pnpm build           # 生产构建
```

`check:seo` 会使用测试 HTTPS 地址构建站点，检查 47 个页面的 title、description、canonical、Open Graph、Twitter Card、JSON-LD、H1、sitemap 和 robots。

正式部署时通过 `SITE_URL` 提供完整 HTTPS 公开地址，构建过程会据此生成 `base`、canonical、绝对社交分享链接、`sitemap.xml` 和 `robots.txt`。

```powershell
$env:SITE_URL = 'https://docs.example.com/omp'
pnpm build
```

```sh
SITE_URL=https://docs.example.com/omp pnpm build
```

## 许可

[MIT](LICENSE)
