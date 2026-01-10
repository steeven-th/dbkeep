import type {
  Project,
  TableData,
  GroupData,
  NoteData,
  Relation,
  Column
} from '~/types/database'
import {
  DatabaseEngine,
  createDefaultProject,
  createDefaultTable,
  createDefaultGroup,
  createDefaultNote,
  createDefaultRelation,
  createDefaultColumn
} from '~/types/database'

/**
 * Store principal pour la gestion des projets DBKeep
 * Utilise useState() de Nuxt pour la réactivité
 */
export const useProjectStore = () => {
  // État du projet courant
  const currentProject = useState<Project | null>('currentProject', () => null)

  // Table en cours d'édition (pour le Slideover)
  const editingTable = useState<TableData | null>('editingTable', () => null)

  // Groupe en cours d'édition (pour le Slideover GroupEditor)
  const editingGroup = useState<GroupData | null>('editingGroup', () => null)

  // Relation en cours d'édition (pour le modal RelationEditor)
  const editingRelation = useState<Relation | null>('editingRelation', () => null)

  // Note en cours d'édition (pour le Slideover NoteEditor)
  const editingNote = useState<NoteData | null>('editingNote', () => null)

  // === Actions Projet ===

  /**
   * Crée un nouveau projet
   */
  const createProject = (name: string, engine: DatabaseEngine): Project => {
    const project = createDefaultProject(name, engine)
    currentProject.value = project
    return project
  }

  /**
   * Met à jour les métadonnées du projet
   */
  const updateProject = (updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    if (!currentProject.value) return

    currentProject.value = {
      ...currentProject.value,
      ...updates,
      updatedAt: new Date()
    }
  }

  /**
   * Ferme le projet courant
   */
  const closeProject = () => {
    currentProject.value = null
    editingTable.value = null
    editingRelation.value = null
  }

  // === Actions Tables ===

  /**
   * Génère un nom de table unique
   */
  const generateUniqueTableName = (baseName: string = 'new_table'): string => {
    if (!currentProject.value) return baseName

    const existingNames = currentProject.value.tables.map(t => t.name.toLowerCase())

    // Si le nom de base n'existe pas, l'utiliser directement
    if (!existingNames.includes(baseName.toLowerCase())) {
      return baseName
    }

    // Sinon, chercher le prochain numéro disponible
    let counter = 1
    let candidateName = `${baseName}_${counter}`
    while (existingNames.includes(candidateName.toLowerCase())) {
      counter++
      candidateName = `${baseName}_${counter}`
    }

    return candidateName
  }

  /**
   * Ajoute une nouvelle table au projet
   * Le nom sera rendu unique automatiquement si nécessaire
   */
  const addTable = (name?: string): TableData | null => {
    if (!currentProject.value) return null

    const baseName = name || 'new_table'
    const tableName = generateUniqueTableName(baseName)
    const table = createDefaultTable(tableName)
    currentProject.value.tables.push(table)
    currentProject.value.updatedAt = new Date()

    return table
  }

  /**
   * Met à jour une table existante
   */
  const updateTable = (tableId: string, updates: Partial<Omit<TableData, 'id'>>) => {
    if (!currentProject.value) return

    const tableIndex = currentProject.value.tables.findIndex(t => t.id === tableId)
    if (tableIndex === -1) return

    currentProject.value.tables[tableIndex] = {
      ...currentProject.value.tables[tableIndex],
      ...updates
    }
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingTable si c'est la même table
    if (editingTable.value?.id === tableId) {
      editingTable.value = currentProject.value.tables[tableIndex]
    }
  }

  /**
   * Supprime une table et ses relations associées
   */
  const deleteTable = (tableId: string) => {
    if (!currentProject.value) return

    // Supprimer la table
    currentProject.value.tables = currentProject.value.tables.filter(t => t.id !== tableId)

    // Supprimer les relations associées
    currentProject.value.relations = currentProject.value.relations.filter(
      r => r.sourceTableId !== tableId && r.targetTableId !== tableId
    )

    currentProject.value.updatedAt = new Date()

    // Fermer l'éditeur si c'était cette table
    if (editingTable.value?.id === tableId) {
      editingTable.value = null
    }
  }

  /**
   * Récupère une table par son ID
   */
  const getTable = (tableId: string): TableData | undefined => {
    return currentProject.value?.tables.find(t => t.id === tableId)
  }

  /**
   * Remplace toutes les tables du projet (utilisé par le parser SQL)
   */
  const setTables = (tables: TableData[]) => {
    if (!currentProject.value) return
    currentProject.value.tables = tables
    currentProject.value.updatedAt = new Date()
  }

  // === Actions Colonnes ===

  /**
   * Génère un nom de colonne unique pour une table
   */
  const generateUniqueColumnName = (table: TableData, baseName: string = 'column'): string => {
    const existingNames = table.columns.map(c => c.name.toLowerCase())

    // Si le nom de base n'existe pas, l'utiliser directement
    if (!existingNames.includes(baseName.toLowerCase())) {
      return baseName
    }

    // Sinon, chercher le prochain numéro disponible
    let counter = 1
    let candidateName = `${baseName}_${counter}`
    while (existingNames.includes(candidateName.toLowerCase())) {
      counter++
      candidateName = `${baseName}_${counter}`
    }

    return candidateName
  }

  /**
   * Ajoute une colonne à une table
   */
  const addColumn = (tableId: string, column?: Partial<Column>): Column | null => {
    if (!currentProject.value) return null

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return null

    // Générer un nom unique si non fourni ou vide
    const columnName = column?.name?.trim() || generateUniqueColumnName(table, 'column')

    const newColumn = createDefaultColumn({ ...column, name: columnName })
    table.columns.push(newColumn)
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingTable si nécessaire
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }

    return newColumn
  }

  /**
   * Met à jour une colonne
   */
  const updateColumn = (tableId: string, columnId: string, updates: Partial<Omit<Column, 'id'>>) => {
    if (!currentProject.value) return

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return

    const columnIndex = table.columns.findIndex(c => c.id === columnId)
    if (columnIndex === -1) return

    // Ne pas permettre de mettre un nom vide
    if ('name' in updates && (!updates.name || updates.name.trim() === '')) {
      return
    }

    table.columns[columnIndex] = {
      ...table.columns[columnIndex],
      ...updates
    }
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingTable si nécessaire
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }
  }

  /**
   * Supprime une colonne et ses relations associées
   */
  const deleteColumn = (tableId: string, columnId: string) => {
    if (!currentProject.value) return

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return

    // Supprimer la colonne
    table.columns = table.columns.filter(c => c.id !== columnId)

    // Supprimer les relations associées à cette colonne
    currentProject.value.relations = currentProject.value.relations.filter(
      r => r.sourceColumnId !== columnId && r.targetColumnId !== columnId
    )

    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingTable si nécessaire
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }
  }

  /**
   * Réordonne les colonnes d'une table
   * Les colonnes PRIMARY KEY sont automatiquement placées en premier
   */
  const reorderColumns = (tableId: string, newOrder: Column[]) => {
    if (!currentProject.value) return

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return

    // Séparer les colonnes PK des autres
    const pkColumns = newOrder.filter(c => c.primaryKey)
    const otherColumns = newOrder.filter(c => !c.primaryKey)

    // Les PK en premier, puis le reste dans l'ordre choisi
    table.columns = [...pkColumns, ...otherColumns]
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingTable si nécessaire
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }
  }

  // === Actions Groupes ===

  /**
   * Ajoute un nouveau groupe au projet
   */
  const addGroup = (name?: string): GroupData | null => {
    if (!currentProject.value) return null

    const group = createDefaultGroup(name || 'new_group')
    currentProject.value.groups.push(group)
    currentProject.value.updatedAt = new Date()

    return group
  }

  /**
   * Met à jour un groupe existant
   */
  const updateGroup = (groupId: string, updates: Partial<Omit<GroupData, 'id'>>) => {
    if (!currentProject.value) return

    const groupIndex = currentProject.value.groups.findIndex(g => g.id === groupId)
    if (groupIndex === -1) return

    currentProject.value.groups[groupIndex] = {
      ...currentProject.value.groups[groupIndex],
      ...updates
    }
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingGroup si c'est le même groupe
    if (editingGroup.value?.id === groupId) {
      editingGroup.value = currentProject.value.groups[groupIndex]
    }
  }

  /**
   * Supprime un groupe
   */
  const deleteGroup = (groupId: string) => {
    if (!currentProject.value) return

    currentProject.value.groups = currentProject.value.groups.filter(g => g.id !== groupId)
    currentProject.value.updatedAt = new Date()

    // Fermer l'éditeur si c'était ce groupe
    if (editingGroup.value?.id === groupId) {
      editingGroup.value = null
    }
  }

  /**
   * Récupère un groupe par son ID
   */
  const getGroup = (groupId: string): GroupData | undefined => {
    return currentProject.value?.groups.find(g => g.id === groupId)
  }

  // === Actions Notes ===

  /**
   * Ajoute une nouvelle note au projet
   */
  const addNote = (name?: string): NoteData | null => {
    if (!currentProject.value) return null

    // Initialiser le tableau notes s'il n'existe pas (rétrocompatibilité)
    if (!currentProject.value.notes) {
      currentProject.value.notes = []
    }

    const note = createDefaultNote(name || 'Note')
    currentProject.value.notes.push(note)
    currentProject.value.updatedAt = new Date()

    return note
  }

  /**
   * Met à jour une note existante
   */
  const updateNote = (noteId: string, updates: Partial<Omit<NoteData, 'id'>>) => {
    if (!currentProject.value || !currentProject.value.notes) return

    const noteIndex = currentProject.value.notes.findIndex(n => n.id === noteId)
    if (noteIndex === -1) return

    currentProject.value.notes[noteIndex] = {
      ...currentProject.value.notes[noteIndex],
      ...updates
    }
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingNote si c'est la même note
    if (editingNote.value?.id === noteId) {
      editingNote.value = currentProject.value.notes[noteIndex]
    }
  }

  /**
   * Supprime une note
   */
  const deleteNote = (noteId: string) => {
    if (!currentProject.value || !currentProject.value.notes) return

    currentProject.value.notes = currentProject.value.notes.filter(n => n.id !== noteId)
    currentProject.value.updatedAt = new Date()

    // Fermer l'éditeur si c'était cette note
    if (editingNote.value?.id === noteId) {
      editingNote.value = null
    }
  }

  /**
   * Récupère une note par son ID
   */
  const getNote = (noteId: string): NoteData | undefined => {
    return currentProject.value?.notes?.find(n => n.id === noteId)
  }

  // === Actions Relations ===

  /**
   * Vérifie si une relation identique existe déjà
   * (même paire de colonnes, dans un sens ou dans l'autre)
   */
  const relationExists = (relation: Partial<Relation>): boolean => {
    if (!currentProject.value) return false

    return currentProject.value.relations.some(r =>
      // Même sens : source→target identique
      (r.sourceTableId === relation.sourceTableId
        && r.sourceColumnId === relation.sourceColumnId
        && r.targetTableId === relation.targetTableId
        && r.targetColumnId === relation.targetColumnId)
      // Sens inverse : source↔target inversés
      || (r.sourceTableId === relation.targetTableId
        && r.sourceColumnId === relation.targetColumnId
        && r.targetTableId === relation.sourceTableId
        && r.targetColumnId === relation.sourceColumnId)
    )
  }

  /**
   * Ajoute une nouvelle relation
   * Retourne null si la relation existe déjà
   */
  const addRelation = (relation?: Partial<Relation>): Relation | null => {
    if (!currentProject.value) return null

    // Vérifier si une relation identique existe déjà
    if (relation && relationExists(relation)) {
      console.warn('Une relation identique existe déjà entre ces colonnes')
      return null
    }

    const newRelation = createDefaultRelation(relation)
    currentProject.value.relations.push(newRelation)
    currentProject.value.updatedAt = new Date()

    return newRelation
  }

  /**
   * Met à jour une relation existante
   */
  const updateRelation = (relationId: string, updates: Partial<Omit<Relation, 'id'>>) => {
    if (!currentProject.value) return

    const relationIndex = currentProject.value.relations.findIndex(r => r.id === relationId)
    if (relationIndex === -1) return

    currentProject.value.relations[relationIndex] = {
      ...currentProject.value.relations[relationIndex],
      ...updates
    }
    currentProject.value.updatedAt = new Date()

    // Mettre à jour editingRelation si nécessaire
    if (editingRelation.value?.id === relationId) {
      editingRelation.value = currentProject.value.relations[relationIndex]
    }
  }

  /**
   * Supprime une relation
   */
  const deleteRelation = (relationId: string) => {
    if (!currentProject.value) return

    currentProject.value.relations = currentProject.value.relations.filter(r => r.id !== relationId)
    currentProject.value.updatedAt = new Date()

    // Fermer l'éditeur si c'était cette relation
    if (editingRelation.value?.id === relationId) {
      editingRelation.value = null
    }
  }

  /**
   * Récupère une relation par son ID
   */
  const getRelation = (relationId: string): Relation | undefined => {
    return currentProject.value?.relations.find(r => r.id === relationId)
  }

  /**
   * Remplace toutes les relations du projet (utilisé par le parser SQL)
   */
  const setRelations = (relations: Relation[]) => {
    if (!currentProject.value) return
    currentProject.value.relations = relations
    currentProject.value.updatedAt = new Date()
  }

  /**
   * Récupère les relations d'une table (source ou target)
   */
  const getTableRelations = (tableId: string): Relation[] => {
    if (!currentProject.value) return []

    return currentProject.value.relations.filter(
      r => r.sourceTableId === tableId || r.targetTableId === tableId
    )
  }

  // === Éditeurs ===

  /**
   * Ouvre l'éditeur de table
   */
  const openTableEditor = (tableId: string) => {
    const table = getTable(tableId)
    if (table) {
      editingTable.value = { ...table }
    }
  }

  /**
   * Ferme l'éditeur de table
   */
  const closeTableEditor = () => {
    editingTable.value = null
  }

  /**
   * Ouvre l'éditeur de groupe
   */
  const openGroupEditor = (groupId: string) => {
    const group = getGroup(groupId)
    if (group) {
      editingGroup.value = { ...group }
    }
  }

  /**
   * Ferme l'éditeur de groupe
   */
  const closeGroupEditor = () => {
    editingGroup.value = null
  }

  /**
   * Ouvre l'éditeur de relation
   */
  const openRelationEditor = (relationId: string) => {
    const relation = getRelation(relationId)
    if (relation) {
      editingRelation.value = { ...relation }
    }
  }

  /**
   * Ferme l'éditeur de relation
   */
  const closeRelationEditor = () => {
    editingRelation.value = null
  }

  /**
   * Ouvre l'éditeur de note
   */
  const openNoteEditor = (noteId: string) => {
    const note = getNote(noteId)
    if (note) {
      editingNote.value = { ...note }
    }
  }

  /**
   * Ferme l'éditeur de note
   */
  const closeNoteEditor = () => {
    editingNote.value = null
  }

  return {
    // État (readonly pour éviter les mutations directes)
    currentProject: readonly(currentProject),
    editingTable,
    editingGroup,
    editingRelation,
    editingNote,

    // Actions Projet
    createProject,
    updateProject,
    closeProject,

    // Actions Tables
    addTable,
    updateTable,
    deleteTable,
    getTable,
    setTables,

    // Actions Colonnes
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,

    // Actions Groupes
    addGroup,
    updateGroup,
    deleteGroup,
    getGroup,

    // Actions Notes
    addNote,
    updateNote,
    deleteNote,
    getNote,

    // Actions Relations
    addRelation,
    updateRelation,
    deleteRelation,
    getRelation,
    setRelations,
    getTableRelations,

    // Éditeurs
    openTableEditor,
    closeTableEditor,
    openGroupEditor,
    closeGroupEditor,
    openRelationEditor,
    closeRelationEditor,
    openNoteEditor,
    closeNoteEditor
  }
}
