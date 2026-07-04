---
title: "会话格式"
description: "了解 omp 会话 JSONL 文件的 Envelope、会话 Header、消息 Entry、内容块、树关系和生命周期记录格式。"
summary: "本页定义磁盘会话文件路径、Entry 与 Session ID、parentId、消息和工具结果结构，以及压缩、模型切换等生命周期事件。"
keywords:
  - "omp 会话格式"
  - "JSONL"
  - "session schema"
  - "parentId"
  - "会话存储"
source: https://omp.sh/docs/session-format
---

# 会话格式

会话存储在 `~/.omp/agent/sessions/<cwd-dir>/<timestamp>_<id>.jsonl`, 分组 每个工作目录。一个文件就是一个会话；一行是一个条目。条目永远不会被重写 place — 该文件是安全的 `tail -f` 当会话处于实时状态时，可以安全地在回合中进行复制。 对于面向用户的简历/分支/共享工作流程，请参阅 [会话](/docs/sessions).

## 参赛信封

每行都是一个 JSON 对象，带有 `type` 鉴别器，8个字符 `id`, a `parentId` 将其穿入树中，然后 `timestamp`。叶子不是一个条目——它是指向最新可达 id 的隐式指针。

| 领域 | 类型 | 注释 |
| --- | --- | --- |
| `type` | 字符串 | 鉴别器；请参阅下面的条目类型。 |
| `id` | 字符串（8 进制） | 随机 8 十六进制，在文件内进行碰撞检查。 |
| `parentId` | 字符串|空 | 
父条目 ID； `null` 对于第一条消息。

 |
| `timestamp` | ISO 8601 | UTC，第二精度或更精细。 |

## 条目和会话 ID

条目 ID 是随机的 8 个字符的十六进制字符串，在文件内进行了冲突检查。会话 ID 是按时间排序的 UUID (v7)，因此字典排序与创建顺序匹配，并且短前缀足以 `--resume`。分支和Fork操作保留条目 ID；Fork将条目逐字复制到新文件中，为标头提供新的会话 ID，并将源记录在 `parentSession`.

## 会话头

每个文件的第一行是 `session` 标头携带架构版本、工作目录、可选标题和（在Fork上） `parentSession` 谱系标记。

```json
{"type":"session","version":3,"id":"1f9d29","timestamp":"2026-05-14T10:12:03Z","cwd":"/Users/me/src/api","title":"refactor importer"}
```

| 领域 | 类型 | 注释 |
| --- | --- | --- |
| `type` | `"session"` | 标头鉴别器。 |
| `version` | 数量 | 
架构版本；当前是 `3`.

 |
| `id` | 字符串 | 会话 ID；匹配文件名。 |
| `cwd` | 字符串 | 会话开始时的绝对工作目录。 |
| `title` | 字符串？ | 

人工标签显示在选择器中；设置为 `/rename`.

 |
| `parentSession` | 字符串？ | 沿袭标记：源会话 ID（Fork）或会话文件路径（分支到新文件）。 |

## 消息条目

A `message` 条目逐字包装代理消息，其 `role` 和一个 `content` 数组。工具调用位于助理消息的内部 `content` 作为 `toolCall` 块；每个工具的结果都是它自己的 `message` 条目与 `role: "toolResult"`，像任何其他条目一样作为子项穿入树中。

```jsonl
{"type":"message","id":"1f9d2a0b","parentId":null,"timestamp":"…","message":{"role":"user","content":[{"type":"text","text":"refactor the importer to stream"}]}}
{"type":"message","id":"1f9d2b0c","parentId":"1f9d2a0b","timestamp":"…","message":{"role":"assistant","content":[{"type":"text","text":"Reading the file first."},{"type":"toolCall","id":"toolu_01","name":"read","arguments":{"path":"src/importer.ts"}}],"usage":{…},"stopReason":"toolUse"}}
{"type":"message","id":"1f9d2c0d","parentId":"1f9d2b0c","timestamp":"…","message":{"role":"toolResult","toolCallId":"toolu_01","toolName":"read","content":[{"type":"text","text":"…file contents…"}],"isError":false}}
```

