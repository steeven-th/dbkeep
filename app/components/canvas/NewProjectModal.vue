<script setup lang="ts">
import { DatabaseEngine } from '~/types/database'

const router = useRouter()
const { t } = useI18n()
const { createProject: createAndSaveProject, isSaving } = useProjects()

// Props to control modal open state
const isOpen = defineModel<boolean>('open', { default: false })

// Form state
const projectName = ref('')
const selectedEngine = ref<DatabaseEngine>(DatabaseEngine.PostgreSQL)

// Database engine selector options
const engineOptions = computed(() => [
  {
    label: t('engines.postgresql'),
    value: DatabaseEngine.PostgreSQL,
    icon: 'i-simple-icons-postgresql'
  },
  {
    label: t('engines.mysql'),
    value: DatabaseEngine.MySQL,
    icon: 'i-simple-icons-mysql'
  },
  {
    label: t('engines.sqlite'),
    value: DatabaseEngine.SQLite,
    icon: 'i-simple-icons-sqlite'
  }
])

// Selected engine icon
const selectedEngineIcon = computed(() => {
  const engine = engineOptions.value.find(e => e.value === selectedEngine.value)
  return engine?.icon || 'i-lucide-database'
})

// Form validation
const isValid = computed(() => {
  return projectName.value.trim().length > 0
})

/**
 * Creates the project and closes the modal
 */
const createProject = async () => {
  if (!isValid.value || isSaving.value) return

  // Create and save the project to database
  const project = await createAndSaveProject(
    projectName.value.trim(),
    selectedEngine.value
  )

  if (project) {
    // Reset the form
    resetForm()

    // Close the modal
    isOpen.value = false

    // Navigate to the created project
    router.push(`/app/project/${project.id}`)
  }
}

/**
 * Resets the form
 */
const resetForm = () => {
  projectName.value = ''
  selectedEngine.value = DatabaseEngine.PostgreSQL
}

/**
 * Closes the modal and resets the form
 */
const closeModal = () => {
  resetForm()
  isOpen.value = false
}

// Reset the form when the modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    resetForm()
  }
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('sidebar.new_project')"
    :description="t('project.new_project_description')"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Project name -->
        <UFormField
          :label="t('project.name')"
          required
        >
          <UInput
            v-model="projectName"
            :placeholder="t('project.name_placeholder')"
            autofocus
            class="w-full"
            @keyup.enter="createProject"
          />
        </UFormField>

        <!-- Database engine -->
        <UFormField
          :label="t('project.engine')"
          required
        >
          <USelectMenu
            v-model="selectedEngine"
            :items="engineOptions"
            value-key="value"
            :icon="selectedEngineIcon"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeModal"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          :disabled="!isValid"
          :loading="isSaving"
          @click="createProject"
        >
          {{ t('project.create') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
