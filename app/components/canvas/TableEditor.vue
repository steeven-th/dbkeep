<script setup lang="ts">
import draggable from 'vuedraggable'
import { ColumnType, TABLE_COLORS } from '~/types/database'
import type { Column } from '~/types/database'

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const deleteConfirm = useDeleteConfirm()

// Local columns list for drag & drop
const localColumns = ref<Column[]>([])

// Sync local columns with table
watch(
  () => projectStore.editingTable.value?.columns,
  (columns) => {
    if (columns) {
      localColumns.value = [...columns]
    }
  },
  { immediate: true, deep: true }
)

// Called when order changes after drag & drop
const onDragEnd = () => {
  if (!table.value) return
  // Update column order in store
  projectStore.reorderColumns(table.value.id, localColumns.value)
  // Update canvas
  const updatedTable = projectStore.getTable(table.value.id)
  if (updatedTable) {
    canvasStore.updateNodeData(table.value.id, { columns: updatedTable.columns })
  }
}

// Types that require a length parameter
const typesWithLength = [
  ColumnType.CHAR,
  ColumnType.VARCHAR,
  ColumnType.BIT,
  ColumnType.VARBIT
]

// Types that require precision and scale
const typesWithPrecision = [
  ColumnType.DECIMAL,
  ColumnType.NUMERIC
]

// Types that require a dimension (vectors)
const typesWithDimension = [
  ColumnType.VECTOR,
  ColumnType.HALFVEC,
  ColumnType.SPARSEVEC
]

// Checks if a type needs the length field
const needsLength = (type: ColumnType) => typesWithLength.includes(type)

// Checks if a type needs the precision/scale fields
const needsPrecision = (type: ColumnType) => typesWithPrecision.includes(type)

// Checks if a type needs the dimension field
const needsDimension = (type: ColumnType) => typesWithDimension.includes(type)

// Defaults by type
const getLengthDefault = (type: ColumnType) => {
  switch (type) {
    case ColumnType.CHAR: return 1
    case ColumnType.VARCHAR: return 255
    case ColumnType.BIT: return 1
    case ColumnType.VARBIT: return 64
    default: return 255
  }
}

// Open state based on editingTable
const isOpen = computed({
  get: () => !!projectStore.editingTable.value,
  set: (val) => {
    if (!val) {
      projectStore.closeTableEditor()
    }
  }
})

// Reference to the table being edited
const table = computed(() => projectStore.editingTable.value)

// ID of the currently open column in the accordion
const openColumnId = ref<string | null>(null)

// Opens/closes a column
const toggleColumn = (columnId: string) => {
  openColumnId.value = openColumnId.value === columnId ? null : columnId
}

// Options for column types
const columnTypeOptions = computed(() =>
  Object.values(ColumnType).map(type => ({
    label: t(`types.${type}`),
    value: type
  }))
)

// Reference to color picker
const colorPickerRef = ref<HTMLInputElement | null>(null)

// Opens native color picker
const openColorPicker = () => {
  colorPickerRef.value?.click()
}

/**
 * Updates table name
 */
const updateTableName = (name: string) => {
  if (!table.value) return
  projectStore.updateTable(table.value.id, { name })
  canvasStore.updateNodeData(table.value.id, { name })
}

/**
 * Updates table color
 */
const updateTableColor = (color: string) => {
  if (!table.value) return
  projectStore.updateTable(table.value.id, { color })
  canvasStore.updateNodeData(table.value.id, { color })
}

/**
 * Adds a new column to the table
 */
const addColumn = () => {
  if (!table.value) return
  const newColumn = projectStore.addColumn(table.value.id)
  // Open the new column in the accordion
  if (newColumn) {
    openColumnId.value = newColumn.id
  }
}

/**
 * Updates a column property
 */
const updateColumn = (columnId: string, key: keyof Column, value: Column[keyof Column]) => {
  if (!table.value) return
  projectStore.updateColumn(table.value.id, columnId, { [key]: value })

  // Update node in canvas
  const updatedTable = projectStore.getTable(table.value.id)
  if (updatedTable) {
    canvasStore.updateNodeData(table.value.id, { columns: updatedTable.columns })
  }
}

/**
 * Deletes a column
 */
const deleteColumn = (columnId: string) => {
  if (!table.value) return
  projectStore.deleteColumn(table.value.id, columnId)

  // Update node in canvas
  const updatedTable = projectStore.getTable(table.value.id)
  if (updatedTable) {
    canvasStore.updateNodeData(table.value.id, { columns: updatedTable.columns })
  }
}

/**
 * Deletes the entire table (with confirmation)
 */
const deleteTable = () => {
  if (!table.value) return

  const tableId = table.value.id

  deleteConfirm.requestDelete({
    type: 'table',
    ids: [tableId],
    onConfirm: () => {
      // Close editor first
      projectStore.closeTableEditor()

      // Remove node from canvas
      canvasStore.removeNode(tableId)

      // Delete table from project
      projectStore.deleteTable(tableId)
    }
  })
}

