<script setup lang="ts">
import { nextTick } from 'vue'
import type { SqlParseResult, SqlParseError } from '~/composables/useSqlParser'
import { DatabaseEngine } from '~/types/database'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const { loadProject, isLoadingProject, saveProject } = useProjects()
const { sql } = useSqlGenerator()
const { parseSql } = useSqlParser()

// Get the project ID from the URL
const projectId = computed(() => route.params.id as string)

// Error state
const error = ref<string | null>(null)

// Sidebar state (open/closed)
const isSidebarOpen = ref(true)

// Sidebar width
const sidebarWidth = ref(350)

// Reference to the canvas component
const canvasRef = ref<{ forceRefresh: () => void } | null>(null)

// State for manual SQL modifications
const sqlPreviewRef = ref<{
  isManuallyModified: { value: boolean }
  currentErrors: { value: SqlParseError[] }
  resetToGenerated: () => void
  acceptChanges: () => void
  getLocalSql: () => string
  forceValidation: () => boolean
} | null>(null)
const isSqlManuallyModified = ref(false)
const sqlParseResult = ref<SqlParseResult | null>(null)
const sqlErrors = ref<SqlParseError[]>([])

// SQL dialect based on the project engine
const sqlDialect = computed((): 'PostgreSQL' | 'MySQL' | 'SQLite' => {
  const engine = projectStore.currentProject.value?.engine
  switch (engine) {
    case DatabaseEngine.POSTGRESQL: return 'PostgreSQL'
    case DatabaseEngine.MYSQL: return 'MySQL'
    case DatabaseEngine.SQLITE: return 'SQLite'
    default: return 'PostgreSQL'
  }
})

// Check if the project is loaded
const isProjectLoaded = computed(() => {
  return projectStore.currentProject.value?.id === projectId.value
})

// Load the project on mount if necessary
onMounted(async () => {
  // If the project is not already loaded or it's a different project
  if (!isProjectLoaded.value) {
    const result = await loadProject(projectId.value)
    if (!result) {
      error.value = t('project.error_load')
    }
  }
})

// Return to projects list
const goBack = () => {
  router.push('/app')
}

// Toggle sidebar
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Store the original SQL to detect renames
const originalSqlSnapshot = ref<string>('')

// Handle SQL validation changes (from SqlPreview)
const handleValidationChange = (valid: boolean, errors: SqlParseError[]) => {
  sqlErrors.value = errors

  // If valid, parse to extract tables and relations
  if (valid && sqlPreviewRef.value) {
    const localSql = sqlPreviewRef.value.getLocalSql()
    const result = parseSql(localSql, sqlDialect.value)
    sqlParseResult.value = result
  } else {
    sqlParseResult.value = null
  }
}

// Handle manual SQL changes
const handleSqlManualChange = (_newSql: string) => {
  // Save the original SQL on first change
  if (!isSqlManuallyModified.value) {
    originalSqlSnapshot.value = sql.value
  }

  isSqlManuallyModified.value = true
  // Validation is now handled by SqlPreview via handleValidationChange
}

// Cancel SQL changes
const handleCancelSqlChanges = () => {
  isSqlManuallyModified.value = false
  sqlParseResult.value = null
  sqlErrors.value = []
  originalSqlSnapshot.value = ''
  sqlPreviewRef.value?.resetToGenerated()
}

