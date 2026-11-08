import { createI18n } from 'vue-i18n'
import zhBase from '~/locales/zh.json'
import enBase from '~/locales/en.json'

// 每个页面一个语言文件：locales/{zh,en}/<namespace>.json，自动合并，避免多页迁移互相冲突
const zhModules = import.meta.glob('~/locales/zh/*.json', { eager: true })
const enModules = import.meta.glob('~/locales/en/*.json', { eager: true })

function deepMerge(target: Record<string, any>, source: Record<string, any>) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(target[key] && typeof target[key] === 'object' ? target[key] : {}, value)
    } else {
      target[key] = value
    }
  }
  return target
}

function collect(mods: Record<string, any>, base: Record<string, any>) {
  const messages = { ...base }
  for (const mod of Object.values(mods)) {
    deepMerge(messages, (mod as any).default ?? mod)
  }
  return messages
}

// SPA 无 SSR，直接从 localStorage 读取用户语言偏好
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('hh-locale') : null

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: saved || 'zh',
    fallbackLocale: 'zh',
    messages: {
      zh: collect(zhModules, zhBase),
      en: collect(enModules, enBase),
    },
  })
  // 必须装到 Vue 应用上，useI18n()/$t 才可用
  nuxtApp.vueApp.use(i18n)
})
