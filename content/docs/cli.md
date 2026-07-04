---
title: "CLI 参考"
description: "查询 omp CLI 的全部 Flag、运行模式、模型、会话、工具、扩展、认证选项和独立子命令。"
summary: "本页按用途整理 omp CLI 的参数优先级、输出协议、模型与角色覆盖、会话恢复、工具限制、资源加载和常用命令示例。"
keywords:
  - "omp CLI"
  - "命令行参考"
  - "CLI Flag"
  - "omp 命令"
  - "终端编程智能体"
source: https://omp.sh/docs/cli
---

# CLI 参考

## 用法

```sh
omp [options] [@files...] [messages...]
omp <command> [args] [flags]
```

直接运行 `omp` 会在当前目录中打开交互式会话；使用 `-p` 时，它输出一次回答后退出。子命令会分派到该工具，而不是启动代理。每个带有值的标志也接受 `--flag=value`。任何前缀为 `@` 被视为文件，即使它位于标志之间。

## 优先级

CLI 标志 > 环境变量 > `~/.omp/agent/config.yml` > 内置默认值。 `--api-key` 覆盖该次运行的所有内容并且永远不会持久化；看到 [Provider](/docs/providers) 了解每个 provider 如何解析密钥。大多数标志都有一个 env-var 后备记录在 [Environment variables](/docs/env).

## 模式

omp 支持五种输出协议。选择一个与 `--mode`，或使用 `-p` 对于最常见的情况（一次性文本）。

| 选项 | 描述 | 默认/注释 |
| --- | --- | --- |
| `--print, -p` | 一次性：发送提示、流式传输答案、退出。没有 TUI。 |  |
| `--mode <mode>` | 输出协议。 | 文字| json | rpc | acp | rpc-ui |
| `--export <file> [out]` | 将录制的 jsonl 会话呈现为 HTML 并退出。位置输出路径可选。 |  |
| `--allow-home` | 允许从 $HOME 启动而不使用自动 chdir 进入临时目录。 |  |

| 模式 | 描述 |
| --- | --- |
| `text` | 默认。纯文本流式传输到标准输出。与脚本的 -p 配对。 |
| `json` | 标准输出上以换行符分隔的 JSON 事件。形状稳定，可通过通过管道传给其他工具。 |
| `rpc` | 通过 stdio 的 JSON-RPC。由 SDK 和编程客户端使用。 |
| `rpc-ui` | 与 rpc 相同，TUI 内工具调用 UI 呈现给客户端。 |
| `acp` | 基于 stdio 的Agent Client Protocol。与 omp acp 相同的wire format。 |

对于 `rpc`, `rpc-ui`, 和 `acp`，参见 [RPC模式](/docs/rpc) 和 [ACP](/docs/acp) 对于wire format和 SDK 客户端。

## 模型

选择活动模型和角色覆盖。有关角色语义，请参阅 [模型角色](/docs/roles);有关凭据和 OAuth，请参阅 [Provider](/docs/providers).

| 选项 | 描述 | 默认/注释 |
| --- | --- | --- |
| `--model <id>` | 活跃模型。与 registry 进行模糊匹配（例如 sonnet、gpt-5-codex）。 | 最后使用或 modelRoles.default |
| `--provider <name>` | Provider 提示。主要用于兼容旧版；通常只需使用 `--model`。 | — |
| `--smol <id>` | 覆盖此运行的 smol 角色（快速/廉价的帮助任务）。 | PI\_SMOL\_MODEL 或设置 |
| `--slow <id>` | 超越缓慢的角色（深度推理、计划）。 | PI\_SLOW\_MODEL 或设置 |
| `--plan <id>` | 覆盖 计划模式 运行时使用的计划角色。 | PI\_PLAN\_MODEL 或设置 |
| `--models <p1,p2,…>` | 用于角色循环的逗号分隔模式。每个项目都是“id\[:effort\]”。 | 请参阅/docs/角色。 |
| `--list-models [pattern]` | 打印发现的模型并退出。可选模式过滤列表。 | 兼作身份验证探针。 |
| `--thinking <level>` | 推理努力。 | 最小、低、中、高、xhigh |
| `--api-key <key>` | 将此键仅用于所选的 provider 运行。 | 不会持久化。请参阅/docs/providers。 |

## 会话

