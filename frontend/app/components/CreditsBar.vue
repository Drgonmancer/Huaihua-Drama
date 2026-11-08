<template>
  <div class="credits-bar" :class="{ compact }">
    <span class="credits-user">{{ displayUsername }}</span>
    <span class="credits-value" :class="{ pulse: loading && info }">{{ creditLabel }}</span>
    <span v-if="!compact && info" class="credits-pricing">
      {{ $t('components.credits.pricing', { agent: info.agentCost, image: info.imageCost, video: videoPricingHint }) }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  compact: { type: Boolean, default: false },
})

const { t } = useLocale()

const POLL_MS = 20_000

const { info, loading, refresh, videoPricingHint } = useCredits()

const creditLabel = computed(() => {
  if (loading.value && !info.value) return t('components.credits.loading')
  if (!info.value) return '—'
  if (info.value.skipCredits) return t('components.credits.localCredits', { n: info.value.credits })
  return info.value.creditsAvailable
    ? t('components.credits.credits', { n: info.value.credits })
    : t('components.credits.syncing')
})

// 后端默认用户名是中文「用户」，展示层翻译为当前语言的通用用户名
const displayUsername = computed(() => {
  const name = info.value?.username
  return !name || name === '用户' ? t('components.credits.user') : name
})

let pollTimer = null

function onFocus() {
  void refresh()
}

onMounted(() => {
  void refresh()
  pollTimer = setInterval(() => { void refresh() }, POLL_MS)
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', onVisibility)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  window.removeEventListener('focus', onFocus)
  document.removeEventListener('visibilitychange', onVisibility)
})

function onVisibility() {
  if (document.visibilityState === 'visible') void refresh()
}

defineExpose({ refresh })
</script>

<style scoped>
.credits-bar::before {
  content: ''; flex-shrink: 0; width: 14px; height: 14px; border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, var(--gold-hi), var(--gold) 58%, var(--hp-gold-lo));
  box-shadow: 0 0 10px rgba(255, 192, 51, .25);
}
.credits-bar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 192, 51, .32);
  background: linear-gradient(180deg, rgba(255, 192, 51, .12), rgba(255, 192, 51, .04));
  box-shadow: inset 0 1px 0 rgba(255, 224, 160, .12);
  font-size: 12px;
  color: var(--text-2, #aaa);
  white-space: nowrap;
}
.credits-bar.compact { gap: 6px; padding: 5px 10px; }
.credits-user { color: var(--text-3, #888); max-width: 88px; overflow: hidden; text-overflow: ellipsis; }
.credits-value { font-family: var(--font-mono); font-weight: 700; color: var(--gold-hi); font-variant-numeric: tabular-nums; }
.credits-value.pulse { opacity: 0.72; }
.credits-pricing { color: var(--text-3, #888); font-size: 11px; }
</style>
