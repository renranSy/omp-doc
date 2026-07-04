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

omp 的大部分行为都是由一次性决定的 [斜线命令](/docs/slash)。其中三个翻转持续或单圈 *模式* 而不是仅仅发送一个辅助操作： `/loop`, `/force`, 和 `/fast`。他们组成—— `/loop` 带有持续时间上限的是标准的“让它煮过夜”食谱。

## 循环模式— `/loop [count|duration]`

`/loop` 切换一种状态，在该状态下，您发送的下一个提示会在每次屈服后自动重新提交，直到达到限制或您停止它。当工作是迭代的并且模型已经知道验收检查时很有用：“修复下一个失败的测试”，“处理队列中的下一个文件”，“查看列表中的下一个 PR”。

```sh
/loop          # unlimited; runs until you cancel
/loop 10       # cap at 10 iterations
/loop 30m      # wall-clock cap
/loop 2h
```

受理单位： `s`, `m`/`min`, `h`/`hr`，以及它们的复数。混合形式（`/loop 10 5m`）被拒绝。切换后发送的第一个提示将成为循环提示；随后的产量会重新触发相同的文本。 `Esc` 取消当前迭代而不禁用循环模式；跑步 `/loop` 再次禁用它；当截止日期过后，期限表格将自行结束。

循环状态显示在状态行的模式部分中，旁边是任何活动的计划模式指示器。

## 强制模式— `/force <tool> [prompt]`

`/force` 将下一回合固定到特定工具。范围恰好是一圈——该圈返回后，工具选择就取消了。当模型不断使用错误的工具时使用它：调用 `edit` 对于尚不存在的文件，拒绝 `write` 在新的断头台上，谈话而不是派遣副特工。

```sh
/force write src/server/auth.ts: stub a JWT verifier
/force task                       # pins next message you send
```

如果您在工具名称后提供提示，则会同时提交。只要 `/force <tool>`，该图钉会附加到您接下来键入的任何内容。形式 `/force:<tool>` 也被接受。

## 快速模式— `/fast`

`/fast` 切换传出请求的优先服务层：OpenAI 模型获取 `service_tier: "priority"`, Anthropic 模型获得快速模式测试版 (`speed: "fast"` 在支持的 Opus 模型上）。优先级流量在默认层请求之前以更高的每个令牌成本进行路由；它与您自己在 API 呼叫中设置的拨号盘相同。 omp 将每个优先级请求与 `premiumRequests` 预算 - 相同的桶 GitHub Copilot 优质请求登陆 - 所以它出现在 `/usage` 和 `omp stats` 高级卡。

```sh
/fast          # toggle
/fast on
/fast off
/fast status
```

该模式是会话持久的（它可以通过以下方式重新加载） `service_tier_change` 会话日志中的条目）并在状态行中显示为小徽章。在没有优先级的Provider上，该标志在请求离开之前被删除，因此切换它是一个无操作。

## 哪个为了哪个目标

-   **对队列或直到检查通过相同的提示** → `/loop` 有计数或持续时间上限。
-   **从长远来看，你想远离** → `/loop` 具有持续时间上限，在终端窗格或多路复用器中，您可以无人值守。
-   **模型总是选择错误的工具** → `/force <tool>` 转一圈，然后放手。
-   **Turn对延迟至关重要，并且您处于 OpenAI 或 Anthropic 状态** → `/fast on`，接受较高的成本。

力是每转一圈并自行解开。快速是每个会话，直到您将其关闭。它们都没有取代清晰的提示——它们只是消除了手动重新提交、错误的工具选择或排队延迟。

## 相关

-   [斜杠命令](/docs/slash) — 上述命令的完整参考。
-   [目标模式](/docs/goal) - 持久的自主目标，与 `/loop`.
-   [计划模式](/docs/plan) — 执行前草稿模式用于更困难的更改。
