<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { TableData, Column } from '~/types/database'

const props = defineProps<{
  id: string
  data: TableData
}>()

const { t } = useI18n()
const projectStore = useProjectStore()

// Read-only mode injected by parent (project page)
const canvasReadOnly = inject<Ref<boolean>>('canvasReadOnly', ref(false))

/**
 * Opens table editor in Slideover (if not read-only)
 */
const openEditor = () => {
  if (canvasReadOnly.value) return
  projectStore.openTableEditor(props.id)
}

/**
 * Returns appropriate icon for a column based on its constraints
 */
const getColumnIcon = (column: Column): string => {
  if (column.primaryKey) return 'i-lucide-key-round'
  if (column.unique) return 'i-lucide-fingerprint'
  return 'i-lucide-columns-3'
}

/**
 * Returns icon color class based on constraint type
 */
const getColumnIconClass = (column: Column): string => {
  if (column.primaryKey) return 'text-amber-500'
  if (column.unique) return 'text-purple-500'
  return 'text-muted'
}

/**
 * Generates condensed type text for display
 */
const getTypeDisplay = (column: Column): string => {
  return column.type
}

/**
 * Checks if a column has a connection on the left side
 */
const isConnectedLeft = (columnId: string): boolean => {
  const relations = projectStore.currentProject.value?.relations || []
  return relations.some(r =>
    (r.sourceTableId === props.id && r.sourceColumnId === columnId
      && (r.sourceHandlePosition || 'right') === 'left')
    || (r.targetTableId === props.id && r.targetColumnId === columnId
      && (r.targetHandlePosition || 'left') === 'left')
  )
}

/**
 * Checks if a column has a connection on the right side
 */
const isConnectedRight = (columnId: string): boolean => {
  const relations = projectStore.currentProject.value?.relations || []
  return relations.some(r =>
    (r.sourceTableId === props.id && r.sourceColumnId === columnId
      && (r.sourceHandlePosition || 'right') === 'right')
    || (r.targetTableId === props.id && r.targetColumnId === columnId
      && (r.targetHandlePosition || 'left') === 'right')
  )
}
</script>

