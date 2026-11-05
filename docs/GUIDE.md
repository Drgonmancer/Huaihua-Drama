# 槐花短剧 · 部署说明（交付给同事）

> AI 短剧生成工具：输入小说/剧本 → 拆角色场景 → 拆分镜 → 生成图片/视频 → 拼接成片导出。
> 作为官网的一个功能模块部署。

## 一、技术栈
- **后端** `backend/`：Node + Hono + Drizzle ORM + better-sqlite3，端口 **5679**
- **前端** `frontend/`：Nuxt 3（**SPA 模式 `ssr:false`**）+ Vue 3 + Vite，端口 **3013**
- **数据库**：SQLite，单文件 `data/huobao_drama.db`（已随包附带，**仅 schema + 空配置骨架，无密钥无数据**）
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
npm run build        # 产物在 frontend/.output/public （静态文件，可直接托管到官网/CDN/Nginx）

# 2. 后端常驻
cd backend
npm install
npm start            # 监听 5679
```
- 把前端静态产物挂到官网某个路径下；
- 反向代理：前端请求的 `/api/*` 和 `/static/*` 都转发到后端 `:5679`（见 `frontend/nuxt.config.ts` 里的 proxy 配置，生产环境在 Nginx/网关里配同样规则即可）。
- 也提供了 **Docker**：根目录 `Dockerfile` + `docker-compose.yml`，`docker compose up --build` 一键起。

## 六、数据库说明
- 随包的 `data/huobao_drama.db` 是**净化版**：表结构齐全、含三条服务配置骨架（密钥为空）、无任何业务数据。
- 后端直接读这个文件，**无需 migration**。首次部署直接用即可，业务数据会写进同一文件。
- 生成的图片/视频存到 `data/static/`（随用随生成，本包未附带历史媒体）。

## 七、本版本已做的定制（交接备注）
1. **品牌**：已更名「槐花短剧 / Huaihua Drama」，配色按内部 VI 规范（浅紫 Periwinkle，见 `docs/assets/VI规范.pdf`），主题变量集中在 `frontend/app/assets/studio.css` 的 `:root`。
2. **出片流程已简化**：去掉了「配音生成」步骤；拼接导出可直接拼接生成的视频（不强制配音/合成）。
3. **视频生成不烧字幕**：火山适配器关了 `generate_audio` 并在提示词里要求"画面无字幕"，避免 AI 中文字幕错乱（`backend/src/services/adapters/volcengine-video.ts`）。
4. **导出面板**：有「全屏查看」「下载视频」。
5. 新建剧集时**音频配置为可选**（不填也能生成视频）。

## 八、目录结构
```
backend/     后端源码（src/ 路由、服务、adapters、db schema）
frontend/    前端源码（app/ pages、layouts、components、assets）
configs/     config.yaml（端口/路径/默认 provider，无密钥）
data/        huobao_drama.db（净化版）
skills/      Agent 提示词定义
scripts/     部署补丁与生产冒烟测试
docs/        本手册、剧本改写工作流标准、assets/（VI 规范）、ui-concepts/
Dockerfile / docker-compose.yml
README.md    项目说明
CONTRIBUTING.md / CHANGELOG.md
启动槐花短剧.bat  一键启动脚本
```

有问题可对照根目录 `README.md` 和 `CLAUDE.md`（开发笔记）。
