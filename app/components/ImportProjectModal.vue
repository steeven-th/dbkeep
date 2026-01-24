<script setup lang="ts">
import { DatabaseEngine } from '~/types/database'
import type { Project, TableData, Relation } from '~/types/database'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { createProject: createAndSaveProject, isSaving } = useProjects()
const { parseSql } = useSqlParser()

// Modal phase: 'dropzone' or 'sql-config'
type ModalPhase = 'dropzone' | 'sql-config'
const phase = ref<ModalPhase>('dropzone')

// Drag state
const isDragging = ref(false)
const isImporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// SQL import state
const sqlContent = ref('')
const sqlFilename = ref('')
const sqlProjectName = ref('')
const sqlEngine = ref<DatabaseEngine>(DatabaseEngine.PostgreSQL)
const sqlParseResult = ref<{
  tables: TableData[]
  relations: Relation[]
  errors: Array<{ message: string; line: number; column: number }>
} | null>(null)

// Accepted file types
const acceptedTypes = ['.json', '.sql']

// Database engine options
const engineOptions = [
  { label: 'PostgreSQL', value: DatabaseEngine.PostgreSQL },
  { label: 'MySQL', value: DatabaseEngine.MySQL },
  { label: 'SQLite', value: DatabaseEngine.SQLite }
]

/**
 * Handles file selection from input
 */
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    processFile(input.files[0])
  }
}

/**
 * Handles drag over event
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

/**
 * Handles drag leave event
 */
const handleDragLeave = () => {
  isDragging.value = false
}

/**
 * Handles file drop
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0])
  }
}

/**
 * Opens file picker
 */
const openFilePicker = () => {
  fileInputRef.value?.click()
}

/**
 * Processes the selected file
 */
const processFile = async (file: File) => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (!acceptedTypes.includes(extension)) {
    toast.add({
      title: t('import.error'),
      description: t('import.error_invalid_format'),
      color: 'error'
    })
    return
  }

  isImporting.value = true

  try {
    const content = await file.text()

    if (extension === '.json') {
      await importJson(content, file.name)
    } else if (extension === '.sql') {
      // Store SQL content and switch to config phase
      sqlContent.value = content
      sqlFilename.value = file.name
      // Extract project name from filename (without extension)
      sqlProjectName.value = file.name.replace(/\.sql$/i, '')
      // Parse SQL with default engine to show preview
      parseSqlContent()
      phase.value = 'sql-config'
    }
  } catch (error: any) {
    toast.add({
      title: t('import.error'),
      description: error.message,
      color: 'error'
    })
  } finally {
    isImporting.value = false
  }
}

/**
 * Parses SQL content with selected engine
 */
const parseSqlContent = () => {
  const dialectMap: Record<DatabaseEngine, 'PostgreSQL' | 'MySQL' | 'SQLite'> = {
    [DatabaseEngine.PostgreSQL]: 'PostgreSQL',
    [DatabaseEngine.MySQL]: 'MySQL',
    [DatabaseEngine.SQLite]: 'SQLite'
  }

  const result = parseSql(sqlContent.value, dialectMap[sqlEngine.value])
  sqlParseResult.value = result
}

/**
 * Watch engine changes to re-parse SQL
 */
watch(sqlEngine, () => {
  if (sqlContent.value) {
    parseSqlContent()
  }
})

/**
 * Imports a JSON file
 */
const importJson = async (content: string, _filename: string) => {
  try {
    const data = JSON.parse(content)

    // Validate structure
    if (!data.project || !data.project.name || !data.project.engine) {
      throw new Error(t('import.error_invalid_json'))
    }

    const projectData = data.project as Partial<Project>

    // Create project with imported data
    const project = await createAndSaveProject(
      projectData.name || 'Imported Project',
      projectData.engine as DatabaseEngine || DatabaseEngine.PostgreSQL,
      {
        tables: projectData.tables || [],
        groups: projectData.groups || [],
        notes: projectData.notes || [],
        relations: projectData.relations || []
      }
    )

    if (project) {
      toast.add({
        title: t('import.success'),
        color: 'success'
      })

      closeModal()
      router.push(`/app/project/${project.id}`)
    }
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error(t('import.error_invalid_json'))
    }
    throw error
  }
}

/**
 * Confirms SQL import with selected options
 */
const confirmSqlImport = async () => {
  if (!sqlParseResult.value || sqlParseResult.value.tables.length === 0) {
    toast.add({
      title: t('import.error'),
      description: t('import.sql_no_tables'),
      color: 'error'
    })
    return
  }

  isImporting.value = true

  try {
    const project = await createAndSaveProject(
      sqlProjectName.value || 'Imported SQL Project',
      sqlEngine.value,
      {
        tables: sqlParseResult.value.tables,
        groups: [],
        notes: [],
        relations: sqlParseResult.value.relations
      }
    )

    if (project) {
      toast.add({
        title: t('import.success'),
        color: 'success'
      })

      closeModal()
      router.push(`/app/project/${project.id}`)
    }
  } catch (error: any) {
    toast.add({
      title: t('import.error'),
      description: error.message,
      color: 'error'
    })
  } finally {
    isImporting.value = false
  }
}

