<script setup lang="ts">
import { shallowRef, ref, watch } from 'vue'
import type { editor } from 'monaco-editor'
import type { SqlParseError } from '~/composables/useSqlParser'

const props = defineProps<{
  modelValue: string
  dialect?: 'PostgreSQL' | 'MySQL' | 'SQLite'
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

// État local du SQL (permet de tracker les modifications manuelles)
const localSql = ref(props.modelValue)
const isManuallyModified = ref(false)
const currentErrors = ref<SqlParseError[]>([])

// Référence à l'éditeur Monaco et au modèle
const editorRef = shallowRef<editor.IStandaloneCodeEditor>()
const monacoRef = shallowRef<typeof import('monaco-editor')>()

// Exposer l'état de modification pour le parent
defineExpose({
  isManuallyModified,
  currentErrors,
  resetToGenerated: () => {
    localSql.value = props.modelValue
    isManuallyModified.value = false
    clearMarkers()
    emit('cancel-changes')
  },
  // Appelé après application des changements SQL : réinitialise l'état sans émettre d'événement
  acceptChanges: () => {
    isManuallyModified.value = false
    clearMarkers()
    currentErrors.value = []
  },
  getLocalSql: () => localSql.value,
  // Permet au parent de forcer une validation
  forceValidation: () => validateAndUpdateMarkers(localSql.value)
})

// Quand le SQL généré change (depuis le store), on met à jour seulement si pas de modification manuelle
watch(() => props.modelValue, (newValue) => {
  if (!isManuallyModified.value) {
    localSql.value = newValue
    clearMarkers()
    currentErrors.value = []
  }
})

/**
 * Efface tous les markers d'erreur dans Monaco
 */
const clearMarkers = () => {
  if (!monacoRef.value || !editorRef.value) return

  const model = editorRef.value.getModel()
  if (model) {
    monacoRef.value.editor.setModelMarkers(model, 'sql-validation', [])
  }
}

/**
 * Met à jour les markers Monaco avec les erreurs de parsing
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
    endColumn: error.column + 10 // Approximation de la longueur
  }))

  monacoRef.value.editor.setModelMarkers(model, 'sql-validation', markers)
}

/**
 * Valide le SQL et met à jour les markers
 */
const validateAndUpdateMarkers = (sql: string) => {
  const dialect = props.dialect || 'PostgreSQL'
  const result = validateSql(sql, dialect)

  currentErrors.value = result.errors
  updateMarkers(result.errors)
  emit('validation-change', result.valid, result.errors)

  return result.valid
}

// Quand l'utilisateur tape dans l'éditeur
const handleEditorChange = (value: string) => {
  localSql.value = value

  // Comparer avec le SQL généré pour détecter les modifications manuelles
  if (value !== props.modelValue) {
    isManuallyModified.value = true
    emit('manual-change', value)

    // Valider le SQL modifié
    validateAndUpdateMarkers(value)
  } else {
    isManuallyModified.value = false
    clearMarkers()
    currentErrors.value = []
    emit('validation-change', true, [])
  }
}

// Nom du thème personnalisé
const THEME_LIGHT = 'dbkeep-light'
const THEME_DARK = 'dbkeep-dark'

// Thème actuel basé sur le mode couleur
const currentTheme = computed(() => {
  return colorMode.value === 'dark' ? THEME_DARK : THEME_LIGHT
})

// Options minimalistes de Monaco
const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  lineNumbers: 'on',
  folding: false,
  glyphMargin: true, // Activé pour afficher les icônes d'erreur
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
  readOnly: false
}

// Définition des thèmes personnalisés
const defineCustomThemes = (monaco: typeof import('monaco-editor')) => {
  // Thème clair
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

  // Thème sombre
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

// Callback avant le montage de Monaco
const handleBeforeMount = (monaco: typeof import('monaco-editor')) => {
  monacoRef.value = monaco
  defineCustomThemes(monaco)
}

// Callback après le montage de l'éditeur
const handleMount = (editor: editor.IStandaloneCodeEditor) => {
  editorRef.value = editor
}

// Copier le contenu dans le presse-papier
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
    <!-- Header avec bouton copier -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-default">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-muted uppercase tracking-wider">
          SQL
        </span>
        <!-- Indicateur d'erreur -->
        <UBadge
          v-if="currentErrors.length > 0"
          color="error"
          size="xs"
          variant="soft"
        >
          {{ currentErrors.length }} {{ currentErrors.length > 1 ? 'erreurs' : 'erreur' }}
        </UBadge>
      </div>
      <UTooltip :text="t('sql.copy')">
        <UButton
          icon="i-lucide-copy"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="copyToClipboard"
        />
      </UTooltip>
    </div>

    <!-- Éditeur Monaco -->
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
  </div>
</template>

<style scoped>
.sql-preview {
  /* Assure que l'éditeur prend toute la hauteur */
  overflow: hidden;
}

/* Override des styles Monaco pour un rendu plus propre */
:deep(.monaco-editor) {
  padding: 0 !important;
}

:deep(.monaco-editor .margin) {
  background: transparent !important;
}

/* Style pour les markers d'erreur */
:deep(.squiggly-error) {
  background: rgba(239, 68, 68, 0.2) !important;
}
</style>
