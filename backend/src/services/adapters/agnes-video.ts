/**
 * Agnes 视频 Adapter（经 magpie 网关或 Agnes 官方 API，OpenAI 风格）
 * 创建: POST /v1/videos { model, prompt, mode, seconds, size, aspect_ratio, ... }
 * 轮询: GET  /v1/videos/{id} -> { status, progress, url, error }
 *
 * mode 映射（Agnes 官方约束）:
 *   text      — 纯文生视频，不允许带任何图片
 *   keyframe  — 首帧/尾帧控制（first_frame / last_frame）
 *   reference — 参考图模式（images，最多 5 张）
 */
import type {
  VideoProviderAdapter,
  ProviderRequest,
  AIConfig,
  VideoGenerationRecord,
  VideoGenResponse,
  VideoPollResponse,
} from './types'
import { joinProviderUrl } from './url'

const SUPPORTED_RATIOS = new Set(['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'])

export class AgnesVideoAdapter implements VideoProviderAdapter {
  provider = 'agnes'

  buildGenerateRequest(config: AIConfig, record: VideoGenerationRecord): ProviderRequest {
    const model = record.model || config.model || 'agnes-video-2.5-flash'

    // 画面不要任何字幕/文字（与其他适配器保持一致）
    const NO_SUBTITLE = '画面必须干净，不要出现任何字幕、文字、台词字幕、对白文字、标题文字、水印或 logo。'
    const promptText = `${(record.prompt || '').trim()}${record.prompt ? '\n' : ''}${NO_SUBTITLE}`

    const body: any = {
      model,
      prompt: promptText,
      seconds: String(this.normalizeDuration(record.duration)),
      size: '720P', // Agnes 仅支持 720P
      aspect_ratio: this.normalizeRatio(record.aspectRatio),
    }

    const refs = this.parseRefs(record.referenceImageUrls)

    if (record.referenceMode === 'first_last') {
      // 首尾帧关键帧模式
      body.mode = 'keyframe'
      if (record.firstFrameUrl) body.first_frame = record.firstFrameUrl
      if (record.lastFrameUrl) body.last_frame = record.lastFrameUrl
    } else if (record.referenceMode === 'single' && record.imageUrl) {
      // 单图参考：作为首帧走关键帧模式
      body.mode = 'keyframe'
      body.first_frame = record.imageUrl
    } else if (refs.length > 0) {
      // 多图参考模式（最多 5 张）
      body.mode = 'reference'
      body.images = refs.slice(0, 5)
    } else {
      body.mode = 'text'
    }

    // keyframe 模式必须至少有一帧
    if (body.mode === 'keyframe' && !body.first_frame && !body.last_frame) {
      body.mode = 'text'
      delete body.first_frame
      delete body.last_frame
    }

    return {
      url: joinProviderUrl(config.baseUrl, '/v1', '/videos'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body,
    }
  }

  parseGenerateResponse(result: any): VideoGenResponse {
    const taskId = result.id || result.video_id || result.task_id
    if (taskId) {
      return { isAsync: true, taskId }
    }
    if (result.url) {
      return { isAsync: false, videoUrl: result.url }
    }
    throw new Error(result.error?.message || 'No task id or video url in response')
  }

  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest {
    return {
      url: joinProviderUrl(config.baseUrl, '/v1', `/videos/${taskId}`),
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: undefined,
    }
  }

  parsePollResponse(result: any): VideoPollResponse {
    const status = result.status
    if (status === 'completed') {
      // magpie 网关把 URL 放在 metadata.url，Agnes 官方 API 在顶层 url
      const videoUrl = result.url || result.metadata?.url
      if (videoUrl) {
        return { status: 'completed', videoUrl }
      }
      return { status: 'failed', error: 'Video completed but no url returned' }
    }
    if (status === 'failed') {
      const err = result.error?.message || result.error || result.message
      return { status: 'failed', error: err || 'Video generation failed' }
    }
    return { status: 'processing' }
  }

  extractVideoUrl(result: any): string | null {
    return result.url || result.metadata?.url || result.video_url || null
  }

  private parseRefs(raw: string | null | undefined): string[] {
    if (!raw) return []
    try {
      const refs = JSON.parse(raw)
      return Array.isArray(refs) ? refs.filter(Boolean) : []
    } catch {
      return []
    }
  }

  private normalizeDuration(duration?: number | null): number {
    const parsed = Math.round(Number(duration || 5))
    if (!Number.isFinite(parsed)) return 5
    return Math.min(12, Math.max(4, parsed))
  }

  private normalizeRatio(ratio?: string | null): string {
    const value = String(ratio || '').trim()
    return SUPPORTED_RATIOS.has(value) ? value : '16:9'
  }
}
