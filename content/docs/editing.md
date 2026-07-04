---
title: "结构化编辑"
description: "使用 ast_edit 执行结构化代码重写，并通过 conflict:// 与 resolve 工具预览、接受或解决合并冲突。"
summary: "本页比较 Hashline 编辑、AST 结构化编辑和 LSP 重命名的适用场景，介绍 ast-grep 模式及冲突预览、接受和丢弃流程。"
keywords:
  - "结构化编辑"
  - "ast_edit"
  - "ast-grep"
  - "合并冲突"
  - "代码重写"
source: https://omp.sh/docs/editing
---

# 结构化编辑

线锚式 [编辑](/docs/files) 补丁是精确的，但对于重新格式化来说很脆弱。相反，结构编辑在 AST 上进行：相同的模式匹配 `foo( x )`, `foo(x)`, 和 `foo(/* comment */ x)`。对于涉及每个导入器的符号感知重命名（TypeScript 风格，语言服务器支持），请访问 [lsp 重命名](/docs/code-intelligence) 相反，它理解作用域并以 ast-grep 不理解的方式重新导出。

## ast\_编辑

`ast_edit` 在结构上重写代码 [ast grep](https://ast-grep.github.io/)。每个操作都是 `{ pat, out }`: `pat` 匹配 AST 形状， `out` 是替换模板。模式匹配结构，而不是文本 - 空格和注释将被忽略。

| 元变量 | 火柴 |
| --- | --- |
| `$A` | 一个 AST 节点，捕获为 `$A` 对于模板。 |
| `$_` | 1 个 AST 节点，未捕获。 |
| `$$$ARGS` | 零个或多个节点，捕获为 `$$$ARGS` 对于模板。 |
| `$$$` | 零个或多个节点，未捕获。 |

重用相同的元变量强制恒等式： `$A == $A` 比赛 `x == x` 但不是 `x == y`。语言是从文件扩展名推断出来的 `paths`;将每次调用范围缩小到一种语言以进行确定性重写。

```sh
# rename every callsite of legacyFn to newFn, preserving args
ast_edit ops=[{ pat: "legacyFn($$$ARGS)", out: "newFn($$$ARGS)" }] \
         paths=["src/**/*.ts"]

# delete every console.log, regardless of argument shape
ast_edit ops=[{ pat: "console.log($$$)", out: "" }] paths=["src/"]

# rewrite a CommonJS require to a const binding
ast_edit ops=[{ pat: "$F = require($M)", out: "const $F = require($M)" }] \
         paths=["src/"]

# modernize to optional chaining; identity enforced by $A
ast_edit ops=[{ pat: "$A && $A()", out: "$A?.()" }] paths=["src/"]
```

每个 `ast_edit` 运行阶段作为预览。 TUI 显示差异和替换计数；在模型调用之前没有任何内容到达磁盘 `resolve` 与 `{ action: "apply" }` （见下文）。将工具门与 `astEdit.enabled`;打开时，它会自动启用 [编辑](/docs/files).

对于一次性本地文本编辑更喜欢 `edit`。对于只读结构搜索，请访问 `ast_grep`：相同的模式语法，无需重写，返回带有内联元变量捕获的锚前缀匹配行。

## 冲突://

当文件包含 git merge 标记时， `read` 注册每个 `<<<<<<<` / `=======` / `>>>>>>>` 作为虚拟块 `conflict://N` 网址。代理人选择一方并回信；拼接发生在适当的位置。

| 网址 | 效果 |
| --- | --- |
| `conflict://N` | 文件中的第 N 个冲突块。编写内容来拼接它。 |
| `conflict://*` | 散装形式；解析具有相同内容或简写的每个块。 |
| `read path:conflicts` | 每个未解决冲突的每块一行索引 `path`. |

简写 `@ours`, `@theirs`, 和 `@base` 代表合并的三个侧面。一行 `@theirs` 当那一面是正确的批发时，就是整个编辑。

```sh
# 1. see what's unresolved
read src/session.ts:conflicts

# 2. pick a side for one block
write path="conflict://1" content="@theirs"

# 3. or resolve every block in the file the same way
write path="conflict://*" content="@ours"

# 4. mixed: read the block, write a hand-merged splice
read conflict://2
write path="conflict://2" content="const merged = { ...base, ...theirs, ...ours };
"
```

没有合并 UI，没有专用工具。一样的 [`read` 和 `write`](/docs/files) 对处理整个流程。

## 解决

`resolve` 完成待处理的操作。阶段性变更的工具（`ast_edit`、扩展提供的预览、计划批准）对必须在写入任何内容之前应用或丢弃的回调进行排队。合同是 `{ action: "apply" | "discard", reason }`;生产者的回调运行，其结果成为工具响应。

```sh
# 1. stage an AST rewrite (returns a (proposed) preview card)
ast_edit ops=[{ pat: "console.log($X)", out: "" }] paths=["src/auth.ts"]
# → 3 replacements in 1 file (proposed)

# 2. accept the preview
resolve action="apply" reason="redundant logging in auth path"
# → Applied 3 replacements in 1 file.

# 3. or reject it
resolve action="discard" reason="keep logs until after the release"
```

呼唤 `resolve` 没有挂起的操作错误，因此代理不会意外地接受上一回合的陈旧预览。丢弃是单次调用且原子的；没有部分适用。

## 何时到达哪个

`ast_edit`

跨多个文件重写语法形状：重命名调用、交换 API、删除匹配 声明。忽略格式。

[lsp 重命名](/docs/code-intelligence)

在每个导入器中进行符号感知重命名，尊重范围和再导出。正确的通话时间 ast-grep 的文本形状匹配会捕获来自另一个模块的同名符号。

`conflict://`

合并分辨率。读取枚举，写入拼接，重复直到文件没有标记。

`resolve`

接受或拒绝任何分阶段预览。一份合同 `ast_edit`、计划批准，以及 自定义工具预览。

[编辑](/docs/files)

针对您刚刚阅读的特定切片的线锚补丁。当更改是本地的并且 周围的文字稳定。
