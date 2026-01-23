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

// Mode lecture seule injecté par le parent (page projet)
const canvasReadOnly = inject<Ref<boolean>>('canvasReadOnly', ref(false))

// Clé pour forcer le re-render de Vue Flow
const vueFlowKey = ref(0)

// Flag pour éviter le fitView lors d'un refresh (ex: après application des changements SQL)
const skipFitViewOnRefresh = ref(false)

// Viewport à restaurer après un refresh
const viewportToRestore = ref<{ x: number; y: number; zoom: number } | null>(null)

// Sauvegarde automatique avec debounce (2 secondes après la dernière modification)
const debouncedSave = useDebounceFn(async () => {
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

// Watcher pour détecter les modifications du projet et sauvegarder automatiquement
watch(
  () => projectStore.currentProject.value?.updatedAt,
  () => {
    if (projectStore.currentProject.value?.id) {
      // Ignorer si une sauvegarde a été effectuée dans les 3 dernières secondes
      // (évite les doubles saves après application des changements SQL)
      const timeSinceLastSave = Date.now() - lastSaveTime.value
      if (timeSinceLastSave < 3000) {
        return
      }
      debouncedSave()
    }
  }
)

// Configuration de Vue Flow
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

// Ajuster la vue quand les nodes sont initialisés par Vue Flow
onNodesInitialized(() => {
  // Restaurer le viewport si c'est un refresh (ex: après application des changements SQL)
  if (skipFitViewOnRefresh.value) {
    skipFitViewOnRefresh.value = false
    if (viewportToRestore.value) {
      // Petit délai pour s'assurer que Vue Flow est prêt
      setTimeout(() => {
        setViewport(viewportToRestore.value!)
        viewportToRestore.value = null
      }, 50)
    }
    return
  }

  // Petit délai pour s'assurer que les dimensions des nodes sont calculées
  setTimeout(() => {
    fitView({ padding: 0.3, maxZoom: 1 })
  }, 50)
})

// Types de noeuds personnalisés (markRaw pour éviter la réactivité)
const nodeTypes = {
  dbTable: markRaw(DbTable),
  dbGroup: markRaw(DbGroup),
  dbNote: markRaw(DbNote)
}

// Types d'edges personnalisés (markRaw pour éviter la réactivité)
const edgeTypes = {
  relation: markRaw(RelationEdge)
}

// État pour le modal de création de relation
const showRelationEditor = ref(false)
const pendingConnection = ref<Connection | null>(null)

/**
 * Gestion d'une nouvelle connexion entre deux colonnes
 */
onConnect((connection: Connection) => {
  // Bloquer en mode lecture seule
  if (canvasReadOnly.value) return

  // Extraire les IDs de table et colonne depuis les handles
  // On retire le suffixe -source ou -target (peu importe le type de handle utilisé)
  const sourceColumnId = connection.sourceHandle?.replace(/-(source|target)$/, '')
  const targetColumnId = connection.targetHandle?.replace(/-(source|target)$/, '')

  if (!sourceColumnId || !targetColumnId) return

  // Créer une nouvelle relation
  const relation = projectStore.addRelation({
    sourceTableId: connection.source,
    sourceColumnId,
    targetTableId: connection.target,
    targetColumnId,
    type: RelationType.ONE_TO_MANY
  })

  if (relation) {
    // Ajouter l'edge au canvas
    canvasStore.addEdge(relation)

    // Ouvrir l'éditeur de relation pour configurer les détails
    projectStore.openRelationEditor(relation.id)
  } else {
    // La relation existe déjà, informer l'utilisateur
    toast.add({
      title: t('relation.already_exists'),
      description: t('relation.already_exists_description'),
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
  }
})

/**
 * Vérifie si un point est dans les limites d'un groupe
 */
const isInsideGroup = (
  nodePosition: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  group: GraphNode
): boolean => {
  const groupWidth = parseFloat(group.style?.width as string) || 400
  const groupHeight = parseFloat(group.style?.height as string) || 300

  // Calculer le centre du node
  const nodeCenterX = nodePosition.x + nodeWidth / 2
  const nodeCenterY = nodePosition.y + nodeHeight / 2

  // Vérifier si le centre du node est dans le groupe
  return (
    nodeCenterX >= group.position.x &&
    nodeCenterX <= group.position.x + groupWidth &&
    nodeCenterY >= group.position.y &&
    nodeCenterY <= group.position.y + groupHeight
  )
}

/**
 * Trouve le groupe contenant une position donnée
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
 * Mise à jour des positions des noeuds après un drag
 * Gère aussi l'assignation automatique aux groupes (Nested Nodes)
 */
onNodeDragStop((event) => {
  event.nodes.forEach((node) => {
    // Ne pas traiter les groupes
    if (node.type === 'dbGroup') {
      canvasStore.updateNodePosition(node.id, node.position)
      return
    }

    // Pour les tables, vérifier si elles sont dans un groupe
    const nodeWidth = node.dimensions?.width || 200
    const nodeHeight = node.dimensions?.height || 100

    // Calculer la position absolue (si la table est déjà dans un groupe, sa position est relative)
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

    // Trouver le groupe qui contient cette position
    const containingGroup = findContainingGroup(absolutePosition, nodeWidth, nodeHeight, node.id)

    if (containingGroup) {
      // La table est dans un groupe
      if (node.parentNode !== containingGroup.id) {
        // Nouveau groupe ou changement de groupe
        // Convertir la position absolue en position relative au groupe
        const relativePosition = {
          x: absolutePosition.x - containingGroup.position.x,
          y: absolutePosition.y - containingGroup.position.y
        }

        canvasStore.assignToGroup(node.id, containingGroup.id)
        canvasStore.updateNodePosition(node.id, relativePosition)
      } else {
        // Même groupe, juste mettre à jour la position
        canvasStore.updateNodePosition(node.id, node.position)
      }
    } else {
      // La table n'est dans aucun groupe
      if (node.parentNode) {
        // Elle était dans un groupe, la retirer
        canvasStore.assignToGroup(node.id, null)
        canvasStore.updateNodePosition(node.id, absolutePosition)
      } else {
        // Pas de changement de groupe
        canvasStore.updateNodePosition(node.id, node.position)
      }
    }
  })
})

/**
 * Gère la suppression des éléments sélectionnés avec confirmation
 * Appelé quand l'utilisateur appuie sur Delete ou Backspace
 */
const handleDeleteSelected = () => {
  // Bloquer en mode lecture seule
  if (canvasReadOnly.value) return

  const selectedNodes = getSelectedNodes.value
  const selectedEdges = getSelectedEdges.value

  if (selectedNodes.length === 0 && selectedEdges.length === 0) return

  // Prioriser les nodes sur les edges
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
        // Supprimer dans le store projet
        selectedNodes.forEach((node) => {
          if (node.type === 'dbTable') {
            projectStore.deleteTable(node.id)
          } else if (node.type === 'dbGroup') {
            // Désassigner les enfants d'abord
            const children = canvasStore.getGroupChildren(node.id)
            children.forEach(child => {
              canvasStore.assignToGroup(child.id, null)
            })
            projectStore.deleteGroup(node.id)
          } else if (node.type === 'dbNote') {
            projectStore.deleteNote(node.id)
          }
        })
        // Supprimer du canvas
        removeNodes(nodeIds)
      }
    })
  } else if (selectedEdges.length > 0) {
    const edgeIds = selectedEdges.map(e => e.id)

    deleteConfirm.requestDelete({
      type: 'relation',
      ids: edgeIds,
      onConfirm: () => {
        // Supprimer dans le store projet
        selectedEdges.forEach((edge) => {
          projectStore.deleteRelation(edge.id)
        })
        // Supprimer du canvas
        removeEdges(edgeIds)
      }
    })
  }
}

