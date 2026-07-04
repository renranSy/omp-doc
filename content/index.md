---
layout: home
title: omp 中文文档｜终端 AI 编程智能体指南
titleTemplate: false
description: omp 中文文档提供终端 AI 编程智能体的安装、配置、模型 Provider、会话、工具、扩展与 SDK 完整指南。
summary: omp 是与 IDE 深度联动的终端编程智能体。本中文站覆盖快速开始、LSP、DAP、子智能体、计划模式、长期记忆、多模型 Provider 与扩展开发。
keywords:
  - omp
  - 终端 AI 编程智能体
  - 中文文档
  - AI 编程
  - LSP
  - 子智能体

hero:
  name: omp
  text: 与 IDE 深度联动的编程智能体
  tagline: 子智能体、计划模式、LSP、DAP、长期记忆、Hashline 编辑与可追溯规则——繁重工作由原生 Rust 引擎完成。
  actions:
    - theme: brand
      text: 快速开始
      link: /docs/quickstart
    - theme: alt
      text: 浏览文档
      link: /docs/
    - theme: alt
      text: GitHub
      link: https://github.com/can1357/oh-my-pi

features:
  - icon: ⚡
    title: 终端优先
    details: 在本机运行，使用同一套工具读取代码、执行命令、编辑文件、驱动调试器并操作 GitHub。
  - icon: 🧭
    title: IDE 级代码智能
    details: 内置 LSP 与 DAP，支持重命名、引用、诊断、断点、单步执行和变量检查。
  - icon: 🌿
    title: 会话像 Git 一样分支
    details: 会话持久化为 JSONL，可恢复、分支、Fork、共享并通过会话树浏览历史。
  - icon: 🤝
    title: 会协作的子智能体
    details: 将工作分派给独立子进程；同级智能体能够直接交换消息，无需父智能体中转。
  - icon: 🧩
    title: 开放且可扩展
    details: 支持多种 Provider、MCP、Skills、Hooks、自定义工具、Plugin 与 Marketplace。
  - icon: 🛠️
    title: 完整工具箱
    details: 文件、搜索、结构化编辑、浏览器、代码执行、图像、SSH 与更多工具开箱即用。
---

## 安装

::: code-group

```sh [macOS / Linux]
curl -fsSL https://omp.sh/install | sh
```

```powershell [Windows]
irm https://omp.sh/install.ps1 | iex
```

```sh [Bun]
bun install -g @oh-my-pi/pi-coding-agent
```

```sh [mise]
mise use -g github:can1357/oh-my-pi
```

:::

omp 可在 macOS、Linux 和 Windows 上运行；使用 Bun 包时需要 Bun ≥ 1.3.14。

## 为什么选择 omp

omp 是 [Pi](https://github.com/badlogic/pi-mono) 的一个 Fork，保留了适合真实开发工作的交互式终端体验，并加入原生文件与搜索工具、LSP、DAP、子智能体、计划模式、长期记忆、浏览器、GitHub 虚拟文件系统以及丰富的扩展接口。

它可以连接数十种模型 Provider。你可以通过 OAuth 使用订阅账户，通过环境变量提供 API Key，也可以在 `~/.omp/agent/models.yml` 中声明兼容端点与本地模型。模型角色、重试与回退链都可以配置，而不是藏在不可见的默认行为中。

## 核心文档

- [快速开始](/docs/quickstart)：安装、终端配置、Provider 认证和第一条提示词。
- [Provider](/docs/providers)：OAuth、API Key、凭据优先级与跨机器认证。
- [设置](/docs/settings)：`config.yml`、模型角色和常用行为配置。
- [CLI 参考](/docs/cli)：全部 Flag、运行模式、会话选项和子命令。
- [编写扩展](/docs/extension-authoring)：使用 TypeScript 注册工具、命令和事件。
- [工具索引](/docs/tools)：浏览文件、LSP、DAP、Web、记忆与子智能体工具。

> 本站是 [omp.sh](https://omp.sh/) 文档的中文翻译，命令、配置键、路径、环境变量及代码示例均保留原文形式。
