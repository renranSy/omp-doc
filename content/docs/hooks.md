---
title: "Hooks"
description: "使用 omp Hooks 在工具调用和生命周期事件前后执行 TypeScript 逻辑，实现拦截、审计、脱敏与自动化。"
summary: "本页介绍 Hook 的发现位置和事件能力，并通过阻止危险 Bash、编辑工具输出中的 Secret 等示例说明处理器返回值和调试方法。"
keywords:
  - "omp Hooks"
  - "生命周期 Hook"
  - "工具拦截"
  - "安全审计"
  - "TypeScript"
source: https://omp.sh/docs/hooks
---

# Hooks

## hooks 住哪里

```text
~/.omp/agent/hooks/pre/*.ts      # global pre-hooks
~/.omp/agent/hooks/post/*.ts     # global post-hooks
.omp/hooks/pre/*.ts              # project pre-hooks
.omp/hooks/post/*.ts             # project post-hooks
```

发现是非递归的：更深一层目录的文件将被忽略。从 CLI 开始， `--hook <path>` 加载一个显式文件（它是 `--extension`).

## hook 可以做什么

| 表面 | 活动 | 退货合同 |
| --- | --- | --- |
| 工具调用门 | `tool_call` | 
返回 `{ block: true, reason }` 拒绝来电。 `reason` 变成 模型看到的错误。第一个区块获胜。

 |
| 工具结果重写 | `tool_result` | 

返回 `{ content?, details?, isError? }` 改变模型接收到的内容。 处理程序链。

 |
| 每次呼叫消息编辑 | `context` | 

返回 `{ messages }` 替换发送到模型的消息数组 打电话。处理程序链。

 |
| 上下文压缩门 | `session_before_compact` | 

返回 `{ cancel: true }` 否决压缩。相同的形状 `session_before_branch`, `session_before_switch`, `session_before_tree`.

 |
| 会话生命周期 | 

`session_start`, `session_shutdown`, `turn_start`, `turn_end`, `message_*`, `tool_execution_*`

 | 观察性的。返回值被忽略。 |

请参阅 `HookAPI` 输入完整的事件列表。 `HookAPI` 是狭窄的事件处理程序表面； `ExtensionAPI` 是还注册命令、工具和渲染器的超集——当您需要更多内容时就可以使用它 `on`.

## 块 `rm -rf` 在bash中

一个拒绝之前一些灾难性形状的前置工具hook `bash` 曾经运行过。处理程序返回 `{ block: true, reason }` 和代理表面 `reason` 作为工具错误。

```ts
// ~/.omp/agent/hooks/pre/guard-rm.ts
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

const DANGER =
  /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+(\/|~|\$HOME)(\s|$)/;

export default function (pi: HookAPI) {
  pi.on("tool_call", (event) => {
    if (event.toolName !== "bash") return;
    const cmd = String(event.input.command ?? "");
    if (DANGER.test(cmd)) {
      return { block: true, reason: `Refused: ${cmd.slice(0, 80)}` };
    }
  });
}
```

> 第一个 `block` 胜利 - 跨多个 hooks 之前的排序是文件系统稳定的，但将正则表达式视为您的最后一道防线，而不是唯一的一道防线。

## 编辑工具输出中的秘密

重写的后置工具hook `read` 结果在模型看到它们之前擦洗 API 键。

```ts
// ~/.omp/agent/hooks/post/redact-keys.ts
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

export default function (pi: HookAPI) {
  pi.on("tool_result", (event) => {
    if (event.toolName !== "read" || event.isError) return;
    const content = event.content.map((c) =>
      c.type === "text"
        ? { ...c, text: c.text.replaceAll(/API_KEY=\S+/g, "API_KEY=[REDACTED]") }
        : c,
    );
    return { content };
  });
}
```

## 调试 hook

运行 `omp -p '/extensions'` 确认 hook 加载以及来自哪个路径。如果丢失，则该文件不在已发现的目录中 - 将其移至下面 `~/.omp/agent/hooks/pre/` 或 `.omp/hooks/pre/`，或者显式加载它 `--hook /path/to/file.ts`。参见 [提示词模板](/docs/prompt-templates) 和 [Skills](/docs/skills) 对于相邻的定制表面，以及 [上下文文件](/docs/context-files) 当您想要每轮注入静态规则而不是活动门时。
