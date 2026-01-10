<script setup lang="ts">
import { TABLE_COLORS } from '~/types/database'

const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const deleteConfirm = useDeleteConfirm()

// État d'ouverture basé sur editingGroup
const isOpen = computed({
  get: () => !!projectStore.editingGroup.value,
  set: (val) => {
    if (!val) {
      projectStore.closeGroupEditor()
    }
  }
})

// Référence au groupe en cours d'édition
const group = computed(() => projectStore.editingGroup.value)

// Référence au color picker
const colorPickerRef = ref<HTMLInputElement | null>(null)

// Ouvre le color picker natif
const openColorPicker = () => {
  colorPickerRef.value?.click()
}

/**
 * Met à jour le nom du groupe
 */
const updateGroupName = (name: string) => {
  if (!group.value) return
  projectStore.updateGroup(group.value.id, { name })
  canvasStore.updateNodeData(group.value.id, { name })
}

/**
 * Met à jour la couleur du groupe
 */
const updateGroupColor = (color: string) => {
  if (!group.value) return
  projectStore.updateGroup(group.value.id, { color })
  canvasStore.updateNodeData(group.value.id, { color })
}

/**
 * Supprime le groupe (avec confirmation)
 */
const deleteGroup = () => {
  if (!group.value) return

  const groupId = group.value.id

  deleteConfirm.requestDelete({
    type: 'group',
    ids: [groupId],
    onConfirm: () => {
      // Fermer l'éditeur d'abord
      projectStore.closeGroupEditor()

      // Retirer les tables enfants du groupe (les désassigner)
      const children = canvasStore.getGroupChildren(groupId)
      children.forEach(child => {
        canvasStore.assignToGroup(child.id, null)
      })

      // Supprimer le noeud du canvas
      canvasStore.removeNode(groupId)

      // Supprimer le groupe du projet
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
        <!-- Section: Informations du groupe -->
        <div class="space-y-4">
          <!-- Nom du groupe -->
          <UFormField :label="t('group.name')">
            <UInput
              :model-value="group.name"
              :placeholder="t('group.name_placeholder')"
              @update:model-value="updateGroupName"
            />
          </UFormField>

          <!-- Couleur du contour et fond -->
          <UFormField :label="t('group.color')">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Couleurs prédéfinies -->
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
              <!-- Bouton color picker personnalisé -->
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
              <!-- Input color caché -->
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

        <!-- Aperçu du groupe -->
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

        <!-- Zone de danger -->
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
