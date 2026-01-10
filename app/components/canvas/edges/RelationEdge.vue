<script setup lang="ts">
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps
} from '@vue-flow/core'
import type { Relation } from '~/types/database'
import { RelationType } from '~/types/database'

const props = defineProps<EdgeProps<Relation>>()

const { t } = useI18n()
const projectStore = useProjectStore()

// Calcul du chemin de l'edge
const path = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition
  })
})

// Position du label au milieu de l'edge
const labelPosition = computed(() => ({
  x: (props.sourceX + props.targetX) / 2,
  y: (props.sourceY + props.targetY) / 2
}))

/**
 * Retourne le texte du type de relation
 */
const relationTypeLabel = computed(() => {
  if (!props.data) return ''

  switch (props.data.type) {
    case RelationType.ONE_TO_ONE:
      return '1:1'
    case RelationType.ONE_TO_MANY:
      return '1:N'
    case RelationType.MANY_TO_MANY:
      return 'N:M'
    default:
      return ''
  }
})

/**
 * Retourne le style de l'edge selon le type de relation
 */
const edgeStyle = computed(() => {
  if (!props.data) return {}

  const baseStyle = {
    strokeWidth: 2
  }

  switch (props.data.type) {
    case RelationType.ONE_TO_ONE:
      return { ...baseStyle, stroke: '#3b82f6' } // bleu
    case RelationType.ONE_TO_MANY:
      return { ...baseStyle, stroke: '#22c55e' } // vert
    case RelationType.MANY_TO_MANY:
      return { ...baseStyle, stroke: '#a855f7' } // violet
    default:
      return { ...baseStyle, stroke: '#6b7280' }
  }
})

/**
 * Ouvre l'éditeur de relation
 */
const openRelationEditor = () => {
  if (props.data) {
    projectStore.openRelationEditor(props.id)
  }
}
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path[0]"
    :style="edgeStyle"
    :marker-end="markerEnd"
  />

  <!-- Label de la relation -->
  <EdgeLabelRenderer>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelPosition.x}px, ${labelPosition.y}px)`,
        pointerEvents: 'all'
      }"
      class="nodrag nopan"
    >
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        class="shadow-sm cursor-pointer"
        @dblclick.stop="openRelationEditor"
      >
        <span class="font-mono text-xs font-semibold">
          {{ relationTypeLabel }}
        </span>
      </UButton>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
/* Animation au survol de l'edge */
:deep(.vue-flow__edge-path) {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

:deep(.vue-flow__edge:hover .vue-flow__edge-path) {
  stroke-width: 3px;
}
</style>
