<template>
  <a :href="kpiHomeUrl" class="kpi-home-link" :class="{ compact }" :title="$t('components.kpiHome.title')">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>
    </svg>
    <span>{{ $t('components.kpiHome.backHome') }}</span>
  </a>
</template>

<script setup>
defineProps({
  compact: { type: Boolean, default: false },
})

/** 跳出子应用，回到 KPI 主站首页（非 huobao-drama 内部路由） */
const kpiHomeUrl = '/'
</script>

<style scoped>
.kpi-home-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius, 8px);
  border: 1px solid var(--border, rgba(27, 41, 64, 0.12));
  background: transparent;
  color: var(--text-2, #64748b);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.kpi-home-link:hover {
  color: var(--text-0, #1e293b);
  border-color: var(--cyan-border);
  background: var(--cyan-bg);
}
.kpi-home-link.compact {
  padding: 5px 10px;
  font-size: 12px;
}
</style>
