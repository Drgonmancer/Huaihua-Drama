import { Hono } from 'hono'
import fs from 'fs'
import { success, notFound } from '../utils/response.js'
import { backupDatabase, listBackups, getBackupPath } from '../services/db-backup.js'

const app = new Hono()

// GET /api/v1/backups —— 备份列表
app.get('/', (c) => {
  return success(c, listBackups())
})

// POST /api/v1/backups —— 立即备份
app.post('/', async (c) => {
  const dest = await backupDatabase('manual')
  return success(c, { filename: dest.replace(/\\/g, '/').split('/').pop() })
})

// GET /api/v1/backups/:filename/download —— 下载备份文件
app.get('/:filename/download', (c) => {
  const p = getBackupPath(c.req.param('filename'))
  if (!p) return notFound(c, '备份文件不存在')
  const data = fs.readFileSync(p)
  return c.body(data, 200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${c.req.param('filename')}"`,
  })
})

export default app
