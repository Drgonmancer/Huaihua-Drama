# 更新记录 / Changelog

本文件记录槐花短剧的显著改动。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [Unreleased]

### 新增

- Agnes 免费模型接入（经本地 magpie 网关）：文本 / 图片 / 视频三类服务适配、连通性测试与设置页选项
- 视频提交环节限流退避重试（503/429/队列满，最多 10 次 × 30 秒）
- 品牌资产：应用图标与浏览器 favicon 生成脚本（`scripts/make-favicon.mjs`）

### 修复

- 环境变量种子不再覆盖用户已配置的 Agent 模型（仅填充空值）
- 技能路由与媒体存储的路径穿越风险（id 白名单校验 + 目录包含防护）
- 视频轮询对网关响应格式（`metadata.url`）的兼容

### 变更

- 积分体系为本地模式：余额与定价展示完全本地，不依赖任何外部账号体系
- 品牌视觉统一为「槐花短剧 / Huaihua Drama」（图标、favicon、页面标题、文档）
