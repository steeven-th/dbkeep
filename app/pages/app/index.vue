<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { projects, isLoadingList, hasLoadedOnce, fetchProjects, deleteProject, closeProject } = useProjects()

// New project modal state
const showNewProjectModal = ref(false)

// Import modal state
const showImportModal = ref(false)

// Project filters (search, engine, sort)
const {
  searchQuery,
  selectedEngine,
  selectedSort,
  sortOptions,
  engineOptions,
  filteredProjects,
  clearFilters
} = useProjectFilters(projects)

// Delete confirmation modal state
const projectToDelete = ref<string | null>(null)
const showDeleteModal = computed({
  get: () => !!projectToDelete.value,
  set: (value) => {
    if (!value) projectToDelete.value = null
  }
})

// Rename modal state
const projectToRename = ref<{ id: string, name: string } | null>(null)
const newProjectName = ref('')
const isRenaming = ref(false)
const showRenameModal = computed({
  get: () => !!projectToRename.value,
  set: (value) => {
    if (!value) {
      projectToRename.value = null
      newProjectName.value = ''
    }
  }
})

// Close any open project immediately
closeProject()

// Start loading projects in setup (not onMounted) to avoid stale data flash.
// The synchronous part of fetchProjects (clear projects + set loading)
// runs before the first render, ensuring skeletons show immediately.
if (import.meta.client) {
  fetchProjects()
}

/**
 * Opens the new project modal
 */
const openNewProjectModal = () => {
  showNewProjectModal.value = true
}

/**
 * Navigates to a project
 */
const openProject = (projectId: string) => {
  router.push(`/app/project/${projectId}`)
}

/**
 * Requests confirmation before deletion
 */
const confirmDelete = (projectId: string) => {
  projectToDelete.value = projectId
}

/**
 * Deletes the project after confirmation
 */
const handleDeleteProject = async () => {
  if (projectToDelete.value) {
    await deleteProject(projectToDelete.value)
    projectToDelete.value = null
  }
}

/**
 * Opens the rename modal
 */
const openRenameModal = (projectId: string, currentName: string) => {
  projectToRename.value = { id: projectId, name: currentName }
  newProjectName.value = currentName
}

/**
 * Renames the project
 */
const handleRenameProject = async () => {
  // Guard against double call (Enter triggers keyup then blur/click)
  if (isRenaming.value) return
  if (!projectToRename.value || !newProjectName.value.trim()) return

  isRenaming.value = true
  try {
    await $fetch(`/api/projects/${projectToRename.value.id}`, {
      method: 'PUT',
      body: { name: newProjectName.value.trim() }
    })

    toast.add({
      title: t('project.renamed_success'),
      color: 'success'
    })

    // Refresh the list
    await fetchProjects()

    // Close the modal
    showRenameModal.value = false
  } catch (error: unknown) {
    toast.add({
      title: t('project.error_rename'),
      description: error instanceof Error ? error.message : String(error),
      color: 'error'
    })
  } finally {
    isRenaming.value = false
  }
}
</script>

<template>
  <div class="welcome-screen bg-muted p-8 overflow-auto">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <div class="flex justify-center">
          <div class="w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full">
            <UIcon
              name="i-lucide-database"
              class="w-10 h-10 text-primary"
            />
          </div>
        </div>
        <h1 class="text-3xl font-bold">
          {{ t('project.welcome_title') }}
        </h1>
        <p class="text-muted text-lg">
          {{ t('project.welcome_message') }}
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
          <UButton
            size="lg"
            icon="i-lucide-plus"
            @click="openNewProjectModal"
          >
            {{ t('sidebar.new_project') }}
          </UButton>
          <UButton
            size="lg"
            variant="outline"
            icon="i-lucide-upload"
            @click="showImportModal = true"
          >
            {{ t('import.button') }}
          </UButton>
        </div>
      </div>

      <!-- Liste des projets -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            {{ t('project.my_projects') }}
          </h2>
          <UButton
            v-if="projects.length > 0"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            size="sm"
            :loading="isLoadingList"
            @click="fetchProjects"
          />
        </div>

        <!-- Search bar and filters -->
        <ProjectFiltersBar
          v-model:search="searchQuery"
          v-model:engine="selectedEngine"
          v-model:sort="selectedSort"
          :sort-options="sortOptions"
          :engine-options="engineOptions"
        />

        <!-- Loading state with card skeletons (only when no projects yet) -->
        <div
          v-if="isLoadingList && projects.length === 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="bg-default rounded-lg border border-default p-4"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <USkeleton class="w-5 h-5 rounded" />
                <USkeleton class="h-5 w-32" />
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <USkeleton class="h-3 w-48" />
            </div>
            <USkeleton class="h-9 w-full rounded-md" />
          </div>
        </div>

        <!-- Empty list (only after first load) -->
        <div
          v-else-if="hasLoadedOnce && projects.length === 0"
          class="text-center py-12 px-4 bg-default rounded-lg border border-default"
        >
          <UIcon
            name="i-lucide-folder-open"
            class="w-12 h-12 text-muted mx-auto mb-4"
          />
          <p class="text-muted">
            {{ t('project.empty_list') }}
          </p>
          <p class="text-sm text-muted mt-1">
            {{ t('project.empty_list_description') }}
          </p>
        </div>

        <!-- No search results -->
        <div
          v-else-if="hasLoadedOnce && projects.length > 0 && filteredProjects.length === 0"
          class="text-center py-12 bg-default rounded-lg border border-default"
        >
          <UIcon
            name="i-lucide-search-x"
            class="w-12 h-12 text-muted mx-auto mb-4"
          />
          <p class="text-muted">
            {{ t('project.no_results') }}
          </p>
          <p class="text-sm text-muted mt-1">
            {{ t('project.no_results_description') }}
          </p>
          <UButton
            variant="soft"
            class="mt-4"
            @click="clearFilters"
          >
            {{ t('project.clear_filters') }}
          </UButton>
        </div>

        <!-- Projects grid -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <ProjectCard
            v-for="project in filteredProjects"
            :key="project.id"
            :project="project"
            :always-show-menu="true"
            @open="openProject"
            @rename="openRenameModal"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </div>

    <!-- New project creation modal -->
    <CanvasNewProjectModal v-model:open="showNewProjectModal" />

    <!-- Import project modal -->
    <ImportProjectModal v-model:open="showImportModal" />

    <!-- Delete confirmation modal -->
    <UModal
      v-model:open="showDeleteModal"
      :title="t('project.confirm_delete')"
      :description="t('project.confirm_delete_description')"
      :icon="{ name: 'i-lucide-alert-triangle', class: 'text-error' }"
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="showDeleteModal = false"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            color="error"
            @click="handleDeleteProject"
          >
            {{ t('project.delete') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Rename modal -->
    <UModal
      v-model:open="showRenameModal"
      :title="t('project.rename')"
      :description="t('project.rename_description')"
    >
      <template #body>
        <UFormField :label="t('project.name')">
          <UInput
            v-model="newProjectName"
            :placeholder="t('project.name_placeholder')"
            autofocus
            class="w-full"
            @keyup.enter="handleRenameProject"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="showRenameModal = false"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            :loading="isRenaming"
            :disabled="!newProjectName.trim() || newProjectName === projectToRename?.name"
            @click="handleRenameProject"
          >
            {{ t('common.save') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.welcome-screen {
  height: calc(100vh - 3.5rem); /* 3.5rem = h-14 of the navbar */
}
</style>