恢复、Fork和隔离运行。会话用户体验位于 [会话](/docs/sessions); JSONL 格式本身位于 [会话格式](/docs/session-format).

| 选项 | 描述 | 默认/注释 |
| --- | --- | --- |
| `--continue, -c` | 打开此目录中的最新会话。 |  |
| `--resume, -r [id|path]` | 通过会话 ID 前缀或 jsonl 路径恢复。如果没有值，则打开交互式选择器。 |  |
| `--session <value>` | \--resume 的别名。 |  |
| `--fork <message-id>` | 从特定消息 ID 分支恢复的会话。 | 与-r 一起使用。 |
| `--no-session` | 不要将此运行持久保存到 ~/.omp/agent/sessions/。 |  |
| `--session-dir <dir>` | 覆盖用于会话存储和查找的目录。 |  |
| `--provider-session-id <id>` | 将外部发布的 provider 会话 ID 传递到模型 API。 | 主要用于集成。 |
| `--no-title` | 跳过后台“生成标题”模型调用。 |  |

## 工具和扩展

限制模型可以调用哪些内置工具，以及启动时加载哪些扩展、skills 和规则。 `--no-extensions` 和 `--no-skills` 是运行范围的——它们不会修改保存的 config。

| 选项 | 描述 | 默认/注释 |
| --- | --- | --- |
| `--tools <a,b,…>` | 仅允许这些内置工具。未知名称会发出警告并被删除。 | 请参阅/docs/tools。 |
| `--no-tools` | 禁用每个内置工具。 Plugin 工具仍在加载。 |  |
| `--no-lsp` | 跳过启动 lsp 工具的语言服务器。 |  |
| `--no-pty` | 在没有 PTY 的情况下运行 bash。与 PI\_NO\_PTY=1 相同。 |  |
| `--extension <path>, -e` | 加载扩展文件。可重复。 |  |
| `--hook <path>` | 加载 hook/扩展文件。可重复；与 -e 相同的加载程序。 |  |
| `--plugin-dir <path>` | 将目录视为 plugin 根。可重复。 |  |
| `--no-extensions` | 禁用扩展发现。还删除运行的显式 -e 路径。 |  |
| `--no-skills` | 禁用 skill 发现和加载。 |  |
| `--skills <p1,p2,…>` | 以逗号分隔的全局模式仅保留匹配的 skills。 |  |
| `--no-rules` | 禁用 RULES.md 发现和注入。 |  |
| `--system-prompt <text|@file>` | 替换系统提示符。接受内联文本或@file 路径。 |  |
| `--append-system-prompt <text|@file>` | 附加到默认系统提示符而不是替换它。 |  |

## 输出

一次性输出和成绩单导出。 `-p` 将 STDIN 读入提示符，因此 `cat README.md | omp -p "Summarise"` 工作无需仪式。 `--export` 将录制的 JSONL 会话转换为独立的 HTML 页面。 `--allow-home` 允许从以下位置启动 `$HOME` 无需自动 chdir 进入临时目录。

## 背景

任何以以下开头的位置 `@` 在发送提示之前已解决。 omp 按内容而不是扩展名检测图像。

-   **文本文件** 解码为 UTF-8 并内联为 `<file name="/abs/path">…</file>` 块位于用户消息的顶部。超过 5 MB 的文件将替换为仅路径存根。
-   **图片** （PNG/JPEG/WebP/GIF/...）作为本机多模式部件附加。何时自动调整大小 `images.autoResize` 开启（默认）。图片上限：25 MB。
-   **文件丢失或无法读取** 以非零退出中止运行。没有无声的跳过。

> `@files` 不支持 `--mode rpc` 或 `rpc-ui`;通过 RPC 协议传递内容。

## 杂项

| 选项 | 描述 |
| --- | --- |
| `--cwd <dir>` | 在此目录中启动（覆盖启动 cwd）。 |
| `--config <file>` | 为此运行加载额外的 config.yml 样式覆盖。可重复。 |
| `--approval-mode <mode>` | 覆盖此会话的tools.approvalMode：always-ask、write、yolo。 |
| `--auto-approve, --yolo` | 自动批准所有工具调用（跳过批准提示）。 |
| `--hide-thinking` | 在 TUI 输出中隐藏思考块。仅显示 - 不会禁用模型思维。 |
| `--help, -h` | 打印帮助和环境变量/工具参考。 |
| `--version, -v` | 打印版本并退出。 |

