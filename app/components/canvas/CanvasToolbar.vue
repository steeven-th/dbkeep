<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { Panel } from '@vue-flow/core'

const router = useRouter()
const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const { saveProject: saveToDb, isSaving } = useProjects()
const toast = useToast()

// Read-only mode injected by parent (project page)
const canvasReadOnly = inject<Ref<boolean>>('canvasReadOnly', ref(false))

/**
 * Closes the project and returns to the list
 */
const handleCloseProject = async () => {
  // Save before closing (except in read-only mode)
  if (!canvasReadOnly.value) {
    await saveToDb()
  }
  // Navigate to projects list
  router.push('/app')
}

/**
 * Adds a new table to the project and canvas
 */
const addNewTable = () => {
  // Create the table in the project store
  const table = projectStore.addTable(t('table.default_name'))

  if (table) {
    // Add the node to the canvas
    canvasStore.addTableNode(table)
  }
}

/**
 * Adds a new group to the project and canvas
 */
const addNewGroup = () => {
  // Create the group in the project store
  const group = projectStore.addGroup(t('group.default_name'))

  if (group) {
    // Add the node to the canvas
    canvasStore.addGroupNode(group)
  }
}

/**
 * Adds a new note to the project and canvas
 */
const addNewNote = () => {
  // Create the note in the project store
  const note = projectStore.addNote(t('note.default_name'))

  if (note) {
    // Add the node to the canvas
    canvasStore.addNoteNode(note)
  }
}

/**
 * Saves the project to the database
 */
const handleSave = async () => {
  const success = await saveToDb()
  if (success) {
    toast.add({
      title: t('project.saved_success'),
      color: 'success',
      icon: 'i-lucide-check'
    })
  }
}
</script>

<template>
  <Panel position="top-center" class="!m-0 !p-0">
    <div
      class="flex items-center gap-1 bg-default border border-default rounded-lg p-1.5 shadow-lg mt-4"
    >
      <!-- Back to project list button -->
      <UTooltip :text="t('project.back_to_list')" :delay-duration="0">
        <UButton
          icon="i-lucide-arrow-left"
          size="sm"
          color="neutral"
          variant="ghost"
          @click="handleCloseProject"
        />
      </UTooltip>

      <!-- Edit buttons (hidden in read-only mode) -->
      <template v-if="!canvasReadOnly">
        <!-- Separator -->
        <div class="w-px h-6 bg-muted mx-1" />

        <!-- Add table button -->
        <UTooltip :text="t('canvas.add_table')" :delay-duration="0">
          <UButton
            size="sm"
            variant="soft"
            @click="addNewTable"
          >
            <!-- Table icon with + -->
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- Table shape -->
              <rect x="2" y="4" width="14" height="12" rx="2" />
              <line x1="2" y1="9" x2="16" y2="9" />
              <line x1="9" y1="4" x2="9" y2="16" />
              <!-- Plus sign -->
              <line x1="19" y1="15" x2="19" y2="21" />
              <line x1="16" y1="18" x2="22" y2="18" />
            </svg>
          </UButton>
        </UTooltip>

        <!-- Create group button -->
        <UTooltip :text="t('group.create')" :delay-duration="0">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            @click="addNewGroup"
          >
            <!-- Group icon with + -->
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- Group rectangle -->
              <rect x="2" y="4" width="14" height="12" rx="2" stroke-dasharray="4 2" />
              <!-- Plus sign -->
              <line x1="19" y1="15" x2="19" y2="21" />
              <line x1="16" y1="18" x2="22" y2="18" />
            </svg>
          </UButton>
        </UTooltip>

        <!-- Create note button -->
        <UTooltip :text="t('note.create')" :delay-duration="0">
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            @click="addNewNote"
          >
            <!-- Note icon with + -->
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- Note rectangle (solid) -->
              <rect x="2" y="4" width="14" height="12" rx="2" />
              <!-- Text lines -->
              <line x1="5" y1="8" x2="13" y2="8" />
              <line x1="5" y1="12" x2="10" y2="12" />
              <!-- Plus sign -->
              <line x1="19" y1="15" x2="19" y2="21" />
              <line x1="16" y1="18" x2="22" y2="18" />
            </svg>
          </UButton>
        </UTooltip>

        <!-- Separator -->
        <div class="w-px h-6 bg-muted mx-1" />

        <!-- Save button -->
        <UTooltip :text="t('common.save')" :delay-duration="0">
          <UButton
            icon="i-lucide-save"
            size="sm"
            color="neutral"
            variant="ghost"
            :loading="isSaving"
            @click="handleSave"
          />
        </UTooltip>
      </template>
    </div>
  </Panel>
</template>

<style scoped>
/* Pointer cursor on all buttons */
:deep(button) {
  cursor: pointer;
}
</style>
