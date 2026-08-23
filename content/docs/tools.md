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

在会话中运行 `/tools` 可查看当前可用工具；在 CLI 中可用 `--tools read,search,edit` 限制内置工具。下表列出开箱即用的工具。

| 工具 | 说明 | 详情 |
| --- | --- | --- |
| `ast_edit` | 使用 ast-grep 模式进行结构化代码修改，写入前会预览。 | [结构编辑](/docs/editing) |
| `ast_grep` | 使用 ast-grep 模式进行结构化代码搜索，是 `ast_edit` 的只读对应工具。 | [结构编辑](/docs/editing) |
| `bash` | 在持久会话中以指定 cwd、环境变量和 PTY 选项运行 Shell 命令。 | [处理文件](/docs/files) |
| `browser` | 通过 Puppeteer 驱动真正的 Chromium 选项卡；选项卡在调用中持续存在。 | [Web & 浏览器](/docs/web) |
| `debug` | 通过 DAP 设置断点、单步执行并检查局部变量。 | [调试](/docs/debugging) |
| `edit` | 根据每个会话文件快照验证行锚定补丁。 | [处理文件](/docs/files) |
| `eval` | 在持久内核中运行 Python 或 JS 单元。 | [处理文件](/docs/files) |
| `find` | 通过 glob 快速查找文件名；按修改时间排序。 | [处理文件](/docs/files) |
| `generate_image` | 通过主题、场景、光照和风格字段生成结构化图像。 | [工具索引](/docs/tools) |
| `github` | 基于 `gh` 的 GitHub 操作封装，如 `repo_view`、`pr_create`、`pr_checkout`、`search_*`、`run_watch`。 | [GitHub](/docs/github) |
| `inspect_image` | 将本地图像传递给视觉模型并获取文本答案。 | [工具索引](/docs/tools) |
| `irc` | 在同一进程内的同级智能体间发送短消息；向暂停的智能体发送消息会将其恢复。 | [子智能体与 IRC](/docs/subagents) |
| `job` | 列出、等待或取消由异步 bash 或 task 启动的后台作业。 | [子智能体与 IRC](/docs/subagents) |
| `lsp` | 重命名、引用、定义、悬停、诊断、Code Action。 | [代码智能](/docs/code-intelligence) |
| `read` | 文件、目录、档案、SQLite、文档、图像、内部 URI、web URL。 | [处理文件](/docs/files) |
| `recipe` | 调用项目任务运行器中的目标，如 bun、just、make、cargo。 | [处理文件](/docs/files) |
| `report_tool_issue` | 标记意外的工具行为以进行自动 QA 跟踪。 | [工具索引](/docs/tools) |
| `resolve` | 应用或放弃待处理的预览操作（ast\_edit、计划模式批准）。 | [结构编辑](/docs/editing) |
| `search` | 跨文件、目录、glob、内部 URL 的正则表达式内容搜索。 | [处理文件](/docs/files) |
| `task` | 创建并行子智能体，结果以 `agent://` URL 返回。 | [子智能体与 IRC](/docs/subagents) |
| `todo` | 维护分阶段任务列表，并在 TUI 中实时显示。 | [子智能体与 IRC](/docs/subagents) |
| `web_search` | 通过首个可用的搜索 Provider 执行查询。 | [Web 与浏览器](/docs/web) |
| `write` | 创建或覆盖文件、归档条目或 SQLite 行。 | [处理文件](/docs/files) |
