<script setup lang="ts">
import { Panel } from '@vue-flow/core'

const router = useRouter()
const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const { saveProject: saveToDb, isSaving } = useProjects()
const toast = useToast()

/**
 * Ferme le projet et retourne à la liste
 */
const handleCloseProject = async () => {
  // Sauvegarder avant de fermer
  await saveToDb()
  // Naviguer vers la liste des projets
  router.push('/app')
}

/**
 * Ajoute une nouvelle table au projet et au canvas
 */
const addNewTable = () => {
  // Créer la table dans le store projet
  const table = projectStore.addTable(t('table.default_name'))

  if (table) {
    // Ajouter le noeud au canvas
    canvasStore.addTableNode(table)
  }
}

/**
 * Ajoute un nouveau groupe au projet et au canvas
 */
const addNewGroup = () => {
  // Créer le groupe dans le store projet
  const group = projectStore.addGroup(t('group.default_name'))

  if (group) {
    // Ajouter le noeud au canvas
    canvasStore.addGroupNode(group)
  }
}

/**
 * Ajoute une nouvelle note au projet et au canvas
 */
const addNewNote = () => {
  // Créer la note dans le store projet
  const note = projectStore.addNote(t('note.default_name'))

  if (note) {
    // Ajouter le noeud au canvas
    canvasStore.addNoteNode(note)
  }
}

/**
 * Sauvegarde le projet en BDD
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
      <!-- Bouton retour à la liste des projets -->
      <UTooltip :text="t('project.back_to_list')" :delay-duration="0">
        <UButton
          icon="i-lucide-arrow-left"
          size="sm"
          color="neutral"
          variant="ghost"
          @click="handleCloseProject"
        />
      </UTooltip>

      <!-- Séparateur -->
      <div class="w-px h-6 bg-muted mx-1" />

      <!-- Bouton Ajouter une table -->
      <UTooltip :text="t('canvas.add_table')" :delay-duration="0">
        <UButton
          size="sm"
          variant="soft"
          @click="addNewTable"
        >
          <!-- Icône table avec + -->
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
            <!-- Table -->
            <rect x="2" y="4" width="14" height="12" rx="2" />
            <line x1="2" y1="9" x2="16" y2="9" />
            <line x1="9" y1="4" x2="9" y2="16" />
            <!-- Plus -->
            <line x1="19" y1="15" x2="19" y2="21" />
            <line x1="16" y1="18" x2="22" y2="18" />
          </svg>
        </UButton>
      </UTooltip>

      <!-- Bouton Créer un groupe -->
      <UTooltip :text="t('group.create')" :delay-duration="0">
        <UButton
          size="sm"
          color="neutral"
          variant="soft"
          @click="addNewGroup"
        >
          <!-- Icône groupe avec + -->
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
            <!-- Rectangle groupe -->
            <rect x="2" y="4" width="14" height="12" rx="2" stroke-dasharray="4 2" />
            <!-- Plus -->
            <line x1="19" y1="15" x2="19" y2="21" />
            <line x1="16" y1="18" x2="22" y2="18" />
          </svg>
        </UButton>
      </UTooltip>

      <!-- Bouton Créer une note -->
      <UTooltip :text="t('note.create')" :delay-duration="0">
        <UButton
          size="sm"
          color="neutral"
          variant="soft"
          @click="addNewNote"
        >
          <!-- Icône note avec + -->
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
            <!-- Rectangle note (plein) -->
            <rect x="2" y="4" width="14" height="12" rx="2" />
            <!-- Lignes de texte -->
            <line x1="5" y1="8" x2="13" y2="8" />
            <line x1="5" y1="12" x2="10" y2="12" />
            <!-- Plus -->
            <line x1="19" y1="15" x2="19" y2="21" />
            <line x1="16" y1="18" x2="22" y2="18" />
          </svg>
        </UButton>
      </UTooltip>

      <!-- Séparateur -->
      <div class="w-px h-6 bg-muted mx-1" />

      <!-- Bouton Enregistrer -->
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
    </div>
  </Panel>
</template>

<style scoped>
/* Cursor pointer sur tous les boutons */
:deep(button) {
  cursor: pointer;
}
</style>
