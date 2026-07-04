---
title: "TTSR 规则"
description: "编写 omp TTSR 规则，在模型输出命中正则条件时中止生成、注入系统提醒并安全重试当前请求。"
summary: "本页解释 Time-Traveling Stream Rules 的匹配与重试机制，介绍规则目录、frontmatter、条件写法、示例和调试建议。"
keywords:
  - "omp TTSR"
  - "流式规则"
  - "模型输出校验"
  - "正则规则"
  - "系统提醒"
source: https://omp.sh/docs/ttsr
---

# TTSR 规则

## 它是如何运作的

TTSR 规则是带有 frontmatter 的 Markdown 文件。 omp 根据每条规则观看实时模型流 `condition` 字节到达时的正则表达式。第一个匹配会中止生成，将规则主体作为系统提醒添加到前面，然后重试相同的请求 - 不会在超过赛点的中止延续上花费任何令牌。

默认情况下，每个规则在每个会话中最多触发一次（`ttsr.repeatMode: after-gap` 让它在可配置的轮数后重新启动），并且触发的规则将在会话中保留，因此用过的规则在整个恢复过程中都会保持花费状态。当出现一类错误时使用 TTSR *仅* 当模型处于中流状态时——达到被禁止的 API，生成您想要压缩的样板，错误命名特定于项目的约定。

对于工具调用范围内的规则，您可以设置 `interruptMode: never` 将提醒折叠到匹配的工具中 `toolResult` 作为 `<system-reminder>` 有效负载而不是中止流。该模型会在下一轮看到修正——对于您不想支付中止/重试成本的软推动很有用。

## 规则存在的地方

-   `.omp/rules/<rule>.md` — 项目范围，通过存储库检查
-   `~/.omp/agent/rules/<rule>.md` ——用户范围，无处不在

项目规则影子用户规则具有相同的文件名。

## 前题

| 领域 | 必填 | 目的 |
| --- | --- | --- |
| `description` | 不 | 一行摘要显示在 `/extensions` 和触发卡。 |
| `condition` | 是的\* | 正则表达式与模型的输出流进行匹配。 JavaScript-口味。 YAML 的转义反斜杠。 （\*或者 `astCondition`：ast-grep 模式在结构上匹配 `edit`/`write` 流。） |
| `scope` | 不 | 要观看的流表面的逗号分隔列表。默认为散文和工具论证（不是思考）。 |

范围值：

-   `text` ——助理散文
-   `thinking` — 推理通道（可见时）
-   `tool:<name>(<glob>)` — 特定工具的参数，可选地通过路径 glob 进行过滤 — 例如 `tool:edit(*.ts)`, `tool:write(*.rs)`, `tool:bash`

## 工作示例

Rust 项目的真实规则：阻止模型到达 `Box::leak` 并引导它走向 `Arc<str>` 相反。

```md
---
description: Refuse Box::leak in production code paths
condition: "Box::leak\\("
scope: "tool:edit(*.rs), tool:write(*.rs)"
---

You were about to write `Box::leak` to obtain a `&'static` reference. Stop.

`Box::leak` permanently allocates for the lifetime of the process &mdash; harmless
in a one-shot binary, a real leak inside a server that runs for days. In this
codebase use one of:

- `Arc<str>` for cheaply-cloneable owned strings
- `Cow<'static, str>` when the value is sometimes a literal, sometimes owned
- `OnceLock<String>` for actual program-lifetime singletons

Re-plan the edit with one of those, then proceed.
```

当模型发出 `Box::leak(` 里面一个 `edit` 或 `write` 瞄准一个 `.rs` 文件中，流在调用中中止，规则主体作为系统提醒预先添加，并且模型使用新上下文从同一点重新运行。

## 写出条件

正则表达式匹配原始字节，而不是解析的标记。锚定在唯一标识故障模式的最小片段上，并为模型退出留出足够的空间。捕捉 `Box::leak\(` 作品；只捕捉 `leak` 对日志消息和良性提及过度关注。

对于范围为 `edit` 或 `write`，正则表达式针对调用引入的重构源内容运行 - 而不是原始 JSON 序列化参数 - 因此根据代码本身编写模式并使用作用域 glob (`tool:edit(*.rs)`) 按路径过滤。对于其他工具，正则表达式会在原始参数流到达时查看它。

## 列出和禁用

`omp -p '/extensions'` 列出每个规则及其范围和源路径。通过将其名称添加到来禁用单个规则 `ttsr.disabledRules` 在 `config.yml`:

```yaml
ttsr:
  disabledRules:
    - box-leak
```

的 `ttsr_triggered` 每次规则注入时都会触发 hook 事件，因此您可以从 [hook](/docs/hooks).

## 相关

-   [Hooks](/docs/hooks) - 在运行之前拦截工具调用，而不是等待模型开始输入它们。
-   [上下文文件](/docs/context-files) - 每个提示中都会出现永久性的指导，而不是在比赛中进行修正。
-   [Skills](/docs/skills) — 当回合与描述匹配时加载的按需剧本。
