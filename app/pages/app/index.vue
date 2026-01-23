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

// Search and filter state
const searchQuery = ref('')
const selectedEngine = ref<string | null>(null)

// Engine filter options
const engineOptions = computed(() => [
  { label: t('project.all_engines'), value: null },
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'MySQL', value: 'MySQL' },
  { label: 'SQLite', value: 'SQLite' }
])

// Filtered projects
const filteredProjects = computed(() => {
  let result = projects.value

  // Filter by text search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => p.name.toLowerCase().includes(query))
  }

  // Filter by engine
  if (selectedEngine.value) {
    result = result.filter(p => p.engine === selectedEngine.value)
  }

  return result
})

// Delete confirmation modal state
const projectToDelete = ref<string | null>(null)
const showDeleteModal = computed({
  get: () => !!projectToDelete.value,
  set: (value) => {
    if (!value) projectToDelete.value = null
  }
})

// Rename modal state
const projectToRename = ref<{ id: string; name: string } | null>(null)
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

// Close any open project and load list on mount
onMounted(() => {
  closeProject()
  fetchProjects()
})

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
  } catch (error: any) {
    toast.add({
      title: t('project.error_rename'),
      description: error.message,
      color: 'error'
    })
  } finally {
    isRenaming.value = false
  }
}

/**
 * Formats a relative date
 */
const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Returns the database engine icon
 */
const getEngineIcon = (engine: string) => {
  switch (engine) {
    case 'PostgreSQL':
      return 'i-simple-icons-postgresql'
    case 'MySQL':
      return 'i-simple-icons-mysql'
    case 'SQLite':
      return 'i-simple-icons-sqlite'
    default:
      return 'i-lucide-database'
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
        <UButton
          size="lg"
          icon="i-lucide-plus"
          @click="openNewProjectModal"
        >
          {{ t('sidebar.new_project') }}
        </UButton>
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
        <div
          v-if="hasLoadedOnce && projects.length > 0"
          class="flex flex-col sm:flex-row gap-3"
        >
          <UInput
            v-model="searchQuery"
            :placeholder="t('project.search_placeholder')"
            icon="i-lucide-search"
            class="flex-1"
          />
          <USelect
            v-model="selectedEngine"
            :items="engineOptions"
            value-key="value"
            class="w-full sm:w-48"
          />
        </div>

        <!-- Loading state with card skeletons -->
        <div
          v-if="isLoadingList"
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
          class="text-center py-12 bg-default rounded-lg border border-default"
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
            @click="searchQuery = ''; selectedEngine = null"
          >
            {{ t('project.clear_filters') }}
          </UButton>
        </div>

        <!-- Projects grid -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="project in filteredProjects"
            :key="project.id"
            class="bg-default rounded-lg border border-default p-4 hover:border-primary transition-colors group"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="getEngineIcon(project.engine)"
                  class="w-5 h-5 text-muted"
                />
                <h3 class="font-medium truncate">
                  {{ project.name }}
                </h3>
              </div>
              <UDropdownMenu
                :items="[
                  [{
                    label: t('project.open'),
                    icon: 'i-lucide-folder-open',
                    onSelect: () => openProject(project.id)
                  },
                  {
                    label: t('project.rename'),
                    icon: 'i-lucide-pencil',
                    onSelect: () => openRenameModal(project.id, project.name)
                  }],
                  [{
                    label: t('project.delete'),
                    icon: 'i-lucide-trash-2',
                    color: 'error',
                    onSelect: () => confirmDelete(project.id)
                  }]
                ]"
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  variant="ghost"
                  size="xs"
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </UDropdownMenu>
            </div>

            <div class="text-xs text-muted space-y-1">
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-lucide-clock"
                  class="w-3 h-3"
                />
                <span>{{ t('project.last_modified') }}: {{ formatDate(project.updatedAt) }}</span>
              </div>
            </div>

            <!-- Open button at bottom -->
            <UButton
              class="w-full mt-4"
              variant="soft"
              @click="openProject(project.id)"
            >
              {{ t('project.open') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- New project creation modal -->
    <CanvasNewProjectModal v-model:open="showNewProjectModal" />

    <!-- Delete confirmation modal -->
    <UModal v-model:open="showDeleteModal">
      <template #header>
        <div class="flex items-center gap-2 text-error">
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-5 h-5"
          />
          <span class="font-semibold">{{ t('project.confirm_delete') }}</span>
        </div>
      </template>
      <template #body>
        <p class="text-muted">
          {{ t('project.confirm_delete_description') }}
        </p>
      </template>
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
