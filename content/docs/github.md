---
title: "GitHub"
description: "通过 omp 的 pr://、issue:// 虚拟 URL 和 github 工具读取、审查并操作 GitHub Issue 与 Pull Request。"
summary: "本页说明 omp 如何复用 gh CLI 凭据，把 PR、Issue 和 Diff 暴露为虚拟文件，并通过结构化 Action 完成评论、审查和写操作。"
keywords:
  - "omp GitHub"
  - "Pull Request"
  - "GitHub Issue"
  - "代码审查"
  - "gh CLI"
source: https://omp.sh/docs/github
---

# GitHub

## 授权

一切都会过去 `gh` 在引擎盖下。登录一次 `gh auth login` 并且代理继承相同的凭据 - 中没有特定于 GitHub 的 config `~/.omp/`.

## pr:// 和 issues:// URL

PR、问题和差异可以作为虚拟 Markdown 文件进行寻址。代理不会学习新的 GitHub 形状的 API；它通过相同的方式读取 URL [`read`](/docs/files) 打开本地文件的工具。读取数据通过软 TTL 和硬 TTL 进行缓存（`github.cache.softTtlSec`, `github.cache.hardTtlSec`）因此在会话中重新读取同一个项目永远不会两次访问网络。

| 网址 | 它返回什么 |
| --- | --- |
| `issue://N` | 会话默认存储库中的单个问题 - 标题、作者、标签、正文、线程评论。 |
| `issue://owner/repo/N` | 跨存储库的完全合格的单一问题。 |
| `issue://N?comments=0` | 没有讨论线程的问题正文。 |
| `pr://N` | 单一公关视图；该页面指向匹配的 diff URL。 |
| `pr://N/diff` | PR 的更改文件列表，每行指向 `pr://N/diff/<i>`. |
| `pr://N/diff/all` | 完全统一的差异，hashline-可锚定，因此代理可以通过锚点引用一个大块。 |
| `pr://N/diff/3` | 单个文件的差异（1-索引）。 |
| `pr://`, `issue://` | 默认存储库中的最新项目；支持 `?state=open|closed|all` (`pr://` 也接受 `merged`), `?author=`, `?label=`, `?limit=`. |

```sh
# read a PR and walk its diff
read pr://1234
read pr://1234/diff
read pr://1234/diff/2

# list recent open bugs in the current repo
read issue://?state=open&label=bug&limit=20
```

## github 工具

一个基于操作的调度程序，可以处理除读取之外的所有事情。通过选择操作 `op`;每个操作都使用参数的子集。

| 操作 | 它的作用 |
| --- | --- |
| `repo_view` | 存储库元数据。可选 `repo` 和 `branch`. |
| `pr_create` | 打开 PR。要么提供 `title` （以及可选的 `body`）或设置 `fill: true` 从提交中自动填充。接受 `base`, `head`, `draft`, `reviewer[]`, `assignee[]`, `label[]`. |
| `pr_checkout` | 将一个或多个 PR 检查到专用的 git 工作树中。 `pr` 是数字、URL、分支或它们的数组。 |
| `pr_push` | 将签出的 PR 分支推回其源。要求分支机构已通过以下方式获得 `pr_checkout`. |
| `search_issues` | GitHub 问题搜索语法。默认值 `repo` 到当前结帐。 |
| `search_prs` | GitHub PR 搜索语法。 |
| `search_code` | GitHub 代码搜索语法。不支持日期过滤器。 |
| `search_commits` | 跨 GitHub 提交搜索。 `dateField` 被忽略；总是使用 `committer-date`. |
| `search_repos` | 存储库搜索。使用查询限定符，例如 `org:` 或 `language:` 而不是 `repo`. |
| `run_watch` | 观看操作运行。省略 `run` 观察当前 HEAD 提交的每次运行。在第一次检测到的作业失败时快速失败，内联返回尾部日志，并将完整的失败作业日志保存为会话工件。 |

搜索操作接受 `since` 和 `until` 作为相对持续时间（`3d`, `12h`, `2w`, `1mo`) 或 ISO 日期。两者都设置后，限定符就变成了一个范围。

### 阅读 PR

最快的路径是 URL 方案 — 无需检出，无需 shell：

```sh
read pr://1234              # metadata + comments
read pr://1234/diff         # file list
read pr://1234/diff/all     # full unified diff
```

如果您想在本地运行 PR，请使用工作树工作流程 [子代理](/docs/subagents)’姐妹工具 `pr_checkout`:

```sh
github op=pr_checkout pr=1234
# cd into the worktree, run tests, edit, then:
github op=pr_push
```

### 开设公关

```sh
github op=pr_create \
  title="Fix login redirect after SSO" \
  body="Resolves #1198. Adds a regression test." \
  base=main \
  reviewer=["octocat","myorg/team-auth"] \
  label=["bug"]

# or autofill from the commit log
github op=pr_create fill=true draft=true
```
