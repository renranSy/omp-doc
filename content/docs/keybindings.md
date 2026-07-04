---
title: "快捷键"
description: "查询并自定义 omp 的默认快捷键，覆盖编辑器导航、消息发送、模型切换、计划模式和智能体面板。"
summary: "本页列出 omp TUI 的默认快捷键和终端兼容注意事项，并说明如何通过 keybindings.yml 重映射操作或为同一动作配置多个按键。"
keywords:
  - "omp 快捷键"
  - "keybindings"
  - "TUI"
  - "终端按键"
  - "快捷键配置"
source: https://omp.sh/docs/keybindings
---

# 快捷键

## 查看直播名单

运行 `/hotkeys` 从任何会话中转储当前版本看到的快捷键。该列表反映了活动的重新映射以及添加的任何快捷键 [插件](/docs/plugins);下表是开箱即用的默认值。

## 编辑器 — 导航

| 钥匙 | 行动 |
| --- | --- |
| 方向键 | 移动cursor； ↑ 在空编辑器上浏览历史记录 |
| Option+←/→ | 按单词移动 |
| Ctrl+A / Home / Cmd+← | 行首 |
| Ctrl+E / End / Cmd+→ | 行尾 |

## 编辑器——编辑

| 钥匙 | 行动 |
| --- | --- |
| Enter | 发送（或在代理工作时作为转向消息排队） |
| Shift+Enter / Alt+Enter | 换行符 |
| Ctrl+Q / Ctrl+Enter | 队列作为后续消息（轮次产生后清空） |
| Ctrl+W / Option+Backspace | 向后删除单词 |
| Ctrl+U | 删除到行首 |
| Ctrl+K | 删除到行尾 |
| Alt+Shift+L | 复制当前行 |
| Alt+Shift+C | 复制整个提示 |
| Ctrl+G | 编辑草稿于 `$VISUAL` / `$EDITOR` |
| Alt+Up | 将已排队的消息出队返回编辑器 |

> 在 Windows Terminal 上， Ctrl+Enter 永远不会到达该应用程序 - 使用 Ctrl+Q 那里有后续快捷键； Shift+Enter 与 Enter 并作为转向着陆。

## 编辑器——控制

| 钥匙 | 行动 |
| --- | --- |
| Tab | 路径完成/接受自动完成 |
| Escape | 取消自动完成/中断活动回合 |
| Ctrl+C | 清除编辑器（第一次按）/退出（第二次按） |
| Ctrl+D | 退出（当编辑器为空时） |
| Ctrl+Z | 暂停到后台； `fg` 在 shell 中恢复 |
| Ctrl+R | 搜索提示历史记录 |
| Ctrl+O | 切换工具输出扩展（以及内部的过滤器循环） `/tree`) |
| Ctrl+T | 切换思维块可见性 |
| Alt+H | 切换语音转文本录音 |
| Shift+Tab | 循环思维水平 |

## 模型

| 钥匙 | 行动 |
| --- | --- |
| Ctrl+P | 向前循环角色模型（慢速/默认/smol） |
| Shift+Ctrl+P | 向后循环榜样 |
| Alt+P | 为本次会话临时选择一个模型 |
| Alt+M | 打开模型选择器（设置角色） |
| Alt+Shift+P | 切换 [计划模式](/docs/plan) |

## 仪表板（导航器表面）

`/tree`, `/extensions`, 和 `/agents` 共享一个通用的导航器。 Escape 关闭；有源过滤器被第一个清除 Escape 第二个出口。

| 钥匙 | 行动 |
| --- | --- |
| Tab / Shift+Tab | 循环选项卡（例如 provider 中的选项卡 `/extensions`) |
| Up/Down 或 j/k | 移动突出显示 |
| Space | 切换所选项目（或标题上的整个选项卡） |
| Enter | 打开检查器/保存编辑 |
| N | 新代理流入 `/agents` |
| R | 在新代理流程期间重新生成 |
| Ctrl+R | 从磁盘重新加载 (`/agents`) |

## 采摘者

文件和历史记录选择器（`@` 文件引用、提示搜索、提示操作菜单 #）与编辑分享他们的动作键： Up/Down 走一遍清单， Tab 接受亮点， Escape 驳回。的 `@` 选择器模糊匹配项目根目录下未被忽略的每个文件 `.gitignore`.

## 计划模式 快捷键

| 钥匙 | 行动 |
| --- | --- |
| Alt+Shift+P | 切换 计划模式（别名为 `/plan`) |
| Escape 在批准屏幕上 | 取消；返回计划模式迭代而不执行 |

## 定制

重新映射生活在 `~/.omp/agent/keybindings.yml` — 一个单独的文件 `config.yml`。每个条目映射一个命名空间的操作 ID（如打印的 `/hotkeys`, e.g. `app.model.cycleForward`, `tui.editor.undo`) 到一个快捷键，或者如果您想要多个快捷键来触发该动作，则到一组快捷键。快捷键记谱匹配什么 `/hotkeys` 以规范形式打印：小写， `+`\-加入，例如 `ctrl+p`, `alt+shift+p`, `alt+up`。参见 [设置](/docs/settings) 代理目录所在的位置，以及 [斜杠命令](/docs/slash) 对于快捷键触发的命令。

```yaml
# ~/.omp/agent/keybindings.yml
app.model.cycleForward: ctrl+p
app.plan.toggle: alt+shift+p
app.clipboard.copyPrompt: [alt+shift+c, ctrl+shift+c]
```

> 旧配置中的旧短名称（`cycleModelForward`, `togglePlanMode`, ...) 在加载时自动迁移到命名空间形式；旧版 `keybindings.json` 被迁移到 `keybindings.yml` (`keybindings.yaml` 也被接受）。

> 动作名称在各个版本中都是稳定的；如果升级后快捷键停止工作，请运行 `/hotkeys` 并与您的地图进行比较。
