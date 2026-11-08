# 贡献指南 / Contributing

感谢关注槐花短剧！欢迎通过 Issue 与 Pull Request 参与改进。

## 本地开发

```bash
# 后端（监听 5679，tsx watch 热重载）
cd backend
npm install
npm run dev

# 前端（监听 3013，Nuxt dev）
cd frontend
npm install
npm run dev
```

- 前后端都需 Node.js 18+；视频合成依赖系统 FFmpeg。
- 数据库迁移：`cd backend && npm run db:generate && npm run db:push`。
- 类型检查：`cd backend && npm run typecheck`。

## 提交规范

- 一个 PR 只做一件事：修 bug 或加功能，不要混在一起。
- 提交信息用中文或英文均可，但要写清楚「改了什么、为什么改」。
- 涉及品牌名、计费、积分逻辑的改动，请在 PR 描述中特别说明。

## 约定

- 品牌名统一使用「槐花短剧 / Huaihua Drama」。
- 前端是 Nuxt 3 SPA（`ssr:false`），纯 CSS 无 UI 框架，请保持一致。
- Agent 技能定义放在 `skills/<名称>/SKILL.md`，遵循现有格式。
- `data/` 是本地运行目录，不要把数据库或生成的媒体文件提交进仓库。

## 反馈问题

提 Issue 时请附带：

1. 复现步骤
2. 期望行为 vs 实际行为
3. 后端控制台日志（注意先脱敏，不要贴 API Key）
