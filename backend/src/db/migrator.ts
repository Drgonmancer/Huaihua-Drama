import { sqlite } from './index.js'
import { now } from '../utils/response.js'

type Sqlite = {
  exec: (sql: string) => void
  prepare: (sql: string) => any
  transaction: (fn: () => void) => () => void
}

export interface Migration {
  version: number
  name: string
  up: (sqlite: Sqlite) => void
}

/** 幂等加列：列已存在则跳过（基线 DDL 是 CREATE IF NOT EXISTS，迁移同样保持幂等） */
function addColumn(sqlite: Sqlite, table: string, column: string, definition: string) {
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (!columns.some(col => col.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

/**
 * 版本化迁移清单：只允许追加，禁止修改已发布的历史迁移。
 * 一次迁移 = 一个 version + 一个事务，失败自动回滚不写入版本号。
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'episodes_ai_config_ids',
    // 原 ensureColumn 补丁收编；对全新库是空操作（基线 DDL 已含这些列）
    up: (sqlite) => {
      addColumn(sqlite, 'episodes', 'image_config_id', 'INTEGER')
      addColumn(sqlite, 'episodes', 'video_config_id', 'INTEGER')
      addColumn(sqlite, 'episodes', 'audio_config_id', 'INTEGER')
    },
  },
]

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)

  const applied = new Set(
    (sqlite.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>).map(r => r.version),
  )
  const pending = MIGRATIONS.filter(m => !applied.has(m.version))

  if (!pending.length) {
    console.log('📦 数据库迁移：已是最新')
    return
  }

  for (const m of pending) {
    const run = sqlite.transaction(() => {
      m.up(sqlite)
      sqlite.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
        .run(m.version, m.name, now())
    })
    run()
    console.log(`📦 迁移 ${m.version}_${m.name} 已应用`)
  }
}
