---
title: "Web 与浏览器"
description: "使用 omp 的 web_search、URL read 和 browser 工具搜索网络、提取网页内容并自动操作浏览器。"
summary: "本页比较网络搜索、URL 读取和浏览器自动化的适用场景，介绍 Provider 链、Reader 模式、页面选择器和持久化浏览器标签。"
keywords:
  - "omp Web"
  - "web_search"
  - "浏览器自动化"
  - "网页读取"
  - "网络搜索"
source: https://omp.sh/docs/web
---

# Web 与浏览器

## 伸手去拿哪个

| 工具 | 使用时 |
| --- | --- |
| `web_search` | 您需要一个综合答案和源 URL，但不知道哪个页面包含事实。 |
| `read` 在网址上 | 您已经有了 URL，并且想要不含 JavaScript 的干净文本。 |
| `browser` | 页面需要 JS、身份验证、表单填写或交互式点击。选项卡在调用过程中持续存在。 |

## 网络搜索

一 `query`，通过配置链中第一个可用的 provider 调度：Anthropic、Brave、Codex、Exa、Gemini、Jina、Kagi、Kimi、Parallel、Perplexity、SearXNG、Synthetic、Tavily、Z.AI。结果是统一的 `SearchResponse`; provider 顺序在 config 中设置一次，而不是每次调用。可选 `recency` (`day`, `week`, `month`, `year`）受到支持它的Provider的尊重。门控由 `web_search.enabled`.

```sh
web_search query="bun workspaces hoisting behaviour" recency="month"
```

## 针对 URL 进行读取

将任意 `http://` 或 `https://` URL 传给 `read`。默认使用 Reader 模式：文章、GitHub Issue 和 PR、Stack Overflow、Wikipedia、NPM 页面、arXiv、RSS/Atom Feed、JSON Endpoint 和 PDF 都会以纯文本或 Markdown 返回。追加 `:raw` 可获取未经处理的 HTML；追加行选择器（`:50-100`、`:50+150`）可对缓存输出分页。不带 scheme 的 `host:port` URL 会与选择器语法冲突；请在选择器前添加尾部斜杠。

```sh
# reader-mode markdown
read https://example.com/docs/api

# raw HTML, then a line range over the cached fetch
read https://example.com/page:raw
read https://example.com/page:200-400
```

伸手去拿 `read` 结束 `browser` 每当内容是静态的时。它更快、更便宜，而且输出已经适合模型的散文形状。

## 浏览器

通过 Puppeteer 驱动的真正的 Chromium 选项卡。三个动作：

`open`

获取（或重用）命名选项卡。 `name` 默认为 `"main"`。 可选 `url` 选项卡准备好后进行导航； `viewport` 设置尺寸； `dialogs` 自动接受或自动拒绝 `alert`/`confirm`/ `beforeunload`.

`run`

针对现有选项卡执行异步 JS。 `code` 是一个异步函数的主体 `page`, `browser`, `tab`, `display`, `assert`, 和 `wait` 范围内。返回值被 JSON 字符串化到工具结果中。

`close`

释放一个选项卡 `name`，或每个选项卡 `all: true`。对于衍生应用程序 浏览器， `kill: true` 终止进程树。

标签存活下来 `run` 呼叫以及跨进程内子代理。打开一次，多次重复使用。的 `tab` 帮手暴露 `observe()` 对于具有稳定元素 ID 的辅助功能快照，加上 `click`, `fill`, `type`, `press`, `select`, `uploadFile`, `waitForUrl`, `waitForResponse`, `screenshot`, 和 `extract`.

默认为 `tab.observe()` 结束 `tab.screenshot()` 为了理解页面状态 - 快照返回带有您可以操作的元素 ID 的结构化数据。仅当视觉外观很重要时才使用屏幕截图。

```js
browser open name=docs url=https://example.com/login
browser run  name=docs code=`
  const obs = await tab.observe();
  const link = obs.elements.find(e => e.role === "link" && e.name === "Sign in");
  await (await tab.id(link.id)).click();
  await tab.fill('input[name=email]', 'me@example.com');
  await tab.click('text/Continue');
`
browser close name=docs
```

不要启动 headless，而是通过 CDP 或生成 Electron 二进制文件附加到正在运行的 Chromium 应用程序：

```js
browser open name=cursor app={path: "/Applications/Cursor.app/Contents/MacOS/Cursor"}
browser open name=devtools app={cdp_url: "http://127.0.0.1:9222"}
```

对于具体的 PR 和问题，更喜欢记录在 [GitHub](/docs/github) - 它们会自动缓存并像本地文件一样读取。
