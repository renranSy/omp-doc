---
title: "Skills"
description: "编写和加载 omp Skills，通过 SKILL.md 的 frontmatter 与按需正文为智能体提供可复用工作流程。"
summary: "本页说明 Skill 的目录布局、发现顺序、frontmatter 字段和描述写法，并给出完整 SKILL.md 示例及调试方法。"
keywords:
  - "omp Skills"
  - "SKILL.md"
  - "智能体工作流"
  - "frontmatter"
  - "可复用提示词"
source: https://omp.sh/docs/skills
---

# Skills

## skill 是什么

skill 是指定目录下的 Markdown 剧本。只有它的正面内容 `description` 停留在系统提示符中。当模型将当前任务与该描述匹配时，或者当您使用以下命令调用它时，主体会加载 `/skill:<name>`。长剧本在需要之前不需要任何成本。

## 布局

```text
~/.omp/agent/skills/<name>/SKILL.md     # global
.omp/skills/<name>/SKILL.md             # project
~/.claude/skills/, .claude/skills/      # also discovered
~/.codex/skills/,  .codex/skills/       # also discovered
```

发现是非递归的 — 每个目录一个 skill，直接位于 `skills/`。 skill 目录内的同级文件可从模型中寻址，如下所示 `skill://<name>/path/to/file.md`.

## 前题

| 领域 | 必填 | 效果 |
| --- | --- | --- |
| `name` | 不 | Skill 标识符；默认为目录名称。用于 `/skill:<name>` 和 `skill://<name>` 网址。 |
| `description` | 是的 | 在 skill 加载之前模型看到的唯一部分。具体动词+名词+范围。 |
| `hide` | 不 | 保持 skill 可通过以下方式加载 `skill://<name>` 和 `/skill:<name>` 但将其排除在系统提示列表之外。 |

## 完整的SKILL.md

```md
---
name: postgres
description: Writing, reviewing, or optimizing Postgres queries, schemas, or configs.
---

# Postgres playbook

## When to use this skill
- Reviewing a migration before it lands
- Diagnosing slow queries with EXPLAIN
- Picking an index type

## Procedure
1. Capture the current plan: `EXPLAIN (ANALYZE, BUFFERS) <query>`.
2. Check stats freshness: `SELECT last_analyze FROM pg_stat_user_tables`.
3. Inspect indexes: `\d+ <table>` in psql, or `pg_indexes`.

## Reference
- `skill://postgres/references/indexes.md` — index decision matrix
- `skill://postgres/references/explain.md` — reading EXPLAIN output
```

## 写出火爆的描述

该模型选择 skills 的方式与选择工具的方式相同：它将任务与描述文本进行匹配。模糊的描述会被跳过；列出动词（写作、审查、调试）、名词（Postgres 查询、Lambda 错误、快照测试）以及有用的范围（`src/parser/`, `*.test.ts`).

**坏：“有助于数据库方面的工作。”**

好：“编写、审查或优化 Postgres 查询、模式或配置。”

**坏：“测试”。**

好：“为导入器模块添加或扩展 Vitest 测试；涵盖固定装置、快照 测试和集成设置。”

对于 skills 应该 *总是* 加载（项目约定、强制检查），无论如何都要保持描述具体，然后使用显式调用 `/skill:<name>` 在您的第一个提示中，而不是在比赛中赌博。

## 范围界定和禁用

| 标志/设置 | 效果 |
| --- | --- |
| `--skills <p1,p2,…>` | 以逗号分隔的全局模式；仅保留匹配的 skills。 |
| `--no-skills` | 为此运行完全禁用 skill 发现。 |
| `skills.enabled: false` | 同样，坚持 `~/.omp/agent/config.yml`. |
| `skills.ignoredSkills: [pattern, …]` | 按名称（全局模式）阻止 skills。 |
| `skills.includeSkills: [pattern, …]` | 允许列表（全局模式）——仅加载这些。 |
| `skills.enableSkillCommands: false` | 禁用 `/skill:<name>` 调用，同时保持发现打开。 |

运行 `omp -p '/extensions'` 查看当前会话加载的 skills 以及从何处加载。将此页面与 [提示词模板](/docs/prompt-templates) 当您想要固定提示来调用 skill 时，并且使用 [上下文文件](/docs/context-files) 对于项目备注，应无条件在系统提示中。
