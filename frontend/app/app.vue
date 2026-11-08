<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="top-right" theme="dark" rich-colors close-button :duration="3000" />
</template>

<script setup>
import { Toaster } from 'vue-sonner'

const { t } = useLocale()
useHead({ title: () => t('app.title') })
</script>

<style>
@import url('./assets/studio.css');
</style>