<template>
  <div
    class="db-table-node min-w-[220px] max-w-[350px] rounded-lg shadow-lg border border-default bg-default cursor-pointer"
    @dblclick="openEditor"
  >
    <!-- Header with dynamic color -->
    <div
      class="px-3 py-2 flex items-center justify-between gap-2"
      :style="{ backgroundColor: data.color }"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <UIcon
          name="i-lucide-table"
          class="size-4 text-white shrink-0"
        />
        <span class="font-semibold text-white truncate">{{ data.name }}</span>
      </div>
      <UButton
        v-if="!canvasReadOnly"
        icon="i-lucide-pencil"
        size="xs"
        color="white"
        variant="ghost"
        :aria-label="t('table.edit')"
        @click.stop="openEditor"
      />
    </div>

    <!-- Column list -->
    <div class="divide-y divide-default">
      <div
        v-for="column in data.columns"
        :key="column.id"
        class="column-row relative px-3 py-2 flex items-center gap-2 text-sm hover:bg-elevated transition-colors"
      >
        <!-- Left side handles (superimposed at the same position) -->
        <Handle
          :id="`${column.id}-left-target`"
          type="target"
          :position="Position.Left"
          class="connection-handle target-handle"
          :class="{ 'is-connected': isConnectedLeft(column.id) }"
        />
        <Handle
          :id="`${column.id}-left-source`"
          type="source"
          :position="Position.Left"
          class="connection-handle source-handle"
          :class="{ 'is-connected': isConnectedLeft(column.id) }"
        />

        <!-- Constraint icon -->
        <UIcon
          :name="getColumnIcon(column)"
          class="size-4 shrink-0"
          :class="getColumnIconClass(column)"
        />

        <!-- Column name -->
        <span class="flex-1 truncate font-medium">{{ column.name }}</span>

        <!-- SQL type -->
        <span class="text-muted text-xs font-mono shrink-0">
          {{ getTypeDisplay(column) }}
        </span>

        <!-- Indicators -->
        <div class="flex items-center gap-1 shrink-0">
          <UTooltip
            v-if="column.nullable"
            :text="t('column.nullable')"
          >
            <span class="text-muted text-xs">?</span>
          </UTooltip>
          <UTooltip
            v-if="column.unique && !column.primaryKey"
            :text="t('column.unique')"
          >
            <UIcon
              name="i-lucide-badge-check"
              class="size-3 text-purple-500"
            />
          </UTooltip>
        </div>

        <!-- Right side handles (superimposed at the same position) -->
        <Handle
          :id="`${column.id}-right-source`"
          type="source"
          :position="Position.Right"
          class="connection-handle source-handle"
          :class="{ 'is-connected': isConnectedRight(column.id) }"
        />
        <Handle
          :id="`${column.id}-right-target`"
          type="target"
          :position="Position.Right"
          class="connection-handle target-handle"
          :class="{ 'is-connected': isConnectedRight(column.id) }"
        />
      </div>

      <!-- Message if no columns -->
      <div
        v-if="data.columns.length === 0"
        class="px-3 py-4 text-center text-muted text-sm"
      >
        {{ t('table.no_columns') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   Connection handle styles (relation)
   ============================================ */

/* Allow handles to overflow */
.db-table-node {
  overflow: visible !important;
}

/* Header with rounded corners at top */
.db-table-node > div:first-child {
  border-radius: 0.5rem 0.5rem 0 0;
}

/* Base handle styles */
.db-table-node :deep(.connection-handle) {
  width: 12px;
  height: 12px;
  background: var(--ui-color-primary-500);
  border: 2px solid white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.15s ease, box-shadow 0.15s ease, width 0.15s ease, height 0.15s ease;
  cursor: crosshair;
}

/* Enlarged hover zone to prevent "jump" between row and handle */
.db-table-node :deep(.connection-handle)::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

/* Handle positions */
.db-table-node :deep(.vue-flow__handle-left) {
  left: -8px;
}

.db-table-node :deep(.vue-flow__handle-right) {
  right: -8px;
}

/* === Connected handles: always visible === */
.db-table-node :deep(.connection-handle.is-connected) {
  opacity: 1;
}

/* Show handles on table hover */
.db-table-node:hover :deep(.connection-handle) {
  opacity: 0.5;
}

/* Connected handles stay at opacity 1 even on table hover */
.db-table-node:hover :deep(.connection-handle.is-connected) {
  opacity: 1;
}

/* Stronger highlight on column row hover */
.column-row:hover :deep(.connection-handle) {
  opacity: 1;
  width: 16px;
  height: 16px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Source handle (right side) - blue */
.db-table-node :deep(.source-handle) {
  background: var(--ui-color-primary-500);
}

/* Target handle (left side) - green */
.db-table-node :deep(.target-handle) {
  background: var(--ui-color-success-500, #22c55e);
}

/* Effect on direct handle hover (via enlarged zone) */
.db-table-node :deep(.connection-handle:hover) {
  opacity: 1;
  width: 18px;
  height: 18px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
  cursor: grab;
}

/* When a connection is being created */
.db-table-node :deep(.vue-flow__handle.connecting) {
  opacity: 1;
  animation: pulse-handle 0.8s ease-in-out infinite;
}

@keyframes pulse-handle {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
}

/* Valid state during drag */
.db-table-node :deep(.vue-flow__handle.valid) {
  background: var(--ui-color-success-500, #22c55e) !important;
  opacity: 1 !important;
}

/* Invalid state during drag */
.db-table-node :deep(.vue-flow__handle.invalid) {
  background: var(--ui-color-error-500, #ef4444) !important;
  opacity: 0.5 !important;
}
</style>
