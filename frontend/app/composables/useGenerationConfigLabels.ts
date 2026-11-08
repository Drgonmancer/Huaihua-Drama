import { useCredits } from './useCredits'

/** 对外展示用：不暴露 provider / model / API / 云雾等信息，只展示扣费规则 */
export function useGenerationConfigLabels() {
  const { t } = useLocale()
  const { agentCost, imageCost, videoPricingHint, refresh } = useCredits()

  const imagePricingHint = computed(() => t('credits.image.perImage', { n: imageCost.value }))
  const agentPricingHint = computed(() => t('credits.agent.perCall', { n: agentCost.value }))
  const audioPricingHint = computed(() => t('credits.audio.freeOptional'))

  function planSuffix(index: number) {
    return index > 0 ? ` · ${t('credits.plan', { n: index + 1 })}` : ''
  }

  function imageConfigOptionLabel(_config?: unknown, index = 0) {
    return t('credits.image.standard', { n: imageCost.value, suffix: planSuffix(index) })
  }

  function videoConfigOptionLabel(_config?: unknown, index = 0) {
    return t('credits.video.short', { hint: videoPricingHint.value, suffix: planSuffix(index) })
  }

  function audioConfigOptionLabel(config?: { id?: number; name?: string } | null) {
    if (!config) return t('credits.audio.none')
    return t('credits.audio.compose')
  }

  function lockedImageLabel() {
    return imagePricingHint.value
  }

  function lockedVideoLabel() {
    return videoPricingHint.value
  }

  return {
    agentCost,
    imageCost,
    videoPricingHint,
    imagePricingHint,
    agentPricingHint,
    audioPricingHint,
    imageConfigOptionLabel,
    videoConfigOptionLabel,
    audioConfigOptionLabel,
    lockedImageLabel,
    lockedVideoLabel,
    refreshCredits: refresh,
  }
}
