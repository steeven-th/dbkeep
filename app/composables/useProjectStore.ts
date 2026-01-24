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
 * Main store for DBKeep project management
 * Uses Nuxt's useState() for reactivity
 */
export const useProjectStore = () => {
  // Current project state
  const currentProject = useState<Project | null>('currentProject', () => null)

  // Table being edited (for Slideover)
  const editingTable = useState<TableData | null>('editingTable', () => null)

  // Group being edited (for GroupEditor Slideover)
  const editingGroup = useState<GroupData | null>('editingGroup', () => null)

  // Relation being edited (for RelationEditor modal)
  const editingRelation = useState<Relation | null>('editingRelation', () => null)

  // Note being edited (for NoteEditor Slideover)
  const editingNote = useState<NoteData | null>('editingNote', () => null)

  // === Project Actions ===

  /**
   * Creates a new project
   */
  const createProject = (name: string, engine: DatabaseEngine): Project => {
    const project = createDefaultProject(name, engine)
    currentProject.value = project
    return project
  }

  /**
   * Updates project metadata
   * Note: id can be updated (e.g., after saving to database)
   */
  const updateProject = (updates: Partial<Omit<Project, 'createdAt'>>) => {
    if (!currentProject.value) return

    currentProject.value = {
      ...currentProject.value,
      ...updates,
      updatedAt: new Date()
    }
  }

  /**
   * Closes the current project
   */
  const closeProject = () => {
    currentProject.value = null
    editingTable.value = null
    editingRelation.value = null
  }

  // === Table Actions ===

  /**
   * Generates a unique table name
   */
  const generateUniqueTableName = (baseName: string = 'new_table'): string => {
    if (!currentProject.value) return baseName

    const existingNames = currentProject.value.tables.map(t => t.name.toLowerCase())

    // If base name doesn't exist, use it directly
    if (!existingNames.includes(baseName.toLowerCase())) {
      return baseName
    }

    // Otherwise, find the next available number
    let counter = 1
    let candidateName = `${baseName}_${counter}`
    while (existingNames.includes(candidateName.toLowerCase())) {
      counter++
      candidateName = `${baseName}_${counter}`
    }

    return candidateName
  }

  /**
   * Adds a new table to the project
   * Name will be made unique automatically if necessary
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
   * Updates an existing table
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

    // Update editingTable if it's the same table
    if (editingTable.value?.id === tableId) {
      editingTable.value = currentProject.value.tables[tableIndex]
    }
  }

  /**
   * Deletes a table and its associated relations
   */
  const deleteTable = (tableId: string) => {
    if (!currentProject.value) return

    // Delete the table
    currentProject.value.tables = currentProject.value.tables.filter(t => t.id !== tableId)

    // Delete associated relations
    currentProject.value.relations = currentProject.value.relations.filter(
      r => r.sourceTableId !== tableId && r.targetTableId !== tableId
    )

    currentProject.value.updatedAt = new Date()

    // Close editor if it was this table
    if (editingTable.value?.id === tableId) {
      editingTable.value = null
    }
  }

  /**
   * Gets a table by its ID
   */
  const getTable = (tableId: string): TableData | undefined => {
    return currentProject.value?.tables.find(t => t.id === tableId)
  }

  /**
   * Replaces all project tables (used by SQL parser)
   */
  const setTables = (tables: TableData[]) => {
    if (!currentProject.value) return
    currentProject.value.tables = tables
    currentProject.value.updatedAt = new Date()
  }

  // === Column Actions ===

  /**
   * Generates a unique column name for a table
   */
  const generateUniqueColumnName = (table: TableData, baseName: string = 'column'): string => {
    const existingNames = table.columns.map(c => c.name.toLowerCase())

    // If base name doesn't exist, use it directly
    if (!existingNames.includes(baseName.toLowerCase())) {
      return baseName
    }

    // Otherwise, find the next available number
    let counter = 1
    let candidateName = `${baseName}_${counter}`
    while (existingNames.includes(candidateName.toLowerCase())) {
      counter++
      candidateName = `${baseName}_${counter}`
    }

    return candidateName
  }

  /**
   * Adds a column to a table
   */
  const addColumn = (tableId: string, column?: Partial<Column>): Column | null => {
    if (!currentProject.value) return null

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return null

    // Generate unique name if not provided or empty
    const columnName = column?.name?.trim() || generateUniqueColumnName(table, 'column')

    const newColumn = createDefaultColumn({ ...column, name: columnName })
    table.columns.push(newColumn)
    currentProject.value.updatedAt = new Date()

    // Update editingTable if necessary
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }

    return newColumn
  }

  /**
   * Updates a column
   */
  const updateColumn = (tableId: string, columnId: string, updates: Partial<Omit<Column, 'id'>>) => {
    if (!currentProject.value) return

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return

    const columnIndex = table.columns.findIndex(c => c.id === columnId)
    if (columnIndex === -1) return

    // Don't allow setting an empty name
    if ('name' in updates && (!updates.name || updates.name.trim() === '')) {
      return
    }

    table.columns[columnIndex] = {
      ...table.columns[columnIndex],
      ...updates
    }
    currentProject.value.updatedAt = new Date()

    // Update editingTable if necessary
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }
  }

  /**
   * Deletes a column and its associated relations
   */
  const deleteColumn = (tableId: string, columnId: string) => {
    if (!currentProject.value) return

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return

    // Delete the column
    table.columns = table.columns.filter(c => c.id !== columnId)

    // Delete relations associated with this column
    currentProject.value.relations = currentProject.value.relations.filter(
      r => r.sourceColumnId !== columnId && r.targetColumnId !== columnId
    )

    currentProject.value.updatedAt = new Date()

    // Update editingTable if necessary
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }
  }

  /**
   * Reorders columns in a table
   * PRIMARY KEY columns are automatically placed first
   */
  const reorderColumns = (tableId: string, newOrder: Column[]) => {
    if (!currentProject.value) return

    const table = currentProject.value.tables.find(t => t.id === tableId)
    if (!table) return

    // Separate PK columns from others
    const pkColumns = newOrder.filter(c => c.primaryKey)
    const otherColumns = newOrder.filter(c => !c.primaryKey)

    // PK first, then the rest in chosen order
    table.columns = [...pkColumns, ...otherColumns]
    currentProject.value.updatedAt = new Date()

    // Update editingTable if necessary
    if (editingTable.value?.id === tableId) {
      editingTable.value = { ...table }
    }
  }

  // === Group Actions ===

  /**
   * Adds a new group to the project
   */
  const addGroup = (name?: string): GroupData | null => {
    if (!currentProject.value) return null

    const group = createDefaultGroup(name || 'new_group')
    currentProject.value.groups.push(group)
    currentProject.value.updatedAt = new Date()

    return group
  }

  /**
   * Updates an existing group
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

    // Update editingGroup if it's the same group
    if (editingGroup.value?.id === groupId) {
      editingGroup.value = currentProject.value.groups[groupIndex]
    }
  }

  /**
   * Deletes a group
   */
  const deleteGroup = (groupId: string) => {
    if (!currentProject.value) return

    currentProject.value.groups = currentProject.value.groups.filter(g => g.id !== groupId)
    currentProject.value.updatedAt = new Date()

    // Close editor if it was this group
    if (editingGroup.value?.id === groupId) {
      editingGroup.value = null
    }
  }

  /**
   * Gets a group by its ID
   */
  const getGroup = (groupId: string): GroupData | undefined => {
    return currentProject.value?.groups.find(g => g.id === groupId)
  }

  // === Note Actions ===

  /**
   * Adds a new note to the project
   */
  const addNote = (name?: string): NoteData | null => {
    if (!currentProject.value) return null

    // Initialize notes array if it doesn't exist (backward compatibility)
    if (!currentProject.value.notes) {
      currentProject.value.notes = []
    }

    const note = createDefaultNote(name || 'Note')
    currentProject.value.notes.push(note)
    currentProject.value.updatedAt = new Date()

    return note
  }

  /**
   * Updates an existing note
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

    // Update editingNote if it's the same note
    if (editingNote.value?.id === noteId) {
      editingNote.value = currentProject.value.notes[noteIndex]
    }
  }

  /**
   * Deletes a note
   */
  const deleteNote = (noteId: string) => {
    if (!currentProject.value || !currentProject.value.notes) return

    currentProject.value.notes = currentProject.value.notes.filter(n => n.id !== noteId)
    currentProject.value.updatedAt = new Date()

    // Close editor if it was this note
    if (editingNote.value?.id === noteId) {
      editingNote.value = null
    }
  }

  /**
   * Gets a note by its ID
   */
  const getNote = (noteId: string): NoteData | undefined => {
    return currentProject.value?.notes?.find(n => n.id === noteId)
  }

  // === Relation Actions ===

  /**
   * Checks if an identical relation already exists
   * (same column pair, in either direction)
   */
  const relationExists = (relation: Partial<Relation>): boolean => {
    if (!currentProject.value) return false

    return currentProject.value.relations.some(r =>
      // Same direction: source→target identical
      (r.sourceTableId === relation.sourceTableId
        && r.sourceColumnId === relation.sourceColumnId
        && r.targetTableId === relation.targetTableId
        && r.targetColumnId === relation.targetColumnId)
      // Reverse direction: source↔target swapped
      || (r.sourceTableId === relation.targetTableId
        && r.sourceColumnId === relation.targetColumnId
        && r.targetTableId === relation.sourceTableId
        && r.targetColumnId === relation.sourceColumnId)
    )
  }

  /**
   * Adds a new relation
   * Returns null if the relation already exists
   */
  const addRelation = (relation?: Partial<Relation>): Relation | null => {
    if (!currentProject.value) return null

    // Check if an identical relation already exists
    if (relation && relationExists(relation)) {
      console.warn('An identical relation already exists between these columns')
      return null
    }

    const newRelation = createDefaultRelation(relation)
    currentProject.value.relations.push(newRelation)
    currentProject.value.updatedAt = new Date()

    return newRelation
  }

  /**
   * Updates an existing relation
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

    // Update editingRelation if necessary
    if (editingRelation.value?.id === relationId) {
      editingRelation.value = currentProject.value.relations[relationIndex]
    }
  }

  /**
   * Deletes a relation
   */
  const deleteRelation = (relationId: string) => {
    if (!currentProject.value) return

    currentProject.value.relations = currentProject.value.relations.filter(r => r.id !== relationId)
    currentProject.value.updatedAt = new Date()

    // Close editor if it was this relation
    if (editingRelation.value?.id === relationId) {
      editingRelation.value = null
    }
  }

  /**
   * Gets a relation by its ID
   */
  const getRelation = (relationId: string): Relation | undefined => {
    return currentProject.value?.relations.find(r => r.id === relationId)
  }

  /**
   * Replaces all project relations (used by SQL parser)
   */
  const setRelations = (relations: Relation[]) => {
    if (!currentProject.value) return
    currentProject.value.relations = relations
    currentProject.value.updatedAt = new Date()
  }

  /**
   * Gets all relations for a table (as source or target)
   */
  const getTableRelations = (tableId: string): Relation[] => {
    if (!currentProject.value) return []

    return currentProject.value.relations.filter(
      r => r.sourceTableId === tableId || r.targetTableId === tableId
    )
  }

  // === Editors ===

  /**
   * Opens the table editor
   */
  const openTableEditor = (tableId: string) => {
    const table = getTable(tableId)
    if (table) {
      editingTable.value = { ...table }
    }
  }

  /**
   * Closes the table editor
   */
  const closeTableEditor = () => {
    editingTable.value = null
  }

  /**
   * Opens the group editor
   */
  const openGroupEditor = (groupId: string) => {
    const group = getGroup(groupId)
    if (group) {
      editingGroup.value = { ...group }
    }
  }

  /**
   * Closes the group editor
   */
  const closeGroupEditor = () => {
    editingGroup.value = null
  }

  /**
   * Opens the relation editor
   */
  const openRelationEditor = (relationId: string) => {
    const relation = getRelation(relationId)
    if (relation) {
      editingRelation.value = { ...relation }
    }
  }

  /**
   * Closes the relation editor
   */
  const closeRelationEditor = () => {
    editingRelation.value = null
  }

  /**
   * Opens the note editor
   */
  const openNoteEditor = (noteId: string) => {
    const note = getNote(noteId)
    if (note) {
      editingNote.value = { ...note }
    }
  }

  /**
   * Closes the note editor
   */
  const closeNoteEditor = () => {
    editingNote.value = null
  }

  return {
    // State (readonly to prevent direct mutations)
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
