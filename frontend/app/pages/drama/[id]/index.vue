<template>
  <div class="page" :aria-busy="loading">
    <div v-if="loading && !drama" class="card page-state" role="status" aria-live="polite">
      <div class="state-loader" aria-hidden="true" />
      <h1 class="state-title">{{ $t('drama.loading.title') }}</h1>
      <p>{{ $t('drama.loading.desc') }}</p>
    </div>
    <div v-else-if="!drama" class="card page-state" role="alert">
      <div class="state-kicker">HUAIHUA STUDIO / PROJECT</div>
      <h1 class="state-title">{{ $t('drama.error.title') }}</h1>
      <p>{{ loadError || $t('drama.error.notAvailable') }}</p>
      <div class="state-actions">
        <button class="back-btn" @click="navigateTo('/')">{{ $t('drama.backToList') }}</button>
        <button class="btn btn-primary" @click="load">{{ $t('drama.reload') }}</button>
      </div>
    </div>
    <template v-else>
    <div v-if="loadError" class="load-notice" role="alert">
      <span>{{ loadError }}</span>
      <button class="back-btn" :disabled="loading" @click="load">{{ loading ? $t('drama.refreshing') : $t('drama.retry') }}</button>
    </div>
    <!-- 项目页头 -->
    <div class="page-head">
      <div class="head-left">
        <div class="head-topline">
        <span class="page-kicker">HUAIHUA STUDIO / PROJECT</span>
        <button class="back-btn" @click="navigateTo('/')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ $t('drama.projectList') }}
        </button>
        </div>
        <div class="head-info">
          <h1 class="page-title">{{ drama.title }}</h1>
          <div class="page-meta">
            <span v-if="drama.style" class="style-chip">{{ drama.style }}</span>
            <span v-if="drama.style" class="meta-divider"></span>
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ $t('drama.meta.characters', { n: drama.characters?.length || 0 }) }}
            </span>
            <span class="meta-divider"></span>
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
              {{ $t('drama.meta.scenes', { n: drama.scenes?.length || 0 }) }}
            </span>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" @click="openAddEpisode">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ $t('drama.addEpisode') }}
      </button>
    </div>

    <nav class="project-overview" :aria-label="$t('drama.overview.ariaLabel')">
      <button
        v-for="item in overviewTabs"
        :key="item.id"
        type="button"
        :class="['overview-card', { active: activeOverview === item.id }]"
        :aria-pressed="activeOverview === item.id"
        aria-controls="project-content"
        @click="activeOverview = item.id"
      >
        <span class="overview-label">{{ item.label }}</span>
        <strong class="overview-count">{{ item.count }}</strong>
        <span class="overview-copy">{{ item.copy }}</span>
      </button>
    </nav>

    <section id="project-content" :aria-label="overviewTabs.find(item => item.id === activeOverview)?.label">
    <template v-if="activeOverview === 'episodes'">
    <div class="section-label">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <rect x="2" y="2" width="20" height="20" rx="2.5"/>
        <line x1="7" y1="8" x2="7" y2="16"/>
        <line x1="10" y1="8" x2="10" y2="16"/>
        <line x1="13" y1="8" x2="13" y2="16"/>
        <line x1="16" y1="8" x2="16" y2="16"/>
      </svg>
      {{ $t('drama.sections.episodeList') }}
    </div>

    <div class="ep-grid">
      <div
        v-for="(ep, i) in episodes"
        :key="ep.id"
        class="card ep-card"
        role="link"
        tabindex="0"
        :aria-label="$t('drama.episodes.openAria', { name: ep.title || $t('drama.episodes.fallbackTitle', { n: ep.episode_number || ep.episodeNumber }) })"
        :style="{ animationDelay: `${Math.min(i, 8) * 0.05}s` }"
        @click="navigateTo(`/drama/${drama.id}/episode/${ep.episode_number || ep.episodeNumber}`)"
        @keydown.enter.prevent="navigateTo(`/drama/${drama.id}/episode/${ep.episode_number || ep.episodeNumber}`)"
        @keydown.space.prevent="navigateTo(`/drama/${drama.id}/episode/${ep.episode_number || ep.episodeNumber}`)"
      >
        <div class="ep-film-strip" aria-hidden="true"><i v-for="frame in 6" :key="frame" /></div>
        <div class="ep-number">E{{ String(ep.episode_number || ep.episodeNumber).padStart(2, '0') }}</div>
        <div class="ep-body">
          <span class="ep-title">{{ ep.title }}</span>
          <div class="ep-status">
            <span :class="['status-dot', hasScript(ep) ? 'dot-ready' : 'dot-pending']"></span>
            <span class="status-text">{{ hasScript(ep) ? $t('drama.episodes.scriptReady') : $t('drama.episodes.scriptPending') }}</span>
            <span v-if="ep.duration" class="ep-duration">{{ ep.duration }}s</span>
          </div>
        </div>
        <div class="ep-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      <!-- Empty episode state -->
      <div v-if="!drama.episodes?.length" class="card ep-empty">
        <div class="ep-empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <p>{{ $t('drama.empty.episodes') }}</p>
      </div>
    </div>
    </template>
    <template v-else>
      <div class="section-label">{{ activeOverview === 'characters' ? $t('drama.assets.characters') : $t('drama.assets.scenes') }}</div>
      <div class="asset-grid">
        <article v-for="(asset, i) in overviewAssets" :key="asset.id ?? i" class="card asset-card">
          <span class="asset-number">{{ activeOverview === 'characters' ? 'C' : 'S' }}{{ String(i + 1).padStart(2, '0') }}</span>
          <h2 class="asset-title">{{ activeOverview === 'characters' ? (asset.name || $t('drama.assets.unnamedCharacter')) : (asset.location || $t('drama.assets.unnamedScene')) }}</h2>
          <p v-if="activeOverview === 'scenes'" class="asset-meta">{{ asset.time || $t('drama.assets.noTime') }}</p>
          <p class="asset-description">{{ activeOverview === 'characters' ? (asset.appearance || $t('drama.assets.noAppearance')) : (asset.prompt || $t('drama.assets.noDescription')) }}</p>
        </article>
        <div v-if="!overviewAssets.length" class="card ep-empty">
          <div class="ep-empty-icon">{{ activeOverview === 'characters' ? 'C' : 'S' }}</div>
          <h2 class="state-title">{{ activeOverview === 'characters' ? $t('drama.assets.emptyCharacters') : $t('drama.assets.emptyScenes') }}</h2>
          <p>{{ $t('drama.assets.emptyHint') }}</p>
          <button class="back-btn" @click="activeOverview = 'episodes'">{{ $t('drama.assets.viewEpisodes') }}</button>
        </div>
      </div>
    </template>
    </section>

    <Teleport to="body">
    <div v-if="addDialog" class="dialog-mask" @click.self="addDialog = false">
      <div class="card dialog" role="dialog" aria-modal="true" aria-labelledby="episode-dialog-title">
        <div class="dialog-head">
          <div class="dialog-head-copy">
            <div class="dialog-kicker">Episode Setup</div>
            <div class="dialog-title-row">
              <div id="episode-dialog-title" class="dialog-title">{{ $t('drama.dialog.title') }}</div>
              <span class="dialog-badge">{{ $t('drama.dialog.badge') }}</span>
            </div>
            <div class="dialog-sub">{{ $t('drama.dialog.sub') }}</div>
          </div>
          <button class="back-btn" @click="addDialog = false">{{ $t('drama.dialog.cancel') }}</button>
        </div>
        <div class="dialog-summary">
          <div class="summary-chip">{{ imagePricingHint }}</div>
          <div class="summary-chip">{{ videoPricingHint }}</div>
          <div class="summary-chip">{{ agentPricingHint }}</div>
          <div class="summary-chip">{{ audioPricingHint }}</div>
        </div>
        <div class="dialog-body">
          <div class="dialog-section">
            <div class="dialog-section-head">
              <span class="dialog-section-title">{{ $t('drama.dialog.basicTitle') }}</span>
              <span class="dialog-section-copy">{{ $t('drama.dialog.basicCopy') }}</span>
            </div>
            <label class="field">
              <span class="field-label">{{ $t('drama.dialog.titleLabel') }}</span>
              <input v-model="newEpisodeTitle" class="input" :placeholder="$t('drama.dialog.titlePlaceholder')" />
              <span class="field-hint">{{ $t('drama.dialog.titleHint') }}</span>
            </label>
          </div>

          <div class="dialog-section">
            <div class="dialog-section-head">
              <span class="dialog-section-title">{{ $t('drama.dialog.configTitle') }}</span>
              <span class="dialog-section-copy">{{ $t('drama.dialog.configCopy') }}</span>
            </div>
            <div class="config-grid">
              <label class="config-card">
                <span class="config-card-kicker">IMAGE</span>
                <span class="field-label">{{ $t('drama.dialog.imageLabel') }}</span>
                <span class="config-pricing">{{ imagePricingHint }}</span>
                <BaseSelect v-model="newEpisodeImageConfigId" :options="imageConfigOptions" :placeholder="$t('drama.dialog.imagePlaceholder')" searchable />
              </label>
              <label class="config-card">
                <span class="config-card-kicker">VIDEO</span>
                <span class="field-label">{{ $t('drama.dialog.videoLabel') }}</span>
                <span class="config-pricing">{{ videoPricingHint }}</span>
                <BaseSelect v-model="newEpisodeVideoConfigId" :options="videoConfigOptions" :placeholder="$t('drama.dialog.videoPlaceholder')" searchable />
              </label>
              <label class="config-card">
                <span class="config-card-kicker">AUDIO</span>
                <span class="field-label">{{ $t('drama.dialog.audioLabel') }}</span>
                <span class="config-pricing">{{ audioPricingHint }}</span>
                <BaseSelect v-model="newEpisodeAudioConfigId" :options="audioConfigOptions" :placeholder="$t('drama.dialog.audioPlaceholder')" searchable />
              </label>
            </div>
            <div class="pricing-footnote">{{ $t('drama.dialog.pricingFootnote', { agent: agentCost, image: imageCost }) }}</div>
          </div>
        </div>
        <div class="dialog-foot">
          <div class="dialog-foot-copy">{{ $t('drama.dialog.footCopy') }}</div>
          <button class="btn btn-primary" :disabled="creatingEpisode || !canCreateEpisode" @click="addEpisode">
            {{ creatingEpisode ? $t('drama.dialog.creating') : $t('drama.dialog.create') }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>
    </template>
  </div>
</template>

<script setup>
import { toast } from 'vue-sonner'
import { aiConfigAPI, dramaAPI, episodeAPI } from '~/composables/useApi'

const {
  agentCost,
  imageCost,
  videoPricingHint,
  imagePricingHint,
  agentPricingHint,
  audioPricingHint,
  imageConfigOptionLabel,
  videoConfigOptionLabel,
  audioConfigOptionLabel,
  refreshCredits,
} = useGenerationConfigLabels()

const { t } = useLocale()

const route = useRoute()
const drama = ref(null)
const loading = ref(true)
const loadError = ref('')
const activeOverview = ref('episodes')
const episodes = computed(() => drama.value?.episodes || [])
const characters = computed(() => drama.value?.characters || [])
const scenes = computed(() => drama.value?.scenes || [])
const overviewTabs = computed(() => [
  { id: 'episodes', label: t('drama.tabs.episodes'), count: episodes.value.length, copy: t('drama.tabs.episodesCopy', { n: episodes.value.filter(hasScript).length }) },
  { id: 'characters', label: t('drama.tabs.characters'), count: characters.value.length, copy: t('drama.tabs.charactersCopy') },
  { id: 'scenes', label: t('drama.tabs.scenes'), count: scenes.value.length, copy: t('drama.tabs.scenesCopy') },
])
const overviewAssets = computed(() => activeOverview.value === 'characters' ? characters.value : scenes.value)
const dramaId = Number(route.params.id)
const addDialog = ref(false)
const creatingEpisode = ref(false)
const newEpisodeTitle = ref('')
const imageConfigs = ref([])
const videoConfigs = ref([])
const audioConfigs = ref([])
const newEpisodeImageConfigId = ref(null)
const newEpisodeVideoConfigId = ref(null)
const newEpisodeAudioConfigId = ref(null)

function hasScript(ep) { return !!(ep.script_content || ep.scriptContent) }

const imageConfigOptions = computed(() => imageConfigs.value.map((c, i) => ({
  label: imageConfigOptionLabel(c, i),
  value: c.id,
})))
const videoConfigOptions = computed(() => videoConfigs.value.map((c, i) => ({
  label: videoConfigOptionLabel(c, i),
  value: c.id,
})))
const audioConfigOptions = computed(() => [
  { label: audioConfigOptionLabel(null), value: null },
  ...audioConfigs.value.map((c, i) => ({
    label: audioConfigOptionLabel(c),
    value: c.id,
  })),
])
const canCreateEpisode = computed(() => !!(newEpisodeImageConfigId.value && newEpisodeVideoConfigId.value))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    drama.value = await dramaAPI.get(dramaId)
  } catch (e) {
    loadError.value = e.message || t('drama.error.loadFailed')
    toast.error(loadError.value)
  } finally {
    loading.value = false
  }
}

