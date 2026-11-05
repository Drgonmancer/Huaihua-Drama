import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { sqlite } from '../db/index.js'
import { logTaskError, logTaskSuccess } from '../utils/task-logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../../data')
const BACKUP_DIR = path.join(DATA_DIR, 'backups')
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP || 10))

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/**
 * 在线一致性备份（better-sqlite3 backup API，WAL 模式下安全）。
 * 禁止用 fs.copy 复制 db 文件：写入中复制会得到损坏副本。
 */
export async function backupDatabase(reason: 'startup' | 'schedule' | 'pre-migrate' | 'manual' = 'startup'): Promise<string> {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const dest = path.join(BACKUP_DIR, `hh-${reason}-${stamp()}.db`)
  await sqlite.backup(dest)
  // 收缩 WAL 文件
  try { sqlite.pragma('wal_checkpoint(TRUNCATE)') } catch { /* 忽略 checkpoint 失败 */ }
  pruneOldBackups()
  logTaskSuccess('Database', 'backup-done', { reason, dest: dest.replace(DATA_DIR, 'data') })
  return dest
}

function pruneOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('hh-') && f.endsWith('.db'))
      .map(f => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
    for (const old of files.slice(KEEP)) {
      try { fs.unlinkSync(path.join(BACKUP_DIR, old.f)) } catch { /* 单个删除失败不影响整体 */ }
    }
  } catch (err: any) {
    logTaskError('Database', 'backup-prune', { error: err.message })
  }
}

export interface BackupItem {
  filename: string
  reason: string
  size: number
  created_at: string
}

const BACKUP_NAME_RE = /^hh-([a-z]+)-\d{8}-\d{6}\.db$/

export function listBackups(): BackupItem[] {
  if (!fs.existsSync(BACKUP_DIR)) return []
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => BACKUP_NAME_RE.test(f))
    .map(f => {
      const st = fs.statSync(path.join(BACKUP_DIR, f))
      const reason = f.match(BACKUP_NAME_RE)![1]
      return { filename: f, reason, size: st.size, created_at: st.mtime.toISOString() }
    })
    .sort((a, b) => b.filename.localeCompare(a.filename))
}

/** 备份文件所在目录（供下载路由做路径校验） */
export function getBackupPath(filename: string): string | null {
  if (!BACKUP_NAME_RE.test(filename)) return null
  const p = path.join(BACKUP_DIR, filename)
  return fs.existsSync(p) ? p : null
}
