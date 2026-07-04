---
title: "快速开始"
description: "从安装 omp、配置终端和认证模型 Provider 开始，完成首次启动并发送第一条编程提示词。"
summary: "快速完成 omp 的安装、终端按键协议配置和 Provider 认证，验证 CLI 是否可用，并在项目目录中启动交互式会话或执行单次提示词。"
keywords:
  - "omp 安装"
  - "快速开始"
  - "Provider 认证"
  - "终端配置"
  - "CLI"
source: https://omp.sh/docs/quickstart
---

# 快速开始

安装二进制文件、认证一个 Provider，并发送第一条提示词。

## 安装

omp 既提供可由 Bun 运行的 Package，也提供预构建二进制文件。请选择下列任一方式；它们都会在你的 `PATH` 中生成一个 `omp` 可执行文件。

| 方式 | 命令 | 适用场景 |
| --- | --- | --- |
| Bun | `bun install -g @oh-my-pi/pi-coding-agent` | 已安装 Bun ≥ 1.3.14。 |
| 安装脚本 | `curl -fsSL https://raw.githubusercontent.com/can1357/oh-my-pi/main/scripts/install.sh \| sh` | 其他情况。若 Bun 可用则使用 Bun，否则使用预构建二进制文件。Windows 请将对应的 `install.ps1` Pipe 给 `iex`。 |
| mise | `mise use -g github:can1357/oh-my-pi` | 按项目固定版本。 |

安装器接受 `--source`（强制使用 Bun）、`--binary`（强制使用预构建版本）和 `--ref <tag|branch|commit>`（固定版本）。设置 `PI_INSTALL_DIR` 可以覆盖安装目录。

### 验证

```sh
omp --version          # PATH 中二进制文件的版本
omp config path        # 当前 Agent 目录（包含 config.yml）
omp -p 'hello'         # 往返执行一次单次提示词
```

升级命令、Channel 固定和离线二进制文件请参阅 [CLI 参考](/docs/cli)。

## 终端设置

omp 使用 [Kitty keyboard protocol](https://sw.kovidgoyal.net/kitty/keyboard-protocol/)，因此可以区分 Shift+Enter 与 Enter，并可靠识别 Alt 组合键。

**Kitty** 和 **iTerm2** 无需配置。**Ghostty** 需要在 `~/.config/ghostty/config` 中加入两个 Keybind：

```ini
keybind = alt+backspace=text:\x1b\x7f
keybind = shift+enter=text:\n
```

**wezterm** 需要在 `~/.wezterm.lua` 中设置 `config.enable_kitty_keyboard = true`。**Windows Terminal** 未实现该协议；请使用 Alt+Enter 而不是 Shift+Enter 输入换行。

## 认证

有两种方式连接 Provider：启动前设置环境变量，或在 TUI 中使用 `/login` 登录 OAuth Provider。完整列表请参阅 [Provider](/docs/providers)。

### 方式一：环境变量

使用 Anthropic 最快的启动方式是：

```sh
export ANTHROPIC_API_KEY=sk-ant-...
omp
```

其他常见 Key 包括 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`XAI_API_KEY`、`GROQ_API_KEY`、`MISTRAL_API_KEY`、`OPENROUTER_API_KEY` 和 `ZAI_API_KEY`。完整映射请参阅[环境变量](/docs/env)。

### 方式二：`/login`

对于 Claude Pro/Max、ChatGPT Plus/Pro、GitHub Copilot、Cursor、Z.AI 以及其他订阅 Provider，请启动 omp 并在其中完成认证：

```sh
omp
/login
```

界面将显示按字母排序的选择器。`/login` 只追加凭据，绝不覆盖；`/logout` 清除所选 Provider。同一 Provider 同时存在两类凭据时，已保存的 API Key 优先于 OAuth。所有凭据都存储在 `~/.omp/agent/agent.db` 中——迁移设备时请备份该文件。

## 第一条提示词

在任意项目目录中运行：

```sh
omp
```

首次启动会创建 `~/.omp/agent/`，检测终端的深浅色模式和 Kitty 支持情况，并显示欢迎面板。当前工作目录成为项目根目录；`AGENTS.md` 和规则文件从这里开始发现。输入提示词即可开始：

```text
summarise src/main.ts
```

智能体会选择工具，TUI 把工具调用显示为紧凑卡片，并流式输出响应。按 Ctrl+O 展开卡片即可查看完整工具输出。

单次模式不会启动 TUI，并在一轮完成后退出：

```sh
omp -p "list .ts files in src/"
```

## 下一步

- [使用 omp](/docs/using)：编辑器、消息队列与模式。
- [快捷键](/docs/keybindings)：日常使用的快捷操作。
- [斜杠命令](/docs/slash)：对话内命令参考。
- [会话](/docs/sessions)：恢复、Fork 与分支。
- [计划模式](/docs/plan)：适合在大型改动之前使用。
