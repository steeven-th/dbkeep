<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

// Liste des locales disponibles pour le select
const availableLocales = computed(() => {
  return (locales.value as { code: string, name: string }[]).map(l => ({
    label: l.name,
    value: l.code
  }))
})

// Gestion du changement de langue
const handleLocaleChange = (newLocale: string) => {
  setLocale(newLocale)
}
</script>

<template>
  <USelectMenu
    :model-value="locale"
    :items="availableLocales"
    value-key="value"
    class="w-32"
    @update:model-value="handleLocaleChange"
  />
</template>
