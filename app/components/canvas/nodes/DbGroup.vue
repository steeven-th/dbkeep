<script setup lang="ts">
import { NodeResizer } from '@vue-flow/node-resizer'
import type { GroupData } from '~/types/database'

const props = defineProps<{
  id: string
  data: GroupData
}>()

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

// État pour l'édition du titre en ligne
const isEditingTitle = ref(false)
const editedTitle = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

// Synchroniser editedTitle avec les props
watch(
  () => props.data.name,
  (newName) => {
    if (!isEditingTitle.value) {
      editedTitle.value = newName
    }
  },
  { immediate: true }
)

/**
 * Démarre l'édition du titre en ligne
 */
const startEditingTitle = () => {
  editedTitle.value = props.data.name
  isEditingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

/**
 * Sauvegarde le titre édité
 */
const saveTitle = () => {
  if (editedTitle.value.trim()) {
    projectStore.updateGroup(props.id, { name: editedTitle.value.trim() })
    canvasStore.updateNodeData(props.id, { name: editedTitle.value.trim() })
  } else {
    editedTitle.value = props.data.name
  }
  isEditingTitle.value = false
}

/**
 * Annule l'édition du titre
 */
const cancelEditing = () => {
  editedTitle.value = props.data.name
  isEditingTitle.value = false
}

/**
 * Ouvre l'éditeur de groupe complet (Slideover)
 */
const openGroupEditor = () => {
  projectStore.openGroupEditor(props.id)
}

// Couleur de fond avec opacité
const backgroundColor = computed(() => {
  const color = props.data.color || '#6b7280'
  // Convertir hex en rgba avec opacité faible
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.05)`
})
</script>

<template>
  <div
    class="db-group-node w-full h-full rounded-lg border-2 border-dashed cursor-pointer"
    :style="{
      borderColor: data.color,
      backgroundColor: backgroundColor
    }"
    @dblclick="openGroupEditor"
  >
    <!-- Composant de redimensionnement -->
    <NodeResizer
      :min-width="250"
      :min-height="150"
    />

    <!-- Header du groupe -->
    <div
      class="absolute -top-3 left-3 px-2 py-0.5 rounded text-xs font-medium bg-default border"
      :style="{ borderColor: data.color, color: data.color }"
    >
      <!-- Mode édition -->
      <input
        v-if="isEditingTitle"
        ref="titleInput"
        v-model="editedTitle"
        type="text"
        class="bg-transparent border-none outline-none w-32 text-xs"
        :style="{ color: data.color }"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.escape="cancelEditing"
      >
      <!-- Mode affichage -->
      <span
        v-else
        class="cursor-pointer"
        @dblclick="startEditingTitle"
      >
        {{ data.name }}
      </span>
    </div>

    <!-- Boutons d'action au survol -->
    <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        :aria-label="t('group.edit')"
        @click.stop="openGroupEditor"
      />
    </div>

    <!-- Contenu (espace pour les noeuds enfants) -->
    <div class="w-full h-full p-4 pt-6">
      <!-- Les noeuds enfants seront rendus ici par Vue Flow -->
    </div>
  </div>
</template>

<style scoped>
.db-group-node {
  /* Position relative pour les éléments absolus enfants */
  position: relative;
}

/* Afficher les boutons au survol */
.db-group-node:hover .opacity-0 {
  opacity: 1;
}

/* Styles pour le NodeResizer */
.db-group-node :deep(.vue-flow__resize-control) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.db-group-node:hover :deep(.vue-flow__resize-control) {
  opacity: 1;
}

.db-group-node :deep(.vue-flow__resize-control.handle) {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--color-primary);
  border: 2px solid white;
}
</style>
