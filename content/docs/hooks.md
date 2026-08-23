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

## Hook 文件位置

```text
~/.omp/agent/hooks/pre/*.ts      # global pre-hooks
~/.omp/agent/hooks/post/*.ts     # global post-hooks
.omp/hooks/pre/*.ts              # project pre-hooks
.omp/hooks/post/*.ts             # project post-hooks
```

发现是非递归的：更深层目录的文件会被忽略。CLI 可通过 `--hook <path>` 显式加载文件，它与 `--extension` 使用同一加载机制。

## Hook 能做什么

| 场景 | 事件 | 返回约定 |
| --- | --- | --- |
| 工具调用门 | `tool_call` |
返回 `{ block: true, reason }` 可拒绝调用；`reason` 会作为工具错误提供给模型。第一个阻止结果生效。

 |
| 工具结果改写 | `tool_result` |

返回 `{ content?, details?, isError? }` 可修改模型接收到的内容；处理器会按链路依次执行。

 |
| 每次调用的消息改写 | `context` |

返回 `{ messages }` 可替换即将发送给模型的消息数组；处理器会按链路依次执行。

 |
| 上下文压缩门 | `session_before_compact` |

返回 `{ cancel: true }` 可取消压缩。同样的返回形式适用于 `session_before_branch`、`session_before_switch`、`session_before_tree`。

 |
| 会话生命周期 |

`session_start`, `session_shutdown`, `turn_start`, `turn_end`, `message_*`, `tool_execution_*`

| 仅用于观测，返回值会被忽略。 |

完整事件列表请查阅 `HookAPI` 类型。`HookAPI` 仅提供事件处理能力；`ExtensionAPI` 是其超集，还能注册命令、工具和渲染器，需要更多能力时应使用 `ExtensionAPI.on`。

## 块 `rm -rf` 在bash中

下面的前置 `bash` Hook 会在执行前拦截一些危险命令。处理器返回 `{ block: true, reason }`，Agent 会把 `reason` 作为工具错误处理。

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

> 多个 Hook 同时阻止时，以第一个 `block` 为准。文件系统的加载顺序是稳定的，但正则表达式应只是最后一道防线，而非唯一的安全措施。

## 编辑工具输出中的秘密

下面的后置 `read` Hook 会在模型看到结果前清除其中的 API Key。

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

## 调试 Hook

运行 `omp -p '/extensions'` 可确认 Hook 是否加载及其来源路径。若缺失，说明该文件不在已发现目录中：将其移到 `~/.omp/agent/hooks/pre/` 或 `.omp/hooks/pre/`，或通过 `--hook /path/to/file.ts` 显式加载。相关定制能力请参阅[提示词模板](/docs/prompt-templates)和 [Skills](/docs/skills)；如需每回合注入静态规则而不是动态拦截，请使用[上下文文件](/docs/context-files)。