### 内容块类型

| 块 | 角色 | 形状 |
| --- | --- | --- |
| `text` | 任何 | `{ type, text }` |
| `toolCall` | 助理 | 
`{ type, id, name, arguments }` — `id` 是工具调用 ID； `arguments` 是模型发出的 JSON。

 |
| 

`toolResult` 消息

 | 自己的条目 | 

`{ role, toolCallId, toolName, content, isError }` — `toolCallId` 匹配 `toolCall.id`; `content` 是一个内容数组（通常是 单身 `text` 块）。

 |
| `thinking` | 助理 | 

`{ type, thinking }` — provider 支持时的扩展思维输出 它。

 |

## 其他条目类型

| 类型 | 它记录了什么 |
| --- | --- |
| `model_change` | 
活动模型已交换（`/model` 或角色循环）。携带 `model` 和 `role`.

 |
| `mode_change` | 计划模式 打开或关闭。 |
| `thinking_level_change` | 扩展思维预算在随后的回合中发生了变化。 |
| `service_tier_change` | Provider 服务等级（优先级、批次）已更改。 |
| `label` | 

在另一个条目上添加书签。携带 `targetId` 和 `label`;指向 条目 ID，压缩永远不会删除条目，因此标签会保留下来。

 |
| `compaction` | 

上下文压缩取代旧Turn的标记。携带 `summary`, `firstKeptEntryId`, 和 `tokensBefore`.

 |
| `branch_summary` | 

一个废弃分支的摘要，写于 `/tree` 将叶子移开。

 |
| `session_init` | 仅子代理会话；捕获系统提示、初始任务、工具列表以及用于调试/重放的任何输出模式。 |
| 

`custom` / `custom_message`

 | 扩展状态 — 由 hooks、custom tools 或插件编写的不透明有效负载。 |
| `ttsr_injection` | 记录已注入的 TTSR 规则名称，因此每个分支都会触发一次规则。 |
| `mcp_tool_selection` | 内务管理 — 本次会话公开了哪些 MCP 工具。 |

## 一个有效的例子

修剪后的会话显示标题、工具调用的两轮、模型更改、标签和压缩：

```jsonl
{"type":"session","version":3,"id":"019700f1-1a2b-7c3d-8e4f-aabbccddeeff","timestamp":"2026-05-14T10:12:03Z","cwd":"/Users/me/src/api","title":"refactor importer"}
{"type":"message","id":"1f9d2a0b","parentId":null,"timestamp":"…","message":{"role":"user","content":[{"type":"text","text":"refactor the importer to stream"}]}}
{"type":"message","id":"1f9d2b0c","parentId":"1f9d2a0b","timestamp":"…","message":{"role":"assistant","content":[{"type":"text","text":"Reading the file first."},{"type":"toolCall","id":"toolu_01","name":"read","arguments":{"path":"src/importer.ts"}}],"stopReason":"toolUse"}}
{"type":"message","id":"1f9d2c0d","parentId":"1f9d2b0c","timestamp":"…","message":{"role":"toolResult","toolCallId":"toolu_01","toolName":"read","content":[{"type":"text","text":"…file contents…"}],"isError":false}}
{"type":"model_change","id":"1f9d2d0e","parentId":"1f9d2c0d","timestamp":"…","model":"anthropic/claude-opus","role":"default"}
{"type":"label","id":"1f9d2e0f","parentId":"1f9d2d0e","timestamp":"…","targetId":"1f9d2a0b","label":"pre-refactor"}
{"type":"compaction","id":"1f9d2f10","parentId":"1f9d2e0f","timestamp":"…","summary":"…","firstKeptEntryId":"1f9d2c0d","tokensBefore":48211}
```

## 将会话作为文件读取

从一个Shell里， `omp -p 'read /path/to/session.jsonl'` 使用 hashline 锚点呈现文件，因此您可以通过 id 引用任何条目，并将该行返回到后续回合，而无需重新格式化。参见 [CLI 参考](/docs/cli) 为了 `--export` 和其他无头Flag。
