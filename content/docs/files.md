---
title: "处理文件"
description: "使用 omp 的 read、write、edit、find 和 search 工具处理文件、目录、URL、归档与结构化数据。"
summary: "本页介绍五类文件工具共享的选择器语法、Hashline 锚点和安全编辑机制，并给出读取、写入、查找和正则搜索示例。"
keywords:
  - "omp 文件工具"
  - "read"
  - "edit"
  - "search"
  - "Hashline"
source: https://omp.sh/docs/files
---

# 处理文件

每个文件流都使用五个内置函数之一。 `read` 提取字节（包含行范围、存档成员、URL 获取）， `write` 创建或覆盖整个文件， `edit` 应用线锚定补丁， `find` 解析路径全局，并且 `search` 运行正则表达式内容查找。对于结构重写和合并冲突跳转到 [结构编辑](/docs/editing);对于符号感知重命名，请参阅 [代码智能](/docs/code-intelligence).

## 读

一 `path` 参数处理磁盘文件、目录、档案、SQLite 数据库、PDF、Office 文档、Jupyter 笔记本、图像和普通 web URL。相同的参数解析内部方案： `skill://`, `pr://`, `issue://`, `agent://`, `artifact://`, `history://`, `memory://`, `mcp://`, `local://`, `rule://`, `vault://`, `conflict://`.

附加一个选择器 `:` 来确定阅读范围。 `:50-200` 是一个线范围， `:50+150` 是一种计数形式， `:raw` 绕过总结， `:conflicts` 索引合并冲突块。输出带有一个 `[path#TAG]` 快照标题和编号行（`41:text`）所以 `edit` 稍后可以参考确切的线路。可解析源上的裸路径返回结构摘要 - 保留签名，省略正文。重新发出范围或 `:raw` 当你需要尸体的时候。

```sh
# line range from a file inside a tarball
read "build/bundle.tar.gz:src/app.ts:120-180"

# raw verbatim slice (no summary, no anchors)
read "src/parser.ts:1-40:raw"

# fetch and clean a web page
read "https://example.com/docs/api"

# URL schemes share the same selector grammar as files
read pr://1234/diff/2
read agent://AuthLoader/findings
read conflict://1
```

## 写

`write` 创建一个新文件或批量替换一个文件。调度员匹配 `read`: `archive.ext:inner/path` 写入档案， `db.sqlite:table` 插入一行， `db.sqlite:table:key` 更新或删除一项。生成的文件可以防止意外覆盖；保存时格式化过程在字节到达磁盘之前运行。

```sh
write path="src/routes/health.ts" content="export const ok = () => 'ok';\n"
```

伸手去拿 `edit` 相反，当文件已经存在并且您只需要更改其中的一部分时。整个文件重写会丢失锚点历史记录，并且在差异审查中噪音更大。

## 编辑

`edit` 应用根据每个会话快照存储验证的行锚定补丁。模型读取一个切片，复制 `[path#TAG]` 读取输出的标头（四个十六进制标签对整个文件进行指纹识别）并针对普通行号发出操作。如果文件在读取后移动（另一个代理、格式化程序或手动保存），则标记不再匹配，并且补丁将被恢复或拒绝，而不是破坏错误的行。修复方法始终相同：重新`read` 切片并针对新标签发出新的补丁。

补丁语法（变体 `hashline`，默认）是单个 `input` 包含一个或多个文件部分的字符串。每个部分都以 `[PATH#TAG]`;操作名称纯行号。有效负载行开头为 `+`.

| 奥普 | 效果 |
| --- | --- |
| `replace N..M:` | 将包含行范围替换为有效负载行。 |
| `replace block N:` | 替换从第 N 行开始的整个语法块（树保姆已解决）。 |
| `delete N..M` | 删除包含的行范围。无有效负载。 |
| `insert after N:` / `insert before N:` | 在 N 行之后/之前插入有效负载行 (`insert head:` / `insert tail:` 目标文件结束）。 |

```sh
# 1. read the slice first to capture the snapshot tag
read src/auth.ts:80-90
# →  [src/auth.ts#1F2A]
#    87:  return loadUser(id);
#    88:}

# 2. patch by line number, anchored to the tag
edit input="[src/auth.ts#1F2A]
replace 87..87:
+  return await loadUser(id);
"
```

使用以下命令覆盖每个会话的语法 `PI_EDIT_VARIANT` 环境变量；可接受的值为 `hashline` （默认）， `patch`, `apply_patch`, 和 `replace`。配套的 `edit.mode` 设置在 `~/.omp/agent/config.yml` 坚持做同样的事情。

> 当更改是结构性的时 - 重命名符号、交换 API 形状、重写每个调用点 - 使用 [ast\_编辑](/docs/editing) 或 [lsp 重命名](/docs/code-intelligence)。两者都忽略空白并在破坏行锚定补丁的格式化搅动中幸存下来。

## 找到

`find` 解决路径全局问题。传递一个或多个模式 `paths`;结果以换行符分隔，相对于 cwd，按 mtime 排序（最近的在前）。荣誉资质 `.gitignore` 默认情况下。用它来枚举而无需阅读：与 `search` 是经过深思熟虑的，因此模型不会意外地将每个匹配文件加载到上下文中。

```sh
# every TypeScript route file, newest first
find paths=["src/routes/**/*.tsx"]

# multiple roots in one call
find paths=["apps/**/package.json", "packages/**/package.json"]
```

## 搜索

`search` 针对跨文件、目录、glob 或内部 URL 的文件内容运行正则表达式。匹配作为锚前缀行返回（`*5th|content`）；上下文行使用前导空格。荣誉资质 `.gitignore`。当正则表达式包含文字时，交叉线模式会自动启用 `\n`。本机引擎分页 - `skip` 跳过较早的比赛而无需重新扫描。

```sh
# every TODO with the author tag, case-insensitive
search pattern="TODO\\(\\w+\\)" paths=["src/"] i=true

# cross-line: function signature followed by an empty body
search pattern="function \\w+\\([^)]*\\)\\s*\\{\\n\\s*\\}" paths=["src/"]
```

使用 `find` 当您只需要路径列表时 `search` 当您需要查看匹配的内容时。对于忽略空格和注释的结构匹配，请访问 `ast_grep` 于 [结构编辑](/docs/editing) 页。

## 工作流程

四种最常见的文件接触轮次共享一种形状：窄化、读取、修补、验证。

```sh
1. find paths=["src/**/*.ts"]                              # enumerate
2. search pattern="loadUser\\(" paths=["src/"]             # locate callsites
3. read src/auth.ts:80-120                                 # capture anchors
4. edit input="@@ src/auth.ts
   = 87qa..87qa
   ~  return await loadUser(id);
   "                                                      # patch by anchor
5. lsp action=diagnostics file=src/auth.ts                 # verify
```

参见 [代码智能](/docs/code-intelligence) 为 `lsp` 工具和 [结构编辑](/docs/editing) 为了 `ast_edit` 和 `conflict://` 网址表面。
