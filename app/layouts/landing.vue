<script setup lang="ts">
// Nuxt UI locale synced with i18n
const nuxtUiLocale = useNuxtUiLocale()
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <slot />
  </UApp>
</template>