async function loadConfigs() {
  try {
    const [imgs, vids, auds] = await Promise.all([
      aiConfigAPI.list('image'),
      aiConfigAPI.list('video'),
      aiConfigAPI.list('audio'),
    ])
    imageConfigs.value = imgs || []
    videoConfigs.value = vids || []
    audioConfigs.value = auds || []
    if (!newEpisodeImageConfigId.value && imageConfigs.value.length) newEpisodeImageConfigId.value = imageConfigs.value[0].id
    if (!newEpisodeVideoConfigId.value && videoConfigs.value.length) newEpisodeVideoConfigId.value = videoConfigs.value[0].id
    // 音频为可选项，不自动选择（不选则不生成配音，直接拼接视频）
  } catch (e) {
    toast.error(e.message)
  }
}

function openAddEpisode() {
  newEpisodeTitle.value = ''
  refreshCredits()
  addDialog.value = true
}

async function addEpisode() {
  try {
    creatingEpisode.value = true
    await episodeAPI.create({
      drama_id: dramaId,
      title: newEpisodeTitle.value || undefined,
      image_config_id: newEpisodeImageConfigId.value,
      video_config_id: newEpisodeVideoConfigId.value,
      audio_config_id: newEpisodeAudioConfigId.value || undefined,
    })
    toast.success(t('drama.toast.episodeAdded'))
    addDialog.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    creatingEpisode.value = false
  }
}

