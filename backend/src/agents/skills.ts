import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SKILLS_DIR = path.resolve(__dirname, '../../../skills')
const AGENT_SKILL_MAP: Record<string, string[]> = {
  script_rewriter: ['script_rewriter'],
  extractor: ['extractor'],
  storyboard_breaker: ['storyboard_breaker'],
  voice_assigner: ['voice_assigner'],
  grid_prompt_generator: ['grid_prompt_generator'],
}

/** 额外内置规范文件（不暴露给前端，仅服务端注入 Agent 指令） */
const AGENT_SKILL_EXTRA_FILES: Record<string, string[]> = {
  script_rewriter: ['jimeng-workflow.md'],
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content.trim()
  const end = content.indexOf('\n---', 3)
  if (end === -1) return content.trim()
  return content.slice(end + 4).trim()
}

function readSkillFile(skillDir: string, filename: string, heading: string): string {
  const filePath = path.join(skillDir, filename)
  if (!fs.existsSync(filePath)) return ''

  const raw = fs.readFileSync(filePath, 'utf-8')
  const content = filename.endsWith('.md') && filename === 'SKILL.md'
    ? stripFrontmatter(raw)
    : raw.trim()
  if (!content) return ''

  return [
    heading,
    content,
  ].join('\n')
}

function readSkill(skillId: string): string {
  const skillDir = path.join(SKILLS_DIR, skillId)
  const main = readSkillFile(skillDir, 'SKILL.md', `## Skill: ${skillId}`)
  if (!main) return ''

  const extras = (AGENT_SKILL_EXTRA_FILES[skillId] || [])
    .map(filename => readSkillFile(skillDir, filename, `## 内置规范: ${filename}`))
    .filter(Boolean)

  return [main, ...extras].join('\n\n')
}

export function loadAgentSkills(agentType: string): string {
  const skillIds = AGENT_SKILL_MAP[agentType] || []
  const contents = skillIds
    .map(readSkill)
    .filter(Boolean)

  if (!contents.length) return ''

  return [
    '以下是该 Agent 专属的项目技能规范（SKILL.md）。',
    '不同 Agent 会加载不同 skill；你只需要遵守当前注入的这些技能。',
    '你必须在不违背当前工具边界的前提下优先遵守这些规范；若与用户明确要求冲突，以用户要求为准。',
    '',
    contents.join('\n\n'),
  ].join('\n')
}
