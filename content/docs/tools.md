---
title: "工具索引"
description: "浏览 omp 内置工具索引，快速了解文件、运行时、代码智能、Web、记忆、子智能体和系统工具的用途。"
summary: "本页按名称列出 omp 开箱即用的工具及其职责，并链接到文件操作、LSP、DAP、Web、记忆、任务编排等详细文档。"
keywords:
  - "omp 工具"
  - "工具索引"
  - "AI 工具调用"
  - "LSP"
  - "子智能体"
source: https://omp.sh/docs/tools
---

# 工具索引

## 内置工具

运行 `/tools` 在会话中查看实时工具界面；通过 `--tools read,search,edit` 在 CLI 上对其进行限制。下表列出了开箱即用的内容。

| 工具 | 总结 | 记录于 |
| --- | --- | --- |
| `ast_edit` | 通过 ast-grep 模式进行结构代码调制；在写入之前进行预览。 | [结构编辑](/docs/editing) |
| `ast_grep` | 通过 ast-grep 模式进行结构代码搜索；的只读同级 `ast_edit`. | [结构编辑](/docs/editing) |
| `bash` | 使用 cwd、env 和 PTY 控件在持久会话中运行 shell 命令。 | [处理文件](/docs/files) |
| `browser` | 通过 Puppeteer 驱动真正的 Chromium 选项卡；选项卡在调用中持续存在。 | [Web & 浏览器](/docs/web) |
| `debug` | DAP 驱动的断点、单步执行和本地检查。 | [调试](/docs/debugging) |
| `edit` | 根据每个会话文件快照验证行锚定补丁。 | [处理文件](/docs/files) |
| `eval` | 在持久内核中运行 Python 或 JS 单元。 | [处理文件](/docs/files) |
| `find` | 通过 glob 快速查找文件名；按修改时间排序。 | [处理文件](/docs/files) |
| `generate_image` | 具有主题、场景、照明和风格字段的结构化图像生成。 | [工具索引](/docs/tools) |
| `github` | 基于 Op 的 gh 包装器：repo\_view、pr\_create、pr\_checkout、search\_\*、run\_watch。 | [GitHub](/docs/github) |
| `inspect_image` | 将本地图像传递给视觉模型并获取文本答案。 | [工具索引](/docs/tools) |
| `irc` | 同一进程中的对等代理之间的短文消息；向停放的特工发送消息使其恢复。 | [子代理 & IRC](/docs/subagents) |
| `job` | 列出、等待或取消由异步 bash 或任务启动的后台作业。 | [子代理 & IRC](/docs/subagents) |
| `lsp` | 重命名、引用、定义、悬停、诊断、Code Action。 | [代码智能](/docs/code-intelligence) |
| `read` | 文件、目录、档案、SQLite、文档、图像、内部 URI、web URL。 | [处理文件](/docs/files) |
| `recipe` | 从项目的任务运行程序运行目标（bun，just，make，cargo）。 | [处理文件](/docs/files) |
| `report_tool_issue` | 标记意外的工具行为以进行自动 QA 跟踪。 | [工具索引](/docs/tools) |
| `resolve` | 应用或放弃待处理的预览操作（ast\_edit、计划模式批准）。 | [结构编辑](/docs/editing) |
| `search` | 跨文件、目录、glob、内部 URL 的正则表达式内容搜索。 | [处理文件](/docs/files) |
| `task` | 生成并行子代理；结果以 agent:// URL 的形式返回。 | [子代理 & IRC](/docs/subagents) |
| `todo` | 分阶段任务跟踪在 TUI 中实时呈现。 | [子代理 & IRC](/docs/subagents) |
| `web_search` | 通过第一个可用搜索 provider 调度一个查询。 | [Web & 浏览器](/docs/web) |
| `write` | 创建或覆盖文件、归档条目或 SQLite 行。 | [处理文件](/docs/files) |
