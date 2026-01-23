<script setup lang="ts">
import { RelationType } from '~/types/database'
import type { ReferentialAction } from '~/types/database'

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

// Open state based on editingRelation
const isOpen = computed({
  get: () => !!projectStore.editingRelation.value,
  set: (val) => {
    if (!val) {
      projectStore.closeRelationEditor()
    }
  }
})

// Reference to the relation being edited
const relation = computed(() => projectStore.editingRelation.value)

// Options for relation types
const relationTypeOptions = computed(() => [
  {
    label: t('relation.one_to_one'),
    value: RelationType.ONE_TO_ONE,
    description: '1:1'
  },
  {
    label: t('relation.one_to_many'),
    value: RelationType.ONE_TO_MANY,
    description: '1:N'
  },
  {
    label: t('relation.many_to_many'),
    value: RelationType.MANY_TO_MANY,
    description: 'N:M'
  }
])

// Options for referential actions
const referentialActionOptions = computed(() => [
  { label: t('relation.no_action'), value: 'NO ACTION' as ReferentialAction },
  { label: t('relation.cascade'), value: 'CASCADE' as ReferentialAction },
  { label: t('relation.set_null'), value: 'SET NULL' as ReferentialAction },
  { label: t('relation.restrict'), value: 'RESTRICT' as ReferentialAction }
])

// List of available tables
const tableOptions = computed(() => {
  if (!projectStore.currentProject.value) return []

  return projectStore.currentProject.value.tables.map(table => ({
    label: table.name,
    value: table.id
  }))
})

// Source table columns
const sourceColumnOptions = computed(() => {
  if (!relation.value || !projectStore.currentProject.value) return []

  const table = projectStore.currentProject.value.tables.find(
    t => t.id === relation.value?.sourceTableId
  )

  if (!table) return []

  return table.columns.map(col => ({
    label: col.name,
    value: col.id,
    type: col.type
  }))
})

// Target table columns
const targetColumnOptions = computed(() => {
  if (!relation.value || !projectStore.currentProject.value) return []

  const table = projectStore.currentProject.value.tables.find(
    t => t.id === relation.value?.targetTableId
  )

  if (!table) return []

  return table.columns.map(col => ({
    label: col.name,
    value: col.id,
    type: col.type
  }))
})

// Table names for display
const sourceTableName = computed(() => {
  if (!relation.value) return ''
  const table = projectStore.getTable(relation.value.sourceTableId)
  return table?.name || ''
})

const targetTableName = computed(() => {
  if (!relation.value) return ''
  const table = projectStore.getTable(relation.value.targetTableId)
  return table?.name || ''
})

/**
 * Updates a relation property
 */
const updateRelation = (key: string, value: any) => {
  if (!relation.value) return

  projectStore.updateRelation(relation.value.id, { [key]: value })

  // Update edge in canvas
  canvasStore.updateEdge(relation.value.id, { [key]: value })
}

/**
 * Deletes the relation
 */
const deleteRelation = () => {
  if (!relation.value) return

  const relationId = relation.value.id

  // Remove edge from canvas
  canvasStore.removeEdge(relationId)

  // Delete relation from project
  projectStore.deleteRelation(relationId)
}

/**
 * Saves and closes the modal
 */
const saveAndClose = () => {
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('relation.edit')"
    :description="t('relation.edit_description')"
    :close="true"
  >
    <template #body>
      <div
        v-if="relation"
        class="space-y-6"
      >
        <!-- Visual summary of the relation -->
        <div class="p-4 bg-elevated rounded-lg text-center">
          <div class="flex items-center justify-center gap-3">
            <span class="font-mono text-sm font-semibold">{{ sourceTableName }}</span>
            <UIcon
              name="i-lucide-arrow-right"
              class="size-5 text-muted"
            />
            <span class="font-mono text-sm font-semibold">{{ targetTableName }}</span>
          </div>
        </div>

        <!-- Relation type -->
        <UFormField :label="t('relation.type')">
          <USelectMenu
            :model-value="relation.type"
            :items="relationTypeOptions"
            value-key="value"
            class="w-full"
            @update:model-value="updateRelation('type', $event)"
          >
            <template #trailing="{ item }">
              <span class="text-xs text-muted font-mono">{{ item?.description }}</span>
            </template>
          </USelectMenu>
        </UFormField>

        <USeparator />

        <!-- Source table and column -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField :label="t('relation.source_table')">
            <USelectMenu
              :model-value="relation.sourceTableId"
              :items="tableOptions"
              value-key="value"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('relation.source_column')">
            <USelectMenu
              :model-value="relation.sourceColumnId"
              :items="sourceColumnOptions"
              value-key="value"
              class="w-full"
              @update:model-value="updateRelation('sourceColumnId', $event)"
            >
              <template #trailing="{ item }">
                <span class="text-xs text-muted font-mono">{{ item?.type }}</span>
              </template>
            </USelectMenu>
          </UFormField>
        </div>

        <!-- Target table and column -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField :label="t('relation.target_table')">
            <USelectMenu
              :model-value="relation.targetTableId"
              :items="tableOptions"
              value-key="value"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('relation.target_column')">
            <USelectMenu
              :model-value="relation.targetColumnId"
              :items="targetColumnOptions"
              value-key="value"
              class="w-full"
              @update:model-value="updateRelation('targetColumnId', $event)"
            >
              <template #trailing="{ item }">
                <span class="text-xs text-muted font-mono">{{ item?.type }}</span>
              </template>
            </USelectMenu>
          </UFormField>
        </div>

        <USeparator />

        <!-- Referential actions -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField :label="t('relation.on_delete')">
            <USelectMenu
              :model-value="relation.onDelete || 'NO ACTION'"
              :items="referentialActionOptions"
              value-key="value"
              class="w-full"
              @update:model-value="updateRelation('onDelete', $event)"
            />
          </UFormField>

          <UFormField :label="t('relation.on_update')">
            <USelectMenu
              :model-value="relation.onUpdate || 'NO ACTION'"
              :items="referentialActionOptions"
              value-key="value"
              class="w-full"
              @update:model-value="updateRelation('onUpdate', $event)"
            />
          </UFormField>
        </div>

        <USeparator />

        <!-- Danger zone -->
        <div>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            block
            @click="deleteRelation"
          >
            {{ t('relation.delete') }}
          </UButton>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="isOpen = false"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton @click="saveAndClose">
          {{ t('common.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
