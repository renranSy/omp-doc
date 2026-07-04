---
title: "上下文压缩"
description: "了解 omp 如何通过上下文压缩保留近期对话、总结旧记录，并在模型窗口接近上限时自动维护会话。"
summary: "本页说明手动与自动压缩的触发条件、工具输出裁剪、非压缩重试和上下文检查方法，以及压缩对磁盘会话记录的影响。"
keywords:
  - "上下文压缩"
  - "context window"
  - "omp 会话"
  - "Token"
  - "compact"
source: https://omp.sh/docs/compaction
---

# 上下文压缩

会话会不断增长，直到不再适合模型的上下文窗口。压缩是 omp 的答案：用单个摘要条目替换成绩单的旧半部分，并逐字保留最近的尾部。下一个回合就看到了 `system`，然后是摘要，然后是保留的尾部——足够的最新细节以继续工作，再加上之前所有内容的摘要。原始条目保留在磁盘上；仅重写实时消息流。

## 它保留了什么，总结了什么

`compaction.keepRecentTokens` （默认 `20000`) 设置保留尾部的目标大小。切入点是在该窗口内的消息边界处选择的；工具结果永远不会跨越边界。剪切之前的元数据条目（模型更改、思维级别更改、标签）被向前拉入保留区域，因此最近的Turn仍可解析。

在切割之前，omp 可能会首先修剪大型工具输出。默认策略保护最新的 `40 000` 工具输出令牌，至少需要 `20 000` 预计节省总额，并且从未触及 `skill` skill 文件的结果或读取。修剪后的输出被替换为 `[Output truncated - N tokens]` 占位符。所有早于剪辑的内容都被折叠成一份摘要，记录了对话的要点以及 `<files>` 会话所触及的路径树，每个路径都经过标记 `(Read)`, `(Write)`, 或 `(RW)`.

摘要条目作为 `CompactionEntry` 与 `type: "compaction"`, 逐字逐句 `summary`, 的 `firstKeptEntryId`, 和 `tokensBefore`。预压缩条目保留在磁盘上； [`/tree`](/docs/sessions) 仍然可以走回他们。

## 手册： `/compact [focus]`

运行 `/compact` 在任何时候强制压缩当前分支。可选参数是作为额外指令传递给摘要器的自由文本 - 当默认摘要会过度加权错误线程时使用它：

```text
/compact Focus on the API redesign decisions; the migration scripts are scratch work.
```

手动压缩首先中止当前回合，然后进行总结，然后写入条目。它的工作原理与 `compaction.enabled` - 该设置仅控制自动路径。 计划模式 通过以下方式提供相同的原语 *批准并压缩上下文* 当接受一个计划时。

## 自动触发器

四个自动路径共享上下文压缩机械，但在启动时间和启动后发生的情况方面有所不同。

| 触发 | 触发时 | 上下文压缩后 |
| --- | --- | --- |
| **溢出恢复** | 该模型在当前回合返回上下文溢出错误。 | 重试同一回合。首先尝试配置的推广链中较大的模型；压缩仅在促销不可用时运行。 |
| **不完全输出恢复** | 该模型会消耗其输出预算并因不完整的响应而停止（没有可用的可交付成果）。 | 放弃死循环并重试。首先尝试升级到更大的模型；压缩仅在促销不可用时运行。 |
| **阈值维护** | 成功的Turn落地并且调整后的上下文标记超出了解析的阈值。 | 安排自动继续提示，除非 `compaction.autoContinue` 是 `false`. |
| **怠速保养** | 会话处于空闲状态，没有流式传输，也没有压缩。 | 停止。没有自动继续。 |

阈值默认为 `contextWindow - max(15% of contextWindow, reserveTokens)`。覆盖它 `compaction.thresholdPercent` 或 `compaction.thresholdTokens`;以正值为准获胜。

## 非压缩重试

并非所有失败都是溢出。 Provider 过载、速率限制、5xx 响应、套接字重置和使用限制错误都是暂时的 - 重新发送相同的提示通常会起作用。 omp 通过单独的重试策略路由这些策略 **不** 紧凑：

1.  代理根据瞬态模式对错误消息进行分类（`overloaded`, `rate limit`, `429`, `5xx`, `connection reset`, `fetch failed`、使用限制、重试提示）。
2.  上下文溢出错误被明确排除并转而进行压缩。
3.  失败的助理条目将从实时代理状态中删除（仍保留在会话文件中），并在退避延迟后重新安排轮次。

退避是指数级的： `retry.baseDelayMs * 2^(attempt - 1)`，抖动为 75–100%，上限为 8 秒。使用默认的 `500` ms 基数，即 0.5 秒、1 秒、2 秒，加倍至上限。 Provider 提供的提示（`retry-after`, `retry-after-ms`, `x-ratelimit-reset`）可以覆盖本地延迟。如果配置了后备链（`retry.fallbackChains`) 提供不同的模型或凭证、omp 切换并立即重试，无延迟；当冷却时间结束时，原始状态将恢复，除非 `retry.fallbackRevertPolicy` 是 `"never"`.

```yaml
retry:
  enabled: true
  maxRetries: 10
  baseDelayMs: 500
  maxDelayMs: 300000
  fallbackRevertPolicy: cooldown-expiry
```

TUI 显示 `Retrying (n/max) in Ns… (esc to cancel)` 正在等待重试。 `Esc` 取消退避并结束重试链；全局中止也会取消飞行中的重试。最大尝试次数后，会话发出 `auto_retry_end { success: false, finalError }` Turn面失败——没有自动上下文压缩，没有第二次尝试。

## 检查上下文和压缩

`/context` 打印实时窗口的每个存储桶细分：系统提示、系统工具、系统上下文、skills、消息、自动压缩缓冲区和剩余时间。每个桶都有一个 ASCII 条和一个令牌计数，因此很明显哪个桶会先溢出。

`/usage` 报告针对活动凭证的 provider 速率限制余量。当Turn失速时，检查 `/usage` 在到达之前 `/compact` 排除配额墙——重试路径会自动处理该问题。

压缩条目可见于 [会话文件](/docs/sessions) 作为 JSON 形式的对象 `{ "type": "compaction", "summary": "…", "firstKeptEntryId": "…", "tokensBefore": N }`。编排者的 `session_compact` hook 在每个之后触发，因此扩展可以记录它们或对其做出反应。

## 设置

在 `~/.omp/agent/config.yml`:

```yaml
compaction:
  enabled: true              # master switch for automatic paths
  strategy: context-full     # "context-full" | "handoff" | "shake" | "snapcompact" | "off"
  reserveTokens: 16384       # headroom kept under the context window
  keepRecentTokens: 20000    # target size of the verbatim tail
  autoContinue: true         # schedule continuation after threshold compaction
  idleEnabled: false         # run maintenance while idle
  thresholdPercent: -1       # explicit % override; -1 = auto
  thresholdTokens: -1        # explicit token override; -1 = auto
```

套装 `autoContinue: false` 对于无头或脚本运行，您希望压缩安静地发生并停止。套装 `strategy: handoff` 在阈值时间使用移交文档启动新会话，而不是在当前分支上写入压缩条目。套装 `enabled: false` 完全禁用自动路径；手册 `/compact` 仍然有效。

## 相关

-   [内存](/docs/memory) ——持久的、跨会话的笔记；与此处描述的会话中压缩正交。
-   [会话](/docs/sessions) — 简历、分支和 `/tree` 通过压缩写入的磁盘会话文件。
-   [设置](/docs/settings) — 完整参考 `compaction.*` 和 `retry.*` 组。
