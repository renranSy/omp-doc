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

## 何时编写自定义工具

当模型需要执行项目专属操作时，请使用自定义工具：例如查询内部 API、运行领域检查或修改远程系统。若只需接入现成的外部集成，应使用 [MCP Server](/docs/mcp)。

## 文件位置

将 TypeScript 模块放置在以下位置之一：

-   `~/.omp/agent/tools/<name>/index.ts` — 用户范围
-   `.omp/tools/<name>/index.ts` — 项目范围

`.claude/tools/` 和 `.codex/tools/` 也会被发现。工具的注册名称来自工厂返回值中的 `name` 字段；同目录下的普通 `.md` 与 `.json` 文件会被视为元数据，而非工具模块。

## 基础结构

模块默认导出一个工厂函数。工厂会收到宿主 API（`pi`）和注入的 Zod 实例（`pi.zod`）；`params` 会由 Schema 推导出静态类型。

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

## 工厂字段

| 字段 | 用途 |
| --- | --- |
| `name` | 供模型调用的工具名，不能与内置工具或其他自定义工具冲突。 |
| `label` | TUI 中展示的人类可读标签。 |
| `description` | 模型判断是否调用时看到的说明，应明确触发条件。 |
| `parameters` | Zod Schema（`pi.zod`；也支持 TypeBox 风格 Schema），用于校验并推导 `params` 类型。 |
| `execute` | `(toolCallId, params, onUpdate, ctx, signal) => Promise<ToolResult>`；应将 `signal` 传递给子流程，确保取消能够传播。 |
| `renderCall` / `renderResult` | 可选，用于自定义调用卡与结果的 TUI 渲染。 |

## 流式输出

在 `execute` 中调用 `onUpdate(partial)` 可在最终返回前将进度推送到 TUI。模型只会看到最终返回的 `content`；`onUpdate` 面向用户界面。

## 返回形状

返回 `AgentToolResult`。`content` 会提供给模型；`details` 不会进入提示词。

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

`text` 块会成为内联上下文；`image` 块会传给支持视觉输入的模型。

## 加载和碰撞

加载时会拒绝与内置工具或已加载自定义工具同名的工具，且没有覆盖 Flag；内置工具始终优先。运行 `omp -p '/extensions'` 可查看已加载和被拒绝的项目。

## 相关

- [MCP](/docs/mcp)：公开由外部进程提供的工具。
- [Hooks](/docs/hooks)：拦截工具调用和结果，而不是新增工具。
- [插件](/docs/plugins)：将自定义工具与 Skills、命令和 MCP 配置打包在一起。
