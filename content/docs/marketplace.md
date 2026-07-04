---
title: "Marketplace"
description: "创建和使用 omp Marketplace，从 Git、本地目录或 JSON Catalog 发现、安装并维护团队 Plugin 集合。"
summary: "本页介绍 Marketplace 来源、添加与浏览命令、Catalog Schema、Plugin Source 写法，以及如何发布可复用的插件目录。"
keywords:
  - "omp Marketplace"
  - "Plugin Catalog"
  - "插件市场"
  - "marketplace.json"
  - "Git"
source: https://omp.sh/docs/marketplace
---

# Marketplace

marketplace 是一个 Git 存储库（或本地目录），它在以下位置发布单个目录文件： `.claude-plugin/marketplace.json`。目录列出了 [插件](/docs/plugins) 以及在哪里获取每一个。添加目录一次，然后安装其插件 `name@marketplace` 无需记住底层的 Git URL。

## 添加来源

```sh
/marketplace add anthropics/claude-plugins-official
/marketplace add ./my-local-marketplace
/marketplace add https://github.com/org/catalog.git
```

`omp plugin marketplace add <source>` 从Shell工作。来源按形式分类：

| 源格式 | 解析为 |
| --- | --- |
| `owner/repo` | GitHub 简写 |
| `https://….git` 或 `git@…` | Git 存储库 |
| `https://….json` | 直接目录 URL |
| `./path`, `~/path`, `/path` | 本地目录 |

omp 克隆（或读取）源，验证 `.claude-plugin/marketplace.json`，并将目录缓存在 `~/.omp/plugins/cache/marketplaces/`。运行 `/marketplace update [name]` 重新获取； `/marketplace remove <name>` 放下它。

## 浏览并安装

类型 `/marketplace` 不带参数打开交互式浏览器。直接安装：

```sh
/marketplace install code-review@claude-plugins-official
/marketplace install --scope project my-plugin@my-marketplace
/marketplace install --force name@marketplace        # reinstall
```

CLI 等效项位于 `omp plugin install`。范围默认为 **用户** （随处可见，记录于 `~/.omp/plugins/installed_plugins.json`）；通过 `--scope project` 仅安装到当前存储库中 `.omp/plugins/installed_plugins.json` — 项目安装相同 plugin 的影子用户安装。

`omp -p '/extensions'` 列出加载此会话的每个表面，包括 plugin 和 marketplace 各自来自哪个表面。

## 目录形状

目录必须位于 `.claude-plugin/marketplace.json` 在存储库根目录中。

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "acme-plugins",
  "owner": { "name": "Acme Corp", "email": "plugins@acme.example" },
  "metadata": { "description": "Official Acme plugins for omp" },
  "plugins": [
    {
      "name": "acme-linter",
      "description": "Enforce Acme coding standards",
      "category": "development",
      "source": "./plugins/linter"
    }
  ]
}
```

顶级字段： `name` （小写字母数字加 `-` 和 `.`，最多 64 个字符）， `owner.name`, 和 `plugins` 是必需的。 `metadata.description`, `owner.email`, 和 `metadata.pluginRoot` （相对 plugin 源前面的前缀）是可选的。

每个plugin条目需要 `name` 和 `source`。可选字段： `description`, `version`, `author`, `homepage`, `category`, `tags`.

## Plugin 来源

的 `source` 每个条目决定 omp 从哪里获取 plugin：

| 形式 | 形状 |
| --- | --- |
| 相对路径 | `"./plugins/foo"` — marketplace 存储库的子目录 |
| git 网址 | `{ "source": "url", "url": "…​.git", "ref": "main", "sha": "…​" }` |
| GitHub 简写 | `{ "source": "github", "repo": "org/repo", "ref": "v1.0" }` |
| git子目录 | `{ "source": "git-subdir", "url": "…", "path": "packages/foo" }` |
| 新项目管理 | `{ "source": "npm", "package": "@scope/foo", "version": "1.2.0" }` |

销 `sha` 将 plugin 锁定到精确提交。转义 marketplace 根目录的相对路径和转义克隆存储库的子目录路径将被拒绝。 npm 源已解析但尚未安装 - 使用基于 Git 的源或相对源。

## 编写 marketplace

使用以下布局创建一个 Git 存储库：

```text
my-marketplace/
  .claude-plugin/
    marketplace.json
  plugins/
    my-plugin/        ← a plugin tree, see /docs/plugins
```

一个正在工作的 `marketplace.json` 小至：

```json
{
  "name": "my-marketplace",
  "owner": { "name": "Your Name" },
  "plugins": [
    { "name": "my-plugin", "source": "./plugins/my-plugin" }
  ]
}
```

推送到GitHub并分享 `owner/repo` 字符串。用户运行 `/marketplace add owner/repo` 然后 `/marketplace install my-plugin@my-marketplace`。首先在本地测试 `/marketplace add ./my-marketplace` — 本地目录是一流的来源。

## 信任

marketplace 是一个指针列表；在您的计算机上运行的代码是 plugin 条目解析的内容。没有签名，没有沙箱，没有集中审查。目录可以发送注册的 plugin [hooks](/docs/hooks) 每次提示时触发或 [custom tools](/docs/custom-tools) 模型调用时无需确认。

之前审查目录存储库 `/marketplace add`。之前审查每个 plugin 的源 `install`。固定到 `sha` 或标记 `ref` 而不是追踪 `main`。更喜欢 `--scope project` 对于任何您自己没有读过的内容。

## 相关

-   [插件](/docs/plugins) — 市场分配的单位。
-   [Skills](/docs/skills) — 通常会提供点播剧本插件。
-   [Hooks](/docs/hooks) — plugin 可以注册的生命周期代码；在添加 marketplace 之前对其进行审查的主要原因。
