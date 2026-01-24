<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import type { GroupData } from '~/types/database'

const props = defineProps<{
  id: string
  data: GroupData
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
    projectStore.updateGroup(props.id, { name: editedTitle.value.trim() })
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
 * Opens full group editor (Slideover) - if not read-only
 */
const openGroupEditor = () => {
  if (canvasReadOnly.value) return
  projectStore.openGroupEditor(props.id)
}

// Background color with opacity
const backgroundColor = computed(() => {
  const color = props.data.color || '#6b7280'
  // Convert hex to rgba with low opacity
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
    <!-- Resize component (hidden in read-only mode) -->
    <NodeResizer
      v-if="!canvasReadOnly"
      :min-width="250"
      :min-height="150"
    />

    <!-- Group header -->
    <div
      class="absolute -top-3 left-3 px-2 py-0.5 rounded text-xs font-medium bg-default border"
      :style="{ borderColor: data.color, color: data.color }"
    >
      <!-- Edit mode -->
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
      <!-- Display mode -->
      <span
        v-else
        class="cursor-pointer"
        @dblclick="startEditingTitle"
      >
        {{ data.name }}
      </span>
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
        :aria-label="t('group.edit')"
        @click.stop="openGroupEditor"
      />
    </div>

    <!-- Content (space for child nodes) -->
    <div class="w-full h-full p-4 pt-6">
      <!-- Child nodes will be rendered here by Vue Flow -->
    </div>
  </div>
</template>

<style scoped>
.db-group-node {
  /* Relative position for absolute child elements */
  position: relative;
}

/* Show buttons on hover */
.db-group-node:hover .opacity-0 {
  opacity: 1;
}

/* NodeResizer styles */
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
