<template>
  <div class="shell">
    <header class="header">
      <NuxtLink to="/" class="brand" :aria-label="$t('home.brand.aria')">
        <span class="brand-mark" aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 21c0-5 3-9 8-10-1 6-4 9-8 10z" />
            <path d="M12 21c0-5-3-9-8-10 1 6 4 9 8 10z" />
            <path d="M12 21v-7" />
          </svg>
        </span>
        <span class="brand-name">{{ $t('home.brand.name') }}<em>{{ $t('home.brand.em') }}</em></span>
      </NuxtLink>

      <nav class="header-nav" :aria-label="$t('home.nav.label')">
        <NuxtLink to="/" class="nav-link" :class="{ active: route.path === '/' || route.path.startsWith('/drama/') }">{{ $t('home.nav.projects') }}</NuxtLink>
        <NuxtLink to="/settings" class="nav-link" :class="{ active: route.path === '/settings' }">{{ $t('home.nav.settings') }}</NuxtLink>
      </nav>

      <div class="header-right">
        <KpiHomeLink compact />
        <CreditsBar compact />
      </div>
    </header>
    <main class="content"><slot /></main>
  </div>
</template>

<script setup>
const route = useRoute()
</script>

<style scoped>
.shell {
  display: flex; flex-direction: column; height: 100vh; height: 100dvh; overflow: hidden;
  background: var(--page-background); background-size: auto, auto, 72px 72px, 72px 72px, auto;
}
.header {
  display: flex; align-items: center; flex-shrink: 0; min-height: 68px; gap: 34px;
  padding: 0 max(24px, calc((100vw - 1232px) / 2));
  background: rgba(10, 14, 26, .92); border-bottom: 1px solid var(--border);
  backdrop-filter: blur(22px); position: relative; z-index: 60;
}
.brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; flex-shrink: 0; }
.brand-mark {
  width: 37px; height: 37px; border-radius: 10px; display: grid; place-items: center; color: #fff;
  background: linear-gradient(145deg, var(--accent), var(--gold));
  box-shadow: 0 0 22px rgba(255, 46, 136, .35);
}
.brand-name { font-family: var(--font-display); font-size: 19px; letter-spacing: .02em; color: var(--text-0); }
.brand-name em { font-style: normal; color: var(--accent); text-shadow: 0 0 16px rgba(255, 46, 136, .45); }
.header-nav { display: flex; align-items: center; gap: 23px; }
.nav-link {
  position: relative; padding: 22px 0; font-size: 13px; color: var(--text-2);
  text-decoration: none; font-weight: 500; transition: color .18s;
}
.nav-link:hover { color: var(--text-0); }
.nav-link.active { color: var(--text-0); text-shadow: 0 0 14px rgba(0, 240, 255, .45); }
.nav-link.active::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: var(--cyan); box-shadow: 0 0 10px var(--cyan-bg);
}
.header-right { display: flex; align-items: center; gap: 12px; margin-left: auto; min-width: 0; }
.content { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
@media (max-width: 800px) {
  .header { gap: 22px; padding: 0 20px; }
  .header-right { gap: 8px; }
  .header-right :deep(.credits-user) { display: none; }
}
@media (max-width: 620px) {
  .header { flex-wrap: wrap; min-height: 102px; padding: 14px 16px 0; gap: 0 18px; }
  .brand-name { font-size: 17px; }
  .brand-mark { width: 32px; height: 32px; }
  .header-right { gap: 6px; }
  .header-right :deep(.kpi-home-link) { padding: 6px; }
  .header-right :deep(.kpi-home-link span) { display: none; }
  .header-nav { order: 3; width: 100%; gap: 26px; }
  .nav-link { padding: 12px 0; }
  .header-right :deep(.credits-bar) { padding: 6px 9px; font-size: 11px; }
}
</style>
