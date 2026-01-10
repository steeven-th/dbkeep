/**
 * Types et interfaces pour DBKeep
 * Définit la structure des données pour la modélisation de bases de données
 */

// Types de colonnes SQL supportés
export enum ColumnType {
  // Numériques
  SMALLINT = 'SMALLINT',
  INT = 'INT',
  INTEGER = 'INTEGER',
  BIGINT = 'BIGINT',
  DECIMAL = 'DECIMAL',
  NUMERIC = 'NUMERIC',
  REAL = 'REAL',
  DOUBLE_PRECISION = 'DOUBLE PRECISION',
  FLOAT = 'FLOAT',
  MONEY = 'MONEY',

  // Auto-incrémentation
  SMALLSERIAL = 'SMALLSERIAL',
  SERIAL = 'SERIAL',
  BIGSERIAL = 'BIGSERIAL',

  // Chaînes de caractères
  CHAR = 'CHAR',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  BYTEA = 'BYTEA',

  // Date et heure
  DATE = 'DATE',
  TIME = 'TIME',
  TIMETZ = 'TIMETZ',
  TIMESTAMP = 'TIMESTAMP',
  TIMESTAMPTZ = 'TIMESTAMPTZ',
  INTERVAL = 'INTERVAL',

  // Booléen
  BOOLEAN = 'BOOLEAN',

  // Géométrie
  POINT = 'POINT',
  LINE = 'LINE',
  LSEG = 'LSEG',
  BOX = 'BOX',
  PATH = 'PATH',
  POLYGON = 'POLYGON',
  CIRCLE = 'CIRCLE',

  // Réseau
  CIDR = 'CIDR',
  INET = 'INET',
  MACADDR = 'MACADDR',
  MACADDR8 = 'MACADDR8',

  // Bits
  BIT = 'BIT',
  VARBIT = 'VARBIT',

  // Recherche texte
  TSVECTOR = 'TSVECTOR',
  TSQUERY = 'TSQUERY',

  // JSON
  JSON = 'JSON',
  JSONB = 'JSONB',

  // Autres
  UUID = 'UUID',
  XML = 'XML',

  // Vecteurs (pgvector)
  VECTOR = 'VECTOR',
  HALFVEC = 'HALFVEC',
  SPARSEVEC = 'SPARSEVEC'
}

// Moteurs de base de données supportés
export enum DatabaseEngine {
  PostgreSQL = 'PostgreSQL',
  MySQL = 'MySQL',
  SQLite = 'SQLite'
}

// Types de relations entre tables
export enum RelationType {
  ONE_TO_ONE = '1:1',
  ONE_TO_MANY = '1:N',
  MANY_TO_MANY = 'N:M'
}

// Actions référentielles pour les clés étrangères
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'

// Interface pour une colonne de table
export interface Column {
  id: string
  name: string
  type: ColumnType
  primaryKey: boolean
  nullable: boolean
  unique: boolean
  default?: string
  // Paramètres de type
  length?: number // Pour VARCHAR(n), CHAR(n), BIT(n), VARBIT(n)
  precision?: number // Pour DECIMAL(p,s), NUMERIC(p,s) - nombre total de chiffres
  scale?: number // Pour DECIMAL(p,s), NUMERIC(p,s) - chiffres après la virgule
  dimension?: number // Pour VECTOR(n), HALFVEC(n), SPARSEVEC(n)
}

// Interface pour les données d'une table
export interface TableData {
  id: string
  name: string
  color: string // Couleur hex du header
  columns: Column[]
  // Infos de présentation Vue Flow (optionnelles pour rétrocompatibilité)
  position?: NodePosition
  parentNode?: string // ID du groupe parent si la table est dans un groupe
}

// Interface pour les données d'un groupe
export interface GroupData {
  id: string
  name: string
  color: string // Couleur hex de la bordure
  // Infos de présentation Vue Flow (optionnelles pour rétrocompatibilité)
  position?: NodePosition
  style?: {
    width: string
    height: string
  }
}

// Interface pour les données d'une note
export interface NoteData {
  id: string
  name: string // Titre de la note
  content: string // Contenu texte de la note
  color: string // Couleur hex du fond
  textColor: 'black' | 'white' // Couleur du texte
  // Infos de présentation Vue Flow (optionnelles pour rétrocompatibilité)
  position?: NodePosition
  style?: {
    width: string
    height: string
  }
}

// Interface pour une relation (clé étrangère)
export interface Relation {
  id: string
  name?: string
  sourceTableId: string
  sourceColumnId: string
  targetTableId: string
  targetColumnId: string
  type: RelationType
  onDelete?: ReferentialAction
  onUpdate?: ReferentialAction
}

