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

// Mode lecture seule injecté par le parent (page projet)
const canvasReadOnly = inject<Ref<boolean>>('canvasReadOnly', ref(false))

/**
 * Ouvre l'éditeur de table dans le Slideover (si pas en lecture seule)
 */
const openEditor = () => {
  if (canvasReadOnly.value) return
  projectStore.openTableEditor(props.id)
}

/**
 * Retourne l'icône appropriée pour une colonne selon ses contraintes
 */
const getColumnIcon = (column: Column): string => {
  if (column.primaryKey) return 'i-lucide-key-round'
  if (column.unique) return 'i-lucide-fingerprint'
  return 'i-lucide-columns-3'
}

/**
 * Retourne la classe de couleur pour l'icône selon le type de contrainte
 */
const getColumnIconClass = (column: Column): string => {
  if (column.primaryKey) return 'text-amber-500'
  if (column.unique) return 'text-purple-500'
  return 'text-muted'
}

/**
 * Génère un texte de type condensé pour l'affichage
 */
const getTypeDisplay = (column: Column): string => {
  return column.type
}

/**
 * Vérifie si une colonne est source d'une relation (côté droit)
 */
const isSourceConnected = (columnId: string): boolean => {
  const relations = projectStore.currentProject.value?.relations || []
  return relations.some(r => r.sourceTableId === props.id && r.sourceColumnId === columnId)
}

/**
 * Vérifie si une colonne est cible d'une relation (côté gauche)
 */
const isTargetConnected = (columnId: string): boolean => {
  const relations = projectStore.currentProject.value?.relations || []
  return relations.some(r => r.targetTableId === props.id && r.targetColumnId === columnId)
}
</script>

<template>
  <div
    class="db-table-node min-w-[220px] max-w-[350px] rounded-lg shadow-lg border border-default bg-default cursor-pointer"
    @dblclick="openEditor"
  >
    <!-- Header avec couleur dynamique -->
    <div
      class="px-3 py-2 flex items-center justify-between gap-2"
      :style="{ backgroundColor: data.color }"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <UIcon name="i-lucide-table" class="size-4 text-white shrink-0" />
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

    <!-- Liste des colonnes -->
    <div class="divide-y divide-default">
      <div
        v-for="column in data.columns"
        :key="column.id"
        class="column-row relative px-3 py-2 flex items-center gap-2 text-sm hover:bg-elevated transition-colors"
      >
        <!-- Handle target (entrée - côté gauche) -->
        <Handle
          :id="`${column.id}-target`"
          type="target"
          :position="Position.Left"
          class="connection-handle target-handle"
          :class="{ 'is-connected': isTargetConnected(column.id) }"
        />

        <!-- Icône de contrainte -->
        <UIcon
          :name="getColumnIcon(column)"
          class="size-4 shrink-0"
          :class="getColumnIconClass(column)"
        />

        <!-- Nom de la colonne -->
        <span class="flex-1 truncate font-medium">{{ column.name }}</span>

        <!-- Type SQL -->
        <span class="text-muted text-xs font-mono shrink-0">
          {{ getTypeDisplay(column) }}
        </span>

        <!-- Indicateurs -->
        <div class="flex items-center gap-1 shrink-0">
          <UTooltip v-if="column.nullable" :text="t('column.nullable')">
            <span class="text-muted text-xs">?</span>
          </UTooltip>
          <UTooltip v-if="column.unique && !column.primaryKey" :text="t('column.unique')">
            <UIcon name="i-lucide-badge-check" class="size-3 text-purple-500" />
          </UTooltip>
        </div>

        <!-- Handle source (sortie - côté droit) -->
        <Handle
          :id="`${column.id}-source`"
          type="source"
          :position="Position.Right"
          class="connection-handle source-handle"
          :class="{ 'is-connected': isSourceConnected(column.id) }"
        />
      </div>

      <!-- Message si aucune colonne -->
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
   Styles des handles de connexion (relation)
   ============================================ */

/* Permettre aux handles de dépasser */
.db-table-node {
  overflow: visible !important;
}

/* Header avec coins arrondis en haut */
.db-table-node > div:first-child {
  border-radius: 0.5rem 0.5rem 0 0;
}

/* Style de base des handles */
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

/* Zone de survol élargie pour éviter le "sursaut" entre la ligne et le handle */
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

/* Position des handles */
.db-table-node :deep(.vue-flow__handle-left) {
  left: -8px;
}

.db-table-node :deep(.vue-flow__handle-right) {
  right: -8px;
}

/* === Handles connectés : toujours visibles === */
.db-table-node :deep(.connection-handle.is-connected) {
  opacity: 1;
}

/* Afficher les handles au survol de la table */
.db-table-node:hover :deep(.connection-handle) {
  opacity: 0.5;
}

/* Les handles connectés restent à opacity 1 même au survol de la table */
.db-table-node:hover :deep(.connection-handle.is-connected) {
  opacity: 1;
}

/* Highlight plus fort au survol de la ligne de colonne */
.column-row:hover :deep(.connection-handle) {
  opacity: 1;
  width: 16px;
  height: 16px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Handle source (côté droit) - bleu */
.db-table-node :deep(.source-handle) {
  background: var(--ui-color-primary-500);
}

/* Handle target (côté gauche) - vert */
.db-table-node :deep(.target-handle) {
  background: var(--ui-color-success-500, #22c55e);
}

/* Effet au survol direct du handle (via la zone élargie) */
.db-table-node :deep(.connection-handle:hover) {
  opacity: 1;
  width: 18px;
  height: 18px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
  cursor: grab;
}

/* Quand une connexion est en cours de création */
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

/* État valid pendant le drag */
.db-table-node :deep(.vue-flow__handle.valid) {
  background: var(--ui-color-success-500, #22c55e) !important;
  opacity: 1 !important;
}

/* État invalid pendant le drag */
.db-table-node :deep(.vue-flow__handle.invalid) {
  background: var(--ui-color-error-500, #ef4444) !important;
  opacity: 0.5 !important;
}
</style>
