---
title: "主题"
description: "切换 omp 内置终端主题，或通过 JSON 主题文件自定义颜色 Token、语法高亮、Diff 与符号集。"
summary: "本页介绍内置主题目录、主题切换命令、自定义文件位置、完整 UI 颜色键和符号配置，并说明校验与调试方式。"
keywords:
  - "omp 主题"
  - "终端配色"
  - "自定义 Theme"
  - "语法高亮"
  - "TUI"
source: https://omp.sh/docs/themes
---

# 主题

## 内置主题

omp 提供约 100 个调色板，包括两个基线 `dark` 和 `light`。该目录包括 Catppuccin、Dracula、Nord、Gruvbox、Tokyo Night、Poimandres、Solarized、Rose Pine、Monokai（大多数有深色和浅色版本）以及 omp 原版，例如 `titanium`.

列出 omp 内部的活动集 `/settings`，然后选择一个进行应用。

## 切换主题

来自 `/settings`，导航至 **主题** 并选择一个值。将其中一个固定 `~/.omp/agent/config.yml`:

```yaml
theme:
  dark: titanium
  light: light
```

自动选择插槽：先OSC 11背景亮度，然后 `COLORFGBG`，然后是 Zellij 路径上的本机 macOS 外观探测，其中 OSC 11 不可靠，然后是黑暗后备。

## 自定义主题

将 JSON 文件拖放到 `~/.omp/agent/themes/<name>.json`。不带扩展名的文件名将成为主题名称。内置名称优先于同名的自定义文件 - 选择一个唯一的名称。

```json
{
  "name": "ink",
  "vars": {
    "fg": "#e6e6e6",
    "accent": "#7aa2f7"
  },
  "colors": {
    "text": "fg",
    "accent": "accent",
    "error": "#f7768e",
    "success": "#9ece6a",
    "warning": "#e0af68",
    "border": "#3a3f4b",
    "muted": "#565f89"
    /* ...remaining required tokens... */
  },
  "symbols": { "preset": "unicode" }
}
```

`vars` 是您通过名称引用的可选调色板 `colors`. `colors` 声明完整的 UI 键集（66 个标记，涵盖文本、边框、背景、markdown、状态行、语法、差异、思维模式）。每个令牌都是必需的 - 缺少密钥是命名它的验证错误。

## 用户界面颜色键

所需的 `colors` Token分为：

| 集团 | 按键 |
| --- | --- |
| 核心文本和边框 | `accent`, `border`, `borderAccent`, `borderMuted`, `success`, `error`, `warning`, `muted`, `dim`, `text`, `thinkingText` |
| 背景 | `selectedBg`, `userMessageBg`, `customMessageBg`, `toolPendingBg`, `toolSuccessBg`, `toolErrorBg`, `statusLineBg` |
| 消息和工具文本 | `userMessageText`, `customMessageText`, `customMessageLabel`, `toolTitle`, `toolOutput` |
| 降价 | `mdHeading`, `mdLink`, `mdLinkUrl`, `mdCode`, `mdCodeBlock`, `mdCodeBlockBorder`, `mdQuote`, `mdQuoteBorder`, `mdHr`, `mdListBullet` |
| 差异 | `toolDiffAdded`, `toolDiffRemoved`, `toolDiffContext` |
| 语法 | `syntaxComment`, `syntaxKeyword`, `syntaxFunction`, `syntaxVariable`, `syntaxString`, `syntaxNumber`, `syntaxType`, `syntaxOperator`, `syntaxPunctuation` |
| 思维和输入模式 | `thinkingOff`, `thinkingMinimal`, `thinkingLow`, `thinkingMedium`, `thinkingHigh`, `thinkingXhigh`, `bashMode`, `pythonMode` |
| 状态行 | `statusLineSep`, `statusLineModel`, `statusLinePath`, `statusLineGitClean`, `statusLineGitDirty`, `statusLineContext`, `statusLineSpend`, `statusLineStaged`, `statusLineDirty`, `statusLineUntracked`, `statusLineOutput`, `statusLineCost`, `statusLineSubagents` |

## 符号集

`symbols.preset` 之间交换 `unicode` （默认）， `nerd` （需要 Nerd 字体），以及 `ascii` 对于错误渲染字形的终端。

## 实时重新加载

监视活动的自定义主题文件。保存并重新绘制 TUI。没有重新启动，没有重新加载命令。

## 相关

-   [设置](/docs/settings) - 将主题固定在 `config.yml`.
-   [插件](/docs/plugins) — 将主题与其他扩展界面捆绑在一起。
