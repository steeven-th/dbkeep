<script setup lang="ts">
import { NodeResizer } from '@vue-flow/node-resizer'
import type { NoteData } from '~/types/database'

const props = defineProps<{
  id: string
  data: NoteData
}>()

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

// Etat pour l'edition du titre en ligne
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
 * Demarre l'edition du titre en ligne
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
 * Sauvegarde le titre edite
 */
const saveTitle = () => {
  if (editedTitle.value.trim()) {
    projectStore.updateNote(props.id, { name: editedTitle.value.trim() })
    canvasStore.updateNodeData(props.id, { name: editedTitle.value.trim() })
  } else {
    editedTitle.value = props.data.name
  }
  isEditingTitle.value = false
}

/**
 * Annule l'edition du titre
 */
const cancelEditing = () => {
  editedTitle.value = props.data.name
  isEditingTitle.value = false
}

/**
 * Ouvre l'editeur de note complet (Slideover)
 */
const openNoteEditor = () => {
  projectStore.openNoteEditor(props.id)
}

// Couleur de fond avec opacite
const backgroundColor = computed(() => {
  const color = props.data.color || '#fef3c7'
  // Convertir hex en rgba avec opacite
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.9)`
})

// Couleur de bordure (plus foncee)
const borderColor = computed(() => {
  const color = props.data.color || '#fef3c7'
  const r = Math.max(0, parseInt(color.slice(1, 3), 16) - 40)
  const g = Math.max(0, parseInt(color.slice(3, 5), 16) - 40)
  const b = Math.max(0, parseInt(color.slice(5, 7), 16) - 40)
  return `rgb(${r}, ${g}, ${b})`
})

// Couleur du texte
const textColor = computed(() => {
  return props.data.textColor === 'white' ? '#ffffff' : '#1f2937'
})
</script>

<template>
  <div
    class="db-note-node w-full h-full rounded-lg border-2 cursor-pointer shadow-sm"
    :style="{
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      color: textColor
    }"
    @dblclick="openNoteEditor"
  >
    <!-- Composant de redimensionnement -->
    <NodeResizer
      :min-width="150"
      :min-height="80"
    />

    <!-- Header de la note -->
    <div class="px-3 py-2 border-b" :style="{ borderColor: borderColor }">
      <!-- Mode edition -->
      <input
        v-if="isEditingTitle"
        ref="titleInput"
        v-model="editedTitle"
        type="text"
        class="bg-transparent border-none outline-none w-full text-sm font-semibold"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.escape="cancelEditing"
      >
      <!-- Mode affichage -->
      <span
        v-else
        class="text-sm font-semibold cursor-pointer block truncate"
        @dblclick.stop="startEditingTitle"
      >
        {{ data.name }}
      </span>
    </div>

    <!-- Contenu de la note -->
    <div class="px-3 py-2 text-xs overflow-hidden h-full">
      <p class="whitespace-pre-wrap line-clamp-6 opacity-90">{{ data.content || t('note.no_content') }}</p>
    </div>

    <!-- Boutons d'action au survol -->
    <div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        :aria-label="t('note.edit')"
        @click.stop="openNoteEditor"
      />
    </div>
  </div>
</template>

<style scoped>
.db-note-node {
  /* Position relative pour les elements absolus enfants */
  position: relative;
}

/* Afficher les boutons au survol */
.db-note-node:hover .opacity-0 {
  opacity: 1;
}

/* Styles pour le NodeResizer */
.db-note-node :deep(.vue-flow__resize-control) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.db-note-node:hover :deep(.vue-flow__resize-control) {
  opacity: 1;
}

.db-note-node :deep(.vue-flow__resize-control.handle) {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: var(--color-primary);
  border: 2px solid white;
}

/* Limite le nombre de lignes affichees */
.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
