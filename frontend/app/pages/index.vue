<template>
  <div class="hp">
    <!-- 背景层 -->
    <div class="hp-bloom" aria-hidden="true" />
    <div class="hp-weave" aria-hidden="true" />
    <div class="hp-scan" aria-hidden="true" />
    <div ref="petalsEl" class="hp-petals" aria-hidden="true" />

    <!-- 导航 -->
    <nav class="hp-nav">
      <div class="hp-wrap hp-nav-in">
        <NuxtLink to="/" class="hp-brand">
          <span class="hp-brand-mark">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
              <path d="M12 21c0-5 3-9 8-10-1 6-4 9-8 10z" />
              <path d="M12 21c0-5-3-9-8-10 1 6 4 9 8 10z" />
              <path d="M12 21v-7" />
            </svg>
          </span>
          <span class="hp-brand-name">{{ $t('home.brand.name') }}<em>{{ $t('home.brand.em') }}</em></span>
        </NuxtLink>

        <div class="hp-nav-links">
          <NuxtLink to="/" class="hp-nav-link is-on">{{ $t('home.nav.projects') }}</NuxtLink>
          <NuxtLink to="/settings" class="hp-nav-link">{{ $t('home.nav.settings') }}</NuxtLink>
        </div>

        <div class="hp-nav-right">
          <div class="hp-wallet">
            <span class="hp-coin" />
            <span>{{ creditLabel }}</span>
          </div>
          <button type="button" class="hp-btn-gold" @click="onRecharge">{{ $t('home.nav.recharge') }}</button>

          <!-- 窄屏菜单开关：窄屏下导航链接被隐藏，必须提供替代入口 -->
          <button
            type="button"
            class="hp-burger"
            :class="{ 'is-open': menuOpen }"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            aria-controls="hp-mobile-menu"
            :aria-label="$t('home.nav.openMenu')"
            @click="menuOpen = !menuOpen"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <!-- 窄屏下拉菜单 -->
      <div v-show="menuOpen" id="hp-mobile-menu" class="hp-menu">
        <NuxtLink to="/" class="hp-menu-link" @click="menuOpen = false">{{ $t('home.nav.projects') }}</NuxtLink>
        <NuxtLink to="/settings" class="hp-menu-link" @click="menuOpen = false">{{ $t('home.nav.settings') }}</NuxtLink>
        <div class="hp-menu-credit">
          <span class="hp-menu-credit-label">{{ $t('home.menu.creditLabel') }}</span>
          <strong>{{ creditLabel }}</strong>
        </div>
        <button type="button" class="hp-btn-gold hp-menu-btn" @click="onRecharge">{{ $t('home.nav.recharge') }}</button>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hp-wrap hp-hero">
      <div class="hp-hero-left">
        <span class="hp-eyebrow"><i />AI SHORT DRAMA STUDIO</span>
        <h1 class="hp-title">{{ $t('home.hero.titleLead') }}<br><span class="is-glow">{{ $t('home.hero.titleGlow') }}</span>{{ $t('home.hero.titleMid') }}<span class="is-cyan">{{ $t('home.hero.titleTail') }}</span></h1>
        <p class="hp-lead">
          {{ $t('home.hero.lead') }}
        </p>
        <div class="hp-cta">
          <button type="button" class="hp-btn-lg" @click="showCreate = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {{ $t('home.hero.create') }}
          </button>
          <NuxtLink v-if="firstDramaId" :to="`/drama/${firstDramaId}`" class="hp-btn-ghost">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {{ $t('home.hero.continue') }}
          </NuxtLink>
        </div>

        <div class="hp-stats">
          <div class="hp-stat"><b>{{ statProjects }}</b><span>{{ $t('home.stats.projects') }}</span></div>
          <div class="hp-stat"><b>{{ statEpisodes }}</b><span>{{ $t('home.stats.episodes') }}</span></div>
          <div class="hp-stat"><b>{{ statCharacters }}</b><span>{{ $t('home.stats.characters') }}</span></div>
        </div>
      </div>

      <aside class="hp-pane">
        <div class="hp-pane-head">
          <div>
            <span class="hp-pane-label">Credit Balance</span>
            <div class="hp-led"><span class="hp-led-num">{{ creditLabel }}</span></div>
            <span class="hp-pane-unit">{{ $t('home.pane.unit') }}</span>
          </div>
          <div class="hp-pane-r">
            <span class="hp-pane-label">{{ $t('home.pane.perCall') }}</span>
            <span class="hp-led-mini">{{ $t('home.pane.points', { n: agentCost }) }}</span>
          </div>
        </div>
        <div class="hp-pane-meter">
          <div class="hp-pane-rule">
            <span>{{ $t('home.pane.agent') }}</span><strong>{{ $t('home.pane.points', { n: agentCost }) }}</strong>
          </div>
          <div class="hp-pane-rule">
            <span>{{ $t('home.pane.image') }}</span><strong>{{ $t('home.pane.points', { n: imageCost }) }}</strong>
          </div>
          <div class="hp-pane-rule">
            <span>{{ $t('home.pane.video') }}</span><strong>{{ videoHint }}</strong>
          </div>
        </div>
      </aside>
    </section>

    <!-- 计费横幅：展示真实计费标准，不虚构促销活动 -->
    <div class="hp-wrap">
      <div class="hp-ticker">
        <span class="hp-ticker-tag">{{ $t('home.ticker.tag') }}</span>
        <span class="hp-ticker-txt">
          Agent <b>{{ agentCost }}</b> {{ $t('home.unit.credits') }} · {{ $t('home.ticker.image') }} <b>{{ imageCost }}</b> {{ $t('home.unit.credits') }} · {{ videoHint }}
        </span>
        <NuxtLink to="/settings" class="hp-btn-gold hp-btn-sm">{{ $t('home.ticker.configure') }}</NuxtLink>
      </div>
    </div>

    <!-- 项目列表 -->
    <section class="hp-wrap hp-sec">
      <div class="hp-sec-head">
        <div>
          <h2 class="hp-sec-title">{{ $t('home.section.title') }}</h2>
          <p class="hp-sec-sub">
            {{ $t('home.section.sub', { n: dramas.length }) }}
          </p>
        </div>
        <button type="button" class="hp-btn-gold hp-btn-sm" @click="showCreate = true">{{ $t('home.section.new') }}</button>
      </div>

      <!-- 加载骨架 -->
      <div v-if="loading" class="hp-grid">
        <div v-for="i in 3" :key="i" class="hp-card hp-skeleton" />
      </div>

      <!-- 列表 -->
      <div v-else class="hp-grid">
        <article
          v-for="d in dramas"
          :key="d.id"
          class="hp-card"
          @click="navigateTo(`/drama/${d.id}`)"
        >
          <div class="hp-card-strip"><i /><i /><i /><i /><i /></div>
          <div class="hp-card-body">
            <div class="hp-card-top">
              <span class="hp-ep">{{ $t('home.card.episodes', { n: d.episodes?.length || 0 }) }}</span>
              <button
                type="button"
                class="hp-del"
                :aria-label="$t('home.card.delete', { title: d.title })"
                @click.stop="delDrama(d)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                </svg>
              </button>
            </div>
            <h3 class="hp-card-title">{{ d.title }}</h3>
            <div class="hp-card-meta">
              <span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {{ d.characters?.length || 0 }}
              </span>
              <span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </svg>
                {{ d.scenes?.length || 0 }}
              </span>
              <span v-if="d.style" class="hp-style-tag">{{ d.style }}</span>
            </div>
          </div>
          <div class="hp-card-foot">
            <div class="hp-prog"><i :style="{ width: getProgress(d) + '%' }" /></div>
            <span class="hp-pct">{{ getProgress(d) }}%</span>
            <span class="hp-pct">{{ fmtDate(d.updated_at || d.updatedAt) }}</span>
          </div>
        </article>

        <!-- 空状态 -->
        <div v-if="!dramas.length" class="hp-empty" @click="showCreate = true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <div class="hp-empty-t">{{ $t('home.empty.title') }}</div>
          <div class="hp-empty-d">{{ $t('home.empty.desc') }}</div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="hp-foot">
      <div class="hp-wrap hp-foot-in">
        <div class="hp-foot-brand">{{ $t('home.brand.name') }}<em>{{ $t('home.brand.em') }}</em></div>
        <div class="hp-foot-links">
          <NuxtLink to="/">{{ $t('home.nav.projects') }}</NuxtLink>
          <NuxtLink to="/settings">{{ $t('home.nav.settings') }}</NuxtLink>
        </div>
        <span class="hp-foot-c">© 2026 HUAIHUA DRAMA</span>
      </div>
    </footer>

    <!-- 新建弹窗 -->
    <div v-if="showCreate" class="hp-mask" @click.self="showCreate = false">
      <div class="hp-modal" role="dialog" aria-modal="true" aria-labelledby="hp-modal-title">
        <h2 id="hp-modal-title" class="hp-modal-title">{{ $t('home.modal.title') }}</h2>
        <p class="hp-modal-desc">{{ $t('home.modal.desc') }}</p>
        <form @submit.prevent="create">
          <div class="hp-fld">
            <label for="hp-f1">{{ $t('home.modal.name') }}</label>
            <input id="hp-f1" v-model="form.title" :placeholder="$t('home.modal.namePlaceholder')" required autofocus>
          </div>
          <div class="hp-fld-row">
            <div class="hp-fld">
              <label for="hp-f2">{{ $t('home.modal.episodes') }}</label>
              <input id="hp-f2" v-model.number="form.total_episodes" type="number" min="1" max="100">
            </div>
            <div class="hp-fld">
              <label for="hp-f3">{{ $t('home.modal.style') }}</label>
              <BaseSelect id="hp-f3" v-model="form.style" :options="styleSelectOptions" :placeholder="$t('home.modal.stylePlaceholder')" searchable />
            </div>
          </div>
          <div class="hp-modal-act">
            <button type="button" class="hp-btn-cancel" @click="showCreate = false">{{ $t('home.modal.cancel') }}</button>
            <button type="submit" class="hp-btn-ok">{{ $t('home.modal.create') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toast } from 'vue-sonner'
import { dramaAPI } from '~/composables/useApi'
import BaseSelect from '~/components/BaseSelect.vue'

const { t, locale } = useLocale()

definePageMeta({ layout: false })

useHead({
  title: () => t('home.meta.title'),
  meta: [
    { name: 'description', content: () => t('home.meta.description') },
    { name: 'theme-color', content: '#0A0E1A' },
    { property: 'og:title', content: () => t('home.meta.ogTitle') },
    { property: 'og:description', content: () => t('home.meta.ogDescription') },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ],
})

const dramas = ref([])
const loading = ref(false)
const showCreate = ref(false)
const menuOpen = ref(false)
const petalsEl = ref(null)
const form = ref({ title: '', total_episodes: 1, style: '' })
const styles = ['realistic', 'anime', 'ghibli', 'cinematic', 'comic', 'watercolor']
const styleSelectOptions = computed(() => styles.map(s => ({ label: s, value: s })))

const { info: creditsInfo, agentCost, imageCost, videoPricingHint, refresh: refreshCredits } = useCredits()

const creditLabel = computed(() => {
  const info = creditsInfo.value
  if (!info) return '—'
  if (info.skipCredits) return `${info.credits}`
  return info.creditsAvailable ? `${info.credits}` : t('home.credit.syncing')
})

const videoHint = computed(() => {
  const hint = videoPricingHint.value || ''
  // 只保留「视频 12 积分/秒」这类费率部分，去掉前缀
  return hint.replace(/^(视频|Video)\s*/, '')
})

const statProjects = computed(() => dramas.value.length)
const statEpisodes = computed(() =>
  dramas.value.reduce((sum, d) => sum + (d.episodes?.length || d.total_episodes || 0), 0),
)
const statCharacters = computed(() =>
  dramas.value.reduce((sum, d) => sum + (d.characters?.length || 0), 0),
)
const firstDramaId = computed(() => dramas.value[0]?.id || null)

async function load() {
  loading.value = true
  try {
    const res = await dramaAPI.list()
    dramas.value = res.items || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function create() {
  if (!form.value.title?.trim()) return
  try {
    const d = await dramaAPI.create(form.value)
    showCreate.value = false
    navigateTo(`/drama/${d.id}`)
  } catch (e) {
    toast.error(e.message)
  }
}

async function delDrama(d) {
  if (!confirm(t('home.deleteConfirm', { title: d.title }))) return
  try {
    await dramaAPI.del(d.id)
    toast.success(t('home.toast.deleted'))
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function onRecharge() {
  menuOpen.value = false
  toast.info(t('home.toast.rechargeLocal'))
}

function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return t('home.time.justNow')
  if (diff < 3600000) return t('home.time.minutesAgo', { n: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('home.time.hoursAgo', { n: Math.floor(diff / 3600000) })
  if (diff < 604800000) return t('home.time.daysAgo', { n: Math.floor(diff / 86400000) })
  return d.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' })
}

function getProgress(d) {
  if (!d.episodes?.length) return 0
  const scripted = d.episodes.filter(e => e.script_content || e.scriptContent).length
  return Math.round((scripted / d.episodes.length) * 100)
}

/* 槐花飘落：客户端生成，弱动效偏好下不渲染 */
function buildPetals() {
  const box = petalsEl.value
  if (!box) return
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  } catch {
    /* 环境不可用时按默认处理 */
  }
  const parts = []
  for (let i = 0; i < 30; i++) {
    const left = (Math.random() * 100).toFixed(2)
    const dur = (9 + Math.random() * 12).toFixed(2)
    const delay = (Math.random() * 18).toFixed(2)
    const size = (4 + Math.random() * 9).toFixed(1)
    parts.push(
      `<span class="hp-petal" style="left:${left}%;width:${size}px;height:${size}px;` +
      `animation-duration:${dur}s;animation-delay:${delay}s"></span>`,
    )
  }
  box.innerHTML = parts.join('')
}

function closeMenu() {
  menuOpen.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    if (menuOpen.value) closeMenu()
    else if (showCreate.value) showCreate.value = false
  }
}

function onResize() {
  // 回到桌面宽度时重置窄屏菜单，避免下次切窄时残留展开态
  if (window.innerWidth > 1000 && menuOpen.value) closeMenu()
}

onMounted(() => {
  load()
  refreshCredits()
  buildPetals()
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.hp {
  /* Palette inherited from the shared design system. */
  position: relative;
  min-height: 100vh;
  background: var(--hp-ink);
  color: var(--hp-hua);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

.hp-wrap { position: relative; z-index: 2; max-width: 1300px; margin: 0 auto; padding: 0 34px; }

/* ── 背景层 ── */
.hp-bloom {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(620px circle at 8% 4%, rgba(255, 46, 136, .22), transparent 60%),
    radial-gradient(560px circle at 94% 8%, rgba(0, 240, 255, .17), transparent 58%),
    radial-gradient(700px circle at 50% 102%, rgba(255, 192, 51, .11), transparent 64%);
}
.hp-weave {
  position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .5;
  background-image:
    linear-gradient(rgba(255, 248, 231, .028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 248, 231, .028) 1px, transparent 1px);
  background-size: 72px 72px;
}
.hp-scan {
  position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: .26;
  background: repeating-linear-gradient(180deg, rgba(0, 0, 0, .26) 0 1px, transparent 1px 3px);
}
.hp-petals { position: fixed; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
.hp-petals :deep(.hp-petal) {
  position: absolute; top: -40px; opacity: 0;
  background: var(--hp-hua); border-radius: 62% 12% 62% 12%;
  box-shadow: 0 0 10px rgba(255, 248, 231, .55);
  animation: hpDrift linear infinite;
}
@keyframes hpDrift {
  0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(0deg); }
  9% { opacity: .9; }
  50% { transform: translate3d(-26px, 52vh, 0) rotate(200deg); }
  91% { opacity: .5; }
  100% { opacity: 0; transform: translate3d(38px, 106vh, 0) rotate(430deg); }
}

/* ── 导航 ── */
.hp-nav {
  position: sticky; top: 0; z-index: 60;
  background: rgba(10, 14, 26, .9);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-bottom: 1px solid var(--hp-line);
}
/* 不支持毛玻璃时退回实色，避免文字压在半透明底上读不清 */
@supports not ((backdrop-filter: blur(4px)) or (-webkit-backdrop-filter: blur(4px))) {
  .hp-nav { background: #0A0E1A; }
}
.hp-nav-in { display: flex; align-items: center; gap: 26px; height: 68px; }

.hp-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.hp-brand-mark {
  width: 37px; height: 37px; border-radius: 10px; display: grid; place-items: center;
  background: linear-gradient(145deg, var(--hp-magenta), var(--hp-gold));
  box-shadow: 0 0 22px rgba(255, 46, 136, .5);
}
.hp-brand-name {
  font-family: 'Archivo Black', var(--font-body);
  font-size: 19px; letter-spacing: .02em; color: var(--hp-hua);
}
.hp-brand-name em { font-style: normal; color: var(--hp-magenta); text-shadow: 0 0 16px rgba(255, 46, 136, .7); }

.hp-nav-links { display: flex; gap: 23px; margin-left: 8px; }
.hp-nav-link {
  font-size: 13px; color: var(--hp-dim); text-decoration: none; font-weight: 500;
  transition: color .18s;
}
.hp-nav-link:hover { color: var(--hp-hua); }
.hp-nav-link.is-on { color: var(--hp-hua); text-shadow: 0 0 14px rgba(0, 240, 255, .6); }

.hp-nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }

/* 钱包 */
.hp-wallet {
  display: flex; align-items: center; gap: 9px; padding: 8px 15px; border-radius: 999px;
  border: 1px solid rgba(255, 192, 51, .44);
  background: linear-gradient(180deg, rgba(255, 192, 51, .14), rgba(255, 192, 51, .05));
  font-family: 'JetBrains Mono', var(--font-mono, monospace);
  font-size: 13px; font-weight: 700; color: var(--hp-gold-hi);
  box-shadow: inset 0 1px 0 rgba(255, 224, 160, .22), 0 0 20px -4px rgba(255, 192, 51, .32);
}
.hp-coin {
  position: relative; width: 16px; height: 16px; border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, var(--hp-gold-hi), var(--hp-gold) 58%, var(--hp-gold-lo));
  box-shadow: 0 0 10px rgba(255, 192, 51, .7);
}
.hp-coin::after {
  content: ''; position: absolute; inset: 4.5px; border-radius: 50%;
  background: rgba(10, 14, 26, .5);
}

/* 金色按钮：三段渐变 + 顶部内高光 */
.hp-btn-gold {
  padding: 8px 18px; border-radius: 999px; border: none; cursor: pointer;
  font-family: var(--font-body); font-size: 13px; font-weight: 800; color: #2A1A00;
  background: linear-gradient(180deg, var(--hp-gold-hi), var(--hp-gold) 62%, var(--hp-gold-lo));
  box-shadow: 0 4px 18px -4px rgba(255, 192, 51, .7), inset 0 1px 0 rgba(255, 255, 255, .5);
  text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap;
  transition: transform .15s, filter .15s;
}
.hp-btn-gold:hover { transform: translateY(-1px); filter: brightness(1.07); }
.hp-btn-sm { border-radius: 9px; padding: 9px 18px; }

/* ── Hero ── */
.hp-hero {
  padding: 66px 34px 44px;
  display: grid; grid-template-columns: 1.12fr .88fr; gap: 52px; align-items: center;
}
.hp-eyebrow {
  display: inline-flex; align-items: center; gap: 9px; padding: 6px 15px; border-radius: 999px;
  border: 1px solid rgba(0, 240, 255, .34); background: rgba(0, 240, 255, .06);
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .16em;
  color: var(--hp-cyan); text-transform: uppercase; margin-bottom: 22px;
}
.hp-eyebrow i {
  width: 6px; height: 6px; border-radius: 50%; background: var(--hp-cyan);
  box-shadow: 0 0 10px var(--hp-cyan); animation: hpBlink 1.5s infinite;
}
@keyframes hpBlink { 0%, 100% { opacity: 1; } 50% { opacity: .22; } }

/* 注意：全局 studio.css 有 `h1,h2,h3 { color: var(--text-0) }`（浅色主题的深色文字），
   元素选择器会盖掉继承色。深色首页里所有标题必须显式声明 color。 */
.hp-title {
  font-family: 'Archivo Black', var(--font-body);
  font-size: clamp(44px, 5.9vw, 76px); line-height: 1.13; letter-spacing: -.012em;
  margin-bottom: 20px; color: var(--hp-hua);
}
.hp-title .is-glow {
  color: var(--hp-hua);
  text-shadow: 0 0 10px rgba(255, 248, 231, .5), 0 0 34px rgba(255, 46, 136, .62), 0 0 68px rgba(255, 46, 136, .34);
}
.hp-title .is-cyan {
  color: var(--hp-cyan);
  text-shadow: 0 0 10px rgba(0, 240, 255, .55), 0 0 38px rgba(0, 240, 255, .42);
}
.hp-lead { font-size: 15px; line-height: 1.9; color: var(--hp-dim); max-width: 540px; margin-bottom: 30px; }

.hp-cta { display: flex; gap: 14px; flex-wrap: wrap; }
.hp-btn-lg {
  display: inline-flex; align-items: center; gap: 9px; padding: 15px 30px; border-radius: 12px;
  border: none; cursor: pointer; font-size: 15.5px; font-weight: 800; font-family: var(--font-body);
  background: linear-gradient(135deg, var(--hp-magenta), #FF6B35); color: #fff;
  box-shadow: 0 10px 32px -8px rgba(255, 46, 136, .6), inset 0 1px 0 rgba(255, 255, 255, .28);
  transition: transform .16s, box-shadow .16s;
}
.hp-btn-lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px -8px rgba(255, 46, 136, .78), inset 0 1px 0 rgba(255, 255, 255, .32);
}
.hp-btn-ghost {
  display: inline-flex; align-items: center; gap: 10px; padding: 16px 26px; border-radius: 12px;
  border: 1px solid var(--hp-line-str); background: rgba(255, 248, 231, .035); color: var(--hp-hua);
  cursor: pointer; font-size: 14.5px; font-weight: 600; text-decoration: none;
  transition: border-color .18s, background .18s;
}
.hp-btn-ghost:hover { border-color: rgba(0, 240, 255, .44); background: rgba(0, 240, 255, .07); }

.hp-stats { display: flex; gap: 34px; margin-top: 38px; padding-top: 28px; border-top: 1px solid var(--hp-line); }
.hp-stat b {
  display: block; font-family: 'JetBrains Mono', monospace; font-size: 29px; font-weight: 700;
  color: var(--hp-hua); text-shadow: 0 0 20px rgba(0, 240, 255, .32); margin-bottom: 4px;
}
.hp-stat span { font-size: 12px; color: var(--hp-dim); }

/* ── 右侧积分面板 ── */
.hp-pane {
  border: 1px solid var(--hp-line-str); border-radius: 16px; padding: 22px 24px;
  background: linear-gradient(170deg, rgba(255, 248, 231, .045), rgba(255, 248, 231, .012));
  box-shadow: inset 0 1px 0 rgba(255, 248, 231, .08), 0 24px 54px -30px rgba(0, 0, 0, .9);
}
.hp-pane-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.hp-pane-label {
  display: block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
  letter-spacing: .17em; color: var(--hp-dim2); text-transform: uppercase;
}
.hp-led {
  display: inline-block; margin-top: 9px; padding: 6px 16px; border-radius: 9px;
  background: rgba(0, 0, 0, .5); border: 1px solid var(--hp-line-str);
}
.hp-led-num {
  font-family: 'JetBrains Mono', monospace; font-size: 38px; font-weight: 700; line-height: 1.1;
  color: var(--hp-gold-hi); letter-spacing: .02em;
  text-shadow: 0 0 8px rgba(255, 224, 160, .6), 0 0 26px rgba(255, 192, 51, .5);
}
.hp-pane-unit { display: block; font-size: 11.5px; color: var(--hp-dim2); margin-top: 9px; }
.hp-pane-r { text-align: right; }
.hp-pane-r .hp-pane-label { margin-bottom: 7px; }
.hp-led-mini {
  font-family: 'JetBrains Mono', monospace; font-size: 15px; color: var(--hp-cyan);
  text-shadow: 0 0 12px rgba(0, 240, 255, .5);
}
.hp-pane-rule {
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  padding: 10px 0; border-top: 1px dashed var(--hp-line-str);
  font-size: 12.5px; color: var(--hp-dim);
}
.hp-pane-rule strong {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--hp-hua); font-weight: 700;
}

/* ── 计费横幅 ── */
.hp-ticker {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-top: 8px; padding: 15px 22px; border-radius: 14px;
  border: 1px solid rgba(255, 46, 136, .3);
  background: linear-gradient(100deg, rgba(255, 46, 136, .09), rgba(255, 192, 51, .05));
}
.hp-ticker-tag {
  font-family: 'Archivo Black', var(--font-body); font-size: 11.5px; color: #fff;
  padding: 6px 12px; border-radius: 6px; background: var(--hp-magenta);
  box-shadow: 0 0 18px rgba(255, 46, 136, .55);
}
.hp-ticker-txt { flex: 1; min-width: 220px; font-size: 13.5px; color: var(--hp-hua); }
.hp-ticker-txt b { font-family: 'JetBrains Mono', monospace; color: var(--hp-gold-hi); }

/* ── 项目区 ── */
.hp-sec { margin-top: 44px; }
.hp-sec-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
.hp-sec-title { font-family: 'Archivo Black', var(--font-body); font-size: 23px; letter-spacing: .01em; color: var(--hp-hua); }
.hp-sec-sub { font-size: 13px; color: var(--hp-dim); margin-top: 6px; }

.hp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(292px, 1fr)); gap: 20px; padding-bottom: 58px; }
.hp-card {
  border: 1px solid var(--hp-line); border-radius: 16px; overflow: hidden; cursor: pointer;
  background: linear-gradient(165deg, rgba(255, 248, 231, .05), rgba(255, 248, 231, .01));
  transition: transform .2s, border-color .2s, box-shadow .2s;
}
.hp-card:hover {
  transform: translateY(-4px); border-color: rgba(255, 46, 136, .5);
  box-shadow: 0 20px 46px -20px rgba(255, 46, 136, .42);
}
.hp-skeleton { height: 190px; animation: hpShimmer 1.5s infinite; }
@keyframes hpShimmer { 0% { opacity: .5; } 50% { opacity: .85; } 100% { opacity: .5; } }

.hp-card-strip {
  display: flex; justify-content: space-around; padding: 8px 14px;
  border-bottom: 1px solid var(--hp-line); background: rgba(0, 0, 0, .26);
}
.hp-card-strip i { width: 9px; height: 7px; border-radius: 2px; background: rgba(255, 248, 231, .12); transition: background .2s; }
.hp-card:hover .hp-card-strip i:nth-child(2) { background: var(--hp-magenta); box-shadow: 0 0 9px var(--hp-magenta); }
.hp-card:hover .hp-card-strip i:nth-child(4) { background: var(--hp-cyan); box-shadow: 0 0 9px var(--hp-cyan); }

.hp-card-body { padding: 17px 18px; }
.hp-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 11px; }
.hp-ep {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: .06em;
  color: var(--hp-cyan); padding: 3px 9px; border-radius: 5px;
  border: 1px solid rgba(0, 240, 255, .3); background: rgba(0, 240, 255, .07);
}
.hp-del {
  width: 26px; height: 26px; border-radius: 6px; display: grid; place-items: center; cursor: pointer;
  border: 1px solid transparent; background: transparent; color: var(--hp-dim); opacity: 0; transition: all .18s;
}
.hp-card:hover .hp-del { opacity: 1; }
.hp-del:hover { border-color: rgba(255, 46, 136, .5); color: var(--hp-magenta); background: rgba(255, 46, 136, .1); }
.hp-card-title { font-size: 15.5px; font-weight: 700; line-height: 1.42; margin-bottom: 12px; color: var(--hp-hua); }
.hp-card-meta { display: flex; gap: 13px; flex-wrap: wrap; font-size: 12px; color: var(--hp-dim); }
.hp-card-meta span { display: inline-flex; align-items: center; gap: 4px; }
.hp-style-tag {
  padding: 2px 8px; border-radius: 99px; font-family: 'JetBrains Mono', monospace; font-size: 11px;
  border: 1px solid rgba(255, 192, 51, .3); background: rgba(255, 192, 51, .09); color: var(--hp-gold-hi);
}
.hp-card-foot {
  padding: 12px 18px 15px; border-top: 1px solid var(--hp-line);
  display: flex; align-items: center; gap: 12px;
}
.hp-prog { flex: 1; height: 4px; border-radius: 99px; background: rgba(255, 248, 231, .09); overflow: hidden; }
.hp-prog i {
  display: block; height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--hp-cyan), var(--hp-magenta));
  box-shadow: 0 0 11px rgba(0, 240, 255, .5);
}
.hp-pct { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--hp-dim2); }

