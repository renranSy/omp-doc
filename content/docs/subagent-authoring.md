---
title: "编写子智能体"
description: "通过 Markdown frontmatter 定义 omp 子智能体，配置名称、描述、工具、模型、权限与可生成的下级智能体。"
summary: "本页介绍子智能体定义文件的搜索顺序、完整字段、同名覆盖和调度方式，并说明如何通过 `/agents` 迭代与检查定义。"
keywords:
  - "omp 子智能体定义"
  - "Subagent"
  - "智能体编排"
  - "frontmatter"
  - "task tool"
source: https://omp.sh/docs/subagent-authoring
---

# 编写子智能体

子代理定义是一个 Markdown 文件。 omp 扫描每个目录上的一些目录 `task` 调用，按名称索引它们，并解析 `agent` 参数以获胜的文件为准。八个捆绑代理来自 [子代理](/docs/subagents) 坐在该堆栈的底部 - 您放在它们前面的任何同名的东西都会接管。

## 定义所在的地方

按此顺序从这些根读取文件。第一场比赛由 `name` 获胜。

```text
.omp/agents/<name>.md          # project, omp-managed
~/.omp/agent/agents/<name>.md  # user, omp-managed
<plugin>/agents/<name>.md      # plugin-provided
<bundled>                      # explore, plan, designer, reviewer, librarian, oracle, task, quick_task
```

解析是精确名称、区分大小写 (`Reviewer` 和 `reviewer` 是不同的）。只有 `.omp` 根被扫描—— `.claude/agents/` 和朋友被跳过，因为他们的 frontmatter 模式不同。在一个目录中，文件在重复数据删除之前按字典顺序读取。 Plugin 代理附加在文件系统源之后；捆绑代理排在最后。通过为您的文件提供相同的内容来覆盖捆绑代理 `name`.

错误的 frontmatter 解析或缺少必填字段会跳过该文件并发出警告。其余部分的发现仍在继续。

## 定义文件形状

```md
---
name: api-reviewer
description: Reviewing changes to packages/api/* for breaking changes, missing tests, and OpenAPI drift.
tools: read, search, find, bash
model: sonnet
---

You review pull requests touching the public API surface.

Focus on:
- breaking changes to exported types or HTTP routes
- missing or thin test coverage on changed branches
- OpenAPI spec drift vs the runtime handlers

Return a short bulleted verdict. Do not edit files.
```

`name` 和 `description` 是必需的。描述是父代理在决定是否调度时读取的内容 - 编写它的方式与编写 [skill](/docs/skills) 描述：动词、名词、范围。 Markdown 正文将逐字变成孩子的系统提示符。

| 领域 | 效果 |
| --- | --- |
| `name` | 与匹配的标识符 `agent` 的领域 `task` 打电话。 |
| `description` | 向家长展示 `task` 工具的库存。 |
| `tools` | CSV 或 YAML 列表。将子级限制为该子集。 `yield` 总是被添加。省略继承父级的工具集。 |
| `model` | 子会话的模型模式（或 CSV 后备列表）。省略继承。 |
| `spawns` | `*`、CSV 或列表 - 哪个代理命名该子进程本身可能会生成。默认为无，除非 `tools` 包括 `task`，默认为 `*`. |
| `thinkingLevel` | `minimal | low | medium | high | xhigh` （烤肉串盒 `thinking-level` 也有效）。 |
| `output` | 用于结构化回报的不透明 JSON 架构。与散文输出指令冲突；选择一个。 |
| `blocking` | 将生成标记为在父级一侧阻塞。 |
| `autoloadSkills` | Skill 名称预加载到子会话中。 |
| `read-summarize` | 套装 `false` 使孩子的 `read` 返回逐字内容而不是结构摘要。 |

任何未设置的内容都会在执行时从父会话的默认值继承。

## 派遣定制代理

文件存入磁盘后，将其传递给 `name` 到 `task` 工具：

```json
{
  "agent": "api-reviewer",
  "tasks": [
    { "id": "review-pr-417", "description": "Review PR 417", "assignment": "..." }
  ]
}
```

如果名称无法解析，则调用返回 `Unknown agent "<name>". Available: …` 没有产生任何东西。如果父母的 `spawns` 政策不允许该名称，您会得到 `Cannot spawn '<name>'. Allowed: …`。递归深度上限进一步从子级内部生成一次 `task.maxRecursionDepth` 被击中。

## 迭代定义

打开 `/agents` 从提示中查看当前会话已解析的每个代理、每个代理是从哪里加载的以及哪个代理赢得了名称冲突。 N 启动新代理流程， R 重新生成草稿，并且 Ctrl+R 从磁盘重新加载 - 当您刚刚在另一个窗口中编辑文件时很有用。为了更快的循环，直接用一行调度代理 `assignment` 并检查返回的 `agent://<id>` 成绩单。

## 相关

-   [子代理 & IRC](/docs/subagents) — 使用 `task` 工具和捆绑代理。
-   [Skills](/docs/skills) — 代理在运行时加载的按需剧本。
-   [Custom tools](/docs/custom-tools) — 扩展子代理可以使用的工具表面。
