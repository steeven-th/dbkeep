<script setup lang="ts">
import { shallowRef, ref, watch } from 'vue'
import type { editor } from 'monaco-editor'
import type { SqlParseError } from '~/composables/useSqlParser'

const props = defineProps<{
  modelValue: string
  dialect?: 'PostgreSQL' | 'MySQL' | 'SQLite'
  readOnly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'manual-change': [value: string]
  'cancel-changes': []
  'validation-change': [valid: boolean, errors: SqlParseError[]]
}>()

const { t } = useI18n()
const toast = useToast()
const colorMode = useColorMode()
const { validateSql } = useSqlParser()
const projectStore = useProjectStore()

// Local SQL state (allows tracking manual modifications)
const localSql = ref(props.modelValue)
const isManuallyModified = ref(false)
const currentErrors = ref<SqlParseError[]>([])

// Export modal state
const showExportModal = ref(false)

// Export format options
const exportFormats = computed(() => [
  {
    id: 'sql',
    icon: 'i-lucide-file-code',
    label: t('export.format_sql'),
    description: t('export.format_sql_description'),
    extension: '.sql',
    available: true
  },
  {
    id: 'json',
    icon: 'i-lucide-file-json',
    label: t('export.format_json'),
    description: t('export.format_json_description'),
    extension: '.json',
    available: true
  },
  {
    id: 'pdf',
    icon: 'i-lucide-file-text',
    label: t('export.format_pdf'),
    description: t('export.format_pdf_description'),
    extension: '.pdf',
    available: false
  },
  {
    id: 'image',
    icon: 'i-lucide-image',
    label: t('export.format_image'),
    description: t('export.format_image_description'),
    extension: '.png',
    available: false
  }
])

/**
 * Generates a safe filename from project name
 */
const getSafeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'schema'
}

/**
 * Downloads a file with the given content
 */
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Handles export for the selected format
 */
const handleExport = (formatId: string) => {
  const projectName = projectStore.currentProject.value?.name || 'schema'
  const safeFilename = getSafeFilename(projectName)

  switch (formatId) {
    case 'sql':
      exportSql(safeFilename)
      break
    case 'json':
      exportJson(safeFilename)
      break
  }

  showExportModal.value = false
}

/**
 * Exports the schema as SQL file
 */
const exportSql = (filename: string) => {
  const projectName = projectStore.currentProject.value?.name
  const header = projectName ? `-- ${projectName}\n\n` : ''
  const content = header + localSql.value

  downloadFile(content, `${filename}.sql`, 'application/sql')

  toast.add({
    title: t('export.success'),
    color: 'success',
    icon: 'i-lucide-check'
  })
}

/**
 * Exports the schema as JSON file
 */
const exportJson = (filename: string) => {
  const project = projectStore.currentProject.value
  if (!project) return

  // Build export object with version for future compatibility
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      engine: project.engine,
      tables: project.tables,
      groups: project.groups,
      notes: project.notes,
      relations: project.relations
    }
  }

  const content = JSON.stringify(exportData, null, 2)
  downloadFile(content, `${filename}.json`, 'application/json')

  toast.add({
    title: t('export.success'),
    color: 'success',
    icon: 'i-lucide-check'
  })
}

// Reference to Monaco editor and model
const editorRef = shallowRef<editor.IStandaloneCodeEditor>()
const monacoRef = shallowRef<typeof import('monaco-editor')>()

// Expose modification state to parent
defineExpose({
  isManuallyModified,
  currentErrors,
  resetToGenerated: () => {
    localSql.value = props.modelValue
    isManuallyModified.value = false
    clearMarkers()
    emit('cancel-changes')
  },
  // Called after applying SQL changes: resets state without emitting events
  acceptChanges: () => {
    isManuallyModified.value = false
    clearMarkers()
    currentErrors.value = []
  },
  getLocalSql: () => localSql.value,
  // Allows parent to force validation
  forceValidation: () => validateAndUpdateMarkers(localSql.value)
})

// When generated SQL changes (from store), update only if no manual modification
watch(() => props.modelValue, (newValue) => {
  if (!isManuallyModified.value) {
    localSql.value = newValue
    clearMarkers()
    currentErrors.value = []
  }
})

