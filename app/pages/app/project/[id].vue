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
const toast = useToast()
const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const { loadProject, isLoadingProject, saveProject } = useProjects()
const { sql } = useSqlGenerator()
const { parseSql } = useSqlParser()

// Récupère l'ID du projet depuis l'URL
const projectId = computed(() => route.params.id as string)

// État d'erreur
const error = ref<string | null>(null)

// État de la sidebar (ouverte/fermée)
const isSidebarOpen = ref(true)

// Largeur de la sidebar
const sidebarWidth = ref(350)

// Référence au composant canvas
const canvasRef = ref<{ forceRefresh: () => void } | null>(null)

// État des modifications SQL manuelles
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

// Dialecte SQL basé sur l'engine du projet
const sqlDialect = computed((): 'PostgreSQL' | 'MySQL' | 'SQLite' => {
  const engine = projectStore.currentProject.value?.engine
  switch (engine) {
    case DatabaseEngine.POSTGRESQL: return 'PostgreSQL'
    case DatabaseEngine.MYSQL: return 'MySQL'
    case DatabaseEngine.SQLITE: return 'SQLite'
    default: return 'PostgreSQL'
  }
})

// Vérifie si le projet est chargé
const isProjectLoaded = computed(() => {
  return projectStore.currentProject.value?.id === projectId.value
})

// Charge le projet au montage si nécessaire
onMounted(async () => {
  // Si le projet n'est pas déjà chargé ou si c'est un projet différent
  if (!isProjectLoaded.value) {
    const result = await loadProject(projectId.value)
    if (!result) {
      error.value = t('project.error_load')
    }
  }
})

// Retour à la liste des projets
const goBack = () => {
  router.push('/app')
}

// Toggle sidebar
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Stocker le SQL original pour pouvoir détecter les renommages
const originalSqlSnapshot = ref<string>('')

// Gestion des changements de validation SQL (depuis SqlPreview)
const handleValidationChange = (valid: boolean, errors: SqlParseError[]) => {
  sqlErrors.value = errors

  // Si valide, parser pour extraire les tables et relations
  if (valid && sqlPreviewRef.value) {
    const localSql = sqlPreviewRef.value.getLocalSql()
    const result = parseSql(localSql, sqlDialect.value)
    sqlParseResult.value = result
  } else {
    sqlParseResult.value = null
  }
}

// Gestion des changements SQL manuels
const handleSqlManualChange = (newSql: string) => {
  // Sauvegarder le SQL original au premier changement
  if (!isSqlManuallyModified.value) {
    originalSqlSnapshot.value = sql.value
  }

  isSqlManuallyModified.value = true
  // La validation est maintenant gérée par SqlPreview via handleValidationChange
}

// Annuler les changements SQL
const handleCancelSqlChanges = () => {
  isSqlManuallyModified.value = false
  sqlParseResult.value = null
  sqlErrors.value = []
  originalSqlSnapshot.value = ''
  sqlPreviewRef.value?.resetToGenerated()
}

