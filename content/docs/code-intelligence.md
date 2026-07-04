---
title: "代码智能"
description: "使用 omp 内置 LSP 完成符号重命名、引用查询、定义跳转、Hover、诊断和 Code Action。"
summary: "本页介绍 omp 的语言服务器能力、支持的操作与服务器配置，并演示如何在整个代码库中安全重命名符号和应用诊断修复。"
keywords:
  - "omp LSP"
  - "代码智能"
  - "符号重命名"
  - "Code Action"
  - "代码诊断"
source: https://omp.sh/docs/code-intelligence
---

# 代码智能

## 通过语言服务器重命名

正则表达式重命名会错过重新导出、隐藏本地变量和字符串键控访问。 `lsp action=rename` 向服务器询问 `WorkspaceEdit` 并将其原子地应用于每个触及的文件。如果服务器拒绝（符号不可重命名，或者其中一项编辑会发生冲突），则不会写入任何内容。这同样适用于 `rename_file`，它会随着移动而重写导入。

对于不涉及符号的其他结构重写 - 语法模式上的代码修改、大型机械重构 - 请参阅 [结构编辑](/docs/editing).

## 行动

| 行动 | 它返回什么 | 何时伸手去拿它 |
| --- | --- | --- |
| **导航** |
| `definition` | 定义 cursor 下符号的位置。 | “这是从哪里来的？”在阅读来电者之前。 |
| `type_definition` | 符号类型声明的位置。 | 该值是一个实例；你想要类/接口。 |
| `implementation` | 接口或抽象方法的具体实现。 | 追踪特征/接口到它的实现。 |
| `references` | 项目范围内符号的每个调用点。 | 在做出改变之前先确定改变的大小。 |
| `hover` | 输入符号的签名和文档注释。 | 推断类型、通用实例化、文档字符串。 |
| `symbols` | 
文档大纲（带有 `file`）或工作区搜索（使用 `file="*"` + `query`).

 | 在不知道文件的情况下通过名称查找符号。 |
| **诊断和修复** |
| `diagnostics` | 

文件（或工作区）的错误、警告、提示 `file="*"`).

 | 编辑后检查文件；对工作区进行健全性检查。 |
| `code_actions` | 

服务器提供的一系列修复/重构；过滤器 `query` (e.g. `quickfix`).

 | “添加缺失的导入”，“实施特征”，组织导入。 |
| **重构** |
| `rename` | 

原子性 `WorkspaceEdit` 在引用该符号的所有地方重命名该符号。

 | 任何跨文件符号重命名。 |
| `rename_file` | 移动/重命名文件并重写导入以匹配。 | 重新调整模块布局而不破坏调用者。 |
| **服务器管理** |
| `status` | PATH 上哪些服务器正在运行、空闲或缺失。 | 诊断结果为空——服务器正常了吗？ |
| `capabilities` | 活动服务器实际支持的内容。 | 在请求可能未实现的功能（例如调用层次结构）之前。 |
| `reload` | 

重新启动文件服务器，或者 `file="*"` 对于每台服务器。

 | 安装缺少的工具链后，或清除陈旧状态后。 |
| `request` | 

原始 LSP 请求： `query` 命名方法， `payload` 携带 JSON 参数。

 | 包装器不会直接公开 LSP 功能。 |

## 指着一个符号

大多数行动采取 `file` + `line` 并且需要一列来解析符号。通行证 `symbol` 而不是计算字符：该工具找到该行上的符号并使用其偏移量。当同一名称在一行中出现多次时，追加 `#N` 第 N 次出现（1 索引）。对于 `definition`, `references`, 和 `rename`, `symbol` 需要同时提供 `line` — 猜测列是重命名出错的原因。

```sh
lsp action=references file=src/server/auth.ts line=42 symbol="issueToken"
lsp action=definition  file=src/parse.ts      line=88 symbol="parse#2"
```

## 服务器

omp 自动从默认表（typescript-语言服务器、rust-analyzer、pyright、gopls、clangd 等）中检测服务器，并根据需要启动它们。覆盖服务器中的 `lsp.json` （或 `.lsp.json`/`lsp.yaml`) 文件 — 项目范围内的 `<project>/lsp.json` 或 `<project>/.omp/lsp.json`，用户范围内 `~/.omp/agent/lsp.json`。整个工具由 `lsp.enabled`;禁用单个会话 `--no-lsp`。参见 [设置](/docs/settings) 对于 config 旋钮。

## 工作示例：在代码库中重命名

功能 `issueToken` 住在 `src/auth/jwt.ts` 并由少数处理程序和测试调用。将其重命名为 `mintToken` 不会错过调用点或破坏重新导出：

```sh
# 1. Confirm what changes (server-computed, no edits yet).
lsp action=references file=src/auth/jwt.ts line=14 symbol="issueToken"

# 2. Apply the rename atomically.
lsp action=rename file=src/auth/jwt.ts line=14 symbol="issueToken" new_name="mintToken"

# 3. Re-check the workspace for fallout.
lsp action=diagnostics file="*"
```

第 2 步要么立即写入每个触及的文件，要么不写入任何内容。第 3 步显示了重命名无法修复的任何内容 - 按字符串进行动态查找、引用旧名称的文档注释、通过另一个路径导入符号的下游 package。

## 常见陷阱

诊断为空但构建失败

运行 `lsp action=status`。 PATH 中可能缺少该语言的服务器。安装它（ `rust-analyzer`, `gopls`，……）然后 `lsp action=reload file="*"`.

重命名被拒绝

服务器将符号标记为不可重命名（通常是内置的外部类型或仅字符串键）。 通过结构编辑来修复受影响的站点。

发现错误发生

当名称在线路上重复时，使用 `symbol="name#2"` 消除歧义。