.hp-empty {
  grid-column: 1 / -1; border: 1.5px dashed rgba(255, 248, 231, .18); border-radius: 16px;
  padding: 54px 30px; text-align: center; cursor: pointer; transition: all .2s;
}
.hp-empty:hover { border-color: var(--hp-magenta); background: rgba(255, 46, 136, .05); }
.hp-empty-t { font-size: 14.5px; font-weight: 700; margin: 12px 0 6px; }
.hp-empty-d { font-size: 12.5px; color: var(--hp-dim); }

/* ── 页脚 ── */
.hp-foot { position: relative; z-index: 2; border-top: 1px solid var(--hp-line); padding: 28px 0 42px; }
.hp-foot-in { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
.hp-foot-brand { font-family: 'Archivo Black', var(--font-body); font-size: 14px; }
.hp-foot-brand em { font-style: normal; color: var(--hp-magenta); }
.hp-foot-links { display: flex; gap: 22px; }
.hp-foot-links a { font-size: 12.5px; color: var(--hp-dim); text-decoration: none; transition: color .18s; }
.hp-foot-links a:hover { color: var(--hp-hua); }
.hp-foot-c { font-size: 12px; color: var(--hp-dim2); font-family: 'JetBrains Mono', monospace; }

/* ── 弹窗 ── */
.hp-mask {
  position: fixed; inset: 0; z-index: 100; display: grid; place-items: center;
  background: rgba(4, 6, 12, .85); backdrop-filter: blur(6px); padding: 20px;
}
.hp-modal {
  width: 100%; max-width: 470px; border-radius: 18px; padding: 30px;
  border: 1px solid var(--hp-line-str); background: linear-gradient(165deg, #141A2C, #0A0F1C);
  box-shadow: 0 44px 96px -30px rgba(0, 0, 0, .96);
}
.hp-modal-title { font-family: 'Archivo Black', var(--font-body); font-size: 20px; margin-bottom: 7px; color: var(--hp-hua); }
.hp-modal-desc { font-size: 13px; color: var(--hp-dim); margin-bottom: 22px; }
.hp-fld { margin-bottom: 16px; }
.hp-fld label { display: block; font-size: 12.5px; font-weight: 600; margin-bottom: 7px; }
.hp-fld input {
  width: 100%; padding: 11px 13px; border-radius: 9px; font-size: 13.5px;
  font-family: var(--font-body); border: 1px solid var(--hp-line);
  background: rgba(0, 0, 0, .34); color: var(--hp-hua); outline: none;
  transition: border-color .18s, box-shadow .18s;
}
.hp-fld input:focus { border-color: var(--hp-magenta); box-shadow: 0 0 0 3px rgba(255, 46, 136, .14); }
.hp-fld-row { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.hp-modal-act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.hp-btn-cancel {
  padding: 11px 20px; border-radius: 9px; cursor: pointer; font-family: var(--font-body);
  font-size: 13.5px; font-weight: 600; border: 1px solid var(--hp-line); background: transparent; color: var(--hp-dim);
}
.hp-btn-ok {
  padding: 11px 22px; border-radius: 9px; cursor: pointer; border: none; font-family: var(--font-body);
  font-size: 13.5px; font-weight: 800; color: #fff;
  background: linear-gradient(135deg, var(--hp-magenta), #FF6B35);
  box-shadow: 0 8px 26px -8px rgba(255, 46, 136, .7);
}

/* 深色底上：BaseSelect 默认走全局浅色变量，需要整体压暗 */
.hp-fld :deep(.base-select-trigger) {
  background: rgba(0, 0, 0, .34) !important;
  border: 1px solid var(--hp-line) !important;
  color: var(--hp-hua) !important;
}
.hp-fld :deep(.base-select-label) { color: var(--hp-hua) !important; }
.hp-fld :deep(.base-select-dropdown) {
  background: #141A2C !important;
  border: 1px solid var(--hp-line-str) !important;
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, .9) !important;
}
.hp-fld :deep(.base-select-search-input) {
  background: rgba(0, 0, 0, .4) !important;
  border: 1px solid var(--hp-line) !important;
  color: var(--hp-hua) !important;
}
.hp-fld :deep(.base-select-option) { color: var(--hp-dim) !important; }
.hp-fld :deep(.base-select-option:hover),
.hp-fld :deep(.base-select-option.highlighted) {
  background: rgba(255, 46, 136, .18) !important;
  color: var(--hp-hua) !important;
}
.hp-fld :deep(.base-select-option.selected) { color: var(--hp-cyan) !important; }

/* ── 窄屏菜单（宽屏隐藏） ── */
.hp-burger { display: none; }

@media (max-width: 1000px) {
  .hp-wrap { padding: 0 20px; }
  .hp-hero { grid-template-columns: 1fr; gap: 34px; padding: 44px 20px; }
  .hp-nav-links { display: none; }
  .hp-burger {
    display: grid; place-items: center; position: relative;
    width: 38px; height: 38px; border-radius: 9px; cursor: pointer;
    border: 1px solid var(--hp-line); background: rgba(255, 248, 231, .05);
  }
  .hp-burger span {
    position: absolute; left: 50%; top: 50%;
    width: 16px; height: 1.6px; background: var(--hp-hua); border-radius: 2px;
    transition: transform .18s, opacity .18s;
  }
  .hp-burger span:nth-child(1) { transform: translate(-50%, calc(-50% - 5px)); }
  .hp-burger span:nth-child(2) { transform: translate(-50%, -50%); }
  .hp-burger span:nth-child(3) { transform: translate(-50%, calc(-50% + 5px)); }
  .hp-burger.is-open span:nth-child(1) { transform: translate(-50%, -50%) rotate(45deg); }
  .hp-burger.is-open span:nth-child(2) { opacity: 0; }
  .hp-burger.is-open span:nth-child(3) { transform: translate(-50%, -50%) rotate(-45deg); }
}
@media (max-width: 700px) {
  .hp-wallet { display: none; }
  .hp-nav-right .hp-btn-gold { display: none; }
  .hp-hero { padding: 34px 20px; }
  .hp-title { font-size: clamp(34px, 9vw, 46px); }
  .hp-stats { gap: 20px; }
  .hp-fld-row { grid-template-columns: 1fr; }
  .hp-sec-head { flex-direction: column; align-items: flex-start; gap: 14px; }
}
@media (max-width: 560px) {
  .hp-eyebrow { font-size: 10px; }
  .hp-brand-name { font-size: 17px; }
}

/* 窄屏菜单面板 */
.hp-menu {
  display: none;
  border-top: 1px solid var(--hp-line);
  background: rgba(10, 14, 26, .97);
  padding: 12px 20px 18px;
}
@media (max-width: 1000px) {
  .hp-menu { display: block; }
}
.hp-menu-link {
  display: block; padding: 12px 4px; font-size: 14px; color: var(--hp-hua);
  text-decoration: none; border-bottom: 1px solid var(--hp-line);
}
.hp-menu-link:hover { color: var(--hp-cyan); }
.hp-menu-credit {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 14px 4px 16px; font-size: 13px; color: var(--hp-dim);
}
.hp-menu-credit-label { font-size: 12px; }
.hp-menu-credit strong {
  font-family: 'JetBrains Mono', monospace; font-size: 16px; color: var(--hp-gold-hi);
}
.hp-menu-btn { width: 100%; justify-content: center; border-radius: 9px; }

/* 无障碍：键盘聚焦可见 */
.hp-nav-link:focus-visible,
.hp-btn-gold:focus-visible,
.hp-btn-lg:focus-visible,
.hp-btn-ghost:focus-visible,
.hp-btn-cancel:focus-visible,
.hp-btn-ok:focus-visible,
.hp-del:focus-visible,
.hp-burger:focus-visible,
.hp-brand:focus-visible,
.hp-menu-link:focus-visible,
.hp-foot-links a:focus-visible {
  outline: 2px solid var(--hp-cyan);
  outline-offset: 2px;
  border-radius: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .hp-petals :deep(.hp-petal),
  .hp-eyebrow i,
  .hp-skeleton { animation: none; }
  .hp-card, .hp-btn-gold, .hp-btn-lg { transition: none; }
}
</style>