/**
 * Handles primary key change (only one PK per table)
 */
const handlePrimaryKeyChange = (columnId: string, isPrimary: boolean) => {
  if (!table.value) return

  if (isPrimary) {
    // Remove PK from other columns
    table.value.columns.forEach((col) => {
      if (col.id !== columnId && col.primaryKey) {
        updateColumn(col.id, 'primaryKey', false)
      }
    })
  }

  updateColumn(columnId, 'primaryKey', isPrimary)
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="t('table.edit')"
    :description="t('table.edit_description')"
    side="right"
  >
    <template #body>
      <div
        v-if="table"
        class="space-y-6"
      >
        <!-- Section: Table information -->
        <div class="space-y-4">
          <!-- Table name -->
          <UFormField :label="t('table.name')">
            <UInput
              :model-value="table.name"
              :placeholder="t('table.default_name')"
              class="w-full"
              @update:model-value="updateTableName"
            />
          </UFormField>

          <!-- Header color -->
          <UFormField :label="t('table.color')">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Predefined colors -->
              <button
                v-for="color in TABLE_COLORS"
                :key="color.value"
                type="button"
                class="color-swatch"
                :class="{ 'ring-2 ring-primary ring-offset-2': table.color === color.value }"
                :style="{ backgroundColor: color.value }"
                :title="t(`colors.${color.label}`)"
                @click="updateTableColor(color.value)"
              />
              <!-- Custom color picker button -->
              <button
                type="button"
                class="color-swatch color-swatch-custom"
                :style="{ backgroundColor: table.color }"
                :title="t('table.custom_color')"
                @click="openColorPicker"
              >
                <UIcon
                  name="i-lucide-pipette"
                  class="size-3 text-white drop-shadow"
                />
              </button>
              <!-- Hidden color input -->
              <input
                ref="colorPickerRef"
                type="color"
                :value="table.color"
                class="sr-only"
                @input="updateTableColor(($event.target as HTMLInputElement).value)"
              >
            </div>
          </UFormField>
        </div>

        <USeparator />

        <!-- Section: Columns -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-sm">
              {{ t('table.columns') }}
            </h3>
            <UButton
              size="xs"
              icon="i-lucide-plus"
              @click="addColumn"
            >
              {{ t('column.add') }}
            </UButton>
          </div>

          <!-- Column list (accordion with drag & drop) -->
          <draggable
            v-model="localColumns"
            item-key="id"
            handle=".drag-handle"
            ghost-class="sortable-ghost"
            chosen-class="sortable-chosen"
            drag-class="sortable-drag"
            :animation="200"
            class="space-y-2"
            @end="onDragEnd"
          >
            <template #item="{ element: column }">
              <div class="border border-default rounded-lg overflow-hidden">
                <!-- Accordion header (always visible) -->
                <div class="flex items-center bg-elevated hover:bg-muted/50 transition-colors">
                  <!-- Drag handle -->
                  <div
                    class="drag-handle flex items-center pl-3 pr-1 text-muted hover:text-default cursor-grab active:cursor-grabbing self-stretch"
                    :title="t('column.drag_to_reorder')"
                  >
                    <UIcon
                      name="i-lucide-grip-vertical"
                      class="size-4"
                    />
                  </div>
                  <button
                    type="button"
                    class="flex-1 flex items-center gap-2 p-3 pl-1 min-w-0 cursor-pointer"
                    @click="toggleColumn(column.id)"
                  >
                    <UIcon
                      name="i-lucide-chevron-right"
                      class="size-4 shrink-0 transition-transform"
                      :class="{ 'rotate-90': openColumnId === column.id }"
                    />
                    <span class="font-medium truncate">{{ column.name || t('column.name_placeholder') }}</span>
                    <span class="text-xs text-muted font-mono">{{ column.type }}</span>
                    <UIcon
                      v-if="column.primaryKey"
                      name="i-lucide-key"
                      class="size-3 text-amber-500"
                    />
                  </button>
                  <button
                    type="button"
                    class="p-3 text-error/60 hover:text-error transition-colors cursor-pointer"
                    :title="t('column.delete')"
                    @click.stop="deleteColumn(column.id)"
                  >
                    <UIcon
                      name="i-lucide-trash-2"
                      class="size-4"
                    />
                  </button>
                </div>

                <!-- Accordion content (conditional) -->
                <div
                  class="accordion-content"
                  :class="{ 'accordion-open': openColumnId === column.id }"
                >
                  <div class="accordion-inner">
                    <div class="p-4 space-y-4 bg-default border-t border-default">
                      <div class="grid grid-cols-2 gap-4">
                        <UFormField :label="t('column.name')">
                          <UInput
                            :model-value="column.name"
                            :placeholder="t('column.name_placeholder')"
                            size="sm"
                            class="w-full"
                            @update:model-value="updateColumn(column.id, 'name', $event)"
                          />
                        </UFormField>

                        <UFormField :label="t('column.type')">
                          <USelectMenu
                            :model-value="column.type"
                            :items="columnTypeOptions"
                            value-key="value"
                            size="sm"
                            class="w-full"
                            @update:model-value="updateColumn(column.id, 'type', $event)"
                          />
                        </UFormField>
                      </div>

                      <!-- Length (for CHAR, VARCHAR, BIT, VARBIT) -->
                      <UFormField
                        v-if="needsLength(column.type)"
                        :label="t('column.length')"
                      >
                        <UInput
                          type="number"
                          :model-value="column.length || getLengthDefault(column.type)"
                          :placeholder="String(getLengthDefault(column.type))"
                          :min="1"
                          :max="65535"
                          size="sm"
                          class="w-full"
                          @update:model-value="updateColumn(column.id, 'length', $event ? Number($event) : undefined)"
                        />
                      </UFormField>

                      <!-- Precision and Scale (for DECIMAL, NUMERIC) -->
                      <div
                        v-if="needsPrecision(column.type)"
                        class="grid grid-cols-2 gap-2"
                      >
                        <UFormField :label="t('column.precision')">
                          <UInput
                            type="number"
                            :model-value="column.precision || 10"
                            :placeholder="'10'"
                            :min="1"
                            :max="65"
                            size="sm"
                            class="w-full"
                            @update:model-value="updateColumn(column.id, 'precision', $event ? Number($event) : undefined)"
                          />
                        </UFormField>
                        <UFormField :label="t('column.scale')">
                          <UInput
                            type="number"
                            :model-value="column.scale || 2"
                            :placeholder="'2'"
                            :min="0"
                            :max="30"
                            size="sm"
                            class="w-full"
                            @update:model-value="updateColumn(column.id, 'scale', $event ? Number($event) : undefined)"
                          />
                        </UFormField>
                      </div>

                      <!-- Dimension (for VECTOR, HALFVEC, SPARSEVEC) -->
                      <UFormField
                        v-if="needsDimension(column.type)"
                        :label="t('column.dimension')"
                      >
                        <UInput
                          type="number"
                          :model-value="column.dimension"
                          :placeholder="'1536'"
                          :min="1"
                          size="sm"
                          class="w-full"
                          @update:model-value="updateColumn(column.id, 'dimension', $event ? Number($event) : undefined)"
                        />
                      </UFormField>

                      <!-- Default value -->
                      <UFormField :label="t('column.default')">
                        <UInput
                          :model-value="column.default"
                          :placeholder="t('column.default')"
                          size="sm"
                          class="w-full"
                          @update:model-value="updateColumn(column.id, 'default', $event)"
                        />
                      </UFormField>

                      <!-- Constraint options -->
                      <div class="flex flex-wrap gap-4">
                        <UCheckbox
                          :model-value="column.primaryKey"
                          :label="t('column.primaryKey')"
                          @update:model-value="handlePrimaryKeyChange(column.id, !!$event)"
                        />
                        <UCheckbox
                          :model-value="column.nullable"
                          :label="t('column.nullable')"
                          :disabled="column.primaryKey"
                          @update:model-value="updateColumn(column.id, 'nullable', $event)"
                        />
                        <UCheckbox
                          :model-value="column.unique"
                          :label="t('column.unique')"
                          :disabled="column.primaryKey"
                          @update:model-value="updateColumn(column.id, 'unique', $event)"
                        />
                      </div>

                      <!-- Delete button -->
                      <UButton
                        color="error"
                        variant="ghost"
                        size="xs"
                        icon="i-lucide-trash-2"
                        class="w-full cursor-pointer"
                        @click="deleteColumn(column.id)"
                      >
                        {{ t('column.delete') }}
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </draggable>

          <!-- Message if no columns -->
          <div
            v-if="localColumns.length === 0"
            class="text-center py-8 text-muted"
          >
            <UIcon
              name="i-lucide-columns-3"
              class="size-8 mb-2 opacity-50"
            />
            <p class="text-sm">
              {{ t('table.no_columns') }}
            </p>
          </div>
        </div>

        <USeparator />

        <!-- Danger zone -->
        <div class="space-y-4">
          <h3 class="font-semibold text-sm text-error">
            {{ t('common.danger_zone') }}
          </h3>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            block
            class="cursor-pointer p-2"
            @click="deleteTable"
          >
            {{ t('table.delete') }}
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: var(--color-border);
}

.color-swatch-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
}

/* Accordion animation */
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease-out;
}

.accordion-inner {
  overflow: hidden;
  min-height: 0;
}

.accordion-content.accordion-open {
  grid-template-rows: 1fr;
}

/* Drag & drop styles - :deep because classes are added by SortableJS */
:deep(.sortable-ghost) {
  opacity: 0.4;
  background: var(--ui-bg-muted);
}

:deep(.sortable-chosen) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.sortable-drag) {
  opacity: 1;
}
</style>
