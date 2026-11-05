function resolveAppBase(): string {
  if (typeof window !== 'undefined') {
    const nuxtBase = (window as any).__NUXT__?.config?.app?.baseURL as string | undefined
    if (nuxtBase && nuxtBase !== './' && nuxtBase !== '/') {
      return nuxtBase.replace(/\/$/, '')
    }
  }

  // dev 模式下 Vite 的 BASE_URL 是构建资源目录（/_nuxt/），不是应用基座；
  // 此时应用运行在根路径，API 直接走 /api/v1
  if (import.meta.dev) return ''

  const envBase = import.meta.env.BASE_URL || '/'
  if (envBase && envBase !== './') {
    return envBase.replace(/\/$/, '')
  }

  return '/huobao-drama'
}

/** KPI 子路径部署时 API 必须带 /huobao-drama 前缀 */
export function apiBasePath() {
  return `${resolveAppBase()}/api/v1`
}

/** 静态资源（/static/...）在子路径下也需带 /huobao-drama 前缀 */
export function staticUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const clean = String(path).replace(/^\/+/, '')
  return `${resolveAppBase()}/${clean}`
}