onMounted(() => { load(); loadConfigs(); refreshCredits() })
</script>

<style scoped>
.page {
  padding: 36px clamp(20px, 4vw, 48px) 48px;
  overflow-y: auto; overflow-x: hidden;
  flex: 1; min-height: 0; min-width: 0; height: 100%; box-sizing: border-box;
  color: var(--text-0); background: var(--page-background);
  animation: fadeUp 0.35s var(--ease-out) both;
}

.page-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 28px; gap: 24px;
}
.head-left { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 20px; }
.head-topline { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.page-kicker, .state-kicker { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; color: var(--cyan); }
.head-info { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.page-head > .btn { flex-shrink: 0; }

.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 12px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--border); border-radius: 10px;
  background: var(--bg-0); color: var(--text-2);
  cursor: pointer; transition: background 0.18s, border-color 0.18s, color 0.18s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.16);
}
.back-btn:hover { background: var(--bg-hover); border-color: var(--border-strong); color: var(--text-0); }
.btn { border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.btn-primary { background: var(--accent-gradient); color: var(--text-0); border-color: var(--accent); }
.btn-primary:hover:not(:disabled) { background: var(--accent); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
.back-btn:focus-visible, .btn:focus-visible, .ep-card:focus-visible, .overview-card:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }

.page-title {
  font-family: var(--font-display); font-size: clamp(26px, 3vw, 36px); font-weight: 800;
  letter-spacing: -0.03em; line-height: 1.3; color: var(--text-0); overflow-wrap: anywhere;
}
.page-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.style-chip {
  font-size: 11px; font-weight: 500; padding: 4px 10px;
  background: var(--accent-bg); color: var(--accent-text);
  border-radius: 99px; border: 1px solid rgba(255,46,136,0.2);
}
.meta-divider { width: 3px; height: 3px; border-radius: 50%; background: var(--text-3); }
.meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-2); }

