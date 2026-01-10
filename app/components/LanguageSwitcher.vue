<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { locale, locales, setLocale } = useI18n()

// Locale courante avec son nom
const currentLocale = computed(() => {
  const loc = (locales.value as { code: string; name: string }[]).find(l => l.code === locale.value)
  return loc?.name || locale.value
})

// Items du dropdown pour les langues
const localeItems = computed<DropdownMenuItem[][]>(() => [
  (locales.value as { code: string; name: string }[]).map(loc => ({
    label: loc.name,
    icon: locale.value === loc.code ? 'i-lucide-check' : undefined,
    onSelect: () => setLocale(loc.code)
  }))
])
</script>

<template>
  <UDropdownMenu :items="localeItems">
    <UButton
      icon="i-lucide-languages"
      variant="ghost"
      color="neutral"
    />
  </UDropdownMenu>
</template>
