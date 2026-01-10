<script setup lang="ts">
import { DatabaseEngine } from '~/types/database'

const router = useRouter()
const { t } = useI18n()
const { createProject: createAndSaveProject, isSaving } = useProjects()

// Props pour contrôler l'ouverture du modal
const isOpen = defineModel<boolean>('open', { default: false })

// État du formulaire
const projectName = ref('')
const selectedEngine = ref<DatabaseEngine>(DatabaseEngine.PostgreSQL)

// Options pour le sélecteur de moteur de BDD
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

// Icône du moteur sélectionné
const selectedEngineIcon = computed(() => {
  const engine = engineOptions.value.find(e => e.value === selectedEngine.value)
  return engine?.icon || 'i-lucide-database'
})

// Validation du formulaire
const isValid = computed(() => {
  return projectName.value.trim().length > 0
})

/**
 * Crée le projet et ferme le modal
 */
const createProject = async () => {
  if (!isValid.value || isSaving.value) return

  // Créer et sauvegarder le projet en BDD
  const project = await createAndSaveProject(
    projectName.value.trim(),
    selectedEngine.value
  )

  if (project) {
    // Réinitialiser le formulaire
    resetForm()

    // Fermer le modal
    isOpen.value = false

    // Naviguer vers le projet créé
    router.push(`/app/project/${project.id}`)
  }
}

/**
 * Réinitialise le formulaire
 */
const resetForm = () => {
  projectName.value = ''
  selectedEngine.value = DatabaseEngine.PostgreSQL
}

/**
 * Ferme le modal et réinitialise le formulaire
 */
const closeModal = () => {
  resetForm()
  isOpen.value = false
}

// Réinitialiser le formulaire quand le modal s'ouvre
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
    :close="true"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Nom du projet -->
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

        <!-- Moteur de base de données -->
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
