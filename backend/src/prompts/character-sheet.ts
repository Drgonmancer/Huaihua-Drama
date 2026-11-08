/**
 * 角色形象提示词模板
 *
 * 目标产出：专业级角色三视图设定参考图（设计稿排版，左侧三视图 + 右侧细节与色卡）。
 * 供 routes/characters.ts 的单张生成与批量生成共用，避免两处硬编码不一致。
 */

interface CharacterPromptInput {
  name?: string | null
  role?: string | null
  appearance?: string | null
  description?: string | null
  personality?: string | null
}

/** 排版与画面规格：左右分区的设计稿布局 */
const SHEET_LAYOUT = [
  '生成专业级角色三视图设定参考图',
  '画面采用规范的设计稿排版，整体分为左右两大区域',
  '左侧为角色全身三视图，按正面、侧面、背面依次完整呈现',
  '右侧为角色细节信息展示，包括多角度面部特写、服装面料与纹理细节、配饰特写，以及标准化配色色卡',
].join('；')

/** 画质与一致性要求 */
const SHEET_QUALITY = [
  '需严格保持角色的五官特征、发型结构、服装款式、配饰与整体气质完全一致，不得擅自改动或再设计',
  '超写实质感，电影感柔和光影，细节清晰，高精度建模参考风格',
  '纯白背景，画面干净无杂物，构图平衡，信息排版专业规范',
  '适合作为角色设定集与美术参考图',
].join('；')

/**
 * 约束条件。
 * 注意：当前图片生成链路（GenerateImageParams / image_generations 表 / 各 provider adapter）
 * 均不支持 negative_prompt 字段，因此负面要求统一改写为正面约束追加在提示词末尾。
 * 待链路打通后可拆分为独立的 negativePrompt 传入。
 */
const SHEET_CONSTRAINTS = [
  '严格遵循上述角色设定，不得更改角色设定',
  '不得添加无关道具或背景',
  '不得使用夸张动作',
  '不得添加艺术化滤镜',
  '画面必须高清锐利，无模糊、无变形、无透视错误、无肢体错位、无重复五官、无多余人物',
].join('；')

function clean(value?: string | null): string {
  return (value || '').trim()
}

/** 拼装角色身份与造型描述，字段缺失时逐层降级兜底 */
function buildIdentity(char: CharacterPromptInput): string {
  const parts: string[] = []

  const name = clean(char.name)
  if (name) parts.push(`角色名：${name}`)

  const role = clean(char.role)
  if (role) parts.push(`身份定位：${role}`)

  const appearance = clean(char.appearance)
  const description = clean(char.description)
  const appearanceText = [appearance, description].filter(Boolean).join('；')
  if (appearanceText) {
    parts.push(`外貌与造型：${appearanceText}`)
  } else {
    // appearance / description 均为空时，避免提示词退化成「名字 + 人物立绘」，
    // 给出明确兜底指令，让模型至少产出风格统一的完整造型。
    parts.push('外貌与造型：资料中暂无详细描述，请根据角色名与身份定位设计一套特征明确、风格统一的造型，并严格沿用该造型贯穿三个视图')
  }

  const personality = clean(char.personality)
  if (personality) parts.push(`性格与气质：${personality}`)

  return parts.join('。')
}

/**
 * 构建角色三视图设定参考图的完整提示词
 */
export function buildCharacterSheetPrompt(char: CharacterPromptInput): string {
  return [buildIdentity(char), SHEET_LAYOUT, SHEET_QUALITY, SHEET_CONSTRAINTS].join('。')
}
