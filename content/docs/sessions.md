---
title: "会话"
description: "管理 omp 的持久化会话：恢复历史、浏览会话树、创建分支或 Fork、压缩上下文、导出并共享记录。"
summary: "本页介绍 omp 会话在磁盘上的 append-only 树结构，以及 CLI 与斜杠命令中的恢复、分支、Fork、切换、导出和共享工作流。"
keywords:
  - "omp 会话"
  - "会话恢复"
  - "会话分支"
  - "Fork"
  - "JSONL"
source: https://omp.sh/docs/sessions
---

# 会话

会话是磁盘上的 append-only 树 `~/.omp/agent/sessions/`，按工作目录分组，因此两个项目永远不会共享历史记录。每转都是一个有父指针的节点；分支会移动叶子并从那里追加，因此原始时间线始终保留在文件中。有关磁盘架构，请参阅 [会话格式](/docs/session-format).

> 会话 ID 是按时间排序的 UUID (v7)，因此它们按创建时间排序，并且短 id 前缀足以识别 `-r`.

## 恢复

四个标志涵盖了常见情况：

```sh
omp -c                       # continue most recent in this cwd
omp -r                       # open a picker scoped to this project
omp -r 1f9d2a                # resume by id prefix
omp --resume ./session.jsonl # resume an explicit file
omp --no-session             # ephemeral; nothing written to disk
```

`-c` 更喜欢每个终端的面包屑，因此分割窗格和 `tmux` 同一目录下的窗口不会互相踩踏。如果面包屑丢失，它将回退到 cwd 中的最新会话，然后重新开始。

`-r <prefix>` 首先在当前项目中查找 id，然后在全局查找。如果匹配位于其他地方，omp 会在将其Fork到当前 cwd 之前进行提示，而不是默默地更改您的目录。 `--session` 是一个别名 `--resume`.

`--fork <id|path>` 将会话恢复到一个全新的文件中 `parentSession` 谱系标记，保持原始状态不变。对于脚本或一次性运行很有用：

```sh
omp --fork 1f9d2a             # fork by id prefix
omp --fork ./session.jsonl    # fork from an explicit file
```

> `--no-session` 短暂运行：没有任何内容被持久化，并且 `/fork`, `/export`, 和 `/share` 对该运行被禁用。与它配对 `-p` 对于不得在磁盘上留下痕迹的一次性管道。

完整标志参考： [CLI 参考](/docs/cli).

## 导航树（`/tree`)

`/tree` 是就地导航器。它将叶指针移动到当前文件中任何较早的消息 - 没有新文件，没有Fork - 这就是当转向横向或需要擦过很长的工具绕路时您想要的。

```text
● 1f9d2a  user      "rewrite the importer to stream"
└─● 1f9d2b  assistant tool: read src/importer.ts
  ├─● 1f9d2c  assistant edit src/importer.ts          ← current leaf
  │ └─● 1f9d2d  user      "add a test for the stream path"
  └─● 1f9d2e  assistant edit src/importer.ts (alt)    ← branch B
    └─◆ 1f9d2f  [labeled: pre-refactor checkpoint]
```

-   键入以在消息之间进行模糊搜索； ←/→ 浏览结果页面。
-   Ctrl+O 循环过滤器： *默认* → *无需工具* → *仅限用户* → *仅标记* → *全部*.
-   Shift+L 标记突出显示的条目。带标签的条目会显示在选择器中并在压缩中幸存下来，因此它们是“稍后再回来”标记的正确工具。

## 分支与Fork

`/branch` 保留在同一个文件中，并从上一条消息启动一个新线程 - 相同的 id 空间，新的叶子：

```text
/branch                       # message selector opens; pick where to branch
```

`/fork` 将整个当前会话克隆到一个全新的文件中 `parentSession` 谱系标记。原始内容未受影响 - 当您想尝试不同的方法而不污染时间线时很有用：

```text
/fork                         # pick a message; opens a new file
```

> 挑选 `/branch` 当您希望一个文件成为一次探索的规范记录时。挑选 `/fork` 当替代方案可能会被放弃并且您不希望它弄乱父母的时候 `/tree` 视图。

## 紧凑型（`/compact`)

`/compact` 总结活动分支的旧半部分并将其替换为单个摘要条目；最近的转折保持逐字记录。通过焦点来偏向摘要，例如 `/compact Focus on the API changes`。磁盘上的文件未受影响 - `/tree` 仍然回到预上下文压缩历史。自动触发器、配置和三个计划模式批准路径均位于 [内存和压缩](/docs/memory) 页。

## 从里面浏览

一旦您进入会话，一些斜杠命令即可完成内务处理，而无需离开 TUI。

| 命令 | 它的作用 |
| --- | --- |
| `/resume` | 打开当前项目的会话选择器。 |
| `/session info` | 打印 ID、路径、父系谱系和统计信息。 |
| `/session delete` | 删除当前文件并返回选择器。 |
| `/new` | 开始新的会话而不触及当前会话。 |
| `/drop` | 删除当前会话并开始新会话。 |
| `/rename <title>` | 设置选择器中显示的人工标签。 |
| `/move <path>` | 将会话重新绑定到不同的工作目录。 |

