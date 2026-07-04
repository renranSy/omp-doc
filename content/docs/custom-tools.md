---
title: "自定义工具"
description: "为 omp 编写带 Zod Schema 的自定义工具，让模型安全调用项目 API、领域检查或远程系统操作。"
summary: "本页说明何时选择 Custom Tool 而不是 MCP，介绍工具文件位置、注册骨架、字段、流式输出、上下文和错误处理。"
keywords:
  - "omp 自定义工具"
  - "Custom Tool"
  - "Zod"
  - "工具调用"
  - "Extension API"
source: https://omp.sh/docs/custom-tools
---

# 自定义工具

## 什么时候写一篇

当模型需要时，使用自定义工具 *做* 特定于您的项目的内容：查询内部 API、运行域检查、改变远程系统。如果您只想公开现成的集成，请使用 [MCP 服务器](/docs/mcp) 相反。

## 它去哪里

将 TypeScript 模块放置在以下位置之一：

-   `~/.omp/agent/tools/<name>/index.ts` — 用户范围
-   `.omp/tools/<name>/index.ts` — 项目范围

`.claude/tools/` 和 `.codex/tools/` 也被拾起。该工具的注册名称来自 `name` 场工厂退货。平原 `.md` 和 `.json` 同一文件夹中的内容被视为元数据，而不是模块。

## 骷髅

默认导出工厂。工厂收到主机API（`pi`）与注入的 Zod 实例（`pi.zod`); `params` 从模式静态类型化。

```ts
import type { CustomToolFactory } from "@oh-my-pi/pi-coding-agent";

const factory: CustomToolFactory = (pi) => ({
  name: "repo_stats",
  label: "Repo Stats",
  description: "Count tracked files matching a glob",
  parameters: pi.zod.object({
    glob: pi.zod.string().optional().default("**/*.ts"),
  }),
  async execute(_toolCallId, params, onUpdate, _ctx, signal) {
    onUpdate?.({
      content: [{ type: "text", text: `Listing ${params.glob ?? "**/*.ts"}` }],
    });
    const result = await pi.exec(
      "git",
      ["ls-files", params.glob ?? "**/*.ts"],
      { signal, cwd: pi.cwd },
    );
    if (result.code !== 0) {
      throw new Error(result.stderr || "git ls-files failed");
    }
    const files = result.stdout.split("\n").filter(Boolean);
    return {
      content: [{ type: "text", text: `Found ${files.length} files` }],
      details: { count: files.length, sample: files.slice(0, 10) },
    };
  },
});

export default factory;
```

## 工厂田野

| 领域 | 目的 |
| --- | --- |
| `name` | 模型调用的工具名称。不得与内置工具或其他自定义工具发生碰撞。 |
| `label` | TUI 的人类可读标签。 |
| `description` | 模型在决定是否调用它时看到的内容。具体说明触发器。 |
| `parameters` | Zod 模式 (`pi.zod`; TypeBox 样式的模式也被接受）。驱动验证和键入 `params`. |
| `execute` | `(toolCallId, params, onUpdate, ctx, signal) => Promise<ToolResult>`。前进 `signal` 到子流程，因此取消会传播。 |
| `renderCall` / `renderResult` | 可选。用于电话卡和结果的自定义 TUI 渲染器。 |

## 流式输出

致电 `onUpdate(partial)` 从里面 `execute` 在最终返回之前将进度推送到 TUI。模型看到了最终结果 `content` 仅； `onUpdate` 是为了用户。

## 返回形状

返回一个 `AgentToolResult`. `content` 是模型读取的内容； `details` 不出现提示。

```ts
return {
  content: [
    { type: "text", text: "Done." },
    { type: "image", mimeType: "image/png", data: pngBase64 },
  ],
  details: { /* arbitrary JSON, surfaced to the user, not the model */ },
  isError: false,
};
```

`text` 块成为内联上下文。 `image` 块进入具有视觉功能的模型。

## 加载和碰撞

加载时会拒绝名称冲突 - 针对内置工具和任何已加载的自定义工具。没有覆盖标志。内置程序总是获胜。运行 `omp -p '/extensions'` 查看加载的内容和拒绝的内容。

## 相关

-   [MCP](/docs/mcp) — 公开由外部进程提供的工具。
-   [Hooks](/docs/hooks) — 拦截工具调用和结果，而不是添加新的。
-   [插件](/docs/plugins) — 将 custom tools 与 skills、命令和 MCP 配置捆绑在一起。
