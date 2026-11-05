# 更新记录 / Changelog

本文件记录槐花短剧的显著改动。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### 变更

- **品牌全面更名**：「短剧大麻雀 / Big Sparrow Shorts」→「槐花短剧 / Huaihua Drama」。
  - 后端所有计费原因（billingReason）、错误提示中的品牌名
  - 部署文档、冒烟测试与 KPI 补丁脚本
  - 前端页面标题、LOGO、设置页品牌名（此前已完成）
- **项目文件重组**（对齐 HuaiHua_MV 仓库格式）：
  - `部署说明.md` → `docs/GUIDE.md`（使用与部署手册）
  - `短剧剧本改写成即梦需求工作流程与标准.md` → `docs/`
  - `VI规范.pdf`、`drama.png` → `docs/assets/`
  - `ui-concepts/` → `docs/ui-concepts/`
  - 新增根目录 `README.md`（重写）、`CONTRIBUTING.md`、`CHANGELOG.md`、`启动槐花短剧.bat`
  - 项目根目录更名为 `槐花短剧`

### 修复

- `better-sqlite3` 原生模块在 Node 22 下的 `ERR_DLOPEN_FAILED`：`npm rebuild better-sqlite3` 解决，已写入使用手册。

## 历史版本

更早的改动（Huobao Drama 时期）见 Git 提交历史。
