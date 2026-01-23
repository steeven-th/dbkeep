<script setup lang="ts">
import { TABLE_COLORS } from '~/types/database'

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const deleteConfirm = useDeleteConfirm()

// Open state based on editingGroup
const isOpen = computed({
  get: () => !!projectStore.editingGroup.value,
  set: (val) => {
    if (!val) {
      projectStore.closeGroupEditor()
    }
  }
})

// Reference to the group being edited
const group = computed(() => projectStore.editingGroup.value)

// Reference to color picker
const colorPickerRef = ref<HTMLInputElement | null>(null)

// Opens native color picker
const openColorPicker = () => {
  colorPickerRef.value?.click()
}

/**
 * Updates group name
 */
const updateGroupName = (name: string) => {
  if (!group.value) return
  projectStore.updateGroup(group.value.id, { name })
  canvasStore.updateNodeData(group.value.id, { name })
}

/**
 * Updates group color
 */
const updateGroupColor = (color: string) => {
  if (!group.value) return
  projectStore.updateGroup(group.value.id, { color })
  canvasStore.updateNodeData(group.value.id, { color })
}

/**
 * Deletes the group (with confirmation)
 */
const deleteGroup = () => {
  if (!group.value) return

  const groupId = group.value.id

  deleteConfirm.requestDelete({
    type: 'group',
    ids: [groupId],
    onConfirm: () => {
      // Close editor first
      projectStore.closeGroupEditor()

      // Remove child tables from group (unassign them)
      const children = canvasStore.getGroupChildren(groupId)
      children.forEach(child => {
        canvasStore.assignToGroup(child.id, null)
      })

      // Remove node from canvas
      canvasStore.removeNode(groupId)

      // Delete group from project
      projectStore.deleteGroup(groupId)
    }
  })
}
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :title="t('group.edit')"
    :description="t('group.edit_description')"
    side="right"
  >
    <template #body>
      <div
        v-if="group"
        class="space-y-6"
      >
        <!-- Section: Group information -->
        <div class="space-y-4">
          <!-- Group name -->
          <UFormField :label="t('group.name')">
            <UInput
              :model-value="group.name"
              :placeholder="t('group.name_placeholder')"
              @update:model-value="updateGroupName"
            />
          </UFormField>

          <!-- Border and background color -->
          <UFormField :label="t('group.color')">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Predefined colors -->
              <button
                v-for="color in TABLE_COLORS"
                :key="color.value"
                type="button"
                class="color-swatch"
                :class="{ 'ring-2 ring-primary ring-offset-2': group.color === color.value }"
                :style="{ backgroundColor: color.value }"
                :title="t(`colors.${color.label}`)"
                @click="updateGroupColor(color.value)"
              />
              <!-- Custom color picker button -->
              <button
                type="button"
                class="color-swatch color-swatch-custom"
                :style="{ backgroundColor: group.color }"
                :title="t('group.custom_color')"
                @click="openColorPicker"
              >
                <UIcon
                  name="i-lucide-pipette"
                  class="size-3 text-white drop-shadow"
                />
              </button>
              <!-- Hidden color input -->
              <input
                ref="colorPickerRef"
                type="color"
                :value="group.color"
                class="sr-only"
                @input="updateGroupColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </UFormField>
        </div>

        <!-- Group preview -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-muted">{{ t('group.preview') }}</label>
          <div
            class="h-24 rounded-lg border-2 border-dashed relative mt-2"
            :style="{
              borderColor: group.color,
              backgroundColor: `${group.color}10`
            }"
          >
            <div
              class="absolute -top-2.5 left-3 px-2 py-0.5 rounded text-xs font-medium bg-default border"
              :style="{ borderColor: group.color, color: group.color }"
            >
              {{ group.name || t('group.default_name') }}
            </div>
          </div>
        </div>

        <USeparator />

        <!-- Danger zone -->
        <div class="space-y-4">
          <h3 class="font-semibold text-sm text-error">
            {{ t('common.danger_zone') }}
          </h3>
          <p class="text-sm text-muted">
            {{ t('group.delete_warning') }}
          </p>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            block
            @click="deleteGroup"
          >
            {{ t('group.delete') }}
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
</style>