// When readOnly changes, update editor options
watch(() => props.readOnly, (newValue) => {
  if (editorRef.value) {
    editorRef.value.updateOptions({ readOnly: newValue ?? false })
  }
})

/**
 * Clears all error markers in Monaco
 */
const clearMarkers = () => {
  if (!monacoRef.value || !editorRef.value) return

  const model = editorRef.value.getModel()
  if (model) {
    monacoRef.value.editor.setModelMarkers(model, 'sql-validation', [])
  }
}

/**
 * Updates Monaco markers with parsing errors
 */
const updateMarkers = (errors: SqlParseError[]) => {
  if (!monacoRef.value || !editorRef.value) return

  const model = editorRef.value.getModel()
  if (!model) return

  const markers: editor.IMarkerData[] = errors.map(error => ({
    severity: monacoRef.value!.MarkerSeverity.Error,
    message: error.message,
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.line,
    endColumn: error.column + 10 // Approximate length
  }))

  monacoRef.value.editor.setModelMarkers(model, 'sql-validation', markers)
}

/**
 * Validates SQL and updates markers
 */
const validateAndUpdateMarkers = (sql: string) => {
  const dialect = props.dialect || 'PostgreSQL'
  const result = validateSql(sql, dialect)

  currentErrors.value = result.errors
  updateMarkers(result.errors)
  emit('validation-change', result.valid, result.errors)

  return result.valid
}

// When user types in the editor
const handleEditorChange = (value: string) => {
  localSql.value = value

  // Compare with generated SQL to detect manual modifications
  if (value !== props.modelValue) {
    isManuallyModified.value = true
    emit('manual-change', value)

    // Validate modified SQL
    validateAndUpdateMarkers(value)
  } else {
    isManuallyModified.value = false
    clearMarkers()
    currentErrors.value = []
    emit('validation-change', true, [])
  }
}

// Custom theme name
const THEME_LIGHT = 'dbkeep-light'
const THEME_DARK = 'dbkeep-dark'

// Current theme based on color mode
const currentTheme = computed(() => {
  return colorMode.value === 'dark' ? THEME_DARK : THEME_LIGHT
})

// Minimalist Monaco options (computed to react to readOnly)
const editorOptions = computed<editor.IStandaloneEditorConstructionOptions>(() => ({
  minimap: { enabled: false },
  lineNumbers: 'on',
  folding: false,
  glyphMargin: true, // Enabled to display error icons
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
  scrollbar: {
    vertical: 'hidden',
    horizontal: 'hidden',
    useShadows: false
  },
  overviewRulerBorder: false,
  renderLineHighlight: 'none',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 13,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  padding: { top: 12, bottom: 12 },
  wordWrap: 'on',
  contextmenu: false,
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  parameterHints: { enabled: false },
  tabSize: 2,
  insertSpaces: true,
  readOnly: props.readOnly ?? false,
  readOnlyMessage: { value: t('sql.readonly_message') }
}))

// Custom theme definitions
const defineCustomThemes = (monaco: typeof import('monaco-editor')) => {
  // Light theme
  monaco.editor.defineTheme(THEME_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' }, // primary
      { token: 'string', foreground: '16a34a' }, // success
      { token: 'number', foreground: 'ea580c' }, // warning
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' }, // muted
      { token: 'type', foreground: '2563eb' }, // info
      { token: 'identifier', foreground: '1f2937' } // default text
    ],
    colors: {
      'editor.background': '#f9fafb', // bg-muted light
      'editor.foreground': '#1f2937',
      'editorLineNumber.foreground': '#9ca3af',
      'editorLineNumber.activeForeground': '#6b7280',
      'editor.lineHighlightBackground': '#f3f4f6',
      'editor.selectionBackground': '#e0e7ff',
      'editorCursor.foreground': '#7c3aed',
      'editorError.foreground': '#dc2626'
    }
  })

  // Dark theme
  monaco.editor.defineTheme(THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' }, // primary light
      { token: 'string', foreground: '4ade80' }, // success light
      { token: 'number', foreground: 'fb923c' }, // warning light
      { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' }, // muted light
      { token: 'type', foreground: '60a5fa' }, // info light
      { token: 'identifier', foreground: 'f3f4f6' } // default text light
    ],
    colors: {
      'editor.background': '#18181b', // bg-muted dark (zinc-900)
      'editor.foreground': '#f3f4f6',
      'editorLineNumber.foreground': '#6b7280',
      'editorLineNumber.activeForeground': '#9ca3af',
      'editor.lineHighlightBackground': '#27272a',
      'editor.selectionBackground': '#4c1d95',
      'editorCursor.foreground': '#a78bfa',
      'editorError.foreground': '#f87171'
    }
  })
}

