---
title: "模型角色"
description: "为 omp 的 default、smol、slow、plan 等模型角色指定不同模型，并通过配置、环境变量和快捷键切换。"
summary: "本页解释模型角色如何让 omp 针对任务选择合适模型，介绍 modelRoles 配置、CLI 覆盖、思考级别和会话内模型循环。"
keywords:
  - "omp 模型角色"
  - "modelRoles"
  - "模型切换"
  - "Plan 模型"
  - "smol 模型"
source: https://omp.sh/docs/roles
---

# 模型角色

## 核心角色

角色是在特定时刻达到的指定插槽。为每个角色固定一个模型，代理无需询问即可选择合适的模型。

`default`

默认模型。用于未包含更具体角色的每个回合 - 正常 实施工作、互动聊天、工具调用。

`smol`

又快又便宜。标题生成、分类、重试摘要消息、任何广泛的内容 比深度更重要。在此处固定俳句/迷你/纳米级模型。

`slow`

深刻的推理。架构决策、粗糙的调试、一次错误的调用会导致更高的成本 比额外的花费。固定 Opus 级或 Codex 级模型。

`plan`

使用者 [计划模式](/docs/plan) — 的 `/plan` 转向和计划审查 通过。

特定时刻还存在四个角色—— `vision` （具有图像功能的后备）， `designer` （设计师子代理）， `commit` （提交消息生成），以及 `task` （分代理工作）。他们通过同样的方式解决 `modelRoles` 地图。

## 配置角色

设置默认值 `~/.omp/agent/config.yml` （见 [设置](/docs/settings)):

```yaml
modelRoles:
  default: claude-sonnet-4-6
  smol: anthropic/claude-haiku-4-5
  slow: gpt-5.3-codex:high
  plan: claude-opus-4-6:high
```

值可以是规范的 id (`claude-sonnet-4-6`）或明确的 `provider/model` 选择器。尾随一个 `:level` 固定思维水平—— `off`, `minimal`, `low`, `medium`, `high`, `xhigh`.

## 启动时覆盖

每个角色都有一面Flag——除了 `default` 环境变量 — 覆盖会话配置的默认值。

| 角色 | Flag | 环境变量 |
| --- | --- | --- |
| `default` | `--model <id>` | — |
| `smol` | `--smol <id>` | `PI_SMOL_MODEL` |
| `slow` | `--slow <id>` | `PI_SLOW_MODEL` |
| `plan` | `--plan <id>` | `PI_PLAN_MODEL` |

```sh
omp --slow gpt-5.3-codex:xhigh --smol claude-haiku-4-5
```

## 使用 Ctrl+P 循环直播

在一次会话中， Ctrl+P 通过模型 ID 列表旋转主插槽。默认情况下，该列表是配置的角色（`smol` → `default` → `slow`）。通行证 `--models` 将其范围限定为自定义列表：

```sh
omp --models sonnet,haiku:high
```

每按一次就会切换到下一个 id。模式是模糊的并且接受 glob — `--models "github-copilot/*,*sonnet*"` 以同样的方式工作。 Shift+Ctrl+P 向后循环； Alt+P 打开一个不会写回的一次性选择器 `modelRoles`.

> 循环仅更改当前会话的活动模型。编辑 `config.yml` 更改持久默认值。

参见 [Provider](/docs/providers) 用于登录，以及 [自定义模型和Provider](/docs/custom-models) 添加您的角色可以定位的 id。