// Interface pour le projet complet
export interface Project {
  id: string
  name: string
  engine: DatabaseEngine
  tables: TableData[]
  groups: GroupData[]
  notes: NoteData[]
  relations: Relation[]
  createdAt: Date
  updatedAt: Date
}

// Types pour Vue Flow - Position d'un noeud
export interface NodePosition {
  x: number
  y: number
}

// Interface pour un noeud table dans Vue Flow
export interface DbTableNode {
  id: string
  type: 'dbTable'
  position: NodePosition
  data: TableData
  parentNode?: string // ID du groupe parent si nested
  extent?: 'parent' // Contraint le drag dans le parent
}

// Interface pour un noeud groupe dans Vue Flow
export interface DbGroupNode {
  id: string
  type: 'dbGroup'
  position: NodePosition
  data: GroupData
  style?: {
    width: string
    height: string
  }
}

// Interface pour un noeud note dans Vue Flow
export interface DbNoteNode {
  id: string
  type: 'dbNote'
  position: NodePosition
  data: NoteData
  style?: {
    width: string
    height: string
  }
}

// Union type pour tous les noeuds
export type DbNode = DbTableNode | DbGroupNode | DbNoteNode

// Interface pour un edge (relation) dans Vue Flow
export interface DbEdge {
  id: string
  type: 'relation'
  source: string // ID du noeud source (table)
  target: string // ID du noeud cible (table)
  sourceHandle: string // ID de la colonne source
  targetHandle: string // ID de la colonne cible
  data: Relation
}

// Couleurs prédéfinies pour les tables et groupes
export const TABLE_COLORS = [
  { label: 'blue', value: '#3b82f6' },
  { label: 'green', value: '#22c55e' },
  { label: 'purple', value: '#a855f7' },
  { label: 'red', value: '#ef4444' },
  { label: 'orange', value: '#f97316' },
  { label: 'pink', value: '#ec4899' },
  { label: 'cyan', value: '#06b6d4' },
  { label: 'yellow', value: '#eab308' }
] as const

// Couleur par défaut pour les nouvelles tables
export const DEFAULT_TABLE_COLOR = '#3b82f6'

// Couleur par défaut pour les nouveaux groupes
export const DEFAULT_GROUP_COLOR = '#6b7280'

// Couleur par défaut pour les nouvelles notes
export const DEFAULT_NOTE_COLOR = '#fef3c7' // Jaune pâle (amber-100)

// Helper pour créer un UUID
export const generateId = (): string => {
  return crypto.randomUUID()
}

// Helper pour créer une colonne par défaut
export const createDefaultColumn = (overrides?: Partial<Column>): Column => ({
  id: generateId(),
  name: '',
  type: ColumnType.VARCHAR,
  primaryKey: false,
  nullable: true,
  unique: false,
  ...overrides
})

// Helper pour créer une colonne ID par défaut
export const createIdColumn = (): Column => ({
  id: generateId(),
  name: 'id',
  type: ColumnType.SERIAL,
  primaryKey: true,
  nullable: false,
  unique: true
})

// Helper pour créer une table par défaut
export const createDefaultTable = (name: string, overrides?: Partial<TableData>): TableData => ({
  id: generateId(),
  name,
  color: DEFAULT_TABLE_COLOR,
  columns: [createIdColumn()],
  ...overrides
})

// Helper pour créer un groupe par défaut
export const createDefaultGroup = (name: string, overrides?: Partial<GroupData>): GroupData => ({
  id: generateId(),
  name,
  color: DEFAULT_GROUP_COLOR,
  ...overrides
})

// Helper pour créer une note par défaut
export const createDefaultNote = (name: string, overrides?: Partial<NoteData>): NoteData => ({
  id: generateId(),
  name,
  content: '',
  color: DEFAULT_NOTE_COLOR,
  textColor: 'black',
  ...overrides
})

// Helper pour créer une relation par défaut
export const createDefaultRelation = (overrides?: Partial<Relation>): Relation => ({
  id: generateId(),
  sourceTableId: '',
  sourceColumnId: '',
  targetTableId: '',
  targetColumnId: '',
  type: RelationType.ONE_TO_MANY,
  onDelete: 'NO ACTION',
  onUpdate: 'NO ACTION',
  ...overrides
})

// Helper pour créer un projet par défaut
export const createDefaultProject = (name: string, engine: DatabaseEngine): Project => ({
  id: generateId(),
  name,
  engine,
  tables: [],
  groups: [],
  notes: [],
  relations: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
