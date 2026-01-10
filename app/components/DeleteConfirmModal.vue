<script setup lang="ts">
const { t } = useI18n()
const deleteConfirm = useDeleteConfirm()
</script>

<template>
  <UModal v-model:open="deleteConfirm.isOpen.value">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-500" />
            <span class="font-semibold">{{ t('common.confirm') }}</span>
          </div>
        </template>

        <p class="text-muted">
          <template v-if="deleteConfirm.targetType.value === 'table'">
            {{ deleteConfirm.targetCount.value > 1
              ? t('confirm.delete_tables', { count: deleteConfirm.targetCount.value })
              : t('table.confirm_delete')
            }}
          </template>
          <template v-else-if="deleteConfirm.targetType.value === 'group'">
            {{ deleteConfirm.targetCount.value > 1
              ? t('confirm.delete_groups', { count: deleteConfirm.targetCount.value })
              : t('group.confirm_delete')
            }}
            <br>
            <span class="text-sm text-amber-600">{{ t('group.delete_warning') }}</span>
          </template>
          <template v-else-if="deleteConfirm.targetType.value === 'note'">
            {{ deleteConfirm.targetCount.value > 1
              ? t('confirm.delete_notes', { count: deleteConfirm.targetCount.value })
              : t('note.confirm_delete')
            }}
          </template>
          <template v-else-if="deleteConfirm.targetType.value === 'relation'">
            {{ deleteConfirm.targetCount.value > 1
              ? t('confirm.delete_relations', { count: deleteConfirm.targetCount.value })
              : t('relation.confirm_delete')
            }}
          </template>
          <template v-else>
            {{ t('confirm.delete_elements', { count: deleteConfirm.targetCount.value }) }}
          </template>
        </p>

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
      </UCard>
    </template>
  </UModal>
</template>