// Callback before Monaco mount
const handleBeforeMount = (monaco: typeof import('monaco-editor')) => {
  monacoRef.value = monaco
  defineCustomThemes(monaco)
}

// Callback after editor mount
const handleMount = (editor: editor.IStandaloneCodeEditor) => {
  editorRef.value = editor
}

// Copy content to clipboard
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(localSql.value)
    toast.add({
      title: t('sql.copied'),
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch {
    toast.add({
      title: t('sql.copy_error'),
      color: 'error',
      icon: 'i-lucide-x'
    })
  }
}
</script>

<template>
  <div class="sql-preview h-full flex flex-col bg-muted">
    <!-- Header with copy button -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-default">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-muted uppercase tracking-wider">
          SQL
        </span>
        <!-- Error indicator -->
        <UBadge
          v-if="currentErrors.length > 0"
          color="error"
          size="xs"
          variant="soft"
        >
          {{ currentErrors.length }} {{ currentErrors.length > 1 ? 'erreurs' : 'erreur' }}
        </UBadge>
      </div>
      <div class="flex items-center gap-1">
        <UTooltip :text="t('sql.copy')">
          <UButton
            icon="i-lucide-copy"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="copyToClipboard"
          />
        </UTooltip>
        <UTooltip text="Export">
          <UButton
            icon="i-lucide-download"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="showExportModal = true"
          />
        </UTooltip>
      </div>
    </div>

    <!-- Monaco Editor -->
    <div class="flex-1 min-h-0">
      <ClientOnly>
        <VueMonacoEditor
          :value="localSql"
          language="sql"
          :theme="currentTheme"
          :options="editorOptions"
          @update:value="handleEditorChange"
          @before-mount="handleBeforeMount"
          @mount="handleMount"
        />
        <template #fallback>
          <div class="h-full flex items-center justify-center">
            <USkeleton class="w-full h-full" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Export Modal -->
    <UModal
      v-model:open="showExportModal"
      :title="t('export.title')"
      :description="t('export.description')"
    >
      <template #body>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="format in exportFormats"
            :key="format.id"
            class="relative flex flex-col items-start p-4 rounded-lg border border-default bg-default hover:bg-elevated hover:border-primary/50 transition-all text-left group"
            :class="{ 'opacity-60 cursor-not-allowed': !format.available }"
            :disabled="!format.available"
            @click="format.available && handleExport(format.id)"
          >
            <!-- Coming soon badge -->
            <UBadge
              v-if="!format.available"
              color="neutral"
              variant="soft"
              size="xs"
              class="absolute top-2 right-2"
            >
              {{ t('export.coming_soon') }}
            </UBadge>

            <div class="flex items-center gap-3 mb-2">
              <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <UIcon :name="format.icon" class="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
              </div>
              <div>
                <span class="font-medium text-default">{{ format.label }}</span>
                <span class="text-xs text-muted ml-1">{{ format.extension }}</span>
              </div>
            </div>
            <p class="text-xs text-muted">{{ format.description }}</p>
          </button>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            @click="showExportModal = false"
          >
            {{ t('common.close') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.sql-preview {
  /* Ensures editor takes full height */
  overflow: hidden;
}

/* Override Monaco styles for cleaner rendering */
:deep(.monaco-editor) {
  padding: 0 !important;
}

:deep(.monaco-editor .margin) {
  background: transparent !important;
}

/* Style for error markers */
:deep(.squiggly-error) {
  background: rgba(239, 68, 68, 0.2) !important;
}
</style>