完整的斜线库存和关键快捷键： [斜杠命令](/docs/slash).

## 出口

`/export [path]` 编写当前会话的独立 HTML 呈现 — 标题、条目、系统提示、工具架构 — 并在浏览器中打开它。 `omp --export <session.jsonl> [output]` 在不启动交互式会话的情况下执行相同的操作，这正是批量渲染存档文件所需的。

`/dump` 将纯文本记录复制到剪贴板：系统提示、活动模型、工具定义、每条消息和工具结果。 `/copy` 打开较小片段的选择器 - 最后的代理消息、单个代码块以及代理运行的最近命令。

## 分享

`/share` 导出到临时 HTML，然后运行您的自定义共享处理程序 `~/.omp/agent/share.{ts,js,mjs}` 如果存在的话。如果没有处理程序，它会退回到秘密 GitHub 要点： `gh` 并通过打开结果 `gistpreview.github.io`.

> 自定义处理程序失败 *不* 回退到 gist — gist 路径仅在未配置处理程序时运行。如果你的处理程序抛出异常， `/share` 报告错误并停止。

### 自定义共享处理程序

将默认导出的函数删除于 `~/.omp/agent/share.ts` （或 `.js` / `.mjs`）和 `/share` 称之为它而不是要点后备。签名：

```ts
// ~/.omp/agent/share.ts
export type CustomShareFn = (
  htmlPath: string,
) => Promise<{ url?: string; message?: string } | string | undefined>;
```

返回一个字符串（或 `{ url }`），omp 显示 URL 并在浏览器中打开它。返回 `undefined` 并且 omp 假设您的处理程序执行了自己的用户体验。

### 工作示例：上传到S3

```ts
// ~/.omp/agent/share.ts
import { execFileSync } from "node:child_process";
import { basename } from "node:path";

const BUCKET = "s3://my-team-omp-shares";
const PUBLIC_BASE = "https://shares.my-team.dev";

export default async function share(htmlPath: string) {
  const key = `${Date.now()}-${basename(htmlPath)}`;
  execFileSync("aws", ["s3", "cp", htmlPath, `${BUCKET}/${key}`, "--acl", "public-read"], {
    stdio: "inherit",
  });
  const url = `${PUBLIC_BASE}/${key}`;
  return { url, message: `Uploaded ${key} (${BUCKET})` };
}
```

## 交给队友

干净地结束Turn `/handoff [focus]`：它编写一个结构化的总结，总结状态、打开的线程和后续步骤。接收者首先阅读该条目，并且无需滚动整个文字记录即可确切知道您停止的位置。

然后选择交通工具：

**要点（默认）**

`/share` 渲染为 HTML 并通过以下方式将其作为秘密要点上传 `gh`。零设置如果 `gh` 已经通过身份验证。

**自定义处理程序**

将默认导出放置在 `~/.omp/agent/share.{ts,js,mjs}` 和 `/share` 相反，通过它的路线。

**原始文件**

对于完全可编辑的交接，请从以下地址发送 JSONL `~/.omp/agent/sessions/<cwd-dir>/<timestamp>_<id>.jsonl` 直接。接收器恢复 反对它：

```
omp --resume ./handoff.jsonl
```

> JSONL 文件是规范记录； HTML 只是一种渲染。如果您希望接收方继续迭代，请发送 JSONL。 HTML 供只读审阅。

## 食谱

### 断开连接后重新连接

SSH 会话中途中断。经纪人还在写—— `-c` 选择 cwd 中的最新会话并重播流尾部：

```sh
ssh box
cd ~/work/api
omp -c          # streams the in-flight assistant turn from where it left off
```

### 重构前的快照

你会要求一些有风险的东西。标记当前的叶子，以便稍后可以返回到它：

```text
/tree                       # opens navigator at the current leaf
# highlight the last user turn, press Shift+L
> pre-refactor              # label the bookmark
# Esc back to the prompt; do the risky thing.
# Later, if it goes sideways:
/tree                       # filter to labeled-only with Ctrl+O, find "pre-refactor"
/branch                     # branches from the bookmark, original timeline preserved
```

### Fork尝试不同的方法

从最后一个用户回合开始Fork，交换模型，给它十个回合，如果没有落地就放弃：

```text
/fork                       # copies the whole session into a new file
/model                      # switch to the model you want to evaluate
> redo this using streams instead of buffers
# If it works:  /handoff and /share the new file.
# If it doesn't: omp -r  → pick the original session, keep going.
```

### 在交接之前强制集中紧凑

```text
/compact Focus on the importer streaming bug and the fix in src/importer.ts
/handoff The streaming importer now copes with empty rows; remaining work is the test for the partial-flush path.
```

参见 [内存和压缩](/docs/memory) 当压缩自动触发时，以及 [会话格式](/docs/session-format) 对于磁盘上的 JSONL 架构。
