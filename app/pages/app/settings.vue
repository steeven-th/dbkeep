<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
</script>

<template>
  <div class="settings-page bg-muted p-8 overflow-auto">
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-2xl font-bold">
          {{ t('settings.title') }}
        </h1>
        <p class="text-muted">
          {{ t('settings.description') }}
        </p>
      </div>

      <!-- Preferences Section -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-settings-2"
              class="w-5 h-5 text-primary"
            />
            <span class="font-semibold">{{ t('settings.preferences') }}</span>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Theme -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">
                {{ t('settings.theme') }}
              </p>
              <p class="text-sm text-muted">
                {{ t('settings.theme_description') }}
              </p>
            </div>
            <UColorModeSelect />
          </div>

          <!-- Language -->
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">
                {{ t('settings.language') }}
              </p>
              <p class="text-sm text-muted">
                {{ t('settings.language_description') }}
              </p>
            </div>
            <LanguageSelect />
          </div>
        </div>
      </UCard>

      <!-- About Section -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-info"
              class="w-5 h-5 text-primary"
            />
            <span class="font-semibold">{{ t('settings.about') }}</span>
          </div>
        </template>

        <div class="space-y-2 text-sm text-muted">
          <p>
            <strong>DBKeep</strong> - {{ t('settings.about_description') }}
          </p>
          <p>
            {{ t('settings.version') }}: 0.1.0
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  height: calc(100vh - 3.5rem); /* 3.5rem = h-14 navbar height */
}
</style>
