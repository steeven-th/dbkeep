<script setup lang="ts">
import type { SqlParseError } from '~/composables/useSqlParser'

const props = defineProps<{
  show: boolean
  hasErrors: boolean
  errors?: SqlParseError[]
}>()

const emit = defineEmits<{
  apply: []
  cancel: []
}>()

const { t } = useI18n()

// Format error for display
const formatError = (error: SqlParseError): string => {
  if (error.line > 1 || error.column > 1) {
    return `Ligne ${error.line}, Col ${error.column}: ${error.message}`
  }
  return error.message
}
</script>

<template>
  <Transition name="overlay">
    <div
      v-if="show"
      class="sql-changes-overlay"
    >
      <div class="overlay-content">
        <!-- Icon -->
        <div class="icon-wrapper" :class="{ 'has-errors': hasErrors }">
          <UIcon
            :name="hasErrors ? 'i-lucide-alert-triangle' : 'i-lucide-code-2'"
            class="w-8 h-8"
          />
        </div>

        <!-- Message text -->
        <h3 class="text-lg font-semibold text-default">
          {{ hasErrors ? t('sql.has_errors') : t('sql.pending_changes') }}
        </h3>

        <p class="text-sm text-muted text-center max-w-md">
          {{ hasErrors ? t('sql.fix_errors_to_apply') : t('sql.apply_or_cancel') }}
        </p>

        <!-- Error list if present -->
        <div v-if="hasErrors && errors?.length" class="errors-list">
          <div
            v-for="(error, index) in errors"
            :key="index"
            class="error-item"
          >
            <UIcon name="i-lucide-x-circle" class="w-4 h-4 text-error shrink-0" />
            <span class="text-sm">{{ formatError(error) }}</span>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex items-center gap-3 mt-4">
          <UButton
            variant="soft"
            color="neutral"
            icon="i-lucide-x"
            @click="emit('cancel')"
          >
            {{ t('common.cancel') }}
          </UButton>

          <UButton
            :disabled="hasErrors"
            color="primary"
            icon="i-lucide-check"
            @click="emit('apply')"
          >
            {{ t('sql.apply_changes') }}
          </UButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sql-changes-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: var(--ui-bg);
  border-radius: 1rem;
  border: 1px solid var(--ui-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 90%;
  max-height: 80%;
  overflow-y: auto;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--ui-color-primary-50);
  color: var(--ui-color-primary-500);
  margin-bottom: 0.5rem;
}

.icon-wrapper.has-errors {
  background: var(--ui-color-error-50);
  color: var(--ui-color-error-500);
}

:root.dark .icon-wrapper {
  background: var(--ui-color-primary-950);
}

:root.dark .icon-wrapper.has-errors {
  background: var(--ui-color-error-950);
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.75rem;
  background: var(--ui-bg-muted);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: var(--ui-text-muted);
}

/* Transitions */
.overlay-enter-active,
.overlay-leave-active {
  transition: all 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-from .overlay-content,
.overlay-leave-to .overlay-content {
  transform: scale(0.95);
}
</style>
