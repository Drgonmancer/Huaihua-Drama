import './config/load-env.js'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import dramas from './routes/dramas.js'
import episodes from './routes/episodes.js'
import storyboards from './routes/storyboards.js'
import scenes from './routes/scenes.js'
import characters from './routes/characters.js'
import images from './routes/images.js'
import videos from './routes/videos.js'
import upload from './routes/upload.js'
import aiConfigs, { aiProviders } from './routes/aiConfigs.js'
import agentConfigs from './routes/agentConfigs.js'
import agent from './routes/agent.js'
import compose from './routes/compose.js'
import merge from './routes/merge.js'
import grid from './routes/grid.js'
import skills from './routes/skills.js'
import webhooks from './routes/webhooks.js'
import aiVoices from './routes/aiVoices.js'
import credits from './routes/credits.js'
import backups from './routes/backups.js'
import { requestLogger, errorHandler } from './middleware/logger.js'
import { seedAiFromEnv } from './config/seed-ai-from-env.js'
import { backupDatabase } from './services/db-backup.js'
import { runMigrations } from './db/migrator.js'

// 启动流程：备份 → 迁移 → 环境变量种子。迁移失败则拒绝启动（schema 不一致时运行更危险）。
try {
  await backupDatabase('startup')
} catch (err: any) {
  console.warn('⚠️ 启动备份失败，继续启动：', err?.message || err)
}
runMigrations()
seedAiFromEnv()

// 每 24 小时定时备份；unref 使其不阻止进程退出
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000
const backupTimer = setInterval(() => {
  backupDatabase('schedule').catch(err => console.error('定时备份失败:', err?.message || err))
}, BACKUP_INTERVAL)
backupTimer.unref()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')

const app = new Hono()

// Middleware
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3013,http://localhost:5679')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use('*', cors({
  origin: corsOrigins,
  credentials: true,
}))
app.use('*', requestLogger)
app.use('*', errorHandler)

// Health check
app.get('/api/v1/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
const api = new Hono()
api.route('/dramas', dramas)
api.route('/episodes', episodes)
api.route('/storyboards', storyboards)
api.route('/scenes', scenes)
api.route('/characters', characters)
api.route('/images', images)
api.route('/videos', videos)
api.route('/upload', upload)
api.route('/ai-configs', aiConfigs)
api.route('/ai-providers', aiProviders)
api.route('/agent-configs', agentConfigs)
api.route('/agent', agent)
api.route('/compose', compose)
api.route('/merge', merge)
api.route('/grid', grid)
api.route('/skills', skills)
api.route('/ai-voices', aiVoices)

api.route('/credits', credits)
api.route('/backups', backups)

app.route('/api/v1', api)

// Webhook callbacks (Vidu, etc.) - outside /api/v1
app.route('/webhooks', webhooks)

// Serve static files (storage)
app.use('/static/*', serveStatic({ root: path.join(projectRoot, 'data') }))

// Serve frontend (production build)
const distPath = path.join(projectRoot, 'frontend', 'dist')
const nuxtOutputPath = path.join(projectRoot, 'frontend', '.output', 'public')
const frontendRoot = fs.existsSync(path.join(distPath, 'index.html'))
  ? distPath
  : nuxtOutputPath
app.use('*', serveStatic({ root: frontendRoot }))
app.get('*', serveStatic({ root: frontendRoot, path: 'index.html' }))

const port = Number(process.env.PORT || 5679)
console.log(`🚀 槐花短剧 Huaihua Drama server on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
