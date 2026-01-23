<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import type { NoteData } from '~/types/database'

const props = defineProps<{
  id: string
  data: NoteData
}>()

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

// Read-only mode injected by parent (project page)
const canvasReadOnly = inject<Ref<boolean>>('canvasReadOnly', ref(false))

// State for inline title editing
const isEditingTitle = ref(false)
const editedTitle = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

// Sync editedTitle with props
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
 * Starts inline title editing (if not read-only)
 */
const startEditingTitle = () => {
  if (canvasReadOnly.value) return
  editedTitle.value = props.data.name
  isEditingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

/**
 * Saves the edited title
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
 * Cancels title editing
 */
const cancelEditing = () => {
  editedTitle.value = props.data.name
  isEditingTitle.value = false
}

/**
 * Opens full note editor (Slideover) - if not read-only
 */
const openNoteEditor = () => {
  if (canvasReadOnly.value) return
  projectStore.openNoteEditor(props.id)
}

// Background color with opacity
const backgroundColor = computed(() => {
  const color = props.data.color || '#fef3c7'
  // Convert hex to rgba with opacity
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.9)`
})

// Border color (darker)
const borderColor = computed(() => {
  const color = props.data.color || '#fef3c7'
  const r = Math.max(0, parseInt(color.slice(1, 3), 16) - 40)
  const g = Math.max(0, parseInt(color.slice(3, 5), 16) - 40)
  const b = Math.max(0, parseInt(color.slice(5, 7), 16) - 40)
  return `rgb(${r}, ${g}, ${b})`
})

// Text color
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
    <!-- Resize component -->
    <NodeResizer
      :min-width="150"
      :min-height="80"
    />

    <!-- Note header -->
    <div class="px-3 py-2 border-b" :style="{ borderColor: borderColor }">
      <!-- Edit mode -->
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
      <!-- Display mode -->
      <span
        v-else
        class="text-sm font-semibold cursor-pointer block truncate"
        @dblclick.stop="startEditingTitle"
      >
        {{ data.name }}
      </span>
    </div>

    <!-- Note content -->
    <div class="px-3 py-2 text-xs overflow-hidden h-full">
      <p class="whitespace-pre-wrap line-clamp-6 opacity-90">{{ data.content || t('note.no_content') }}</p>
    </div>

    <!-- Action buttons on hover (hidden in read-only mode) -->
    <div
      v-if="!canvasReadOnly"
      class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
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
  /* Relative position for absolute child elements */
  position: relative;
}

/* Show buttons on hover */
.db-note-node:hover .opacity-0 {
  opacity: 1;
}

/* NodeResizer styles */
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

/* Limit number of displayed lines */
.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
