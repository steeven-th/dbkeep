/**
 * Types and interfaces for DBKeep
 * Defines data structures for database schema modeling
 */

// Supported SQL column types
export enum ColumnType {
  // Numeric
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

  // Auto-increment
  SMALLSERIAL = 'SMALLSERIAL',
  SERIAL = 'SERIAL',
  BIGSERIAL = 'BIGSERIAL',

  // Character strings
  CHAR = 'CHAR',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  BYTEA = 'BYTEA',

  // Date and time
  DATE = 'DATE',
  TIME = 'TIME',
  TIMETZ = 'TIMETZ',
  TIMESTAMP = 'TIMESTAMP',
  TIMESTAMPTZ = 'TIMESTAMPTZ',
  INTERVAL = 'INTERVAL',

  // Boolean
  BOOLEAN = 'BOOLEAN',

  // Geometry
  POINT = 'POINT',
  LINE = 'LINE',
  LSEG = 'LSEG',
  BOX = 'BOX',
  PATH = 'PATH',
  POLYGON = 'POLYGON',
  CIRCLE = 'CIRCLE',

  // Network
  CIDR = 'CIDR',
  INET = 'INET',
  MACADDR = 'MACADDR',
  MACADDR8 = 'MACADDR8',

  // Bits
  BIT = 'BIT',
  VARBIT = 'VARBIT',

  // Text search
  TSVECTOR = 'TSVECTOR',
  TSQUERY = 'TSQUERY',

  // JSON
  JSON = 'JSON',
  JSONB = 'JSONB',

  // Other
  UUID = 'UUID',
  XML = 'XML',

  // Vectors (pgvector)
  VECTOR = 'VECTOR',
  HALFVEC = 'HALFVEC',
  SPARSEVEC = 'SPARSEVEC'
}

// Supported database engines
export enum DatabaseEngine {
  PostgreSQL = 'PostgreSQL',
  MySQL = 'MySQL',
  SQLite = 'SQLite'
}

// Relation types between tables
export enum RelationType {
  ONE_TO_ONE = '1:1',
  ONE_TO_MANY = '1:N',
  MANY_TO_MANY = 'N:M'
}

// Referential actions for foreign keys
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'

// Interface for a table column
export interface Column {
  id: string
  name: string
  type: ColumnType
  primaryKey: boolean
  nullable: boolean
  unique: boolean
  default?: string
  // Type parameters
  length?: number // For VARCHAR(n), CHAR(n), BIT(n), VARBIT(n)
  precision?: number // For DECIMAL(p,s), NUMERIC(p,s) - total digits
  scale?: number // For DECIMAL(p,s), NUMERIC(p,s) - digits after decimal
  dimension?: number // For VECTOR(n), HALFVEC(n), SPARSEVEC(n)
}

// Interface for table data
export interface TableData {
  id: string
  name: string
  color: string // Hex color for header
  columns: Column[]
  // Vue Flow presentation info (optional for backward compatibility)
  position?: NodePosition
  parentNode?: string // Parent group ID if table is in a group
}

// Interface for group data
export interface GroupData {
  id: string
  name: string
  color: string // Hex color for border
  // Vue Flow presentation info (optional for backward compatibility)
  position?: NodePosition
  style?: {
    width: string
    height: string
  }
}

// Interface for note data
export interface NoteData {
  id: string
  name: string // Note title
  content: string // Note text content
  color: string // Hex color for background
  textColor: 'black' | 'white' // Text color
  // Vue Flow presentation info (optional for backward compatibility)
  position?: NodePosition
  style?: {
    width: string
    height: string
  }
}

// Interface for a relation (foreign key)
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

// Interface for complete project
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
  // Optional ownership fields for multi-tenant deployments
  ownerType?: 'user' | 'team'
  ownerId?: string
}

// Vue Flow types - Node position
export interface NodePosition {
  x: number
  y: number
}

// Interface for a table node in Vue Flow
export interface DbTableNode {
  id: string
  type: 'dbTable'
  position: NodePosition
  data: TableData
  parentNode?: string // Parent group ID if nested
  extent?: 'parent' // Constrains drag within parent
}

// Interface for a group node in Vue Flow
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

// Interface for a note node in Vue Flow
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

// Union type for all nodes
export type DbNode = DbTableNode | DbGroupNode | DbNoteNode

// Interface for an edge (relation) in Vue Flow
export interface DbEdge {
  id: string
  type: 'relation'
  source: string // Source node ID (table)
  target: string // Target node ID (table)
  sourceHandle: string // Source column ID
  targetHandle: string // Target column ID
  data: Relation
}

// Predefined colors for tables and groups
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

// Default color for new tables
export const DEFAULT_TABLE_COLOR = '#3b82f6'

// Default color for new groups
export const DEFAULT_GROUP_COLOR = '#6b7280'

// Default color for new notes
export const DEFAULT_NOTE_COLOR = '#fef3c7' // Light yellow (amber-100)

// Helper to create a UUID
export const generateId = (): string => {
  return crypto.randomUUID()
}

// Helper to create a default column
export const createDefaultColumn = (overrides?: Partial<Column>): Column => ({
  id: generateId(),
  name: '',
  type: ColumnType.VARCHAR,
  primaryKey: false,
  nullable: true,
  unique: false,
  ...overrides
})

// Helper to create a default ID column
export const createIdColumn = (): Column => ({
  id: generateId(),
  name: 'id',
  type: ColumnType.SERIAL,
  primaryKey: true,
  nullable: false,
  unique: true
})

// Helper to create a default table
export const createDefaultTable = (name: string, overrides?: Partial<TableData>): TableData => ({
  id: generateId(),
  name,
  color: DEFAULT_TABLE_COLOR,
  columns: [createIdColumn()],
  ...overrides
})

// Helper to create a default group
export const createDefaultGroup = (name: string, overrides?: Partial<GroupData>): GroupData => ({
  id: generateId(),
  name,
  color: DEFAULT_GROUP_COLOR,
  ...overrides
})

// Helper to create a default note
export const createDefaultNote = (name: string, overrides?: Partial<NoteData>): NoteData => ({
  id: generateId(),
  name,
  content: '',
  color: DEFAULT_NOTE_COLOR,
  textColor: 'black',
  ...overrides
})

// Helper to create a default relation
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

// Helper to create a default project
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
