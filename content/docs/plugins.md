---
title: "Plugins"
description: "安装、移除、更新和管理 omp Plugins，并了解 Plugin 来源、项目作用域、可捆绑能力与安全边界。"
summary: "本页介绍 Plugin 命令、Git 与 Marketplace 来源、用户和项目安装范围，以及 Extension、Skill、Hook、工具和 MCP 的捆绑方式。"
keywords:
  - "omp Plugin"
  - "插件管理"
  - "omp install"
  - "Marketplace"
  - "Extension"
source: https://omp.sh/docs/plugins
---

# Plugins

## 四个命令

| 命令 | 效果 |
| --- | --- |
| `omp install <source>` | 安装 plugin 到 `~/.omp/plugins/`. |
| `omp remove <name>` | 卸载 plugin 并取消注册其表面。 |
| `omp update [name]` | 重新获取一个 plugin 或每个已安装的 plugin。 |
| `omp list` | 显示每个已安装的 plugin 的来源、版本和范围。 |

通行证 `-l` （或 `--scope project`) 到 `install`/`remove`/`update` 进行操作 `.omp/plugins/` 在当前的存储库中。项目安装相同 plugin 的影子用户安装。提交 `.omp/plugins/installed_plugins.json` 与您的团队共享 plugin 集，而不强制其全局设置。

## 来源

每个 `omp install` 源解析为以下之一：

**npm package**

`omp install @scope/plugin-foo`。裸名称和作用域名称都有效； semver 范围被接受为 `name@^1.2`.

**Git 存储库**

`omp install github:user/repo`, `omp install [https://github.com/user/repo.git](https://github.com/user/repo.git)`，或带有 ref 的 Git URL： `user/repo#tag`.

**本地路径**

`omp install ./path/to/plugin` - 在开发时很有用。 omp 符号链接目录并监视它的更改。

**Marketplace plugin**

`omp install code-review@claude-plugins-official` — `name@marketplace` 表单，添加目录后 `omp marketplace add <source>`.

## Marketplace 目录

marketplace 是一个 Git 存储库（或本地目录），具有 `.claude-plugin/marketplace.json` 其根目录。添加一个使其 plugin 集可以通过短名称安装。

```sh
omp marketplace add anthropics/claude-plugins-official
omp marketplace discover           # browse plugins in the catalog
omp install code-review@claude-plugins-official
omp list                           # everything installed, npm + marketplace
```

marketplace 表面与 Claude 代码兼容 - 现有目录按原样工作。互动等价物生活在 `/marketplace` 和 `/plugins` 内部omp；看到 [斜线命令](/docs/slash).

## plugin 可以捆绑什么

plugin 的根布局镜像扩展目录。每个子文件夹都是可选的。

```text
my-plugin/
  plugin.json              # name, version, description, entry points
  skills/<name>/SKILL.md   # → /docs/skills
  commands/<name>.md       # → /docs/prompt-templates
  hooks/pre/*.ts           # → /docs/hooks
  hooks/post/*.ts
  tools/<name>/index.ts    # → /docs/custom-tools
  mcp.json                 # → /docs/mcp
  themes/<name>.json       # → /docs/themes
  README.md
```

在安装时，omp 将每个子目录合并到其相应的发现表面中。 plugin 的 `mcp.json` 贡献额外的 `mcpServers` 条目；它的 `themes/` 目录提供额外的主题文件；等等。卸载就会逆转一切。

## 捆绑表面 - 快速链接

-   [Skills](/docs/skills) — 下的点播剧本 `skills/<name>/SKILL.md`.
-   [提示词模板](/docs/prompt-templates) — Markdown 下的斜杠命令 `commands/`.
-   [Hooks](/docs/hooks) — 生命周期处理程序 `hooks/pre/` 和 `hooks/post/`.
-   [Custom tools](/docs/custom-tools) — TypeBox 架构工具 `tools/<name>/index.ts`.
-   [MCP 服务器](/docs/mcp) — 额外 `mcpServers` 通过 plugin 的条目 `mcp.json`.
-   [主题](/docs/themes) — 调色板下 `themes/<name>.json`.

## 列出加载的内容

`omp list` 显示已安装的插件； `omp -p '/extensions'` 显示每个表面的视图 - 每个 skill、命令、hook、工具、MCP 服务器和在此会话上解析的主题，以及提供它的 plugin 或目录。

## 安全性

> plugin 可以注册在每个提示上运行的 hooks、模型可以在没有确认的情况下调用的 custom tools 以及使用您的令牌与远程服务通信的 MCP 服务器。仅从您信任的来源安装 - 您每次都运行任意 TypeScript。

安装前审核 plugin：克隆源代码，读取其 `hooks/` 和 `tools/`，并浏览其 `mcp.json`。更喜欢项目范围内的安装（`-l`）对于您尚未审查的代码，并固定到特定的 Git 标签或 npm 版本而不是跟踪 `main`。同样的注意事项也适用于 marketplace 目录 - 在添加目录存储库之前先对其进行审查。

## 相关

-   [斜杠命令](/docs/slash) — `/marketplace` 和 `/plugins` 交互式表面。
-   [设置](/docs/settings) — 每个 plugin 启用/禁用 `disabledExtensions`.
