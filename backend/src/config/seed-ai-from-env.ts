import { eq } from 'drizzle-orm'
import { db, schema } from '../db/index.js'
import { now } from '../utils/response.js'

const AGENT_TYPES = [
  'script_rewriter',
  'extractor',
  'storyboard_breaker',
  'voice_assigner',
  'grid_prompt_generator',
] as const

interface EnvPreset {
  serviceType: 'text' | 'image' | 'video'
  provider: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  priority: number
}

export function seedAiFromEnv() {
  const yunwuKey = process.env.YUNWU_API_KEY?.trim()
  const volcKey = process.env.VOLCENGINE_API_KEY?.trim()
  if (!yunwuKey && !volcKey) return

  const ts = now()
  const presets: EnvPreset[] = []

  if (yunwuKey) {
    presets.push(
      {
        serviceType: 'text',
        provider: 'openai',
        name: '文案 Agent',
        baseUrl: process.env.YUNWU_BASE_URL?.trim() || 'https://api.yunwu.ai',
        apiKey: yunwuKey,
        model: process.env.YUNWU_TEXT_MODEL?.trim() || 'gpt-5.4',
        priority: 100,
      },
      {
        serviceType: 'image',
        provider: 'openai',
        name: '标准生图',
        baseUrl: process.env.YUNWU_IMAGE_BASE_URL?.trim() || 'https://api.yunwu.ai/v1',
        apiKey: yunwuKey,
        model: process.env.YUNWU_IMAGE_MODEL?.trim() || 'gpt-image-2',
        priority: 99,
      },
    )
  }

  if (volcKey) {
    presets.push({
      serviceType: 'video',
      provider: 'volcengine',
      name: 'Seedance 视频',
      baseUrl: process.env.VOLCENGINE_BASE_URL?.trim() || 'https://ark.cn-beijing.volces.com',
      apiKey: volcKey,
      model: process.env.VOLCENGINE_VIDEO_MODEL?.trim() || 'doubao-seedance-2-0-mini-260615',
      priority: 100,
    })
  }

  for (const preset of presets) {
    const rows = db.select().from(schema.aiServiceConfigs)
      .where(eq(schema.aiServiceConfigs.serviceType, preset.serviceType))
      .all()
    const existing = rows.find(r => r.isActive) || rows[0]

    const values = {
      serviceType: preset.serviceType,
      provider: preset.provider,
      name: preset.name,
      baseUrl: preset.baseUrl,
      apiKey: preset.apiKey,
      model: JSON.stringify([preset.model]),
      priority: preset.priority,
      isActive: true,
      updatedAt: ts,
    }

    if (existing) {
      db.update(schema.aiServiceConfigs).set(values).where(eq(schema.aiServiceConfigs.id, existing.id)).run()
    } else {
      db.insert(schema.aiServiceConfigs).values({ ...values, createdAt: ts }).run()
    }
  }

  if (yunwuKey) {
    const textModel = process.env.YUNWU_TEXT_MODEL?.trim() || 'gpt-5.4'
    for (const agentType of AGENT_TYPES) {
      const [existing] = db.select().from(schema.agentConfigs)
        .where(eq(schema.agentConfigs.agentType, agentType))
        .all()
      // seed 只负责初始化：模型已配置（如界面里切到 agnes 免费模型）时不再覆盖
      if (existing && !String(existing.model || '').trim()) {
        db.update(schema.agentConfigs)
          .set({ model: textModel, updatedAt: ts })
          .where(eq(schema.agentConfigs.id, existing.id))
          .run()
      }
    }
  }
}
