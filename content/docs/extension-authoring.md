---
title: "编写扩展"
description: "创建带 package.json 清单的 omp Extension，注册工具、命令和事件，并打包 Skills、Hooks 与其他功能。"
summary: "本页介绍 Extension Package 的清单、目录布局、TypeScript 工厂模块和完整示例，并说明本地加载、安装与调试流程。"
keywords:
  - "omp Extension"
  - "Extension 开发"
  - "package.json"
  - "TypeScript"
  - "Plugin"
source: https://omp.sh/docs/extension-authoring
---

# 编写扩展

## package 是什么扩展名

扩展名是一个带有 `package.json` 清单、一个或多个 TypeScript 工厂模块以及您想要与其一起发布的任何功能文件夹。运行时部分——什么 `pi.registerTool`, `pi.registerCommand`, 和 `pi.on` 实际运行 - 是清单指向的工厂模块。目录中的其他所有内容（skills、hooks、custom tools、提示词模板、 `mcp.json`当 package 位于加载路径上时，omp 的现有发现表面会拾取 (主题)。清单是唯一必须存在的文件；其余的是惯例。

本页是关于包装的。对于各个表面，请参见 [Skills](/docs/skills), [Hooks](/docs/hooks), [Custom tools](/docs/custom-tools), 和 [MCP](/docs/mcp).

## 清单

omp 从中读取一个字段 `package.json`: `omp.extensions`。它是一个入口路径数组，每个路径都相对于 package 根进行解析。每条路径都是一个 `.ts` 或 `.js` 默认导出工厂的模块 `ExtensionAPI`.

```json
{
  "name": "my-extension",
  "version": "0.1.0",
  "omp": {
    "extensions": ["./src/main.ts"]
  }
}
```

package 可以声明多个条目——当一个包想要将安全性 hook 与生产力工具分开时，这很有用：

```json
{
  "omp": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

遗留密钥 `pi.extensions` 仍以相同的形状被接受；新包应该使用 `omp.extensions`.

## 目录布局

omp 通过目录名称而不是清单字段发现功能。如果您将传统文件夹运送到工厂旁边，它们会被加载，就像用户将它们放在下面一样 `~/.omp/agent/` 他们自己。

```text
my-extension/
  package.json          ← omp.extensions manifest
  src/
    main.ts             ← extension factory (registers tools, commands, events)
  skills/
    my-skill/
      SKILL.md          ← on-demand playbook
  hooks/
    pre/
      block-rm.ts       ← legacy HookAPI module
  tools/
    my-tool/
      index.ts          ← custom tool factory
  prompts/
    review.md           ← prompt template
  mcp.json              ← additional MCP servers
  themes/
    midnight.json       ← theme
  README.md
```

子发现规则与独立表面匹配：skills 是深层目录 `skills/`,hooks下 `hooks/pre/` 和 `hooks/post/`, custom tools 在 `tools/<name>/index.ts`。工厂位于 `src/main.ts` 除了（而不是代替）这些之外运行。

## 一个完整的例子

一个最小的 package，注册一个工具、一个斜线命令，并发送一个 skill：

```json
{
  "name": "@acme/notes",
  "version": "1.0.0",
  "description": "Notes search tool plus a writing-style skill",
  "omp": {
    "extensions": ["./src/main.ts"]
  }
}
```

```ts
// src/main.ts
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function notes(pi: ExtensionAPI) {
  const { z } = pi.zod;

  pi.registerCommand("notes", {
    description: "Open today's note",
    handler: async (_args, ctx) => ctx.ui.notify("Opened notes", "info"),
  });

  pi.registerTool({
    name: "search_notes",
    label: "Search Notes",
    description: "Full-text search through project notes",
    parameters: z.object({ query: z.string() }),
    async execute(_id, params) {
      return {
        content: [{ type: "text", text: `Searched: ${params.query}` }],
        details: { query: params.query },
      };
    },
  });
}
```

`skills/notes-style/SKILL.md` 其余的传统文件夹不需要接线 - 将它们放入，当 package 位于加载路径上时，omp 会找到它们。

## 本地测试一下

开发时加载 package 的三种方法。从运行时的角度来看，这三者是等效的；选择与您想要的迭代方式匹配的选项。

-   **将设置指向目录。** 添加绝对路径 `extensions` 在 `~/.omp/agent/config.yml`:
    
    ```yaml
    extensions:
      - /path/to/my-extension
    ```
    
-   **通过 CLI 一次性完成。** `omp --extension ./my-extension` 为单个会话加载 package。 `--hook` 是同一个Flag，但名称不同。
    
-   **安装为 plugin。** `omp install ./my-extension` （或 `-l ./my-extension` 对于项目范围）将目录符号链接到 plugin 集中并监视它的更改 - 当您想要将其与真正的工具集一起进行测试时，这是正确的选择。参见 [插件](/docs/plugins).
    

确认装载了什么 `omp -p '/extensions'`。运行与 `--log-level debug` 查看每个表面的负载线。

## 通过 marketplace 运送

marketplace 是一个 Git 存储库，具有 `.claude-plugin/marketplace.json` 列出一个或多个包的目录。目录是版本控制和元数据所在的地方 - `name`, `version`, `author`, `category`, `tags`, `homepage` — 不是 package 本身。指向同一存储库中同级目录的最小条目：

```json
{
  "name": "acme-plugins",
  "owner": { "name": "Acme Corp" },
  "plugins": [
    {
      "name": "notes",
      "version": "1.0.0",
      "category": "productivity",
      "source": "./plugins/notes"
    }
  ]
}
```

推送仓库；用户添加它 `omp marketplace add owner/repo` 并安装 `omp install notes@acme-plugins`。通过标记 marketplace 存储库并更新目录来固定版本 `version` 字段 — 安装尊重引脚。参见 [Marketplace](/docs/marketplace) 完整的目录架构和源类型（Git URL、GitHub 简写、git-subdir、npm）。

## 相关

-   [Marketplace](/docs/marketplace) — 目录架构和发布工作流程。
-   [插件](/docs/plugins) — 安装、范围和更新机制。
-   [Skills](/docs/skills) - 捆绑在下面的剧本 `skills/`.
-   [Hooks](/docs/hooks) - 事件拦截器捆绑在 `hooks/`.
