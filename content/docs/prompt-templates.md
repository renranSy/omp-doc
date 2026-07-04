---
title: "提示词模板"
description: "使用 Markdown 或 TypeScript 创建 omp 提示词模板，把可复用 Prompt 注册为带参数和自定义 UI 的斜杠命令。"
summary: "本页比较 Markdown 与 TypeScript 两类 Prompt Template，介绍文件位置、frontmatter、参数插值、模块接口和模板调试方式。"
keywords:
  - "omp 提示词模板"
  - "Prompt Template"
  - "斜杠命令"
  - "Markdown 模板"
  - "TypeScript"
source: https://omp.sh/docs/prompt-templates
---

# 提示词模板

## 两种口味

prompt template 是斜杠命令。不带扩展名的文件名成为命令名。最简单的版本是带有提示正文的 Markdown 文件；对于任何需要参数解析、自定义 UI 或后台工作的内容，请改用 TypeScript 模块。

## 他们住的地方

```text
~/.omp/agent/commands/<name>.md           # global, markdown
~/.omp/agent/commands/<name>/index.ts     # global, typescript
.omp/commands/<name>.md                   # project, markdown
.omp/commands/<name>/index.ts             # project, typescript

# also discovered:
~/.claude/commands/  .claude/commands/
~/.codex/commands/   .codex/commands/
```

项目命令隐藏同名的全局命令。运行 `omp -p '/extensions'` 查看加载的内容。

## 降价模板

Markdown 命令是 YAML frontmatter 加上提示正文。调用命令时，正文将成为用户消息。位置参数是 `$1`, `$2`，……；连接后的余数是 `$@` 或 `$ARGUMENTS`.

```md
---
description: Review a PR with a structured checklist
---

Review pull request #$1.

Focus areas (from `$@`):

1. Correctness — logic errors, off-by-ones, wrong return paths.
2. Security — injection, authn/authz, secret handling.
3. Performance — N+1, allocations on hot paths, blocking I/O.
4. Tests — new code paths covered, no flakiness or hidden mocks.

Use `gh pr view $1 --json title,body,files` to start, then
`gh pr diff $1` for the patch. Surface findings inline with file:line.
```

调用它 `/review-pr 482 --focus security`. `$1` 决心 `482`, `$@` 决心 `--focus security`.

### 前题

| 领域 | 效果 |
| --- | --- |
| `description` | 一行摘要显示在 `/` 自动完成。回落至第一条非空主体线。 |
| `name` | 覆盖命令名称（荣幸地 `.codex`/OpenCode 风格的命令文件； OMP 本机命令使用文件名）。 |

## TypeScript 模块

当您需要解析参数、提示用户、运行 shell 命令或呈现自定义 UI 时，请改用 TS 模块。默认导出接收自定义命令 API 并返回命令定义（或其数组）的工厂。

```ts
// ~/.omp/agent/commands/changelog/index.ts
import type { CustomCommandAPI } from "@oh-my-pi/pi-coding-agent";

export default function (pi: CustomCommandAPI) {
  return {
    name: "changelog",
    description: "Summarise recent commits into CHANGELOG bullets",
    async execute(args: string[], ctx) {
      const range = args[0] || "HEAD~10..HEAD";
      const log = await pi.exec("git", ["log", "--oneline", range], {
        cwd: pi.cwd,
      });
      if (log.code !== 0) {
        ctx.ui.notify("git log failed: " + log.stderr, "error");
        return;
      }
      // Returning a string sends it as the prompt for this turn.
      return `Summarise these commits as CHANGELOG bullets, grouped by Added / Changed / Fixed:\n\n${log.stdout}`;
    },
  };
}
```

工厂可以返回多个命令。返回 `undefined` 来自 `execute` 意味着命令本身处理了所有事情（不发送提示）。对于自定义 UI、消息渲染器和键盘快捷键，请编写 [plugin](/docs/plugins) 相反。参见 [Hooks](/docs/hooks) 对于相关的生命周期 API 和 [Skills](/docs/skills) 当您想要按需播放手册而不是固定提示时。

## 祈求

所有模板均显示在 `/` 交互模式下的自动完成选择器。从 CLI 中，传递斜杠命令作为提示符： `omp -p '/review-pr 482'`。参见 [斜杠命令](/docs/slash) 用于选择器、历史记录和内置命令参考。
