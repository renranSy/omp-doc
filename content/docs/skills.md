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

## Skill 是什么

Skill 是放在指定目录中的 Markdown 工作手册。未加载前，系统提示词中只保留其 frontmatter 的 `description`；模型判断当前任务与描述匹配时，或你手动执行 `/skill:<name>` 时，才会加载正文。因此较长的手册不会在无需使用时消耗上下文。

## 布局

```text
~/.omp/agent/skills/<name>/SKILL.md     # global
.omp/skills/<name>/SKILL.md             # project
~/.claude/skills/, .claude/skills/      # also discovered
~/.codex/skills/,  .codex/skills/       # also discovered
```

发现是非递归的：每个目录只对应一个 Skill，且必须直接位于 `skills/` 下。Skill 目录内的同级文件可通过 `skill://<name>/path/to/file.md` 供模型读取。

## Frontmatter

| 字段 | 必填 | 作用 |
| --- | --- | --- |
| `name` | 否 | Skill 标识符；默认使用目录名。用于 `/skill:<name>` 和 `skill://<name>` URL。 |
| `description` | 是 | Skill 加载前模型唯一可见的内容；应包含具体动词、名词和适用范围。 |
| `hide` | 否 | 仍可通过 `skill://<name>` 与 `/skill:<name>` 加载，但不会列入系统提示词中的 Skill 清单。 |

## 完整的 `SKILL.md`

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

## 编写有效的描述

模型选择 Skill 的方式与选择工具相同：将当前任务与描述文本匹配。描述过于笼统时容易被跳过；应明确写出动词（编写、审查、调试）、对象（Postgres 查询、Lambda 错误、快照测试）和范围（`src/parser/`、`*.test.ts`）。

**坏：“有助于数据库方面的工作。”**

好：“编写、审查或优化 Postgres 查询、模式或配置。”

**坏：“测试”。**

好：“为导入器模块添加或扩展 Vitest 测试；涵盖固定装置、快照 测试和集成设置。”

即使某个 Skill 应当始终使用（如项目约定或强制检查），也应保持描述具体；在第一条提示词中显式调用 `/skill:<name>`，不要依赖模型猜测。

## 范围界定和禁用

| Flag / 设置 | 作用 |
| --- | --- |
| `--skills <p1,p2,…>` | 以逗号分隔的全局模式；仅保留匹配的 skills。 |
| `--no-skills` | 为本次运行完全禁用 Skill 发现。 |
| `skills.enabled: false` | 在 `~/.omp/agent/config.yml` 中持久禁用。 |
| `skills.ignoredSkills: [pattern, …]` | 按名称（全局模式）阻止 skills。 |
| `skills.includeSkills: [pattern, …]` | 允许列表（全局模式）——仅加载这些。 |
| `skills.enableSkillCommands: false` | 禁用 `/skill:<name>` 调用，同时保持发现打开。 |

运行 `omp -p '/extensions'` 可查看当前会话加载了哪些 Skill 以及来源路径。若需要通过固定提示词调用 Skill，请参阅[提示词模板](/docs/prompt-templates)；需要始终注入系统提示词的项目说明，请使用[上下文文件](/docs/context-files)。