## 子命令

子命令会短路代理启动器并运行专用工具。每个子命令都接受 `--help`.

| 命令 | 描述 |
| --- | --- |
| `acp` | 通过 stdio 说出Agent Client Protocol。由编辑器集成（Zed、Neovim）用来嵌入 omp。 |
| `agents` | 管理代理定义。 omp Agents unpack 将捆绑的子代理写入 ~/.omp/agent/agents/ （或使用 --project 的 ./.omp/agents/ ）。 |
| `auth-broker` | 运行或管理远程凭证库：服务、令牌、登录、注销、列表、导入、迁移、状态。参见 [Provider](/docs/providers#remote-credential-vault-auth-broker). |
| `auth-gateway` | 将代理凭据注入 OpenAI 聊天、Anthropic 消息和 OpenAI 响应请求的转发代理。服务、令牌、状态、检查。参见 [Provider](/docs/providers#remote-credential-vault-auth-broker). |
| `commit` | 生成提交消息并从暂存差异更新 CHANGELOG.md。标志：--push、--dry-run、--no-changelog、--legacy、--context、--model。 |
| `completions` | 打印从实时命令元数据生成的 bash、zsh 或 Fish 的 shell 完成脚本。 |
| `config` | 读/写设置：列表、获取、设置、重置、路径、init-xdg。事实来源是设置模式。 |
| `grep` | 独立运行本机 grep 包装器。标志：--glob、--limit、--context、--files、--count、--no-gitignore。 |
| `grievances` | 检查由report\_tool\_issue写入的自动QA工具问题日志。列表/清理/推送。 |
| `install` | 安装或链接扩展 package — 本地路径路由到 plugin 链接，package 规格路由到 plugin 安装。 |
| `join` | 通过链接加入共享协作会话（与 /join 相同）。 |
| `plugin` | Plugin 和 marketplace 生命周期：安装、卸载、列表、链接、医生、功能、config、启用、禁用、marketplace、发现、升级。 |
| `read` | 从 shell 中的任何路径或 \*:// URI 调用读取工具。对于档案和工具输出很有用。 |
| `search (q)` | 通过配置的 provider 堆栈运行 web 搜索。 omp q 是短别名。标志：--provider、--recency、--limit、--compact。 |
| `setup` | Bare omp 设置运行载入向导。 omp setup python 设置 Python 内核； omp setup stt 规定语音转文本。通过 --check 来探测而不安装。 |
| `shell` | 进入由 bash 工具使用的相同 Brush-Core shell 支持的交互式 REPL。标志：--cwd、--超时、--无快照。 |
| `ssh` | 管理 ssh 工具使用的 SSH 主机定义：添加、删除、列表。 |
| `stats` | 查看所有会话的使用统计信息（成本、高级请求计数、令牌）。标志：--summary、--json、--port。 |
| `update` | 自我更新。如果可用，则使用 bun，否则提取发布二进制文件。标志：--force、--check。 |
| `usage` | 显示每个经过身份验证的帐户的 provider 使用限制。标志：--provider、--redact、--history、--days、--json。 |
| `worktree (wt)` | 列出或清除 ~/.omp/wt 下代理管理的 git 工作树：列出，清除。标志：--all、--dry-run、--json。 |

## 食谱

```sh
# Continue the most recent session here
omp -c

# Pick a session interactively
omp -r

# Resume by id prefix and branch from a specific message
omp -r 1f9d2a --fork msg_8c1e "Try a different approach"

# One-shot, no TUI
omp -p "Summarise CHANGELOG.md since the last release"

# Read-only audit: no edits, no shell, no LSP
omp --tools read,find,search --no-lsp -p "Find dead code in src/"

# Role cycling: sonnet for slow/plan, haiku for smol
omp --models 'sonnet:high,haiku:low'

# Attach files and an image in one shot
omp @prompt.md @screenshot.png "Implement what's drawn"

# Render an old session as standalone HTML
omp --export ~/.omp/agent/sessions/proj/2026-05-01.jsonl out.html

# Pipe stdin: anything on stdin becomes the prompt
git diff | omp "review this diff and flag risky changes"

# JSON event stream for CI
omp --mode json --no-session -p "$PROMPT" > events.jsonl
```
