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

模型角色是为特定工作预留的固定槽位。为每个角色指定模型后，omp 可以在无需额外询问的情况下选择合适的模型。

`default`

默认模型。用于没有更具体角色的常规回合，包括实现任务、交互式对话和工具调用。

`smol`

速度快、成本低。适用于标题生成、分类、重试摘要，以及广度比深度更重要的任务。通常为该角色指定 Haiku、Mini 或 Nano 级模型。

`slow`

深度推理模型。适用于架构决策、复杂调试，以及一次错误决策的代价高于额外模型成本的任务。通常使用 Opus 或 Codex 级模型。

`plan`

供[计划模式](/docs/plan)使用，包括 `/plan` 的规划回合和计划审查。

此外还有 `vision`（支持图像的后备模型）、`designer`（设计子智能体）、`commit`（生成提交信息）和 `task`（子智能体任务）等角色；它们同样通过 `modelRoles` 映射解析。

## 配置角色

在 `~/.omp/agent/config.yml` 中设置默认值，参阅[设置](/docs/settings)：

```yaml
modelRoles:
  default: claude-sonnet-4-6
  smol: anthropic/claude-haiku-4-5
  slow: gpt-5.3-codex:high
  plan: claude-opus-4-6:high
```

值可以是规范模型 ID（如 `claude-sonnet-4-6`），也可以是明确的 `provider/model` 选择器。末尾追加 `:level` 可固定思考强度：`off`、`minimal`、`low`、`medium`、`high`、`xhigh`。

## 启动时覆盖

每个角色都有对应的 CLI Flag，可覆盖会话配置；`default` 角色没有单独的环境变量。

| 角色 | Flag | 环境变量 |
| --- | --- | --- |
| `default` | `--model <id>` | — |
| `smol` | `--smol <id>` | `PI_SMOL_MODEL` |
| `slow` | `--slow <id>` | `PI_SLOW_MODEL` |
| `plan` | `--plan <id>` | `PI_PLAN_MODEL` |

```sh
omp --slow gpt-5.3-codex:xhigh --smol claude-haiku-4-5
```

## 使用 Ctrl+P 循环模型

在会话中按 Ctrl+P 可在模型 ID 列表中循环切换主模型。默认列表为已配置的角色（`smol` → `default` → `slow`）；使用 `--models` 可指定自定义列表：

```sh
omp --models sonnet,haiku:high
```

每按一次会切换到下一个模型。模式支持模糊匹配和 glob，例如 `--models "github-copilot/*,*sonnet*"`。Shift+Ctrl+P 反向循环；Alt+P 打开一次性选择器，不会写回 `modelRoles`。

> 循环仅更改当前会话的活动模型。编辑 `config.yml` 更改持久默认值。

登录方式请参阅 [Provider](/docs/providers)；如需添加角色可选的模型，请参阅[自定义模型与 Provider](/docs/custom-models)。
