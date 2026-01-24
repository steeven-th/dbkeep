<script setup lang="ts">
import type { SortOption } from '~/composables/useProjectFilters'

const { t } = useI18n()

// v-model bindings
const searchQuery = defineModel<string>('search', { default: '' })
const selectedEngine = defineModel<string | null>('engine', { default: null })
const selectedSort = defineModel<SortOption>('sort', { default: 'updated_desc' })

// Options passed from parent (from useProjectFilters)
defineProps<{
  sortOptions: { label: string; value: string }[]
  engineOptions: { label: string; value: string | null }[]
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <UInput
      v-model="searchQuery"
      :placeholder="t('project.search_placeholder')"
      icon="i-lucide-search"
      class="flex-1"
    />
    <USelect
      v-model="selectedEngine"
      :items="engineOptions"
      value-key="value"
      class="w-full sm:w-40"
    />
    <USelect
      v-model="selectedSort"
      :items="sortOptions"
      value-key="value"
      icon="i-lucide-arrow-up-down"
      class="w-full sm:w-48"
    />
  </div>
</template>