// Apply SQL changes
const handleApplySqlChanges = async () => {
  if (!sqlParseResult.value || !sqlParseResult.value.success || sqlErrors.value.length > 0) {
    return
  }

  const currentProject = projectStore.currentProject.value
  if (!currentProject) return

  // Parse the original SQL to detect renames
  const originalParsed = parseSql(originalSqlSnapshot.value)
  const originalTables = originalParsed.success ? originalParsed.tables : []

  // Update the store with the new tables and relations
  const { tables: newTables, relations: newRelations } = sqlParseResult.value

  // Create a mapping between original and new tables by position
  // (the order of CREATE TABLE statements in the SQL)
  const tableMapping = new Map<number, { oldTable: typeof originalTables[0], newTable: typeof newTables[0] }>()

  for (let i = 0; i < Math.max(originalTables.length, newTables.length); i++) {
    if (originalTables[i] && newTables[i]) {
      tableMapping.set(i, { oldTable: originalTables[i], newTable: newTables[i] })
    }
  }

  // Mapping of old table names to new ones (to update relations)
  const tableRenameMap = new Map<string, string>()

  // Preserve positions, parentNode and column IDs from existing tables
  const updatedTables = newTables.map((newTable, index) => {
    // 1. First try to match by exact name
    let existingTable = currentProject.tables.find(
      t => t.name.toLowerCase() === newTable.name.toLowerCase()
    )

    // 2. If not found, try to match by position (renamed table)
    if (!existingTable) {
      const mapping = tableMapping.get(index)
      if (mapping) {
        // Find the existing table that corresponds to the old table at this position
        existingTable = currentProject.tables.find(
          t => t.name.toLowerCase() === mapping.oldTable.name.toLowerCase()
        )
        // Record the rename
        if (existingTable && existingTable.name.toLowerCase() !== newTable.name.toLowerCase()) {
          tableRenameMap.set(existingTable.id, newTable.name)
        }
      }
    }

    if (existingTable) {
      // Get the parentNode from the canvas (that's where it's stored)
      const canvasNode = canvasStore.getNode(existingTable.id)

      // Map columns while preserving existing IDs
      const updatedColumns = newTable.columns.map((newCol) => {
        const existingCol = existingTable!.columns.find(
          c => c.name.toLowerCase() === newCol.name.toLowerCase()
        )
        if (existingCol) {
          // Preserve existing ID but take new properties
          return {
            ...newCol,
            id: existingCol.id
          }
        }
        return newCol
      })

      return {
        ...newTable,
        id: existingTable.id,
        columns: updatedColumns,
        position: canvasNode?.position || existingTable.position,
        color: existingTable.color,
        parentNode: canvasNode?.parentNode || existingTable.parentNode
      }
    }
    return newTable
  })

  // Create a quick mapping: table name -> updated table
  const tableByName = new Map(updatedTables.map(t => [t.name.toLowerCase(), t]))

  // Create a mapping: old table ID -> new table ID
  const tableIdMap = new Map<string, string>()
  for (const [index, mapping] of tableMapping.entries()) {
    const updatedTable = updatedTables[index]
    if (updatedTable) {
      // Find the existing table by old name
      const existingTable = currentProject.tables.find(
        t => t.name.toLowerCase() === mapping.oldTable.name.toLowerCase()
      )
      if (existingTable) {
        tableIdMap.set(existingTable.id, updatedTable.id)
      }
    }
  }

  // Preserve existing relations and update them if necessary
  const existingRelations = currentProject.relations.map((relation) => {
    const sourceTableId = relation.sourceTableId
    const targetTableId = relation.targetTableId
    const sourceColumnId = relation.sourceColumnId
    const targetColumnId = relation.targetColumnId

    // Check if tables still exist
    const sourceTable = updatedTables.find(t => t.id === sourceTableId)
    const targetTable = updatedTables.find(t => t.id === targetTableId)

    if (!sourceTable || !targetTable) {
      // Source or target table no longer exists, mark for deletion
      return null
    }

    // Check if columns still exist
    const sourceColumn = sourceTable.columns.find(c => c.id === sourceColumnId)
    const targetColumn = targetTable.columns.find(c => c.id === targetColumnId)

    if (!sourceColumn || !targetColumn) {
      // Source or target column no longer exists, mark for deletion
      return null
    }

    return {
      ...relation,
      sourceTableId,
      targetTableId,
      sourceColumnId,
      targetColumnId
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  // Add new relations from parsed SQL (avoiding duplicates)
  const finalRelations = [...existingRelations]

  for (const newRelation of newRelations) {
    // Find corresponding tables and columns by name
    const parsedSourceTable = sqlParseResult.value?.tables.find(t => t.id === newRelation.sourceTableId)
    const parsedTargetTable = sqlParseResult.value?.tables.find(t => t.id === newRelation.targetTableId)

    if (!parsedSourceTable || !parsedTargetTable) continue

    const sourceTable = tableByName.get(parsedSourceTable.name.toLowerCase())
    const targetTable = tableByName.get(parsedTargetTable.name.toLowerCase())

    if (!sourceTable || !targetTable) continue

    const parsedSourceColumn = parsedSourceTable.columns.find(c => c.id === newRelation.sourceColumnId)
    const parsedTargetColumn = parsedTargetTable.columns.find(c => c.id === newRelation.targetColumnId)

    if (!parsedSourceColumn || !parsedTargetColumn) continue

    const sourceColumn = sourceTable.columns.find(c => c.name.toLowerCase() === parsedSourceColumn.name.toLowerCase())
    const targetColumn = targetTable.columns.find(c => c.name.toLowerCase() === parsedTargetColumn.name.toLowerCase())

    if (!sourceColumn || !targetColumn) continue

    // Check if this relation already exists
    const alreadyExists = finalRelations.some(r =>
      (r.sourceTableId === sourceTable.id && r.sourceColumnId === sourceColumn.id
        && r.targetTableId === targetTable.id && r.targetColumnId === targetColumn.id)
      || (r.sourceTableId === targetTable.id && r.sourceColumnId === targetColumn.id
        && r.targetTableId === sourceTable.id && r.targetColumnId === sourceColumn.id)
    )

    if (!alreadyExists) {
      finalRelations.push({
        ...newRelation,
        sourceTableId: sourceTable.id,
        sourceColumnId: sourceColumn.id,
        targetTableId: targetTable.id,
        targetColumnId: targetColumn.id
      })
    }
  }

  // Reset state BEFORE applying changes so the SQL watcher takes over
  isSqlManuallyModified.value = false
  sqlParseResult.value = null
  originalSqlSnapshot.value = ''
  sqlErrors.value = []
  sqlPreviewRef.value?.acceptChanges()

  // Apply changes to the store (the SQL watcher will pick up changes)
  projectStore.setTables(updatedTables)
  projectStore.setRelations(finalRelations)

  // Resync canvas from the updated project
  const updatedProject = projectStore.currentProject.value
  if (updatedProject) {
    await canvasStore.syncFromProject(updatedProject as unknown as import('~/types/database').Project)
  }

  // Force Vue Flow re-render to apply changes
  await nextTick()
  canvasRef.value?.forceRefresh()

  // Save project to database (toast is handled by saveProject)
  await saveProject()
}
</script>

<template>
  <div class="project-page">
    <!-- Loading -->
    <div
      v-if="isLoadingProject"
      class="h-full flex items-center justify-center bg-muted"
    >
      <div class="text-center space-y-4">
        <UIcon
          name="i-lucide-loader-2"
          class="w-12 h-12 animate-spin text-primary mx-auto"
        />
        <p class="text-muted">
          {{ t('common.loading') }}
        </p>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="h-full flex items-center justify-center bg-muted"
    >
      <div class="text-center space-y-4">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-12 h-12 text-error mx-auto"
        />
        <p class="text-error font-medium">
          {{ error }}
        </p>
        <UButton
          variant="soft"
          icon="i-lucide-arrow-left"
          @click="goBack"
        >
          {{ t('project.back_to_list') }}
        </UButton>
      </div>
    </div>

    <!-- Layout with sidebar and canvas -->
    <div
      v-else-if="isProjectLoaded"
      class="h-full flex"
    >
      <!-- SQL Sidebar -->
      <aside
        v-show="isSidebarOpen"
        class="h-full border-r border-default flex-shrink-0 relative flex flex-col"
        :style="{ width: `${sidebarWidth}px` }"
      >
        <!-- Project name -->
        <div class="px-3 py-2 border-b border-default bg-default flex items-center gap-2">
          <span class="text-xs text-muted whitespace-nowrap">{{ t('project.active_project') }} :</span>
          <span class="text-sm font-semibold truncate">{{ projectStore.currentProject.value?.name }}</span>
        </div>

        <!-- SQL Preview -->
        <SidebarSqlPreview
          ref="sqlPreviewRef"
          class="flex-1 min-h-0"
          :model-value="sql"
          :dialect="sqlDialect"
          @manual-change="handleSqlManualChange"
          @cancel-changes="handleCancelSqlChanges"
          @validation-change="handleValidationChange"
        />

        <!-- Sidebar toggle button (visible on hover) -->
        <button
          class="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 w-6 h-12 bg-default border border-default rounded-r-md flex items-center justify-center hover:bg-elevated transition-colors"
          @click="toggleSidebar"
        >
          <UIcon
            name="i-lucide-chevron-left"
            class="w-4 h-4 text-muted"
          />
        </button>
      </aside>

      <!-- Button to reopen sidebar when closed -->
      <button
        v-if="!isSidebarOpen"
        class="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-6 h-12 bg-default border border-default rounded-r-md flex items-center justify-center hover:bg-elevated transition-colors"
        @click="toggleSidebar"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="w-4 h-4 text-muted"
        />
      </button>

      <!-- Canvas -->
      <div class="flex-1 h-full min-w-0 relative">
        <CanvasDatabaseCanvas
          ref="canvasRef"
          class="h-full"
        />

        <!-- Overlay for SQL changes -->
        <CanvasSqlChangesOverlay
          :show="isSqlManuallyModified"
          :has-errors="sqlErrors.length > 0"
          :errors="sqlErrors"
          @apply="handleApplySqlChanges"
          @cancel="handleCancelSqlChanges"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-page {
  height: calc(100vh - 3.5rem); /* 3.5rem = h-14 of the navbar */
  width: 100%;
  position: relative;
}
</style>
