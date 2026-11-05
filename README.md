# Huaihua Drama · 槐花短剧

**Inspiration has its blooming season. Creation has no limits.**

Huaihua Drama is a local-first AI short-drama production pipeline that takes you from raw script to finished film: script rewriting, character & scene extraction, voice casting, storyboard breakdown, image & video generation, and final-cut stitching — all in one place.

[Quick Start](#quick-start) · [Docker](#run-with-docker) · [User Guide](docs/GUIDE.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## Core Features

- **Script rewriting** — an LLM turns novels or raw scripts into shootable short-drama scripts
- **Character & scene extraction** — automatically pulls out character profiles and a scene list
- **Voice casting** — matches a TTS voice to every character
- **Storyboard breakdown** — script → shot list (shot size, angle, camera movement, dialogue, duration)
- **Image & video generation** — character portraits, scene images, shot first/last frames, image-to-video and text-to-video
- **Grid prompts** — batch-generate grid reference images for storyboards
- **Final-cut stitching** — FFmpeg trimming, stitching, audio mixing, and subtitle burning
- **Credit billing** — every generation action is billed in credits with a full audit trail
- **Bilingual UI** — the entire interface switches between Chinese and English instantly (preference stored per browser)

Production order: **Script → Characters & Scenes → Voices → Storyboard → Shot media → Final cut**.

## Quick Start

Prerequisites: **Node.js 18+** (20 LTS recommended) and **FFmpeg** on your PATH (`ffmpeg -version` works).

```bash
# Backend (listens on 5679)
cd backend
npm install
npm run dev

# Frontend (separate terminal, listens on 3013, proxies /api and /static to 5679)
cd frontend
npm install
npm run dev
```

Open <http://localhost:3013>. On Windows you can also double-click **启动槐花短剧.bat** in the repo root.

## Run with Docker

A single container serves both the frontend and the API (the backend auto-hosts the built frontend):

```bash
docker compose up -d --build
```

Then open <http://localhost:5679>. The `./data` volume persists the SQLite database and all generated media; the container ships with a `HEALTHCHECK` on `/api/v1/health`.

## Connect Your Own AI

This tool ships with **no built-in keys**. Copy `.env.example` to `.env` (or configure in-app). Supported services:

| Service | Purpose | Preset base_url (editable) | Model requirements |
|---|---|---|---|
| text (LLM) | Rewrite scripts / extract characters & storyboards | `https://api.zwenooo.link` | Any OpenAI-compatible chat model |
| image | Character / scene / shot images | `https://yunwu.ai/v1` | OpenAI-compatible image API |
| video | Image-to-video / text-to-video | `https://ark.cn-beijing.volces.com` | Volcengine Seedance etc. |

The **Settings** page supports:

- **One-click preset** — paste a single API key to wire up text / image / video / audio services at once
- **Connectivity test** — test each saved service configuration (auth, endpoint, rate-limit feedback per HTTP status)

## Tech Stack

Nuxt 3 (SPA, `ssr: false`) · Vue 3 · TypeScript · vue-i18n · Hono · Drizzle ORM · better-sqlite3 · FFmpeg

## Project Structure

```
huaihua-drama/
├── backend/                 # Node + Hono + Drizzle, listens on 5679
│   ├── src/                 # Routes, services, credit billing & config
│   └── package.json
├── frontend/                # Nuxt 3 SPA + Vue 3, listens on 3013
│   ├── app/                 # Pages, layouts, i18n locales & styles
│   └── nuxt.config.ts       # Port and /api /static proxy config
├── configs/                 # config.example.yaml / config.yaml
├── skills/                  # Agent skill definitions (SKILL.md files)
├── scripts/                 # Deploy patches and production smoke tests
├── docs/
│   ├── GUIDE.md             # Usage & deployment guide
│   ├── assets/              # VI specs and brand assets
│   └── ui-concepts/         # Early UI style explorations
├── data/                    # SQLite DB and generated media (local runtime dir, not committed)
├── Dockerfile
├── docker-compose.yml
├── 启动槐花短剧.bat
├── README.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

## Where Your Data Lives

Projects and credit records live in a single SQLite file under `data/`; generated images/videos are stored in `data/static/`. API keys are stored locally and never echoed back by the UI.

**Automatic backups**: the backend performs an online consistent backup on every startup and every 24 hours (latest 10 kept by default, tunable via `BACKUP_KEEP`), plus a mandatory pre-migration backup before any schema migration. Manage and download backups any time in **Settings → Backups**. To restore: stop the service, replace the database file, and start again.

## Feedback & Contributing

Issues, feature requests, skill templates, model adapters, and docs improvements are all welcome — see the [contributing guide](CONTRIBUTING.md) and [changelog](CHANGELOG.md).

## License

License TBD — no open-source license (MIT, Apache, etc.) is declared yet.
