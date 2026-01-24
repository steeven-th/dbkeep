<script setup lang="ts">
import { markRaw, inject, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { VueFlow, useVueFlow, SelectionMode, type Connection, type GraphNode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import DbTable from './nodes/DbTable.vue'
import DbGroup from './nodes/DbGroup.vue'
import DbNote from './nodes/DbNote.vue'
import RelationEdge from './edges/RelationEdge.vue'
import { RelationType, generateId } from '~/types/database'

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const deleteConfirm = useDeleteConfirm()
const { saveProject, isSaving, lastSaveTime } = useProjects()
const toast = useToast()

// Read-only mode injected by parent (project page)
const canvasReadOnly = inject<Ref<boolean>>('canvasReadOnly', ref(false))

// Preview mode injected by parent - when true, auto-save is disabled
// Useful when displaying temporary data that should not be persisted
const previewMode = inject<Ref<boolean>>('versionPreviewMode', ref(false))

// Key to force Vue Flow re-render
const vueFlowKey = ref(0)

// Flag to skip fitView on refresh (e.g., after applying SQL changes)
const skipFitViewOnRefresh = ref(false)

// Viewport to restore after a refresh
const viewportToRestore = ref<{ x: number; y: number; zoom: number } | null>(null)

// Auto-save with debounce (2 seconds after last modification)
const debouncedSave = useDebounceFn(async () => {
  // Don't save if in preview mode (temporary data)
  if (previewMode.value) {
    return
  }
  if (projectStore.currentProject.value?.id) {
    const success = await saveProject()
    if (success) {
      toast.add({
        title: t('project.saved_success'),
        color: 'success',
        icon: 'i-lucide-check'
      })
    }
  }
}, 2000)

// Watcher to detect project modifications and auto-save
watch(
  () => projectStore.currentProject.value?.updatedAt,
  () => {
    if (projectStore.currentProject.value?.id) {
      // Skip if in preview mode (temporary data should not be saved)
      if (previewMode.value) {
        return
      }
      // Skip if a save was performed in the last 3 seconds
      // (avoids double saves after applying SQL changes)
      const timeSinceLastSave = Date.now() - lastSaveTime.value
      if (timeSinceLastSave < 3000) {
        return
      }
      debouncedSave()
    }
  }
)

// Vue Flow configuration
const {
  onConnect,
  onNodeDragStop,
  onNodesInitialized,
  fitView,
  getNodes,
  getSelectedNodes,
  getSelectedEdges,
  removeNodes,
  removeEdges,
  getViewport,
  setViewport
} = useVueFlow()

// Adjust view when nodes are initialized by Vue Flow
onNodesInitialized(() => {
  // Restore viewport if this is a refresh (e.g., after applying SQL changes)
  if (skipFitViewOnRefresh.value) {
    skipFitViewOnRefresh.value = false
    if (viewportToRestore.value) {
      // Small delay to ensure Vue Flow is ready
      setTimeout(() => {
        setViewport(viewportToRestore.value!)
        viewportToRestore.value = null
      }, 50)
    }
    return
  }

  // Small delay to ensure node dimensions are calculated
  setTimeout(() => {
    fitView({ padding: 0.3, maxZoom: 1 })
  }, 50)
})

// Custom node types (markRaw to avoid reactivity)
const nodeTypes = {
  dbTable: markRaw(DbTable),
  dbGroup: markRaw(DbGroup),
  dbNote: markRaw(DbNote)
}

// Custom edge types (markRaw to avoid reactivity)
const edgeTypes = {
  relation: markRaw(RelationEdge)
}

// State for relation creation modal
const showRelationEditor = ref(false)
const pendingConnection = ref<Connection | null>(null)

/**
 * Handles a new connection between two columns
 */
onConnect((connection: Connection) => {
  // Block in read-only mode
  if (canvasReadOnly.value) return

  // Extract table and column IDs from handles
  // Remove -source or -target suffix (regardless of handle type used)
  const sourceColumnId = connection.sourceHandle?.replace(/-(source|target)$/, '')
  const targetColumnId = connection.targetHandle?.replace(/-(source|target)$/, '')

  if (!sourceColumnId || !targetColumnId) return

  // Create a new relation
  const relation = projectStore.addRelation({
    sourceTableId: connection.source,
    sourceColumnId,
    targetTableId: connection.target,
    targetColumnId,
    type: RelationType.ONE_TO_MANY
  })

  if (relation) {
    // Add edge to canvas
    canvasStore.addEdge(relation)

    // Open relation editor to configure details
    projectStore.openRelationEditor(relation.id)
  } else {
    // Relation already exists, notify user
    toast.add({
      title: t('relation.already_exists'),
      description: t('relation.already_exists_description'),
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
  }
})

/**
 * Checks if a point is within the bounds of a group
 */
const isInsideGroup = (
  nodePosition: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  group: GraphNode
): boolean => {
  const groupWidth = parseFloat(group.style?.width as string) || 400
  const groupHeight = parseFloat(group.style?.height as string) || 300

  // Calculate node center
  const nodeCenterX = nodePosition.x + nodeWidth / 2
  const nodeCenterY = nodePosition.y + nodeHeight / 2

  // Check if node center is within the group
  return (
    nodeCenterX >= group.position.x &&
    nodeCenterX <= group.position.x + groupWidth &&
    nodeCenterY >= group.position.y &&
    nodeCenterY <= group.position.y + groupHeight
  )
}

/**
 * Finds the group containing a given position
 */
const findContainingGroup = (
  nodePosition: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  excludeNodeId: string
): GraphNode | null => {
  const allNodes = getNodes.value
  const groups = allNodes.filter(n => n.type === 'dbGroup' && n.id !== excludeNodeId)

  for (const group of groups) {
    if (isInsideGroup(nodePosition, nodeWidth, nodeHeight, group)) {
      return group
    }
  }

  return null
}

/**
 * Updates node positions after drag
 * Also handles automatic group assignment (Nested Nodes)
 */
onNodeDragStop((event) => {
  event.nodes.forEach((node) => {
    // Don't process groups
    if (node.type === 'dbGroup') {
      canvasStore.updateNodePosition(node.id, node.position)
      return
    }

    // For tables, check if they are inside a group
    const nodeWidth = node.dimensions?.width || 200
    const nodeHeight = node.dimensions?.height || 100

    // Calculate absolute position (if table is already in a group, its position is relative)
    let absolutePosition = { ...node.position }
    if (node.parentNode) {
      const parentGroup = getNodes.value.find(n => n.id === node.parentNode)
      if (parentGroup) {
        absolutePosition = {
          x: parentGroup.position.x + node.position.x,
          y: parentGroup.position.y + node.position.y
        }
      }
    }

    // Find the group containing this position
    const containingGroup = findContainingGroup(absolutePosition, nodeWidth, nodeHeight, node.id)

    if (containingGroup) {
      // Table is inside a group
      if (node.parentNode !== containingGroup.id) {
        // New group or group change
        // Convert absolute position to relative position within group
        const relativePosition = {
          x: absolutePosition.x - containingGroup.position.x,
          y: absolutePosition.y - containingGroup.position.y
        }

        canvasStore.assignToGroup(node.id, containingGroup.id)
        canvasStore.updateNodePosition(node.id, relativePosition)
      } else {
        // Same group, just update position
        canvasStore.updateNodePosition(node.id, node.position)
      }
    } else {
      // Table is not in any group
      if (node.parentNode) {
        // It was in a group, remove it
        canvasStore.assignToGroup(node.id, null)
        canvasStore.updateNodePosition(node.id, absolutePosition)
      } else {
        // No group change
        canvasStore.updateNodePosition(node.id, node.position)
      }
    }
  })
})

/**
 * Handles deletion of selected elements with confirmation
 * Called when user presses Delete or Backspace
 */
const handleDeleteSelected = () => {
  // Block in read-only mode
  if (canvasReadOnly.value) return

  const selectedNodes = getSelectedNodes.value
  const selectedEdges = getSelectedEdges.value

  if (selectedNodes.length === 0 && selectedEdges.length === 0) return

  // Prioritize nodes over edges
  if (selectedNodes.length > 0) {
    const nodeIds = selectedNodes.map(n => n.id)
    const types = selectedNodes.map(n => n.type)

    let targetType: 'table' | 'group' | 'note' | 'mixed'
    if (types.every(t => t === 'dbTable')) {
      targetType = 'table'
    } else if (types.every(t => t === 'dbGroup')) {
      targetType = 'group'
    } else if (types.every(t => t === 'dbNote')) {
      targetType = 'note'
    } else {
      targetType = 'mixed'
    }

    deleteConfirm.requestDelete({
      type: targetType,
      ids: nodeIds,
      onConfirm: () => {
        // Delete from project store
        selectedNodes.forEach((node) => {
          if (node.type === 'dbTable') {
            projectStore.deleteTable(node.id)
          } else if (node.type === 'dbGroup') {
            // Unassign children first
            const children = canvasStore.getGroupChildren(node.id)
            children.forEach(child => {
              canvasStore.assignToGroup(child.id, null)
            })
            projectStore.deleteGroup(node.id)
          } else if (node.type === 'dbNote') {
            projectStore.deleteNote(node.id)
          }
        })
        // Remove from canvas
        removeNodes(nodeIds)
      }
    })
  } else if (selectedEdges.length > 0) {
    const edgeIds = selectedEdges.map(e => e.id)

    deleteConfirm.requestDelete({
      type: 'relation',
      ids: edgeIds,
      onConfirm: () => {
        // Delete from project store
        selectedEdges.forEach((edge) => {
          projectStore.deleteRelation(edge.id)
        })
        // Remove from canvas
        removeEdges(edgeIds)
      }
    })
  }
}

/**
 * Keyboard handler to intercept Delete/Backspace
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Don't intercept if inside an input
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    handleDeleteSelected()
  }
}

/**
 * Adjusts view to display all elements
 * padding: 0.5 = 50% empty space around elements
 * maxZoom: 1 = don't zoom more than 100%
 */
const handleFitView = () => {
  fitView({ padding: 0.5, maxZoom: 1 })
}

// Forces complete re-render of Vue Flow while preserving viewport
const forceRefresh = () => {
  // Save current viewport to restore after refresh
  viewportToRestore.value = getViewport()
  skipFitViewOnRefresh.value = true
  vueFlowKey.value++
}

// Expose methods for parent components
defineExpose({
  fitView: handleFitView,
  forceRefresh
})
</script>

<template>
  <div class="database-canvas h-full w-full relative">
    <VueFlow
      v-model:nodes="canvasStore.nodes.value"
      v-model:edges="canvasStore.edges.value"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-edge-options="{
        type: 'relation',
        animated: false
      }"
      :snap-to-grid="true"
      :snap-grid="[15, 15]"
      :connection-mode="'loose'"
      :fit-view-on-init="false"
      :max-zoom="1.5"
      :min-zoom="0.1"
      :pan-on-scroll="true"
      :zoom-on-scroll="true"
      :delete-key-code="null"
      :elements-selectable="true"
      :selection-mode="SelectionMode.Partial"
      :nodes-draggable="!canvasReadOnly"
      :nodes-connectable="!canvasReadOnly"
      :edges-updatable="!canvasReadOnly"
      class="bg-muted"
      @keydown="handleKeyDown"
    >
      <!-- Background with grid -->
      <Background
        :gap="20"
        :size="1"
        pattern-color="var(--vue-flow-grid-color)"
      />

      <!-- Zoom/pan controls -->
      <Controls
        :show-zoom="true"
        :show-fit-view="true"
        :show-interactive="true"
        position="bottom-right"
      />

      <!-- Floating toolbar -->
      <CanvasToolbar />
    </VueFlow>

    <!-- Slideover for table editing -->
    <CanvasTableEditor />

    <!-- Slideover for group editing -->
    <CanvasGroupEditor />

    <!-- Slideover for note editing -->
    <CanvasNoteEditor />

    <!-- Modal for relation editing -->
    <CanvasRelationEditor />

    <!-- Delete confirmation modal (global) -->
    <DeleteConfirmModal />
  </div>
</template>

<style scoped>
.database-canvas {
  /* Ensures canvas takes full available height */
  min-height: 100%;
}
</style>
