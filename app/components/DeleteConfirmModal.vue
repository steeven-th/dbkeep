<script setup lang="ts">
const { t } = useI18n()
const deleteConfirm = useDeleteConfirm()

// Dynamic description based on target type
const description = computed(() => {
  switch (deleteConfirm.targetType.value) {
    case 'table':
      return deleteConfirm.targetCount.value > 1
        ? t('confirm.delete_tables', { count: deleteConfirm.targetCount.value })
        : t('table.confirm_delete')
    case 'group':
      return deleteConfirm.targetCount.value > 1
        ? t('confirm.delete_groups', { count: deleteConfirm.targetCount.value })
        : t('group.confirm_delete')
    case 'note':
      return deleteConfirm.targetCount.value > 1
        ? t('confirm.delete_notes', { count: deleteConfirm.targetCount.value })
        : t('note.confirm_delete')
    case 'relation':
      return deleteConfirm.targetCount.value > 1
        ? t('confirm.delete_relations', { count: deleteConfirm.targetCount.value })
        : t('relation.confirm_delete')
    default:
      return t('confirm.delete_elements', { count: deleteConfirm.targetCount.value })
  }
})
</script>

<template>
  <UModal
    v-model:open="deleteConfirm.isOpen.value"
    :title="t('common.confirm')"
    :description="description"
    :icon="{ name: 'i-lucide-alert-triangle', class: 'text-error' }"
  >
    <template #body>
      <!-- Additional warning for groups -->
      <p
        v-if="deleteConfirm.targetType.value === 'group'"
        class="text-sm text-amber-600"
      >
        {{ t('group.delete_warning') }}
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="deleteConfirm.cancel"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          color="error"
          @click="deleteConfirm.confirm"
        >
          {{ t('common.delete') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
