# 槐花短剧 · 部署说明（交付给同事）

> AI 短剧生成工具：输入小说/剧本 → 拆角色场景 → 拆分镜 → 生成图片/视频 → 拼接成片导出。
> 独立部署的本地优先应用，不依赖任何外部账号体系。

## 一、技术栈
- **后端** `backend/`：Node + Hono + Drizzle ORM + better-sqlite3，端口 **5679**
- **前端** `frontend/`：Nuxt 3（**SPA 模式 `ssr:false`**）+ Vue 3 + Vite，端口 **3013**
- **数据库**：SQLite，单文件 `data/huaihua_drama.db`（已随包附带，**仅 schema + 空配置骨架，无密钥无数据**）
- **媒体处理**：依赖系统 **ffmpeg**（视频合成/拼接用，必须装）

## 二、环境要求
- Node.js **18+**（建议 20 LTS）
- **ffmpeg** 已安装并在 PATH 中（`ffmpeg -version` 能跑）
- 包管理：后端用 npm，前端用 npm（或 pnpm）

## 三、本地跑起来（开发）
```bash
# 后端
cd backend
npm install
npm run dev        # tsx watch，监听 5679

# 前端（另开一个终端）
cd frontend
npm install
npm run dev        # nuxt dev，监听 3013；自动把 /api 和 /static 代理到 5679
```
浏览器打开 `http://localhost:3013`。

## 四、配置 AI 服务密钥（必做）
本工具不内置任何密钥。启动后进入页面右上角 **设置**，给三类服务各填一个 API Key：
| 服务 | 用途 | 当前预置的 base_url（可改） | 需要的模型 |
|---|---|---|---|
| text（LLM） | 改写剧本/拆角色/拆分镜 | `https://api.zwenooo.link` | 任意 OpenAI 兼容对话模型 |
| image | 生成角色/场景/镜头图 | `https://yunwu.ai/v1` | `gpt-image-2`（OpenAI 兼容图片接口） |
| video | 图生/文生视频 | `https://ark.cn-beijing.volces.com` | 火山 Seedance（`doubao-seedance-2-0-260128` 等） |

> base_url / 模型都可以在设置里换成你们自己的供应商，只要是对应的兼容接口即可。
> 设置页还有「一键配置」入口（指向 chatfire 全链路），按需使用。

## 五、生产部署
前端是 **SPA（ssr:false）**，最简单的集成方式：
```bash
# 1. 构建前端为纯静态站点
cd frontend
npm install
npm run build        # 产物在 frontend/.output/public （静态文件，可托管到任意静态服务器/CDN/Nginx）

# 2. 后端常驻
cd backend
npm install
npm start            # 监听 5679
```
- 把前端静态产物托管到任意静态服务器 / CDN / 对象存储；
- 反向代理：前端请求的 `/api/*` 和 `/static/*` 都转发到后端 `:5679`（见 `frontend/nuxt.config.ts` 里的 proxy 配置，生产环境在 Nginx/网关里配同样规则即可）。
- 也提供了 **Docker**：根目录 `Dockerfile` + `docker-compose.yml`，`docker compose up --build` 一键起。

## 六、数据库说明
- 随包的 `data/huaihua_drama.db` 是**净化版**：表结构齐全、含三条服务配置骨架（密钥为空）、无任何业务数据。
- 后端直接读这个文件，**无需 migration**。首次部署直接用即可，业务数据会写进同一文件。
- 生成的图片/视频存到 `data/static/`（随用随生成，本包未附带历史媒体）。

## 七、目录结构
```
backend/     后端源码（src/ 路由、服务、adapters、db schema）
frontend/    前端源码（app/ pages、layouts、components、assets）
configs/     config.yaml（端口/路径/默认 provider，无密钥）
data/        huaihua_drama.db（净化版）
skills/      Agent 提示词定义
scripts/     工具脚本（品牌 favicon 生成等）
docs/        本手册、剧本改写工作流标准、assets/（VI 规范）
Dockerfile / docker-compose.yml
README.md    项目说明
CONTRIBUTING.md / CHANGELOG.md
启动槐花短剧.bat  一键启动脚本
```

有问题可对照根目录 `README.md` 和 `CLAUDE.md`（开发笔记）。
