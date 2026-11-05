import type { schema } from '../db/index.js'

type AiConfigRow = typeof schema.aiServiceConfigs.$inferSelect

function parseModels(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
  } catch {
    return raw ? [raw] : []
  }
}

function publicServiceName(serviceType: string, index: number): string {
  if (serviceType === 'image') return index > 0 ? `标准生图 · 方案 ${index + 1}` : '标准生图'
  if (serviceType === 'video') return index > 0 ? `短视频 · 方案 ${index + 1}` : '短视频'
  if (serviceType === 'audio') return index > 0 ? `配音合成 · 方案 ${index + 1}` : '配音合成'
  if (serviceType === 'text') return index > 0 ? `文案 Agent · 方案 ${index + 1}` : '文案 Agent'
  return index > 0 ? `生成服务 · 方案 ${index + 1}` : '生成服务'
}

/** 列表接口：隐藏 API Key、Base URL、真实 provider/model */
export function toPublicAiConfigRow(row: AiConfigRow, index = 0) {
  return {
    id: row.id,
    service_type: row.serviceType,
    name: publicServiceName(row.serviceType, index),
    provider: 'platform',
    model: [],
    priority: row.priority,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function toAdminAiConfigRow(row: AiConfigRow) {
  const models = parseModels(row.model)
  return {
    id: row.id,
    service_type: row.serviceType,
    name: row.name,
    provider: row.provider,
    base_url: row.baseUrl,
    api_key: row.apiKey ? '***' : '',
    model: models,
    priority: row.priority,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}