// Appliquer les changements SQL
const handleApplySqlChanges = async () => {
  if (!sqlParseResult.value || !sqlParseResult.value.success || sqlErrors.value.length > 0) {
    return
  }

  const currentProject = projectStore.currentProject.value
  if (!currentProject) return

  // Parser le SQL original pour détecter les renommages
  const originalParsed = parseSql(originalSqlSnapshot.value)
  const originalTables = originalParsed.success ? originalParsed.tables : []

  // Mettre à jour le store avec les nouvelles tables et relations
  const { tables: newTables, relations: newRelations } = sqlParseResult.value

  // Créer un mapping entre les tables originales et les nouvelles par leur position
  // (l'ordre des CREATE TABLE dans le SQL)
  const tableMapping = new Map<number, { oldTable: typeof originalTables[0], newTable: typeof newTables[0] }>()

  for (let i = 0; i < Math.max(originalTables.length, newTables.length); i++) {
    if (originalTables[i] && newTables[i]) {
      tableMapping.set(i, { oldTable: originalTables[i], newTable: newTables[i] })
    }
  }

  // Mapping des anciens noms de tables vers les nouveaux (pour mettre à jour les relations)
  const tableRenameMap = new Map<string, string>()

  // Conserver les positions, parentNode et IDs des colonnes des tables existantes
  const updatedTables = newTables.map((newTable, index) => {
    // 1. D'abord essayer de matcher par nom exact
    let existingTable = currentProject.tables.find(
      t => t.name.toLowerCase() === newTable.name.toLowerCase()
    )

    // 2. Si pas trouvé, essayer de matcher par position (table renommée)
    if (!existingTable) {
      const mapping = tableMapping.get(index)
      if (mapping) {
        // Trouver la table existante qui correspond à l'ancienne table à cette position
        existingTable = currentProject.tables.find(
          t => t.name.toLowerCase() === mapping.oldTable.name.toLowerCase()
        )
        // Enregistrer le renommage
        if (existingTable && existingTable.name.toLowerCase() !== newTable.name.toLowerCase()) {
          tableRenameMap.set(existingTable.id, newTable.name)
        }
      }
    }

    if (existingTable) {
      // Récupérer le parentNode depuis le canvas (c'est là qu'il est stocké)
      const canvasNode = canvasStore.getNode(existingTable.id)

      // Mapper les colonnes en préservant les IDs existants
      const updatedColumns = newTable.columns.map(newCol => {
        const existingCol = existingTable!.columns.find(
          c => c.name.toLowerCase() === newCol.name.toLowerCase()
        )
        if (existingCol) {
          // Préserver l'ID existant mais prendre les nouvelles propriétés
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

  // Créer un mapping rapide: nom de table -> table mise à jour
  const tableByName = new Map(updatedTables.map(t => [t.name.toLowerCase(), t]))

  // Créer un mapping: ancien ID de table -> nouveau ID de table
  const tableIdMap = new Map<string, string>()
  for (const [index, mapping] of tableMapping.entries()) {
    const updatedTable = updatedTables[index]
    if (updatedTable) {
      // Chercher la table existante par l'ancien nom
      const existingTable = currentProject.tables.find(
        t => t.name.toLowerCase() === mapping.oldTable.name.toLowerCase()
      )
      if (existingTable) {
        tableIdMap.set(existingTable.id, updatedTable.id)
      }
    }
  }

  // Conserver les relations existantes et les mettre à jour si nécessaire
  const existingRelations = currentProject.relations.map(relation => {
    let sourceTableId = relation.sourceTableId
    let targetTableId = relation.targetTableId
    let sourceColumnId = relation.sourceColumnId
    let targetColumnId = relation.targetColumnId

    // Vérifier si les tables existent encore
    const sourceTable = updatedTables.find(t => t.id === sourceTableId)
    const targetTable = updatedTables.find(t => t.id === targetTableId)

    if (!sourceTable || !targetTable) {
      // La table source ou cible n'existe plus, marquer pour suppression
      return null
    }

    // Vérifier si les colonnes existent encore
    const sourceColumn = sourceTable.columns.find(c => c.id === sourceColumnId)
    const targetColumn = targetTable.columns.find(c => c.id === targetColumnId)

    if (!sourceColumn || !targetColumn) {
      // La colonne source ou cible n'existe plus, marquer pour suppression
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

  // Ajouter les nouvelles relations du SQL parsé (en évitant les doublons)
  const finalRelations = [...existingRelations]

  for (const newRelation of newRelations) {
    // Trouver les tables et colonnes correspondantes par nom
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

    // Vérifier si cette relation existe déjà
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

  // Reset l'état AVANT d'appliquer les changements pour que le watcher SQL reprenne la main
  isSqlManuallyModified.value = false
  sqlParseResult.value = null
  originalSqlSnapshot.value = ''
  sqlErrors.value = []
  sqlPreviewRef.value?.acceptChanges()

  // Appliquer les changements au store (le watcher SQL va capter les changements)
  projectStore.setTables(updatedTables)
  projectStore.setRelations(finalRelations)

  // Resynchroniser le canvas depuis le projet mis à jour
  const updatedProject = projectStore.currentProject.value
  if (updatedProject) {
    await canvasStore.syncFromProject(updatedProject as unknown as import('~/types/database').Project)
  }

  // Forcer le re-render de Vue Flow pour appliquer les changements
  await nextTick()
  canvasRef.value?.forceRefresh()

  // Sauvegarder le projet en BDD (le toast est géré par saveProject)
  await saveProject()
}
</script>

<template>
  <div class="project-page">
    <!-- Chargement -->
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

    <!-- Erreur -->
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

    <!-- Layout avec sidebar et canvas -->
    <div
      v-else-if="isProjectLoaded"
      class="h-full flex"
    >
      <!-- Sidebar SQL -->
      <aside
        v-show="isSidebarOpen"
        class="h-full border-r border-default flex-shrink-0 relative flex flex-col"
        :style="{ width: `${sidebarWidth}px` }"
      >
        <!-- Nom du projet -->
        <div class="px-3 py-2 border-b border-default bg-default flex items-center gap-2">
          <span class="text-xs text-muted whitespace-nowrap">{{ t('project.active_project') }} :</span>
          <span class="text-sm font-semibold truncate">{{ projectStore.currentProject.value?.name }}</span>
        </div>

        <!-- Prévisualisation SQL -->
        <SidebarSqlPreview
          ref="sqlPreviewRef"
          class="flex-1 min-h-0"
          :model-value="sql"
          :dialect="sqlDialect"
          @manual-change="handleSqlManualChange"
          @cancel-changes="handleCancelSqlChanges"
          @validation-change="handleValidationChange"
        />

        <!-- Bouton toggle sidebar (visible au survol) -->
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

      <!-- Bouton pour rouvrir la sidebar quand fermée -->
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
        <CanvasDatabaseCanvas ref="canvasRef" class="h-full" />

        <!-- Overlay pour les changements SQL -->
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
  height: calc(100vh - 3.5rem); /* 3.5rem = h-14 de la navbar */
  width: 100%;
  position: relative;
}
</style>
