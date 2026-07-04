---
title: "概览"
description: "了解 omp 终端编程智能体的核心能力、适用人群、会话模型、子智能体、LSP、DAP 与多模型 Provider 支持。"
summary: "本页概述 omp 的定位与主要特性，包括可分支会话、Hashline 编辑、子智能体协作、代码智能、调试和 GitHub 虚拟文件系统，并说明推荐的后续阅读路径。"
keywords:
  - "omp"
  - "终端编程智能体"
  - "AI 编程"
  - "LSP"
  - "子智能体"
source: https://omp.sh/docs
---

# 概览

omp 是一款运行在本机、以终端为中心的编程智能体。它可以连接任意模型 Provider，并像 Git 分支一样管理会话。

## omp 是什么

omp（读作 “oh-em-pi”，其二进制命令为 `omp`）是 Mario Zechner 的 [Pi](https://github.com/badlogic/pi-mono) 的一个 Fork。它以单个 Bun 进程运行，可驱动你拥有凭据的任意模型 Provider，并向模型提供一组扁平的工具：读取代码、执行命令、编辑文件、驱动调试器，以及生成能够通过进程内 IRC 总线协作的子智能体。

会话以 JSONL 形式持久化在 `~/.omp/agent/sessions/` 下。你可以恢复、Fork、创建分支以及共享会话。设置、凭据、Plugin 和缓存都位于 `~/.omp/agent/`。除非你调用会向外发送数据的工具，否则不会有任何内容离开本机。

初次使用？请前往[快速开始](/docs/quickstart)完成安装并发送第一条提示词，或阅读[使用 omp](/docs/using)了解交互模式的组成。

## 适用人群

omp 面向习惯终端、同时处理多个代码仓库，并希望编程智能体使用同类工具的工程师：`read`、`search`、调试器、LSP、子进程和 GitHub。omp 默认风格克制，并且处处可配置——通过单个配置文件（`~/.omp/agent/config.yml`）、一个 CLI Flag 或一条斜杠命令即可改变行为。

## 与众不同之处

**[会话像 Git 一样分支](/docs/sessions)**  每个会话都是 JSONL 文件。`/branch` 从同一文件中的任意历史消息创建新叶节点；`/fork` 生成新文件；`/tree` 用于浏览它们。还可以使用 `omp -c` 或 `omp -r` 从 CLI 恢复会话。

**[能够互发私信的子智能体](/docs/subagents)**  `task` 工具把工作分派给子 `omp` 进程。同级智能体可在 IRC Peer 列表中看到彼此并直接交换消息，无需父智能体中转。

**[带过期锚点恢复的 Hashline 编辑](/docs/editing)**  每一行都有短内容哈希锚点。模型通过锚点编辑，不必复现空白字符；过期锚点会在文件受损前被发现。

**[进程内 LSP 与 DAP](/docs/code-intelligence)**  `lsp` 驱动重命名、引用、Code Action、诊断与 Hover。[`debug`](/docs/debugging) 工具通过 DAP 提供断点、单步执行和局部变量，并支持 gdb、lldb-dap、debugpy、dlv、js-debug-adapter 等适配器。

**[作为虚拟文件系统的 GitHub](/docs/github)**  `read pr://1428`、`read issue://1234`、`read pr://1428/diff/3`。Issue、PR 与 Diff 都会变成虚拟 Markdown，智能体使用读取本地文件的同一个 `read` 工具访问它们。

**[接入任意 Provider](/docs/providers)**  可通过 OAuth 使用 Claude Pro/Max、ChatGPT、Copilot、Cursor、Z.AI 等服务，也可通过环境变量提供 API Key。各模型角色（`default`、`smol`、`slow`、`plan`）会根据当前认证情况自动解析。

**[计划模式](/docs/plan)**  `/plan` 使用独立规划模型，在隔离环境中执行一次规划 Turn。批准计划时，你可以选择执行并清理规划记录、保留 Transcript，或压缩上下文。

## 接下来阅读什么

- [快速开始](/docs/quickstart)：安装、登录和第一条提示词。
- [使用 omp](/docs/using)：交互模式、编辑器、消息队列和模式。
- [会话](/docs/sessions)：恢复、Fork、分支与共享。
- [斜杠命令](/docs/slash)和[快捷键](/docs/keybindings)：对话内控制方式。
- [Provider](/docs/providers)和[环境变量](/docs/env)：凭据与配置。
- [CLI 参考](/docs/cli)：所有 Flag 与子命令。

## 约定

- 二进制命令是 `omp`，Package 是 `@oh-my-pi/pi-coding-agent`。
- Agent 目录是 `~/.omp/agent/`；设置位于 `~/.omp/agent/config.yml`；凭据位于 `~/.omp/agent/agent.db`。
- 斜杠命令写作 `/plan`，并在活动会话中运行。
- CLI Flag 使用长形式，如 `--resume`；短别名会列在 [CLI 页面](/docs/cli)。
- 设置键是 `config.yml` 内的点分路径，例如 `memory.backend`。
- 内部 URL 使用 `scheme://` 形式，并通过 `read` 工具解析，例如 `pr://`、`issue://`、`skill://`、`artifact://` 和 `memory://`。