/**
 * Handler de clavier pour intercepter Delete/Backspace
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Ne pas intercepter si on est dans un input
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    handleDeleteSelected()
  }
}

/**
 * Ajuste la vue pour afficher tous les éléments
 * padding: 0.5 = 50% d'espace vide autour des éléments
 * maxZoom: 1 = ne pas zoomer plus que 100%
 */
const handleFitView = () => {
  fitView({ padding: 0.5, maxZoom: 1 })
}

// Force le re-render complet de Vue Flow en préservant le viewport
const forceRefresh = () => {
  // Sauvegarder le viewport actuel pour le restaurer après le refresh
  viewportToRestore.value = getViewport()
  skipFitViewOnRefresh.value = true
  vueFlowKey.value++
}

// Exposer les méthodes pour les composants parents
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
      class="bg-muted"
      @keydown="handleKeyDown"
    >
      <!-- Fond avec grille -->
      <Background
        :gap="20"
        :size="1"
        pattern-color="var(--vue-flow-grid-color)"
      />

      <!-- Contrôles de zoom/pan -->
      <Controls
        :show-zoom="true"
        :show-fit-view="true"
        :show-interactive="true"
        position="bottom-right"
      />

      <!-- Toolbar flottante -->
      <CanvasToolbar />
    </VueFlow>

    <!-- Slideover pour l'édition des tables -->
    <CanvasTableEditor />

    <!-- Slideover pour l'édition des groupes -->
    <CanvasGroupEditor />

    <!-- Slideover pour l'édition des notes -->
    <CanvasNoteEditor />

    <!-- Modal pour l'édition des relations -->
    <CanvasRelationEditor />

    <!-- Modal de confirmation de suppression (global) -->
    <DeleteConfirmModal />
  </div>
</template>

<style scoped>
.database-canvas {
  /* Assure que le canvas prend toute la hauteur disponible */
  min-height: 100%;
}
</style>
