<script setup lang="ts">
import { TABLE_COLORS } from '~/types/database'

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const deleteConfirm = useDeleteConfirm()

// Open state based on editingNote
const isOpen = computed({
  get: () => !!projectStore.editingNote.value,
  set: (val) => {
    if (!val) {
      projectStore.closeNoteEditor()
    }
  }
})

// Reference to the note being edited
const note = computed(() => projectStore.editingNote.value)

// Reference to color picker
const colorPickerRef = ref<HTMLInputElement | null>(null)

// Opens native color picker
const openColorPicker = () => {
  colorPickerRef.value?.click()
}

/**
 * Updates note name
 */
const updateNoteName = (name: string) => {
  if (!note.value) return
  projectStore.updateNote(note.value.id, { name })
  canvasStore.updateNodeData(note.value.id, { name })
}

/**
 * Updates note content
 */
const updateNoteContent = (content: string) => {
  if (!note.value) return
  projectStore.updateNote(note.value.id, { content })
  canvasStore.updateNodeData(note.value.id, { content })
}

/**
 * Updates note color
 */
const updateNoteColor = (color: string) => {
  if (!note.value) return
  projectStore.updateNote(note.value.id, { color })
  canvasStore.updateNodeData(note.value.id, { color })
}

/**
 * Updates text color
 */
const updateNoteTextColor = (textColor: 'black' | 'white') => {
  if (!note.value) return
  projectStore.updateNote(note.value.id, { textColor })
  canvasStore.updateNodeData(note.value.id, { textColor })
}

/**
 * Deletes the note (with confirmation)
 */
const deleteNote = () => {
  if (!note.value) return

  const noteId = note.value.id

  deleteConfirm.requestDelete({
    type: 'note',
    ids: [noteId],
    onConfirm: () => {
      // Close editor first
      projectStore.closeNoteEditor()

      // Remove node from canvas
      canvasStore.removeNode(noteId)

      // Delete note from project
      projectStore.deleteNote(noteId)
    }
  })
}

// Calculate colors for preview
const previewBackgroundColor = computed(() => {
  const color = note.value?.color || '#fef3c7'
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.9)`
})

const previewBorderColor = computed(() => {
  const color = note.value?.color || '#fef3c7'
  const r = Math.max(0, parseInt(color.slice(1, 3), 16) - 40)
  const g = Math.max(0, parseInt(color.slice(3, 5), 16) - 40)
  const b = Math.max(0, parseInt(color.slice(5, 7), 16) - 40)
  return `rgb(${r}, ${g}, ${b})`
})

const previewTextColor = computed(() => {
  return note.value?.textColor === 'white' ? '#ffffff' : '#1f2937'
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="t('note.edit')"
    :description="t('note.edit_description')"
    side="right"
  >
    <template #body>
      <div v-if="note" class="space-y-6">
        <!-- Section: Note information -->
        <div class="space-y-4">
          <!-- Note name -->
          <UFormField :label="t('note.name')">
            <UInput
              :model-value="note.name"
              :placeholder="t('note.name_placeholder')"
              @update:model-value="updateNoteName"
            />
          </UFormField>

          <!-- Note content -->
          <UFormField :label="t('note.content')">
            <UTextarea
              :model-value="note.content"
              :placeholder="t('note.content_placeholder')"
              :rows="6"
              @update:model-value="updateNoteContent"
            />
          </UFormField>

          <!-- Background color -->
          <UFormField :label="t('note.color')">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Predefined colors -->
              <button
                v-for="color in TABLE_COLORS"
                :key="color.value"
                type="button"
                class="color-swatch"
                :class="{ 'ring-2 ring-primary ring-offset-2': note.color === color.value }"
                :style="{ backgroundColor: color.value }"
                :title="t(`colors.${color.label}`)"
                @click="updateNoteColor(color.value)"
              />
              <!-- Custom color picker button -->
              <button
                type="button"
                class="color-swatch color-swatch-custom"
                :style="{ backgroundColor: note.color }"
                :title="t('note.custom_color')"
                @click="openColorPicker"
              >
                <UIcon name="i-lucide-pipette" class="size-3 text-white drop-shadow" />
              </button>
              <!-- Hidden color input -->
              <input
                ref="colorPickerRef"
                type="color"
                :value="note.color"
                class="sr-only"
                @input="updateNoteColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </UFormField>

          <!-- Text color -->
          <UFormField :label="t('note.text_color')">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-color-swatch text-color-swatch-light"
                :class="{ 'ring-2 ring-primary ring-offset-2': note.textColor === 'black' || !note.textColor }"
                @click="updateNoteTextColor('black')"
              >
                <span class="text-black font-semibold">A</span>
              </button>
              <button
                type="button"
                class="text-color-swatch text-color-swatch-dark"
                :class="{ 'ring-2 ring-primary ring-offset-2': note.textColor === 'white' }"
                @click="updateNoteTextColor('white')"
              >
                <span class="text-white font-semibold">A</span>
              </button>
            </div>
          </UFormField>
        </div>

        <!-- Note preview -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-muted">{{ t('note.preview') }}</label>
          <div
            class="rounded-lg border-2 p-3 min-h-24"
            :style="{
              borderColor: previewBorderColor,
              backgroundColor: previewBackgroundColor,
              color: previewTextColor
            }"
          >
            <div
              class="text-sm font-semibold mb-2 pb-2 border-b"
              :style="{ borderColor: previewBorderColor }"
            >
              {{ note.name || t('note.default_name') }}
            </div>
            <p class="text-xs whitespace-pre-wrap line-clamp-4 opacity-90">
              {{ note.content || t('note.no_content') }}
            </p>
          </div>
        </div>

        <USeparator />

        <!-- Danger zone -->
        <div class="space-y-4">
          <h3 class="font-semibold text-sm text-error">{{ t('common.danger_zone') }}</h3>
          <p class="text-sm text-muted">{{ t('note.delete_warning') }}</p>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            block
            @click="deleteNote"
          >
            {{ t('note.delete') }}
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: var(--color-border);
}

.color-swatch-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
}

.text-color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 2px solid;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.text-color-swatch-light {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.text-color-swatch-dark {
  background-color: #1f2937;
  border-color: #1f2937;
}

.text-color-swatch:hover {
  transform: scale(1.1);
}

/* Limit number of displayed lines */
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