/* 现有项目数据概览 */
.project-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 32px; }
.overview-card {
  display: grid; grid-template-columns: 1fr auto; gap: 8px; min-width: 0; padding: 18px 20px;
  text-align: left; color: var(--text-2); background: var(--surface-gradient);
  border: 1px solid var(--border); border-radius: 16px; cursor: pointer;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18); transition: border-color 0.18s, background 0.18s;
}
.overview-card:hover { background: var(--bg-hover); border-color: var(--border-strong); }
.overview-card.active { border-color: rgba(0,240,255,0.4); background: var(--cyan-bg); }
.overview-label { font-size: 13px; font-weight: 600; align-self: center; }
.overview-count { grid-column: 2; grid-row: 1 / 3; align-self: center; font-family: var(--font-mono); font-size: 30px; color: var(--text-0); }
.overview-card.active .overview-label, .overview-card.active .overview-count { color: var(--cyan); }
.overview-copy { font-size: 11px; line-height: 1.6; color: var(--text-3); }

/* 加载、错误与重试 */
.page-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  min-height: 320px; padding: 40px 24px; text-align: center;
  background: var(--surface-gradient); border: 1px solid var(--border); border-radius: 22px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.2); color: var(--text-2);
}
.page-state p { max-width: 520px; font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }
.state-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--text-0); }
.state-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
.state-loader { width: 32px; height: 32px; border: 2px solid var(--border); border-top-color: var(--cyan); border-radius: 50%; animation: projectSpin 0.8s linear infinite; }
.load-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; margin-bottom: 20px; border: 1px solid rgba(255,192,51,0.25); border-radius: 12px; background: var(--gold-bg); color: var(--gold-hi); font-size: 13px; }
.load-notice span { min-width: 0; overflow-wrap: anywhere; }
.load-notice .back-btn { flex-shrink: 0; }
@keyframes projectSpin { to { transform: rotate(360deg); } }

