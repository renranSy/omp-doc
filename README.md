# omp 中文文档

基于 VitePress 的 [omp.sh](https://omp.sh/) 中文文档站，包含首页及 Docs 导航中的 46 篇文档。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 检查与构建

```sh
pnpm lint
pnpm typecheck
pnpm check:content
pnpm check:seo
pnpm build
```

`check:seo` 会使用测试 HTTPS 地址构建站点，并检查 47 个页面的 title、description、canonical、Open Graph、Twitter Card、JSON-LD、H1、sitemap 和 robots。

正式部署时通过 `SITE_URL` 提供完整 HTTPS 公开地址；地址可以带子路径。构建过程会据此生成 `base`、canonical、绝对社交分享链接、`sitemap.xml` 和 `robots.txt`。未设置时仍可本地构建，但不会输出可能错误的 canonical 或 sitemap。

```powershell
$env:SITE_URL = 'https://docs.example.com/omp'
pnpm build
```

```sh
SITE_URL=https://docs.example.com/omp pnpm build
```
