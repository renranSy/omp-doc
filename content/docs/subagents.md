---
title: "子智能体与 IRC"
description: "使用 task 工具并行生成 omp 子智能体，通过进程内 IRC 查看 Peer、发送消息并协调独立任务。"
summary: "本页介绍内置子智能体、并发限制、异步结果和 agent:// 记录，并说明运行中的同级智能体如何通过 IRC 直接协作。"
keywords:
  - "omp 子智能体"
  - "Subagent"
  - "IRC"
  - "task tool"
  - "并行编程"
source: https://omp.sh/docs/subagents
---

# 子智能体与 IRC

## 任务工具

`task` 并行生成一个或多个子代理。每个条目在 `tasks` 得到一个独立的 `assignment` 字符串（加上共享的 `context` 对于批处理）并在其自己的子会话中运行。并发性受到信号量的限制；结果在每个代理产生时传递（或在异步执行关闭时内联）。每个代理的全部输出保持可达 `agent://<id>`，其转录本为 `history://<id>`，家长可以 [`read`](/docs/files) 在任何时候。

通行证 `isolated: true` 在其自己的隔离工作区中运行每个任务（写时复制克隆或覆盖 - APFS、Btrfs/ZFS、overlayfs、ProjFS 或纯副本，具体取决于平台），以便并发编辑不会发生冲突；当任务成功时，补丁会被合并回来。调整策略 `task.isolation.mode`.

### 捆绑代理

八个可派遣代理随 omp 一起发货。将名称传递到 `agent` 字段，或将您自己的字段放在 `~/.omp/agent/agents/` 和 `.omp/agents/`.

| 代理 | 最适合 | 生成 |
| --- | --- | --- |
| `explore` | 快速只读调查；返回压缩的结果。 | — |
| `plan` | 多文件架构决策。 | `explore` |
| `designer` | UI/UX 实施、可访问性、视觉审查。 | — |
| `reviewer` | 质量和安全审查以及结构化结果。 | `explore` |
| `librarian` | 外部库/API 研究以及经过来源验证的答案。 | — |
| `oracle` | 高级工程师咨询：调试、架构、第二意见、实际实施。 | `explore` |
| `task` | 通用多步骤委托。 | 任何 |
| `quick_task` | 严格机械更新或数据收集。 | — |

> 伸手去拿 `quick_task` 当工作是机械的时——它运行在廉价的模型上，推理最少。伸手去拿 `task` 当工作是开放式的并且需要完整的工具访问时。

## 并行性如何工作

每个任务都在一个任务中 `task` 呼叫同时开始并独立运行。每个孩子都可以看到其 IRC 对等块中的其他任务，以便他们可以在工作时交谈。当任务完成时 `idle` （然后 `parked` TTL 后）——它的 id 仍然可以通过 IRC 进行寻址，并通过消息将其唤醒以进行后续轮次。

## IRC 存在

的 `irc` 工具在同一进程中的代理之间传递简短的散文消息。主要代理是 `Main`;子代理重用其任务 ID，例如 `AuthMap` (`AuthMap-2` 当名字重复时）。

-   `op: "list"` 枚举具有状态的对等点 (`running`/`idle`/`parked`) 和未读计数。
-   `op: "send"` 交付 `message` 到 `to` （对等 ID 或 `"all"`）并立即返回送货收据——它永远不会阻塞收件人。通行证 `await: true` 阻塞直到该对等方的回复到达。
-   `op: "wait"` 阻止传入消息； `op: "inbox"` 排空待处理的。

没有开/关设置： `irc` 只要有人要发消息，就可以使用 - 在每个子代理中，以及在仍然可以生成子代理的任何会话中。

## DMing 已完成的对等点

完成的子代理不会消失：它们会消失 `idle`，那么 `parked` TTL 后，并始终保持可寻址状态。发往空闲或暂停对等点的 DM 会唤醒（或恢复）它并运行您的消息作为后续轮次。发送给繁忙对等点的 DM 会在其下一步边界处作为旁注注入 — 如果您发送 `await: true` 并且对等方无法及时到达步骤边界，它会通过在侧通道上生成的简短自动回复进行应答。

1.  对等 B 呼叫 `irc op=send to=A await=true` 并阻止回复。
2.  如果A正在工作，则消息到达A的下一步边界（或触发自动回复路径）；如果 A 空闲或停止，DM 会将其唤醒。
3.  B 收到 A 的答复并继续。

如果超时前未收到回复，请检查 `inbox` 或 `wait` 再次发送而不是重新发送——对等方可以在完成当前步骤后进行应答。

## 工作示例：两个子代理，一个是 DM，另一个是 DM

父级扇出一个 auth-map 任务和一个路由审核任务。 Route-audit 需要 AuthMap 生成的颁发者列表，因此它会发送 DM 并等待回复。

```text
# parent
task agent=explore context="Auditing auth coverage for src/." tasks=[
  { id: "AuthMap",
    assignment: "Map every token issuance path under src/auth/. \
                 Answer RouteAudit when it pings you." },
  { id: "RouteAudit",
    assignment: "List protected routes under src/routes/. \
                 DM AuthMap for the live issuer list before finalizing." },
]

# inside RouteAudit
irc op=send to=AuthMap await=true message="Which issuer does /api/v2 use?"
# -> reply arrives, RouteAudit resumes

# parent, after the batch returns
read agent://AuthMap
read agent://RouteAudit
```

参见 [工具索引](/docs/tools) 其余的清单以及哪个功能页面记录了每一项。
