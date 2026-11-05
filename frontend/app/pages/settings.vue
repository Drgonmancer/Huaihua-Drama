<template>
  <div class="settings-shell">
  <div class="settings-layout">
    <aside class="settings-nav">
      <div class="nav-group">
        <div class="nav-group-label">{{ $t('settings.group.label') }}</div>
        <button v-for="t in tabs" :key="t.id" :class="['nav-item', { active: tab === t.id }]" @click="tab = t.id">
          <component :is="t.icon" :size="14" />
          {{ $t('settings.nav.' + t.id) }}
        </button>
      </div>

      <div class="lang-switch">
        <div class="lang-switch-label"><Languages :size="12" /> {{ $t('settings.language.title') }}</div>
        <div class="lang-switch-row">
          <button
            v-for="l in ['zh', 'en']"
            :key="l"
            :class="['chip', { active: locale === l }]"
            @click="setLocale(l)"
          >{{ $t('settings.language.' + l) }}</button>
        </div>
      </div>
    </aside>

    <div class="settings-content">

      <!-- ===== 服务接入 ===== -->
      <div v-if="tab === 'services'" class="settings-scroll">
        <div class="settings-head">
          <div class="settings-kicker">HUAIHUA STUDIO / SERVICE ACCESS</div>
          <h2 class="settings-title">{{ $t('settings.services.title') }}</h2>
          <p class="settings-desc">{{ $t('settings.services.desc') }}</p>
        </div>

        <!-- 快捷配置 -->
        <div class="card preset-card">
          <div class="preset-head">
            <div class="preset-icon"><Zap :size="18" /></div>
            <div style="flex:1;min-width:0">
              <div class="preset-title">{{ $t('settings.preset.title') }}</div>
              <div class="preset-desc">{{ $t('settings.preset.desc') }}</div>
            </div>
          </div>
          <div class="preset-form">
            <input
              v-model="presetKey"
              class="input mono"
              type="password"
              autocomplete="off"
              :placeholder="$t('settings.preset.keyPlaceholder')"
              @keyup.enter="applyPreset"
            />
            <button class="btn btn-primary btn-sm" :disabled="presetBusy || !presetKey.trim()" @click="applyPreset">
              <Loader2 v-if="presetBusy" :size="12" class="animate-spin" />
              {{ $t('settings.preset.apply') }}
            </button>
          </div>
        </div>

        <!-- 列表工具栏 -->
        <div class="list-toolbar">
          <div class="chip-row">
            <button
              v-for="f in serviceFilters"
              :key="f.value"
              :class="['chip', { active: configFilter === f.value }]"
              @click="configFilter = f.value"
            >{{ f.label }}</button>
          </div>
          <button class="btn btn-ghost btn-sm" @click="startAddConfig">
            <Plus :size="13" /> {{ $t('settings.actions.add') }}
          </button>
        </div>

        <!-- 服务配置列表 -->
        <div class="agent-list">
          <div v-for="cfg in filteredConfigs" :key="cfg.id" class="card agent-card">
            <div class="agent-card-head" @click="toggleConfigEdit(cfg.id)">
              <span class="svc-type-badge" :data-type="cfg.service_type">{{ serviceTypeLabel(cfg.service_type) }}</span>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:14px">{{ cfg.name }}</div>
                <div class="dim" style="font-size:11px;overflow-wrap:anywhere">{{ cfg.provider }} · {{ cfg.base_url || $t('settings.services.noBaseUrl') }}</div>
              </div>
              <span v-if="testResults[cfg.id]?.ok" class="tag tag-success"><Check :size="10" /> {{ $t('settings.status.connected') }}</span>
              <span v-else-if="testResults[cfg.id]" class="tag tag-danger">{{ $t('settings.status.testFailed') }}</span>
              <span v-if="cfg.is_active" class="tag tag-active">{{ $t('settings.status.enabled') }}</span>
              <ChevronDown :size="14" :style="{ transform: editingConfig === cfg.id ? 'rotate(180deg)' : '', transition: '0.2s' }" />
            </div>
            <div v-if="editingConfig === cfg.id" class="agent-card-body">
              <div class="field-row">
                <label class="field">
                  <span class="field-label">{{ $t('settings.field.name') }}</span>
                  <input v-model="configForm.name" class="input" />
                </label>
                <label class="field">
                  <span class="field-label">{{ $t('settings.field.provider') }}</span>
                  <select v-model="configForm.provider" class="input">
                    <option v-for="p in providerOptions" :key="p" :value="p">{{ p }}</option>
                  </select>
                </label>
              </div>
              <label class="field">
                <span class="field-label">Base URL</span>
                <input v-model="configForm.base_url" class="input mono" placeholder="https://api.chatfire.site" />
              </label>
              <label class="field">
                <span class="field-label">API Key</span>
                <input
                  v-model="configForm.api_key"
                  class="input mono"
                  type="password"
                  autocomplete="off"
                  :placeholder="cfg.api_key ? $t('settings.field.apiKeySet') : 'sk-...'"
                />
              </label>
              <label class="field">
                <span class="field-label">{{ $t('settings.field.models') }} <span class="dim">{{ $t('settings.field.modelsHint') }}</span></span>
                <textarea v-model="configForm.models" class="textarea mono" rows="3" placeholder="gemini-3-pro-preview" />
              </label>
              <div class="field-row">
                <label class="field">
                  <span class="field-label">{{ $t('settings.field.priority') }}</span>
                  <input v-model.number="configForm.priority" class="input" type="number" />
                </label>
                <label class="field">
                  <span class="field-label">{{ $t('settings.field.status') }}</span>
                  <label class="switch-row">
                    <input v-model="configForm.is_active" type="checkbox" />
                    <span>{{ configForm.is_active ? $t('settings.status.enabled') : $t('settings.status.disabled') }}</span>
                  </label>
                </label>
              </div>

              <!-- 测试结果 -->
              <div v-if="testResults[cfg.id]" class="test-result" :class="testResults[cfg.id].ok ? 'is-ok' : 'is-bad'">
                <div class="test-result-head">
                  <span class="test-dot" />
                  <strong>HTTP {{ testResults[cfg.id].status || '—' }}</strong>
                  <span>{{ testResults[cfg.id].message }}</span>
                </div>
                <details v-if="testResults[cfg.id].response_preview" class="test-preview">
                  <summary>{{ $t('settings.test.responsePreview') }}</summary>
                  <pre class="mono">{{ testResults[cfg.id].response_preview }}</pre>
                </details>
              </div>

              <div class="agent-card-foot">
                <button class="btn btn-ghost btn-sm test-danger-btn" @click="deleteConfig(cfg)">{{ $t('settings.actions.delete') }}</button>
                <button class="btn btn-ghost btn-sm ml-auto" :disabled="configTesting" @click="testConfig(cfg)">
                  <Loader2 v-if="configTesting" :size="12" class="animate-spin" />
                  <Activity v-else :size="12" />
                  {{ $t('settings.actions.test') }}
                </button>
                <button class="btn btn-primary btn-sm" :disabled="configSaving" @click="saveConfig(cfg)">
                  <Loader2 v-if="configSaving" :size="12" class="animate-spin" />
                  {{ $t('settings.actions.save') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="!filteredConfigs.length" class="step-empty" style="padding:48px 24px">
            <div class="empty-visual"><Plug :size="28" /></div>
            <div class="empty-title">{{ $t('settings.services.emptyTitle') }}</div>
            <div class="empty-desc">{{ $t('settings.services.emptyDesc') }}</div>
          </div>
        </div>
      </div>

      <!-- ===== Agent 配置 ===== -->
      <div v-else-if="tab === 'agents'" class="settings-scroll">
        <div class="settings-head">
          <div class="settings-kicker">HUAIHUA STUDIO / PREFERENCES</div>
          <h2 class="settings-title">{{ $t('settings.agents.title') }}</h2>
          <p class="settings-desc">{{ $t('settings.agents.desc') }}</p>
        </div>
        <div class="agent-list">
          <div v-for="a in agentDefs" :key="a.type" class="card agent-card">
            <div class="agent-card-head" @click="toggleAgentEdit(a.type)">
              <div class="agent-type-badge">{{ a.icon }}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:14px">{{ a.label }}</div>
              </div>
              <span v-if="getAgentCfg(a.type)" class="tag tag-success">{{ $t('settings.status.configured') }}</span>
              <span v-else class="tag">{{ $t('settings.status.default') }}</span>
              <ChevronDown :size="14" :style="{ transform: editingAgent === a.type ? 'rotate(180deg)' : '', transition: '0.2s' }" />
            </div>
            <div v-if="editingAgent === a.type" class="agent-card-body">
              <div class="field-row">
                <label class="field">
                  <span class="field-label">Temperature</span>
                  <input v-model.number="agentForm.temperature" class="input" type="number" min="0" max="2" step="0.1" />
                </label>
                <label class="field">
                  <span class="field-label">Max Tokens</span>
                  <input v-model.number="agentForm.max_tokens" class="input" type="number" min="100" max="32000" />
                </label>
              </div>
              <label class="field">
                <span class="field-label">System Prompt</span>
                <textarea v-model="agentForm.system_prompt" class="textarea" rows="12" :placeholder="$t('settings.agents.promptPlaceholder')" />
              </label>
              <div class="agent-card-foot">
                <button class="btn btn-ghost btn-sm" @click="resetAgentPrompt(a.type)">{{ $t('settings.actions.resetPrompt') }}</button>
                <span v-if="agentSaved === a.type" class="tag tag-success" style="margin-left:8px">
                  <Check :size="10" /> {{ $t('settings.status.saved') }}
                </span>
                <button class="btn btn-primary btn-sm ml-auto" :disabled="agentSaving" @click="saveAgentCfg(a.type)">
                  <Loader2 v-if="agentSaving" :size="12" class="animate-spin" />
                  {{ $t('settings.actions.save') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Skills 编辑 ===== -->
      <div v-else-if="tab === 'skills'" class="skills-layout">
        <!-- Agent 左侧列表 -->
        <aside class="skills-agent-list">
          <div class="skills-agent-title">{{ $t('settings.skills.agentList') }}</div>
          <button
            v-for="a in agentDefs"
            :key="a.type"
            :class="['skills-agent-item', { active: selectedAgent === a.type }]"
            @click="selectAgent(a.type)"
          >
            <span class="agent-type-badge">{{ a.icon }}</span>
            <span class="skills-agent-label">{{ a.label }}</span>
            <span v-if="agentSkillCount(a.type) > 0" class="skill-count-badge">{{ agentSkillCount(a.type) }}</span>
          </button>
        </aside>

        <!-- Skill 管理右侧主区域 -->
        <div class="settings-scroll skills-main">
          <div class="settings-head">
            <div class="settings-kicker">HUAIHUA STUDIO / PREFERENCES</div>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="agent-type-badge" style="width:32px;height:32px;font-size:16px">{{ selectedAgentIcon }}</span>
              <div>
                <h2 class="settings-title" style="margin:0">{{ selectedAgentLabel }}</h2>
                <div class="dim" style="font-size:12px">{{ selectedAgentType }} — Skills</div>
              </div>
            </div>
            <p class="settings-desc" style="margin-top:10px">{{ $t('settings.skills.desc') }}</p>
            <button class="btn btn-primary btn-sm" @click="startAddSkill">
              <Plus :size="13" /> {{ $t('settings.skills.add') }}
            </button>
          </div>

          <!-- 无 skill 提示 -->
          <div v-if="!currentSkills.length" class="step-empty" style="padding:48px 24px">
            <div class="empty-visual">
              <FileText :size="28" />
            </div>
            <div class="empty-title">{{ $t('settings.skills.emptyTitle') }}</div>
            <div class="empty-desc">{{ $t('settings.skills.emptyDesc') }}</div>
          </div>

          <!-- Skill 列表 -->
          <div class="skill-list" v-else>
            <div v-for="s in currentSkills" :key="s.id" class="card skill-card">
              <div class="skill-card-head" @click="toggleSkillEdit(s.id)">
                <FileText :size="14" style="color:var(--accent);flex-shrink:0" />
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px">{{ s.name }}</div>
                  <div class="dim" style="font-size:11px">{{ s.description }}</div>
                </div>
                <button class="btn btn-ghost btn-icon" style="margin-right:4px" @click.stop="deleteSkill(s.id)">
                  <Trash2 :size="13" />
                </button>
                <ChevronDown :size="14" :style="{ transform: editingSkill === s.id ? 'rotate(180deg)' : '', transition: '0.2s' }" />
              </div>
              <div v-if="editingSkill === s.id" class="skill-card-body">
                <textarea
                  v-model="skillContent"
                  class="textarea mono"
                  rows="20"
                  style="font-size:12px;line-height:1.6"
                  :placeholder="$t('settings.skills.contentPlaceholder')"
                />
                <div class="skill-card-foot">
                  <span class="dim" style="font-size:11px">skills/{{ selectedAgentType }}/{{ s.id }}/SKILL.md</span>
                  <span v-if="skillSaved === s.id" class="tag tag-success" style="margin-left:8px">
                    <Check :size="10" /> {{ $t('settings.status.saved') }}
                  </span>
                  <button class="btn btn-primary btn-sm ml-auto" :disabled="skillSaving" @click="saveSkill(s.id)">
                    <Loader2 v-if="skillSaving" :size="12" class="animate-spin" />
                    {{ $t('settings.actions.save') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 数据备份 ===== -->
      <div v-else-if="tab === 'backups'" class="settings-scroll">
        <div class="settings-head">
          <div class="settings-kicker">HUAIHUA STUDIO / DATA & BACKUP</div>
          <h2 class="settings-title">{{ $t('settings.backups.title') }}</h2>
          <p class="settings-desc">{{ $t('settings.backups.desc') }}</p>
        </div>

        <div class="card preset-card">
          <div class="preset-head">
            <div class="preset-icon"><Database :size="18" /></div>
            <div style="flex:1;min-width:0">
              <div class="preset-title">{{ $t('settings.backups.cardTitle') }}</div>
              <div class="preset-desc">{{ $t('settings.backups.cardDesc') }}</div>
            </div>
            <button class="btn btn-primary btn-sm" :disabled="backupCreating" @click="createBackup">
              <Loader2 v-if="backupCreating" :size="12" class="animate-spin" />
              <Database v-else :size="12" />
              {{ $t('settings.backups.create') }}
            </button>
          </div>
        </div>

        <div class="agent-list">
          <div v-for="b in backups" :key="b.filename" class="card backup-row">
            <span class="svc-type-badge" :data-type="backupReasonType(b.reason)">{{ backupReasonLabel(b.reason) }}</span>
            <div style="flex:1;min-width:0">
              <div class="mono" style="font-size:12.5px;overflow-wrap:anywhere">{{ b.filename }}</div>
              <div class="dim" style="font-size:11px">{{ formatBackupTime(b.created_at) }} · {{ formatSize(b.size) }}</div>
            </div>
            <a class="btn btn-ghost btn-sm" :href="backupDownloadUrl(b.filename)">
              <Download :size="12" /> {{ $t('settings.actions.download') }}
            </a>
          </div>

          <div v-if="!backups.length" class="step-empty" style="padding:48px 24px">
            <div class="empty-visual"><Database :size="28" /></div>
            <div class="empty-title">{{ $t('settings.backups.emptyTitle') }}</div>
            <div class="empty-desc">{{ $t('settings.backups.emptyDesc') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增 Skill 弹窗 -->
    <Teleport to="body">
    <div v-if="addSkillDialog" class="overlay" @click.self="addSkillDialog = false">
      <form class="modal card" role="dialog" aria-modal="true" aria-labelledby="skill-dialog-title" @submit.prevent="confirmAddSkill">
        <div class="settings-kicker">HUAIHUA STUDIO / NEW SKILL</div>
        <h2 id="skill-dialog-title" class="modal-title">{{ $t('settings.skills.addTitle', { name: selectedAgentLabel }) }}</h2>
        <label class="field">
          <span class="field-label">{{ $t('settings.skills.dirName') }} <span class="dim">{{ $t('settings.skills.dirNameHint') }}</span></span>
          <input v-model="newSkillForm.id" class="input" :placeholder="$t('settings.skills.dirPlaceholder')" />
        </label>
        <label class="field">
          <span class="field-label">{{ $t('settings.field.name') }}</span>
          <input v-model="newSkillForm.name" class="input" :placeholder="$t('settings.skills.namePlaceholder')" />
        </label>
        <label class="field">
          <span class="field-label">{{ $t('settings.field.description') }}</span>
          <input v-model="newSkillForm.description" class="input" :placeholder="$t('settings.skills.descPlaceholder')" />
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" @click="addSkillDialog = false">{{ $t('settings.actions.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="!newSkillForm.id">{{ $t('settings.actions.create') }}</button>
        </div>
      </form>
    </div>
    </Teleport>

    <!-- 新增服务配置弹窗 -->
    <Teleport to="body">
    <div v-if="addConfigDialog" class="overlay" @click.self="addConfigDialog = false">
      <form class="modal card" role="dialog" aria-modal="true" aria-labelledby="svc-dialog-title" @submit.prevent="confirmAddConfig">
        <div class="settings-kicker">HUAIHUA STUDIO / NEW SERVICE</div>
        <h2 id="svc-dialog-title" class="modal-title">{{ $t('settings.services.addTitle') }}</h2>
        <div class="field-row">
          <label class="field">
            <span class="field-label">{{ $t('settings.field.serviceType') }}</span>
            <select v-model="newConfigForm.service_type" class="input">
              <option v-for="t in SERVICE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">{{ $t('settings.field.provider') }}</span>
            <select v-model="newConfigForm.provider" class="input">
              <option v-for="p in newConfigProviderOptions" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
        </div>
        <label class="field">
          <span class="field-label">{{ $t('settings.field.name') }} <span class="dim">{{ $t('settings.field.nameHint') }}</span></span>
          <input v-model="newConfigForm.name" class="input" :placeholder="$t('settings.services.namePlaceholder')" />
        </label>
        <label class="field">
          <span class="field-label">Base URL</span>
          <input v-model="newConfigForm.base_url" class="input mono" :placeholder="newConfigBaseUrl" />
        </label>
        <label class="field">
          <span class="field-label">API Key</span>
          <input v-model="newConfigForm.api_key" class="input mono" type="password" autocomplete="off" placeholder="sk-..." />
        </label>
        <label class="field">
          <span class="field-label">{{ $t('settings.field.models') }} <span class="dim">{{ $t('settings.field.modelsHint') }}</span></span>
          <textarea v-model="newConfigForm.models" class="textarea mono" rows="3" />
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" @click="addConfigDialog = false">{{ $t('settings.actions.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="configSaving || !newConfigForm.base_url">
            <Loader2 v-if="configSaving" :size="12" class="animate-spin" />
            {{ $t('settings.actions.createAndSave') }}
          </button>
        </div>
      </form>
    </div>
    </Teleport>
  </div>
  </div>
</template>

<script setup>
import { Plus, Trash2, FileText, ChevronDown, Check, Loader2, Bot, Plug, Zap, Activity, Database, Download, Languages } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { agentConfigAPI, skillsAPI, aiConfigAPI, backupAPI, backupDownloadUrl } from '~/composables/useApi'

const { t, locale, setLocale } = useLocale()

const tab = ref('services')
const tabs = [
  { id: 'services', icon: Plug },
  { id: 'agents', icon: Bot },
  { id: 'skills', icon: FileText },
  { id: 'backups', icon: Database },
]

// ===== 服务接入 =====
const SERVICE_TYPES = computed(() => [
  { value: 'text', label: t('settings.svcType.text') },
  { value: 'image', label: t('settings.svcType.image') },
  { value: 'video', label: t('settings.svcType.video') },
  { value: 'audio', label: t('settings.svcType.audio') },
])
const PROVIDER_BASE_URLS = {
  chatfire: 'https://api.chatfire.site',
  openai: 'https://api.openai.com',
  openrouter: 'https://openrouter.ai/api',
  gemini: 'https://generativelanguage.googleapis.com',
  ali: 'https://dashscope.aliyuncs.com',
  volcengine: 'https://ark.cn-beijing.volces.com',
  minimax: 'https://api.minimaxi.com',
  vidu: 'https://api.vidu.com',
}
const PROVIDER_OPTIONS = {
  text: ['chatfire', 'openai', 'openrouter', 'gemini'],
  image: ['chatfire', 'openai', 'gemini', 'ali', 'volcengine', 'minimax'],
  video: ['chatfire', 'ali', 'volcengine', 'minimax', 'vidu'],
  audio: ['chatfire', 'minimax'],
}

const serviceConfigs = ref([])
const serviceFilters = computed(() => [
  { value: 'all', label: t('settings.svcType.all') },
  ...SERVICE_TYPES.value.map(x => ({ value: x.value, label: x.label })),
])
const configFilter = ref('all')
const editingConfig = ref(null)
const configForm = reactive({ name: '', provider: 'chatfire', service_type: 'text', base_url: '', api_key: '', models: '', priority: 0, is_active: true })
const configSaving = ref(false)
const configTesting = ref(false)
const testResults = ref({})
const presetKey = ref('')
const presetBusy = ref(false)
const addConfigDialog = ref(false)
const newConfigForm = reactive({ service_type: 'text', provider: 'chatfire', name: '', base_url: '', api_key: '', models: '' })

const filteredConfigs = computed(() =>
  serviceConfigs.value.filter(c => configFilter.value === 'all' || c.service_type === configFilter.value)
)
const providerOptions = computed(() => PROVIDER_OPTIONS[configForm.service_type] || [])
const newConfigProviderOptions = computed(() => PROVIDER_OPTIONS[newConfigForm.service_type] || [])
const newConfigBaseUrl = computed(() => PROVIDER_BASE_URLS[newConfigForm.provider] || '')

function serviceTypeLabel(type) {
  return SERVICE_TYPES.value.find(x => x.value === type)?.label || type
}

function parseModels(text) {
  return text.split(/[\n,，]/).map(s => s.trim()).filter(Boolean)
}

async function loadServiceConfigs() {
  try { serviceConfigs.value = await aiConfigAPI.list(undefined, 'admin') }
  catch (e) { toast.error(e.message) }
}

async function applyPreset() {
  const key = presetKey.value.trim()
  if (!key) return
  presetBusy.value = true
  try {
    await aiConfigAPI.preset(key)
    await Promise.all([loadServiceConfigs(), loadAgents()])
    presetKey.value = ''
    toast.success(t('settings.toast.presetApplied'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    presetBusy.value = false
  }
}

function toggleConfigEdit(id) {
  if (editingConfig.value === id) { editingConfig.value = null; return }
  const cfg = serviceConfigs.value.find(c => c.id === id)
  if (!cfg) return
  configForm.name = cfg.name
  configForm.provider = cfg.provider
  configForm.service_type = cfg.service_type
  configForm.base_url = cfg.base_url
  configForm.api_key = ''
  configForm.models = (cfg.model || []).join('\n')
  configForm.priority = cfg.priority ?? 0
  configForm.is_active = !!cfg.is_active
  editingConfig.value = id
}

// provider 切换时自动补全默认 Base URL（已填自定义值则不动）
watch(() => configForm.provider, (p) => {
  const d = PROVIDER_BASE_URLS[p]
  if (!d) return
  if (!configForm.base_url || Object.values(PROVIDER_BASE_URLS).includes(configForm.base_url)) {
    configForm.base_url = d
  }
})
watch(() => newConfigForm.provider, (p) => {
  const d = PROVIDER_BASE_URLS[p]
  if (!d) return
  if (!newConfigForm.base_url || Object.values(PROVIDER_BASE_URLS).includes(newConfigForm.base_url)) {
    newConfigForm.base_url = d
  }
})

async function saveConfig(cfg) {
  configSaving.value = true
  try {
    const payload = {
      name: configForm.name,
      provider: configForm.provider,
      base_url: configForm.base_url,
      model: parseModels(configForm.models),
      priority: configForm.priority,
      is_active: configForm.is_active,
    }
    if (configForm.api_key.trim()) payload.api_key = configForm.api_key.trim()
    await aiConfigAPI.update(cfg.id, payload)
    await loadServiceConfigs()
    toast.success(t('settings.toast.configSaved'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    configSaving.value = false
  }
}

async function testConfig(cfg) {
  configTesting.value = true
  try {
    const payload = {
      id: cfg.id,
      service_type: configForm.service_type,
      provider: configForm.provider,
      base_url: configForm.base_url,
      model: parseModels(configForm.models)[0] || undefined,
    }
    if (configForm.api_key.trim()) payload.api_key = configForm.api_key.trim()
    const res = await aiConfigAPI.test(payload)
    testResults.value = { ...testResults.value, [cfg.id]: res }
    if (res.ok) toast.success(t('settings.test.passed', { msg: res.message }))
    else toast.error(t('settings.test.failed', { msg: res.message }))
  } catch (e) {
    testResults.value = { ...testResults.value, [cfg.id]: { ok: false, status: 0, message: e.message, response_preview: '' } }
    toast.error(e.message)
  } finally {
    configTesting.value = false
  }
}

async function deleteConfig(cfg) {
  if (!confirm(t('settings.confirm.deleteService', { name: cfg.name }))) return
  try {
    await aiConfigAPI.del(cfg.id)
    if (editingConfig.value === cfg.id) editingConfig.value = null
    await loadServiceConfigs()
    toast.success(t('settings.toast.deleted'))
  } catch (e) {
    toast.error(e.message)
  }
}

function startAddConfig() {
  newConfigForm.service_type = 'text'
  newConfigForm.provider = 'chatfire'
  newConfigForm.name = ''
  newConfigForm.base_url = PROVIDER_BASE_URLS['chatfire']
  newConfigForm.api_key = ''
  newConfigForm.models = ''
  addConfigDialog.value = true
}

async function confirmAddConfig() {
  configSaving.value = true
  try {
    await aiConfigAPI.create({
      service_type: newConfigForm.service_type,
      provider: newConfigForm.provider,
      name: newConfigForm.name || `${newConfigForm.provider}-${newConfigForm.service_type}`,
      base_url: newConfigForm.base_url,
      api_key: newConfigForm.api_key.trim(),
      model: parseModels(newConfigForm.models),
      priority: 0,
    })
    addConfigDialog.value = false
    await loadServiceConfigs()
    toast.success(t('settings.toast.configCreated'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    configSaving.value = false
  }
}

// ===== Agent Configs =====
const agentCfgs = ref([])
const editingAgent = ref(null)
const agentSaving = ref(false)
const agentSaved = ref(null)
const agentForm = reactive({ temperature: 0.7, max_tokens: 4096, system_prompt: '' })

const agentDefs = computed(() => [
  { type: 'script_rewriter', label: t('settings.agent.script_rewriter'), icon: '📝' },
  { type: 'extractor', label: t('settings.agent.extractor'), icon: '🔍' },
  { type: 'storyboard_breaker', label: t('settings.agent.storyboard_breaker'), icon: '🎬' },
  { type: 'voice_assigner', label: t('settings.agent.voice_assigner'), icon: '🎙' },
  { type: 'grid_prompt_generator', label: t('settings.agent.grid_prompt_generator'), icon: '🖼' },
])

const defaultPrompts = {
  script_rewriter: `你是短剧内容转译专家，负责把任意输入改写成符合短剧规律、适合后续即梦视频生成的格式化剧本。

工作流程：
1. 调用 read_episode_script 读取原始内容
2. 严格按内置技能规范执行阶段一（理解输入）和阶段二（短剧化编剧）
3. 输出格式化剧本并调用 save_script 保存

格式化剧本格式：
- 场景头：## S编号 | 内景/外景 · 地点 | 时间段
- 动作描写：自然段落，只写可见事实，不包含镜头语言
- 对白：角色名：（可见状态/表情）台词内容
- 每个场景 30-60 秒，内含至少一个明确剧情动作`,
  extractor: `你是制片助理，擅长从剧本中提取角色和场景信息，并在提取时与项目已有数据进行智能去重。

工作流程：
1. 调用 read_script_for_extraction 读取格式化剧本
2. 调用 read_existing_characters 读取项目中已存在的角色列表（用于去重）
3. 调用 read_existing_scenes 读取项目中已存在的场景列表（用于去重）
4. 分析剧本内容，提取所有角色信息
5. 对每个角色：若同名已存在则合并更新，若不存在则新增
6. 调用 save_dedup_characters 保存角色（去重合并，自动处理新增和更新）
7. 分析剧本内容，提取所有场景信息
8. 对每个场景：若同地点+时间段已存在则复用，若不存在则新增
9. 调用 save_dedup_scenes 保存场景（去重合并，自动处理新增和复用）

去重规则：
- 角色：按名字精确匹配，同名保留现有（合并信息）
- 场景：按【地点+时间段】精确匹配；同地点不同时段视为新场景

提取要求：
- 角色要包含完整的外貌特征描述（发型、服装、体态等）
- 场景要包含光线、色调、氛围等视觉信息
- 不要遗漏任何有台词或重要动作的角色`,
  storyboard_breaker: `你是资深影视分镜师，擅长将剧本拆解为分镜方案。

工作流程：
1. 调用 read_storyboard_context 读取剧本、角色列表、场景列表
2. 将剧本拆解为镜头序列（每个镜头 10-15 秒）
3. 为每个镜头生成视频提示词（video_prompt）
4. 调用 save_storyboards 保存所有分镜`,
  voice_assigner: `你是配音导演，擅长为角色选择合适的音色。

工作流程：
1. 调用 list_voices 获取可用音色列表
2. 调用 get_characters 获取所有角色信息
3. 根据每个角色的性别、性格、年龄、角色定位，选择最匹配的音色
4. 对每个角色调用 assign_voice 分配音色，并说明选择理由

注意：每个角色都必须分配音色，不要遗漏。`,
  grid_prompt_generator: `你是专业的 AI 图像提示词工程师，擅长为角色、场景和宫格图生成高质量的英文提示词。

你将收到用户的请求，告知要生成哪种类型的提示词：
- "角色" → 生成角色图片提示词
- "场景" → 生成场景图片提示词
- "宫格" → 生成宫格图提示词

## 角色图片提示词

工作流程：
1. 调用 read_characters 读取所有角色信息
2. 根据角色外貌特征（appearance）、性格（personality）、定位（role）生成英文提示词
3. 提示词结构：[外貌描述]，[性格/气质]，[角色定位]，[电影感]，[高质量]，[无文字水印]

## 场景图片提示词

工作流程：
1. 调用 read_scenes 读取所有场景信息
2. 根据场景地点（location）、时间段（time）、已有描述（prompt）生成英文提示词
3. 提示词结构：[地点]，[时间/光线/氛围]，[已有描述]，[电影感场景]，[高质量]，[无文字水印]

## 宫格图提示词（参考 skills/grid-image-generator/SKILL.md）

工作流程：
1. 调用 read_shots_for_grid 读取选中镜头的详细信息
2. 根据 mode 调用 generate_grid_prompt：
   - first_frame 模式：每格=一个镜头的首帧，NxN 风格统一
   - first_last 模式：每个镜头占2格（左首右尾），同一行风格连续
   - multi_ref 模式：所有格子都是同一镜头的不同参考角度
3. 返回 grid_prompt（整体提示词）和 cell_prompts（每格提示词）

提示词规范：
- 使用英文提示词
- 必须包含 "consistent art style" 保持风格统一
- 必须包含 "cinematic quality"
- 避免出现文字或水印`,
}

function getAgentCfg(type) {
  return agentCfgs.value.find(a => a.agent_type === type)
}

async function loadAgents() {
  try { agentCfgs.value = await agentConfigAPI.list() }
  catch (e) { toast.error(e.message) }
}

function toggleAgentEdit(type) {
  if (editingAgent.value === type) { editingAgent.value = null; return }
  const cfg = getAgentCfg(type)
  agentForm.temperature = cfg?.temperature ?? 0.7
  agentForm.max_tokens = cfg?.max_tokens ?? 4096
  agentForm.system_prompt = cfg?.system_prompt || defaultPrompts[type] || ''
  agentSaved.value = null
  editingAgent.value = type
}

function resetAgentPrompt(type) {
  agentForm.system_prompt = defaultPrompts[type] || ''
  toast.info(t('settings.toast.promptReset'))
}

async function saveAgentCfg(type) {
  agentSaving.value = true
  agentSaved.value = null
  try {
    const existing = getAgentCfg(type)
    const data = {
      agent_type: type,
      name: agentDefs.value.find(a => a.type === type)?.label || type,
      model: existing?.model || '',
      temperature: agentForm.temperature,
      max_tokens: agentForm.max_tokens,
      system_prompt: agentForm.system_prompt,
    }
    if (existing) {
      await agentConfigAPI.update(existing.id, data)
    } else {
      await agentConfigAPI.create(data)
    }
    await loadAgents()
    agentSaved.value = type
    toast.success(t('settings.toast.agentSaved', { name: agentDefs.value.find(a => a.type === type)?.label || type }))
    setTimeout(() => { if (agentSaved.value === type) agentSaved.value = null }, 3000)
  } catch (e) {
    toast.error(e.message)
  } finally {
    agentSaving.value = false
  }
}

// ===== Skills =====
const selectedAgent = ref('script_rewriter')
const allSkills = ref([])   // { id, name, description }[]
const editingSkill = ref(null)
const skillContent = ref('')
const skillSaving = ref(false)
const skillSaved = ref(null)
const addSkillDialog = ref(false)
const newSkillForm = reactive({ id: '', name: '', description: '' })

const selectedAgentType = computed(() => selectedAgent.value)
const selectedAgentLabel = computed(() => agentDefs.value.find(a => a.type === selectedAgent.value)?.label || '')
const selectedAgentIcon = computed(() => agentDefs.value.find(a => a.type === selectedAgent.value)?.icon || '')

function agentSkillCount(type) {
  return allSkills.value.filter(s => s.id === type || s.id.startsWith(type + '/')).length
}

const currentSkills = computed(() =>
  allSkills.value.filter(s => s.id === selectedAgent.value || s.id.startsWith(selectedAgent.value + '/'))
)

async function loadAllSkills() {
  try { allSkills.value = await skillsAPI.list() }
  catch (e) { toast.error(e.message) }
}

async function selectAgent(type) {
  selectedAgent.value = type
  editingSkill.value = null
}

function startAddSkill() {
  newSkillForm.id = ''
  newSkillForm.name = ''
  newSkillForm.description = ''
  addSkillDialog.value = true
}

async function confirmAddSkill() {
  if (!newSkillForm.id) return
  const skillId = `${selectedAgent.value}/${newSkillForm.id}`
  try {
    await skillsAPI.create({ id: skillId, name: newSkillForm.name, description: newSkillForm.description })
    addSkillDialog.value = false
    await loadAllSkills()
    toast.success(t('settings.toast.skillCreated'))
  } catch (e) {
    toast.error(e.message)
  }
}

async function deleteSkill(id) {
  if (!confirm(t('settings.confirm.deleteSkill', { id }))) return
  try {
    await skillsAPI.del(id)
    if (editingSkill.value === id) editingSkill.value = null
    await loadAllSkills()
    toast.success(t('settings.toast.deleted'))
  } catch (e) {
    toast.error(e.message)
  }
}

async function toggleSkillEdit(id) {
  if (editingSkill.value === id) { editingSkill.value = null; return }
  try {
    const res = await skillsAPI.get(id)
    skillContent.value = res.content
    skillSaved.value = null
    editingSkill.value = id
  } catch (e) { toast.error(e.message) }
}

async function saveSkill(id) {
  skillSaving.value = true
  skillSaved.value = null
  try {
    await skillsAPI.update(id, skillContent.value)
    await loadAllSkills()
    skillSaved.value = id
    toast.success(t('settings.toast.saved'))
    setTimeout(() => { if (skillSaved.value === id) skillSaved.value = null }, 3000)
  } catch (e) {
    toast.error(e.message)
  } finally {
    skillSaving.value = false
  }
}

// ===== 数据备份 =====
const backups = ref([])
const backupCreating = ref(false)

async function loadBackups() {
  try { backups.value = await backupAPI.list() }
  catch (e) { toast.error(e.message) }
}

async function createBackup() {
  backupCreating.value = true
  try {
    await backupAPI.create()
    await loadBackups()
    toast.success(t('settings.toast.backupDone'))
  } catch (e) {
    toast.error(e.message)
  } finally {
    backupCreating.value = false
  }
}

function backupReasonLabel(reason) {
  return {
    startup: t('settings.backupReason.startup'),
    schedule: t('settings.backupReason.schedule'),
    'pre-migrate': t('settings.backupReason.pre-migrate'),
    manual: t('settings.backupReason.manual'),
  }[reason] || reason
}
function backupReasonType(reason) {
  return { startup: 'text', schedule: 'video', 'pre-migrate': 'image', manual: 'audio' }[reason] || 'text'
}
function formatBackupTime(iso) {
  const d = new Date(iso)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

onMounted(() => { loadServiceConfigs(); loadAgents(); loadAllSkills(); loadBackups() })
</script>

<style scoped>
.settings-shell {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--text-0);
  background: var(--page-background);
}
.settings-layout { display: flex; flex: 1; min-height: 0; min-width: 0; }

.settings-nav {
  width: 204px; flex-shrink: 0; padding: 24px 12px; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 14px; background: var(--bg-surface);
}
.nav-group { display: flex; flex-direction: column; gap: 6px; }
.nav-group-label {
  font-size: 10px; font-weight: 700; color: var(--text-3);
  letter-spacing: 0.12em; text-transform: uppercase; padding: 0 12px 10px;
}
.nav-item {
  display: flex; align-items: center; gap: 8px; padding: 12px; font-size: 13px;
  border: 1px solid transparent; background: none; color: var(--text-2); cursor: pointer;
  border-radius: 12px; transition: background 0.18s, color 0.18s, border-color 0.18s; text-align: left; width: 100%;
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-0); }
.nav-item.active { background: var(--cyan-bg); color: var(--cyan); border-color: rgba(0,240,255,0.25); font-weight: 600; }
.nav-item:focus-visible, .skills-agent-item:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }

.settings-content { flex: 1; min-width: 0; min-height: 0; overflow: hidden; }
.settings-scroll {
  height: 100%; box-sizing: border-box; overflow-y: auto; overflow-x: hidden;
  padding: 40px clamp(20px, 4vw, 48px); max-width: 920px; margin: 0 auto;
  overscroll-behavior: contain; animation: fadeUp 0.3s var(--ease-out);
}
.settings-head { margin-bottom: 28px; }
.settings-kicker {
  font-size: 10px; font-weight: 700; color: var(--cyan);
  letter-spacing: 0.16em; line-height: 1.6; margin-bottom: 12px;
}
.settings-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-0); }
.settings-desc { font-size: 13px; line-height: 1.8; color: var(--text-2); margin: 8px 0 16px; }

/* Agent 配置 */
.agent-list { display: flex; flex-direction: column; gap: 12px; }

/* 服务接入 */
.preset-card {
  padding: 20px; display: flex; flex-direction: column; gap: 14px;
  border: 1px solid rgba(0,240,255,0.18); border-radius: 18px;
  background: linear-gradient(135deg, rgba(0,240,255,0.06), var(--surface-gradient));
  box-shadow: 0 8px 24px rgba(0,0,0,0.2); margin-bottom: 16px;
}
.preset-head { display: flex; align-items: center; gap: 12px; }
.preset-icon {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  background: var(--cyan-bg); color: var(--cyan); border: 1px solid rgba(0,240,255,0.2);
  display: flex; align-items: center; justify-content: center;
}
.preset-title { font-weight: 700; font-size: 14px; }
.preset-desc { font-size: 12px; color: var(--text-2); margin-top: 2px; line-height: 1.6; }
.preset-form { display: flex; gap: 8px; }
.preset-form .input { flex: 1; }

.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 16px 0 14px; flex-wrap: wrap; }
.chip-row { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  padding: 7px 14px; font-size: 12px; border-radius: 99px; cursor: pointer;
  border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-2);
  transition: all 0.18s;
}
.chip:hover { color: var(--text-0); border-color: var(--border-strong); }
.chip.active { background: var(--cyan-bg); color: var(--cyan); border-color: rgba(0,240,255,0.25); font-weight: 600; }

.svc-type-badge {
  min-width: 36px; height: 36px; padding: 0 10px; border-radius: 10px; flex-shrink: 0;
  font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid;
}
.svc-type-badge[data-type="text"] { color: #7ec8ff; background: rgba(126,200,255,0.1); border-color: rgba(126,200,255,0.25); }
.svc-type-badge[data-type="image"] { color: #c792ea; background: rgba(199,146,234,0.1); border-color: rgba(199,146,234,0.25); }
.svc-type-badge[data-type="video"] { color: #ffcb6b; background: rgba(255,203,107,0.1); border-color: rgba(255,203,107,0.25); }
.svc-type-badge[data-type="audio"] { color: #7dffa8; background: rgba(125,255,168,0.1); border-color: rgba(125,255,168,0.25); }

.tag-active { background: rgba(125,255,168,0.08); color: #7dffa8; border-color: rgba(125,255,168,0.2); }
.tag-danger { background: rgba(255,83,112,0.08); color: #ff5370; border-color: rgba(255,83,112,0.2); }
.test-danger-btn { color: #ff5370; }

.switch-row {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer;
  border: 1px solid var(--border); border-radius: 10px; background: var(--bg-input); font-size: 13px;
}
.switch-row input { accent-color: var(--cyan); }

.test-result { border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.test-result.is-ok { border-color: rgba(125,255,168,0.25); background: rgba(125,255,168,0.04); }
.test-result.is-bad { border-color: rgba(255,83,112,0.25); background: rgba(255,83,112,0.04); }
.test-result-head { display: flex; align-items: center; gap: 8px; font-size: 12.5px; flex-wrap: wrap; }
.test-dot { width: 8px; height: 8px; border-radius: 99px; flex-shrink: 0; }
.is-ok .test-dot { background: #7dffa8; box-shadow: 0 0 8px rgba(125,255,168,0.6); }
.is-bad .test-dot { background: #ff5370; box-shadow: 0 0 8px rgba(255,83,112,0.6); }
.test-preview summary { font-size: 11px; color: var(--text-3); cursor: pointer; }
.test-preview pre {
  margin: 8px 0 0; padding: 10px; font-size: 11px; line-height: 1.5; color: var(--text-2);
  background: var(--bg-input); border-radius: 8px; overflow: auto; white-space: pre-wrap;
  word-break: break-all; max-height: 160px;
}
.mono { font-family: var(--font-mono); }

/* 数据备份 */
.backup-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
}
.backup-row .btn { flex-shrink: 0; text-decoration: none; }

/* 语言切换 */
.lang-switch {
  margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
}
.lang-switch-label {
  display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-3);
}
.lang-switch-row { display: flex; gap: 6px; }
.lang-switch-row .chip { padding: 5px 12px; }
.agent-card, .skill-card {
  overflow: hidden; border: 1px solid var(--border); border-radius: 18px;
  background: var(--surface-gradient); box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.agent-card-head { display: flex; align-items: center; gap: 10px; padding: 18px; cursor: pointer; transition: background 0.18s; }
.agent-card-head:hover { background: var(--bg-hover); }
.agent-type-badge {
  width: 36px; height: 36px; border-radius: 10px; background: var(--accent-bg);
  color: var(--accent-text); border: 1px solid rgba(255,46,136,0.16);
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.agent-card-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; border-top: 1px solid var(--border); }
.agent-card-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding-top: 8px; }

/* Skills 布局 */
.skills-layout { display: flex; height: 100%; min-height: 0; min-width: 0; overflow: hidden; }
.skills-agent-list {
  width: 196px; flex-shrink: 0; border-right: 1px solid var(--border);
  background: var(--bg-surface); display: flex; flex-direction: column;
  padding: 12px 8px; gap: 6px; overflow-y: auto;
}
.skills-agent-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--text-3); padding: 10px 10px 8px;
}
.skills-agent-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px; font-size: 12px; cursor: pointer;
  border: 1px solid transparent; background: none; color: var(--text-2);
  transition: background 0.18s, color 0.18s; width: 100%; text-align: left;
  border-radius: 12px; flex-shrink: 0;
}
.skills-agent-item:hover { background: var(--bg-hover); color: var(--text-0); }
.skills-agent-item.active { background: var(--cyan-bg); color: var(--cyan); border-color: rgba(0,240,255,0.25); font-weight: 600; }
.skills-agent-label { flex: 1; }
.skill-count-badge {
  font-size: 10px; font-weight: 700; font-family: var(--font-mono);
  background: var(--cyan-bg); color: var(--cyan);
  padding: 2px 6px; border-radius: 99px;
}
.skills-main { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; max-width: 920px; }

/* Skill 列表 */
.skill-list { display: flex; flex-direction: column; gap: 12px; }
.skill-card-head { display: flex; align-items: center; gap: 10px; padding: 16px 18px; cursor: pointer; transition: background 0.18s; }
.skill-card-head:hover { background: var(--bg-hover); }
.skill-card-head .dim { overflow-wrap: anywhere; }
.skill-card-body { padding: 18px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--border); }
.skill-card-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.skill-card-foot .dim { min-width: 0; overflow-wrap: anywhere; }
.step-empty { border: 1px dashed var(--border-strong); border-radius: 18px; background: var(--bg-surface); }
.empty-visual { color: var(--cyan); background: var(--cyan-bg); }

/* 表单与按钮 */
.field { display: flex; flex-direction: column; min-width: 0; gap: 6px; }
.field-label { font-size: 12px; font-weight: 600; color: var(--text-1); }
.field-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.input, .textarea {
  width: 100%; min-width: 0; box-sizing: border-box; background: var(--bg-input);
  color: var(--text-0); border: 1px solid var(--border); border-radius: 10px;
}
.input:focus, .textarea:focus { border-color: var(--cyan); box-shadow: none; outline: none; }
.input::placeholder, .textarea::placeholder { color: var(--text-3); }
.textarea { resize: vertical; }
.btn { border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.18); }
.btn-primary { background: var(--accent-gradient); color: var(--text-0); border-color: var(--accent); }
.btn-primary:hover:not(:disabled) { background: var(--accent); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
.tag-success { background: var(--cyan-bg); color: var(--cyan); border-color: rgba(0,240,255,0.2); }

/* 创建弹窗 */
.overlay {
  position: fixed; inset: 0; box-sizing: border-box; padding: 20px;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; overflow-y: auto;
  z-index: 1000; animation: fadeIn 0.18s var(--ease-out);
}
.modal {
  padding: 28px; width: min(460px, 100%); box-sizing: border-box;
  max-height: calc(100dvh - 40px); overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px; color: var(--text-0);
  background: var(--surface-gradient); border: 1px solid var(--border-strong); border-radius: 22px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.modal > * { flex-shrink: 0; }
.modal .settings-kicker { margin-bottom: 0; }
.modal-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; overflow-wrap: anywhere; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 10px; }

@media (max-width: 1100px) {
  .skills-layout { flex-direction: column; }
  .skills-agent-list {
    width: auto; flex-direction: row; align-items: center; padding: 10px 16px;
    border-right: none; border-bottom: 1px solid var(--border); overflow-x: auto; overflow-y: hidden;
  }
  .skills-agent-title { display: none; }
  .skills-agent-item { width: auto; white-space: nowrap; }
  .skills-main { width: 100%; height: auto; }
}

@media (max-width: 720px) {
  .settings-layout { flex-direction: column; }
  .settings-nav { width: auto; padding: 10px 16px; border-right: none; border-bottom: 1px solid var(--border); }
  .nav-group { flex-direction: row; overflow-x: auto; }
  .nav-group-label { display: none; }
  .nav-item { width: auto; flex-shrink: 0; padding: 10px 14px; }
  .settings-scroll { padding: 24px 16px 32px; }
  .settings-title { font-size: 22px; }
  .field-row { grid-template-columns: 1fr; }
  .agent-card-head, .skill-card-head { padding: 14px; gap: 8px; }
  .agent-card-body, .skill-card-body { padding: 14px; }
  .overlay { padding: 12px; }
  .modal { padding: 20px; max-height: calc(100dvh - 24px); border-radius: 18px; }
}
</style>
