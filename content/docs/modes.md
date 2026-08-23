---
title: "运行模式"
description: "了解 omp 的循环模式、强制工具模式和快速模式，选择适合持续修复、指定工具或优先推理的运行方式。"
summary: "本页解释 `/loop`、`/force` 与 `/fast` 的行为、持续时间和组合方式，帮助你针对长时间任务、工具约束或低延迟请求选择运行模式。"
keywords:
  - "omp 运行模式"
  - "loop mode"
  - "force tool"
  - "fast mode"
  - "自动化编程"
source: https://omp.sh/docs/modes
---

# 运行模式

omp 的多数行为由一次性的[斜杠命令](/docs/slash)完成。`/loop`、`/force` 和 `/fast` 则会启用持续或单回合的运行模式，而不是仅发送一条辅助命令。它们可以组合使用；为 `/loop` 设置时限是常见的无人值守工作方式。

## 循环模式：`/loop [count|duration]`

`/loop` 会启用自动重提：之后发送的下一条提示词会在每次回合结束后自动再次提交，直到达到限制或手动停止。它适合模型已知验收条件的迭代任务，例如“修复下一个失败的测试”“处理队列中的下一个文件”或“检查列表中的下一个 PR”。

```sh
/loop          # unlimited; runs until you cancel
/loop 10       # cap at 10 iterations
/loop 30m      # wall-clock cap
/loop 2h
```

支持 `s`、`m` / `min`、`h` / `hr` 及其复数形式；混合形式（如 `/loop 10 5m`）会被拒绝。开启后发送的第一条提示词即为循环提示，之后每个回合都会重用同一文本。Esc 只取消当前迭代，不会关闭循环模式；再次运行 `/loop` 才会关闭它；到达时限后循环会自行结束。

循环状态显示在状态行的模式部分中，旁边是任何活动的计划模式指示器。

## 强制模式：`/force <tool> [prompt]`

`/force` 将下一回合固定为调用指定工具，且只影响这一回合；回合结束后约束会自动解除。当模型反复选择错误工具时很有用，例如对尚不存在的文件使用 `edit`、对新文件拒绝使用 `write`，或只解释却没有派发子智能体。

```sh
/force write src/server/auth.ts: stub a JWT verifier
/force task                       # pins next message you send
```

在工具名后提供提示词会立即提交；只输入 `/force <tool>` 时，约束会附加到你随后输入的下一条内容。也支持 `/force:<tool>` 写法。

## 快速模式：`/fast`

`/fast` 切换请求的优先服务层：OpenAI 模型使用 `service_tier: "priority"`，支持的 Anthropic Opus 模型使用快速模式（`speed: "fast"`）。优先级请求通常延迟更低、每 Token 成本更高。omp 会将其计入 `premiumRequests` 预算，与 GitHub Copilot 的高级请求使用同一统计桶，因此可在 `/usage` 和 `omp stats` 中查看。

```sh
/fast          # toggle
/fast on
/fast off
/fast status
```

该模式会持久化到会话中（以 `service_tier_change` 条目记录），并在状态栏显示徽章。对于不支持优先级服务的 Provider，omp 会在请求发出前移除该标记，因此开启后不会产生效果。

## 如何选择

- **重复同一提示词，直到检查通过或任务清空**：使用带次数或时限的 `/loop`。
- **希望长时间无人值守运行**：在终端窗格或多路复用器中使用带时限的 `/loop`。
- **模型总是选择错误工具**：对下一回合使用 `/force <tool>`。
- **回合延迟至关重要，且使用 OpenAI 或 Anthropic**：使用 `/fast on`，同时接受更高成本。

`/force` 每回合自动解除；`/fast` 则会保持到手动关闭。它们都不能替代清晰的提示词，只是减少手动重提、错误工具选择或排队延迟。

## 相关

-   [斜杠命令](/docs/slash) — 上述命令的完整参考。
- [目标模式](/docs/goal)：持续推进的自主目标模式，可与 `/loop` 配合。
- [计划模式](/docs/plan)：适合复杂改动的执行前规划模式。