/* Section label */
.section-label {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700;
  color: var(--text-3); letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* 胶片剧集卡 */
.ep-grid, .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 18px; }
.ep-card {
  position: relative; display: flex; align-items: center; gap: 14px; min-width: 0;
  padding: 44px 20px 24px; min-height: 132px; box-sizing: border-box;
  border: 1px solid var(--border); border-radius: 18px; background: var(--surface-gradient);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2); overflow: hidden; cursor: pointer;
  animation: fadeUp 0.35s var(--ease-out) backwards;
  transition: transform 0.18s var(--ease-out), box-shadow 0.18s var(--ease-out), border-color 0.18s;
}
.ep-card:hover {
  border-color: rgba(0,240,255,0.4); box-shadow: 0 14px 32px rgba(0,0,0,0.35); transform: translateY(-4px);
}
.ep-film-strip {
  position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between;
  padding: 9px 16px; border-bottom: 1px solid var(--border); background: var(--bg-input);
}
.ep-film-strip i { width: 18px; height: 7px; border-radius: 2px; background: var(--bg-3); }
.ep-number {
  width: 48px; height: 48px; flex-shrink: 0; border-radius: 12px;
  background: var(--cyan-bg); border: 1px solid rgba(0,240,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: var(--cyan);
  transition: border-color 0.18s;
}
.ep-card:hover .ep-number { border-color: var(--cyan); }
.ep-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.ep-title { font-size: 15px; font-weight: 600; line-height: 1.5; color: var(--text-0); overflow-wrap: anywhere; }
.ep-status { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dot-ready { background: var(--cyan); }
.dot-pending { background: var(--text-3); }
.status-text { font-size: 11px; color: var(--text-2); }
.ep-duration { font-size: 11px; color: var(--text-3); font-family: var(--font-mono); margin-left: 4px; }
.ep-arrow { color: var(--text-3); flex-shrink: 0; transition: transform 0.18s; }
.ep-card:hover .ep-arrow { transform: translateX(3px); color: var(--cyan); }

/* 角色与场景概览 */
.asset-card { padding: 22px; min-width: 0; background: var(--surface-gradient); border: 1px solid var(--border); border-radius: 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.asset-number { display: inline-block; padding: 5px 8px; border-radius: 6px; background: var(--cyan-bg); color: var(--cyan); font-family: var(--font-mono); font-size: 11px; }
.asset-title { margin: 14px 0 8px; font-size: 16px; font-weight: 600; color: var(--text-0); overflow-wrap: anywhere; }
.asset-meta { font-size: 11px; color: var(--accent-text); margin-bottom: 8px; }
.asset-description { font-size: 12px; color: var(--text-2); line-height: 1.8; overflow-wrap: anywhere; white-space: pre-wrap; }

/* 空内容 */
.ep-empty {
  grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 24px; text-align: center; color: var(--text-2); font-size: 13px; line-height: 1.7;
  border: 1px dashed var(--border-strong); border-radius: 18px; background: var(--bg-surface);
}
.ep-empty-icon {
  width: 48px; height: 48px; border-radius: 14px; color: var(--cyan); font-family: var(--font-mono);
  background: var(--cyan-bg); display: flex; align-items: center; justify-content: center;
}

.dialog-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; box-sizing: border-box; overflow-y: auto;
}
.dialog {
  width: min(820px, 100%); max-height: calc(100dvh - 48px); box-sizing: border-box;
  display: flex; flex-direction: column; gap: 18px;
  padding: 28px; border-radius: 24px; color: var(--text-0);
  background: var(--surface-gradient); overflow-y: auto; overscroll-behavior: contain;
  border: 1px solid var(--border-strong);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3);
}
.dialog > * { flex-shrink: 0; }
.dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.dialog-head-copy { display: flex; flex-direction: column; gap: 8px; max-width: 520px; }
.dialog-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
}
.dialog-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dialog-title { font-size: 28px; font-weight: 800; color: var(--text-0); letter-spacing: -0.03em; }
.dialog-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--cyan-bg);
  color: var(--cyan);
  font-size: 12px;
  font-weight: 700;
}
.dialog-sub { font-size: 14px; line-height: 1.7; color: var(--text-2); }
.dialog-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.summary-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--gold-bg);
  border: 1px solid rgba(255,192,51,0.2);
  font-size: 12px;
  line-height: 1.5;
  color: var(--gold);
}
.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.dialog-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--bg-1);
  border: 1px solid var(--border);
}
.dialog-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.dialog-section-title { font-size: 14px; font-weight: 700; color: var(--text-0); }
.dialog-section-copy { font-size: 12px; color: var(--text-3); }
.config-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.config-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border-radius: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  transition: border-color 0.18s;
}
.config-card:focus-within {
  border-color: rgba(0,240,255,0.45);
}
.config-card-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
}
.config-pricing {
  font-size: 11px;
  line-height: 1.5;
  color: var(--gold);
  font-weight: 600;
}
.pricing-footnote {
  font-size: 12px;
  line-height: 1.7;
  color: var(--gold-hi);
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--gold-bg);
}
.dialog-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 2px;
}
.dialog-foot-copy {
  flex: 1;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-3);
}
.field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.field-label { font-size: 12px; font-weight: 600; color: var(--text-1); }
.field-hint { font-size: 12px; line-height: 1.6; color: var(--text-3); }
.input { width: 100%; box-sizing: border-box; background: var(--bg-input); color: var(--text-0); border: 1px solid var(--border); border-radius: 10px; }
.input:focus { outline: none; border-color: var(--cyan); box-shadow: none; }
.input::placeholder { color: var(--text-3); }
.config-card :deep(.base-select-trigger) { border-radius: 10px; background: var(--bg-0); }
.config-card :deep(.base-select-trigger.open) { border-color: var(--cyan); box-shadow: none; }

@media (max-width: 860px) {
  .dialog-mask { padding: 12px; }
  .dialog { width: 100%; max-height: calc(100dvh - 24px); padding: 20px; border-radius: 20px; }
  .dialog-title { font-size: 24px; }
  .config-grid { grid-template-columns: 1fr; }
  .dialog-foot { flex-direction: column; align-items: stretch; }
}

@media (max-width: 640px) {
  .page { padding: 24px 16px 32px; }
  .page-head { flex-direction: column; align-items: stretch; gap: 20px; }
  .head-topline { justify-content: space-between; gap: 10px; }
  .page-kicker { font-size: 9px; letter-spacing: 0.1em; }
  .project-overview { gap: 8px; margin-bottom: 24px; }
  .overview-card { display: flex; flex-direction: column; align-items: flex-start; padding: 14px 12px; gap: 6px; }
  .overview-count { font-size: 26px; align-self: flex-start; }
  .overview-copy { font-size: 10px; }
  .dialog { padding: 18px; }
  .dialog-head { gap: 10px; }
  .dialog-head .back-btn { flex-shrink: 0; }
  .dialog-sub { font-size: 12px; }
  .dialog-section { padding: 14px; }
  .load-notice { align-items: flex-start; }
}
</style>
