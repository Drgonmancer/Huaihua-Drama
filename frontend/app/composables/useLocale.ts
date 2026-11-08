import { useI18n } from 'vue-i18n'

/** 全局语言切换封装：切换即时生效并持久化到 localStorage */
export function useLocale() {
  const { t, locale } = useI18n()

  function setLocale(lang: string) {
    locale.value = lang
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hh-locale', lang)
    }
  }

  return { t, locale, setLocale }
}