/**
 * Goes back to dropzone phase
 */
const goBackToDropzone = () => {
  phase.value = 'dropzone'
  sqlContent.value = ''
  sqlFilename.value = ''
  sqlProjectName.value = ''
  sqlParseResult.value = null
}

/**
 * Closes the modal
 */
const closeModal = () => {
  emit('update:open', false)
  // Reset state
  phase.value = 'dropzone'
  sqlContent.value = ''
  sqlFilename.value = ''
  sqlProjectName.value = ''
  sqlParseResult.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="t('import.title')"
    :description="t('import.description')"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptedTypes.join(',')"
        class="hidden"
        @change="handleFileSelect"
      >

      <!-- Phase 1: Dropzone -->
      <div v-if="phase === 'dropzone'">
        <div
          class="relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer"
          :class="[
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-default hover:border-primary/50 hover:bg-muted/50'
          ]"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="openFilePicker"
        >
          <!-- Loading overlay -->
          <div
            v-if="isImporting || isSaving"
            class="absolute inset-0 flex items-center justify-center bg-default/80 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin" />
              <span class="text-sm">{{ t('import.importing') }}</span>
            </div>
          </div>

          <!-- Dropzone content -->
          <div class="space-y-3">
            <div class="flex justify-center">
              <div
                class="w-12 h-12 flex items-center justify-center rounded-full transition-colors"
                :class="isDragging ? 'bg-primary/10' : 'bg-muted'"
              >
                <UIcon
                  :name="isDragging ? 'i-lucide-download' : 'i-lucide-upload'"
                  class="w-6 h-6"
                  :class="isDragging ? 'text-primary' : 'text-muted'"
                />
              </div>
            </div>

            <p class="text-sm font-medium">
              {{ isDragging ? t('import.dropzone_active') : t('import.dropzone') }}
            </p>

            <p class="text-xs text-muted">
              {{ t('import.accepted_formats') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Phase 2: SQL Configuration -->
      <div v-else-if="phase === 'sql-config'" class="space-y-4">
        <!-- File info -->
        <div class="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <UIcon name="i-lucide-file-code" class="w-5 h-5 text-muted" />
          <span class="text-sm font-medium truncate">{{ sqlFilename }}</span>
        </div>

        <!-- Project name -->
        <UFormField :label="t('import.sql_project_name')">
          <UInput
            v-model="sqlProjectName"
            :placeholder="t('import.sql_project_name_placeholder')"
          />
        </UFormField>

        <!-- Engine selection -->
        <UFormField :label="t('import.sql_select_engine')">
          <USelect
            v-model="sqlEngine"
            :items="engineOptions"
            value-key="value"
          />
        </UFormField>

        <!-- Parse result preview -->
        <div v-if="sqlParseResult" class="space-y-2">
          <!-- Success: show tables and relations count -->
          <div v-if="sqlParseResult.tables.length > 0" class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1.5 text-success">
              <UIcon name="i-lucide-table" class="w-4 h-4" />
              <span>{{ t('import.sql_tables_found', { count: sqlParseResult.tables.length }) }}</span>
            </div>
            <div v-if="sqlParseResult.relations.length > 0" class="flex items-center gap-1.5 text-info">
              <UIcon name="i-lucide-link" class="w-4 h-4" />
              <span>{{ t('import.sql_relations_found', { count: sqlParseResult.relations.length }) }}</span>
            </div>
          </div>

          <!-- No tables found -->
          <div v-else-if="sqlParseResult.errors.length === 0" class="text-sm text-warning">
            {{ t('import.sql_no_tables') }}
          </div>

          <!-- Parse errors -->
          <div v-if="sqlParseResult.errors.length > 0" class="space-y-1">
            <div
              v-for="(error, idx) in sqlParseResult.errors"
              :key="idx"
              class="text-sm text-error flex items-start gap-1.5"
            >
              <UIcon name="i-lucide-alert-circle" class="w-4 h-4 mt-0.5 shrink-0" />
              <span>{{ error.message }} ({{ t('import.sql_line') }} {{ error.line }})</span>
            </div>
          </div>

          <!-- Tables list preview -->
          <div v-if="sqlParseResult.tables.length > 0" class="mt-3">
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="table in sqlParseResult.tables.slice(0, 10)"
                :key="table.id"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ table.name }}
              </UBadge>
              <UBadge
                v-if="sqlParseResult.tables.length > 10"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                +{{ sqlParseResult.tables.length - 10 }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between w-full">
        <!-- Back button (SQL config phase) -->
        <div>
          <UButton
            v-if="phase === 'sql-config'"
            color="neutral"
            variant="ghost"
            @click="goBackToDropzone"
          >
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4 mr-1" />
            {{ t('import.back') }}
          </UButton>
        </div>

        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="closeModal"
          >
            {{ t('common.cancel') }}
          </UButton>

          <!-- Import button (SQL config phase) -->
          <UButton
            v-if="phase === 'sql-config'"
            color="primary"
            :loading="isImporting || isSaving"
            :disabled="!sqlParseResult || sqlParseResult.tables.length === 0 || !sqlProjectName.trim()"
            @click="confirmSqlImport"
          >
            {{ t('import.sql_import_button') }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
