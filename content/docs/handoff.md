---
title: "交接"
description: "通过 omp Handoff 生成结构化交接摘要，在保留旧会话的同时开启带完整上下文的新会话。"
summary: "本页说明 `/handoff` 何时适用、摘要包含哪些状态、如何创建新会话，以及取消、失败、读取与后续 Fork 时的行为。"
keywords:
  - "omp Handoff"
  - "会话交接"
  - "上下文迁移"
  - "会话摘要"
  - "新会话"
source: https://omp.sh/docs/handoff
---

# 交接

`/handoff [focus]` 通过生成一个捕获状态、打开的线程和后续步骤的简短文档来关闭当前回合，然后打开一个全新的会话，并将该文档作为其第一个上下文注入。旧会话保持其记录不变；新的一开始是干净的，除了总结之外。

## 何时伸手去拿它

使用 `/handoff` 当会话是 *完成了这部分工作* 但工作本身还没有完成：

-   在您离开之前结束调试或实施推送。
-   切换上下文 - 相同的项目，不同的功能 - 并且您希望下一个会话在没有 200 轮不相关历史记录的情况下开始。
-   在长时间的暂停之前（过夜、周末），当你回来时，你会想要快速回顾一下。
-   将 JSONL 交给队友。他们继续进入新的会话并首先查看总结，而不是原始记录。

如果您只需要缩小活动上下文以适应下一回合，请使用 [`/compact`](/docs/compaction) 相反。 Compaction停留在同一个session中，总结到位；切换结束会话并创建后继者。

可选的 `[focus]` 争论使文档偏向于您关心的内容，例如 `/handoff Focus on the migration plan and which callers still need updating`。如果没有它，生成器就会选择自己的结构。

`/handoff` 拒绝与 `Nothing to hand off (no messages yet)` 如果当前分支的消息少于两条——太少而无法进行有用的总结。

## 写了什么

生成器在禁用工具的情况下以会话当前思维级别的旁路模型调用运行，因此加载程序位于状态行时预计需要 10-20 秒： `Generating handoff… (esc to cancel)`。输出是自由格式的降价——通常是正在处理的内容、代码的当前状态、剩余的内容以及任何值得推进的决策或约束。

文本被换行并附加到 *新的* 会话作为 `custom_message` 类型条目 `handoff`:

```text
<handoff-context>
...handoff text...
</handoff-context>

The above is a handoff document from a previous session. Use this context to continue the work seamlessly.
```

因为它是一个 `custom_message`，当您重建聊天并在新会话的每个后续回合中参与 LLM 上下文时，该条目会显示在 TUI 中。

## 新会话

当生成完成时， `/handoff` 将旧会话刷新到磁盘，创建一个新的会话文件，并将其指向 `parentSession` 旧会话文件的标头。那个血统标记是同一个 `/fork` 写入，因此当您遍历树时，两个会话显示为已连接。

交换后你会看到 `New session started with handoff context` 在聊天中，以及 `/context` 将显示总结条目作为消息桶的一部分。上一届会话是 *不* 修改 - 总结永远不会附加到旧的记录中，只会附加到新的记录中。

## 取消和失败

新闻 Esc 当加载程序可见时可以中止请求。用户界面报告 `Handoff cancelled` 并且您保留在原始会话中，磁盘上没有任何更改。如果模型不返回文本，则会显示相同的消息。任何其他错误 — provider 故障、网络丢失 — 表面为 `Handoff failed: <message>` 并再次保持原始会话完好无损。

## 读回切换

下一个会话将按照任何会话的方式继续： `omp -c` 来自同一目录，或者 `omp --resume <id-prefix>` 来自任何地方。因为切换是第一个真正的条目，所以代理在第一轮读取它，而人类在重建的聊天的顶部读取它。没有单独的“负载切换”步骤。

`/fork` 从新会话中向前克隆沿袭，并携带切换条目。 `/tree` 回到新会话本身的历史；步入 *家长* 会话，通过 id 恢复它 `~/.omp/agent/sessions/<cwd-hash>/`.

自动触发的切换（压缩子系统为您触发的切换）也可以删除带时间戳的 `handoff-*.md` 在会话的工件目录下，当 `compaction.handoffSaveToDisk` 已设置。手册 `/handoff` 跳过该文件 - JSONL 条目是规范副本。

## 相关

-   [会话](/docs/sessions) — 简历、分支、Fork和会话工具包的其余部分。
-   [上下文压缩](/docs/compaction) - 何时上下文压缩到位而不是交接。
-   [计划模式](/docs/plan) — 将计划与交接结合起来，将规范发送到下一次会话。
