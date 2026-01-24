/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: 'any' types are necessary because node-sql-parser returns a dynamic AST
// whose structure varies depending on the SQL dialect and query type

import { Parser } from 'node-sql-parser'
import type { TableData, Column, Relation } from '~/types/database'
import { ColumnType, RelationType, generateId } from '~/types/database'

/**
 * SQL parsing error with position for Monaco
 */
export interface SqlParseError {
  message: string
  line: number
  column: number
  startOffset?: number
  endOffset?: number
}

/**
 * SQL parsing result
 */
export interface SqlParseResult {
  success: boolean
  tables: TableData[]
  relations: Relation[]
  errors: SqlParseError[]
}

/**
 * Normalized column structure extracted from AST
 * This interface captures ALL possible information from the AST
 */
interface NormalizedColumnDef {
  name: string
  dataType: string
  length?: number
  precision?: number
  scale?: number
  constraints: {
    primaryKey: boolean
    notNull: boolean
    unique: boolean
    autoIncrement: boolean
    defaultValue?: string
    check?: string
    references?: {
      table: string
      column: string
      onDelete?: string
      onUpdate?: string
    }
  }
  // Extra field to store unrecognized AST properties (extensibility)
  extra: Record<string, unknown>
}

/**
 * Normalized table constraint structure
 */
interface NormalizedTableConstraint {
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'INDEX' | 'UNKNOWN'
  name?: string
  columns: string[]
  references?: {
    table: string
    columns: string[]
    onDelete?: string
    onUpdate?: string
  }
  extra: Record<string, unknown>
}

/**
 * Composable to parse SQL and extract tables/relations
 * Uses node-sql-parser for robust validation
 * Approach: Complete AST normalization for reliable extraction
 */
export const useSqlParser = () => {
  const parser = new Parser()

  /**
   * Maps a SQL type to our ColumnType enum
   */
  const mapSqlTypeToColumnType = (dataType: string): ColumnType => {
    const normalizedType = dataType.toUpperCase().trim()

    const typeMap: Record<string, ColumnType> = {
      // Integers
      'SMALLINT': ColumnType.SMALLINT,
      'INT': ColumnType.INT,
      'INT2': ColumnType.SMALLINT,
      'INT4': ColumnType.INT,
      'INT8': ColumnType.BIGINT,
      'INTEGER': ColumnType.INTEGER,
      'BIGINT': ColumnType.BIGINT,
      'TINYINT': ColumnType.INT,
      'MEDIUMINT': ColumnType.INT,

      // Decimals
      'DECIMAL': ColumnType.DECIMAL,
      'NUMERIC': ColumnType.NUMERIC,
      'REAL': ColumnType.REAL,
      'DOUBLE': ColumnType.DOUBLE_PRECISION,
      'DOUBLE PRECISION': ColumnType.DOUBLE_PRECISION,
      'FLOAT': ColumnType.FLOAT,
      'FLOAT4': ColumnType.REAL,
      'FLOAT8': ColumnType.DOUBLE_PRECISION,
      'MONEY': ColumnType.MONEY,

      // Serial (auto-increment)
      'SMALLSERIAL': ColumnType.SMALLSERIAL,
      'SERIAL': ColumnType.SERIAL,
      'SERIAL4': ColumnType.SERIAL,
      'BIGSERIAL': ColumnType.BIGSERIAL,
      'SERIAL8': ColumnType.BIGSERIAL,

      // Strings
      'CHAR': ColumnType.CHAR,
      'CHARACTER': ColumnType.CHAR,
      'VARCHAR': ColumnType.VARCHAR,
      'CHARACTER VARYING': ColumnType.VARCHAR,
      'TEXT': ColumnType.TEXT,
      'LONGTEXT': ColumnType.TEXT,
      'MEDIUMTEXT': ColumnType.TEXT,
      'TINYTEXT': ColumnType.TEXT,

      // Binaire
      'BYTEA': ColumnType.BYTEA,
      'BLOB': ColumnType.BYTEA,

      // Date/Temps
      'DATE': ColumnType.DATE,
      'TIME': ColumnType.TIME,
      'TIMETZ': ColumnType.TIMETZ,
      'TIME WITH TIME ZONE': ColumnType.TIMETZ,
      'TIMESTAMP': ColumnType.TIMESTAMP,
      'TIMESTAMPTZ': ColumnType.TIMESTAMPTZ,
      'TIMESTAMP WITH TIME ZONE': ColumnType.TIMESTAMPTZ,
      'DATETIME': ColumnType.TIMESTAMP,
      'INTERVAL': ColumnType.INTERVAL,

      // Boolean
      'BOOLEAN': ColumnType.BOOLEAN,
      'BOOL': ColumnType.BOOLEAN,

      // Geometry
      'POINT': ColumnType.POINT,
      'LINE': ColumnType.LINE,
      'LSEG': ColumnType.LSEG,
      'BOX': ColumnType.BOX,
      'PATH': ColumnType.PATH,
      'POLYGON': ColumnType.POLYGON,
      'CIRCLE': ColumnType.CIRCLE,

      // Network
      'CIDR': ColumnType.CIDR,
      'INET': ColumnType.INET,
      'MACADDR': ColumnType.MACADDR,
      'MACADDR8': ColumnType.MACADDR8,

      // Bits
      'BIT': ColumnType.BIT,
      'VARBIT': ColumnType.VARBIT,
      'BIT VARYING': ColumnType.VARBIT,

      // Text search
      'TSVECTOR': ColumnType.TSVECTOR,
      'TSQUERY': ColumnType.TSQUERY,

      // JSON
      'JSON': ColumnType.JSON,
      'JSONB': ColumnType.JSONB,

      // Autres
      'UUID': ColumnType.UUID,
      'XML': ColumnType.XML,

      // Vecteurs (pgvector)
      'VECTOR': ColumnType.VECTOR,
      'HALFVEC': ColumnType.HALFVEC,
      'SPARSEVEC': ColumnType.SPARSEVEC
    }

    return typeMap[normalizedType] || ColumnType.VARCHAR
  }

  /**
   * Extracts a string value from any AST structure
   * Handles all possible formats from node-sql-parser
   */
  const extractStringValue = (value: any): string | null => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)

    // Object case with different possible properties
    if (typeof value === 'object') {
      // { value: "..." }
      if (value.value !== undefined) return extractStringValue(value.value)
      // { expr: { value: "..." } }
      if (value.expr?.value !== undefined) return extractStringValue(value.expr.value)
      // { column: "..." } ou { column: { expr: { value: "..." } } }
      if (value.column !== undefined) return extractStringValue(value.column)
      // { table: "..." }
      if (value.table !== undefined) return extractStringValue(value.table)
      // { name: "..." }
      if (value.name !== undefined) return extractStringValue(value.name)
    }

    return null
  }

  /**
   * Extrait le nom d'une fonction SQL depuis la structure AST
   * node-sql-parser structure le nom comme { name: [{ type: "...", value: "FUNC_NAME" }] }
   */
  const extractFunctionName = (nameObj: any): string => {
    if (!nameObj) return ''
    if (typeof nameObj === 'string') return nameObj

    // { name: [{ type: "origin"|"default", value: "FUNC_NAME" }] }
    if (nameObj.name && Array.isArray(nameObj.name)) {
      const parts = nameObj.name.map((part: any) => part.value || part).filter(Boolean)
      return parts.join('.')
    }

    // { name: "FUNC_NAME" }
    if (typeof nameObj.name === 'string') return nameObj.name

    return ''
  }

  /**
   * Extracts a DEFAULT value from the AST
   * Handles strings, numbers, and SQL functions (CURRENT_TIMESTAMP, NOW(), etc.)
   */
  const extractDefaultValue = (defaultVal: any): string | null => {
    if (!defaultVal) return null

    // Cas simple : string ou nombre
    if (typeof defaultVal === 'string') return defaultVal
    if (typeof defaultVal === 'number') return String(defaultVal)

    // Cas objet
    if (typeof defaultVal === 'object') {
      // { type: "default", value: { ... } }
      if (defaultVal.type === 'default' && defaultVal.value !== undefined) {
        return extractDefaultValue(defaultVal.value)
      }

      // { type: "function", name: { name: [...] }, args: ... }
      if (defaultVal.type === 'function') {
        const funcName = extractFunctionName(defaultVal.name)
        // Args can be empty or contain values
        const hasArgs = defaultVal.args?.value && defaultVal.args.value.length > 0
        // CURRENT_TIMESTAMP has no parentheses, NOW() does
        if (funcName === 'CURRENT_TIMESTAMP' && !hasArgs) {
          return 'CURRENT_TIMESTAMP'
        }
        return `${funcName}()`
      }

      // { type: "single_quote_string", value: "pending" }
      if (defaultVal.type === 'single_quote_string' && defaultVal.value) {
        return `'${defaultVal.value}'`
      }

      // { type: "number", value: 1 }
      if (defaultVal.type === 'number' && defaultVal.value !== undefined) {
        return String(defaultVal.value)
      }

      // { type: "null" }
      if (defaultVal.type === 'null') {
        return 'NULL'
      }

      // { type: "bool", value: true/false }
      if (defaultVal.type === 'bool') {
        return defaultVal.value ? 'TRUE' : 'FALSE'
      }

      // Fallback: essayer d'extraire une valeur simple
      if (defaultVal.value !== undefined) {
        if (typeof defaultVal.value === 'string') return defaultVal.value
        if (typeof defaultVal.value === 'number') return String(defaultVal.value)
      }

      // Dernier fallback
      const fallback = extractStringValue(defaultVal)
      if (fallback) return fallback
    }

    return null
  }

  /**
   * Normalizes an AST column definition into a uniform structure
   * This is the core of the mapper: it traverses the entire object and extracts constraints
   */
  const normalizeColumnDef = (colDef: any): NormalizedColumnDef | null => {
    // Extract column name
    const name = extractStringValue(colDef.column)
    if (!name) return null

    // Extract data type
    const dataType = (colDef.definition?.dataType || '').toUpperCase().replace(/\(.*\)/, '').trim()
    if (!dataType) return null

    // Initialize the normalized structure
    const normalized: NormalizedColumnDef = {
      name,
      dataType,
      constraints: {
        primaryKey: false,
        notNull: false,
        unique: false,
        autoIncrement: false
      },
      extra: {}
    }

    // === EXTRACTION DES PARAMÈTRES DE TYPE ===
    if (colDef.definition?.length) {
      const len = colDef.definition.length
      if (typeof len === 'number') {
        normalized.length = len
      } else if (Array.isArray(len)) {
        normalized.precision = len[0]
        if (len.length > 1) normalized.scale = len[1]
      }
    }

    // === DÉTECTION AUTO-INCREMENT (SERIAL) ===
    if (/SERIAL/i.test(dataType)) {
      normalized.constraints.autoIncrement = true
      normalized.constraints.notNull = true // SERIAL implique NOT NULL
    }

    // === PARCOURS COMPLET DE L'OBJET POUR EXTRAIRE LES CONTRAINTES ===

    // 1. "nullable" property - can be boolean, object, or string
    const nullable = colDef.nullable ?? colDef.definition?.nullable
    if (nullable !== undefined) {
      if (nullable === false) {
        normalized.constraints.notNull = true
      } else if (typeof nullable === 'object') {
        // { type: "not null", value: "not null" }
        const nullableType = String(nullable.type || nullable.value || '').toLowerCase()
        if (nullableType.includes('not null')) {
          normalized.constraints.notNull = true
        }
      } else if (typeof nullable === 'string' && nullable.toLowerCase().includes('not null')) {
        normalized.constraints.notNull = true
      }
    }

    // 2. Direct "not_null" property
    if (colDef.not_null || colDef.definition?.not_null) {
      normalized.constraints.notNull = true
    }

    // 3. "unique" property - can be boolean or string
    const unique = colDef.unique ?? colDef.definition?.unique
    if (unique) {
      if (unique === true || (typeof unique === 'string' && unique.toLowerCase() === 'unique')) {
        normalized.constraints.unique = true
      }
    }

    // 4. Direct "primary_key" property
    if (colDef.primary_key || colDef.definition?.primary_key) {
      normalized.constraints.primaryKey = true
      normalized.constraints.notNull = true // PK implique NOT NULL
      normalized.constraints.unique = true // PK implique UNIQUE
    }

    // 5. Direct "auto_increment" property (MySQL)
    if (colDef.auto_increment || colDef.definition?.auto_increment) {
      normalized.constraints.autoIncrement = true
    }

    // 6. Extraction de la valeur DEFAULT
    const defaultVal = colDef.default_val ?? colDef.definition?.default_val
    if (defaultVal !== undefined && defaultVal !== null) {
      const defaultStr = extractDefaultValue(defaultVal)
      if (defaultStr !== null) {
        normalized.constraints.defaultValue = defaultStr
      }
    }

    // 7. Traverse "constraint" array if present
    const constraints = colDef.constraint ?? colDef.definition?.constraint
    if (constraints) {
      const constraintList = Array.isArray(constraints) ? constraints : [constraints]
      for (const c of constraintList) {
        const constraintType = String(c?.type || c?.constraint_type || c || '').toUpperCase()

        if (constraintType.includes('PRIMARY')) {
          normalized.constraints.primaryKey = true
          normalized.constraints.notNull = true
          normalized.constraints.unique = true
        }
        if (constraintType.includes('NOT NULL')) {
          normalized.constraints.notNull = true
        }
        if (constraintType.includes('UNIQUE')) {
          normalized.constraints.unique = true
        }
        if (constraintType.includes('AUTO_INCREMENT') || constraintType.includes('AUTOINCREMENT')) {
          normalized.constraints.autoIncrement = true
        }

        // CHECK constraint
        if (constraintType.includes('CHECK') && c.definition) {
          normalized.constraints.check = JSON.stringify(c.definition)
          normalized.extra.check = c
        }

        // REFERENCES (FK inline)
        if (constraintType.includes('REFERENCES') || c.reference) {
          const ref = c.reference || c
          const refTable = extractStringValue(ref.table?.[0] || ref.table)
          const refColumn = extractStringValue(ref.definition?.[0] || ref.columns?.[0])
          if (refTable && refColumn) {
            normalized.constraints.references = {
              table: refTable,
              column: refColumn,
              onDelete: ref.on_delete?.toUpperCase(),
              onUpdate: ref.on_update?.toUpperCase()
            }
          }
        }
      }
    }

    // 8. Check for direct references (colDef.references)
    if (colDef.references) {
      const refTable = extractStringValue(colDef.references.table)
      const refColumn = extractStringValue(colDef.references.columns?.[0])
      if (refTable && refColumn) {
        normalized.constraints.references = {
          table: refTable,
          column: refColumn,
          onDelete: colDef.references.on_delete?.toUpperCase(),
          onUpdate: colDef.references.on_update?.toUpperCase()
        }
      }
    }

    // 9. Store unprocessed properties in extra (for extensibility)
    const knownProperties = new Set([
      'column', 'definition', 'resource', 'nullable', 'not_null', 'unique',
      'primary_key', 'auto_increment', 'default_val', 'constraint', 'references'
    ])
    for (const key of Object.keys(colDef)) {
      if (!knownProperties.has(key)) {
        normalized.extra[key] = colDef[key]
      }
    }

    return normalized
  }

  /**
   * Normalise les contraintes de table (PRIMARY KEY, FOREIGN KEY, UNIQUE, etc.)
   */
  const normalizeTableConstraints = (stmt: any): NormalizedTableConstraint[] => {
    const constraints: NormalizedTableConstraint[] = []

    // Sources possibles des contraintes
    const sources = [
      stmt.constraint,
      stmt.create_definitions,
      stmt.create_definition
    ].filter(Boolean)

    for (const source of sources) {
      const items = Array.isArray(source) ? source : [source]

      for (const item of items) {
        // Ignore column definitions
        if (item?.resource === 'column' || (item?.column && item?.definition?.dataType)) {
          continue
        }

        // Identifier le type de contrainte
        const constraintType = String(
          item?.constraint_type
          || item?.type
          || item?.resource
          || ''
        ).toUpperCase()

        let type: NormalizedTableConstraint['type'] = 'UNKNOWN'
        if (constraintType.includes('PRIMARY')) type = 'PRIMARY KEY'
        else if (constraintType.includes('FOREIGN')) type = 'FOREIGN KEY'
        else if (constraintType.includes('UNIQUE')) type = 'UNIQUE'
        else if (constraintType.includes('CHECK')) type = 'CHECK'
        else if (constraintType.includes('INDEX')) type = 'INDEX'
        else if (!constraintType && !item?.constraint_type) continue // Pas une contrainte

        // Extract the relevant columns
        const columnSources = item?.definition || item?.columns || item?.index_columns || []
        const columnList = Array.isArray(columnSources) ? columnSources : [columnSources]
        const columns: string[] = []

        for (const col of columnList) {
          const colName = extractStringValue(col)
          if (colName) columns.push(colName)
        }

        // Create the normalized constraint
        const normalized: NormalizedTableConstraint = {
          type,
          name: item?.constraint_name || item?.name,
          columns,
          extra: {}
        }

        // Add references for FKs
        // Note: node-sql-parser uses "reference_definition" (not "reference")
        // and "on_action" is an array instead of separate on_delete/on_update
        const refDef = item?.reference_definition || item?.reference
        if (type === 'FOREIGN KEY' && refDef) {
          const refTable = extractStringValue(refDef.table?.[0] || refDef.table)
          const refCols = refDef.definition || refDef.columns || []
          const refColList = Array.isArray(refCols) ? refCols : [refCols]
          const refColumns: string[] = []

          for (const rc of refColList) {
            const rcName = extractStringValue(rc)
            if (rcName) refColumns.push(rcName)
          }

          // Extraire ON DELETE et ON UPDATE depuis on_action (tableau)
          let onDelete: string | undefined
          let onUpdate: string | undefined

          if (refDef.on_action && Array.isArray(refDef.on_action)) {
            for (const action of refDef.on_action) {
              const actionType = String(action.type || '').toLowerCase()
              const actionValue = extractStringValue(action.value)?.toUpperCase()

              if (actionType.includes('delete') && actionValue) {
                onDelete = actionValue
              } else if (actionType.includes('update') && actionValue) {
                onUpdate = actionValue
              }
            }
          }

          // Fallback to legacy properties
          if (!onDelete) {
            onDelete = refDef.on_delete?.toUpperCase() || item.on_delete?.toUpperCase()
          }
          if (!onUpdate) {
            onUpdate = refDef.on_update?.toUpperCase() || item.on_update?.toUpperCase()
          }

          if (refTable && refColumns.length > 0) {
            normalized.references = {
              table: refTable,
              columns: refColumns,
              onDelete,
              onUpdate
            }
          }
        }

        constraints.push(normalized)
      }
    }

    return constraints
  }

  /**
   * Converts a normalized column to a store Column
   */
  const normalizedToColumn = (normalized: NormalizedColumnDef): Column => {
    return {
      id: generateId(),
      name: normalized.name,
      type: mapSqlTypeToColumnType(normalized.dataType),
      primaryKey: normalized.constraints.primaryKey,
      nullable: !normalized.constraints.notNull && !normalized.constraints.primaryKey,
      unique: normalized.constraints.unique || normalized.constraints.primaryKey,
      default: normalized.constraints.defaultValue,
      length: normalized.length,
      precision: normalized.precision,
      scale: normalized.scale
    }
  }

  /**
   * Parses complete SQL and extracts tables and relations
   * Uses complete AST normalization
   */
  const parseSql = (sql: string, dialect: 'PostgreSQL' | 'MySQL' | 'SQLite' = 'PostgreSQL'): SqlParseResult => {
    const errors: SqlParseError[] = []
    const tables: TableData[] = []
    const relations: Relation[] = []

    const tableMap = new Map<string, { id: string, columns: Column[] }>()

    if (!sql.trim()) {
      return { success: true, tables: [], relations: [], errors: [] }
    }

    try {
      let dbType: string
      if (dialect === 'PostgreSQL') {
        dbType = 'postgresql'
      } else if (dialect === 'MySQL') {
        dbType = 'mysql'
      } else {
        dbType = 'sqlite'
      }

      let ast: any
      try {
        ast = parser.astify(sql, { database: dbType })
      } catch (parseError: any) {
        const errorMessage = parseError.message || 'SQL syntax error'
        let line = 1
        let column = 1

        const posMatch = errorMessage.match(/line\s*(\d+)/i)
        const colMatch = errorMessage.match(/column\s*(\d+)/i)

        if (posMatch) line = parseInt(posMatch[1], 10)
        if (colMatch) column = parseInt(colMatch[1], 10)

        if (parseError.location) {
          line = parseError.location.start?.line || line
          column = parseError.location.start?.column || column
        }

        errors.push({
          message: errorMessage.split('\n')[0],
          line,
          column
        })

        return { success: false, tables: [], relations: [], errors }
      }

      const statements = Array.isArray(ast) ? ast : [ast]

      // === PREMIÈRE PASSE : Extraction des tables ===
      for (const stmt of statements) {
        if (stmt?.type !== 'create' || stmt?.keyword !== 'table') continue

        const tableName = extractStringValue(stmt.table?.[0] || stmt.table)
        if (!tableName) continue

        const columns: Column[] = []
        const createDef = stmt.create_definitions || stmt.create_definition || []
        const columnDefs = Array.isArray(createDef) ? createDef : [createDef]

        // Parser chaque colonne via normalisation
        for (const colDef of columnDefs) {
          if (colDef?.resource === 'column' || colDef?.column) {
            const normalized = normalizeColumnDef(colDef)
            if (normalized) {
              columns.push(normalizedToColumn(normalized))
            }
          }
        }

        // Extraire les contraintes de table
        const tableConstraints = normalizeTableConstraints(stmt)

        // Appliquer les contraintes PRIMARY KEY de table aux colonnes
        for (const constraint of tableConstraints) {
          if (constraint.type === 'PRIMARY KEY') {
            for (const pkColName of constraint.columns) {
              const col = columns.find(c => c.name.toLowerCase() === pkColName.toLowerCase())
              if (col) {
                col.primaryKey = true
                col.nullable = false
                col.unique = true
              }
            }
          }
          // Appliquer les contraintes UNIQUE de table
          if (constraint.type === 'UNIQUE') {
            for (const uqColName of constraint.columns) {
              const col = columns.find(c => c.name.toLowerCase() === uqColName.toLowerCase())
              if (col) {
                col.unique = true
              }
            }
          }
        }

        if (columns.length === 0) continue

        const tableId = generateId()
        const table: TableData = {
          id: tableId,
          name: tableName,
          color: '#3b82f6',
          columns
        }

        tables.push(table)
        tableMap.set(tableName.toLowerCase(), { id: tableId, columns })
      }

      // === DEUXIÈME PASSE : Extraction des relations ===
      for (const stmt of statements) {
        if (stmt?.type !== 'create' || stmt?.keyword !== 'table') continue

        const tableName = extractStringValue(stmt.table?.[0] || stmt.table)
        const tableInfo = tableMap.get(tableName?.toLowerCase() || '')
        if (!tableInfo) continue

        const tableConstraints = normalizeTableConstraints(stmt)

        for (const constraint of tableConstraints) {
          if (constraint.type !== 'FOREIGN KEY' || !constraint.references) continue

          const sourceColName = constraint.columns[0]
          const targetTableName = constraint.references.table
          const targetColName = constraint.references.columns[0]

          if (!sourceColName || !targetTableName || !targetColName) continue

          const sourceColumn = tableInfo.columns.find(c =>
            c.name.toLowerCase() === sourceColName.toLowerCase()
          )
          const targetTable = tableMap.get(targetTableName.toLowerCase())
          const targetColumn = targetTable?.columns.find(c =>
            c.name.toLowerCase() === targetColName.toLowerCase()
          )

          if (!sourceColumn || !targetTable || !targetColumn) continue

          let onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' = 'NO ACTION'
          let onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' = 'NO ACTION'

          const deleteAction = constraint.references.onDelete?.replace(/\s+/g, ' ')
          const updateAction = constraint.references.onUpdate?.replace(/\s+/g, ' ')

          if (deleteAction === 'CASCADE') onDelete = 'CASCADE'
          else if (deleteAction === 'SET NULL') onDelete = 'SET NULL'
          else if (deleteAction === 'RESTRICT') onDelete = 'RESTRICT'

          if (updateAction === 'CASCADE') onUpdate = 'CASCADE'
          else if (updateAction === 'SET NULL') onUpdate = 'SET NULL'
          else if (updateAction === 'RESTRICT') onUpdate = 'RESTRICT'

          relations.push({
            id: generateId(),
            sourceTableId: tableInfo.id,
            sourceColumnId: sourceColumn.id,
            targetTableId: targetTable.id,
            targetColumnId: targetColumn.id,
            type: RelationType.ONE_TO_MANY,
            onDelete,
            onUpdate
          })
        }
      }

      // === TROISIÈME PASSE : ALTER TABLE ===
      for (const stmt of statements) {
        if (stmt?.type !== 'alter') continue

        const tableName = extractStringValue(stmt.table?.[0] || stmt.table)
        const tableInfo = tableMap.get(tableName?.toLowerCase() || '')
        if (!tableInfo) continue

        const alterSpecs = Array.isArray(stmt.expr) ? stmt.expr : [stmt.expr]
        for (const spec of alterSpecs) {
          // Check for ADD CONSTRAINT action
          const action = String(spec?.action || spec?.keyword || '').toLowerCase()
          if (action !== 'add') continue

          // Check constraint type - could be in different properties
          const constraintType = String(
            spec?.constraint_type
            || spec?.create_definitions?.constraint_type
            || spec?.constraint?.type
            || ''
          ).toUpperCase()

          if (!constraintType.includes('FOREIGN')) continue

          // Extract source column - could be in different locations
          const sourceColName = extractStringValue(
            spec.definition?.[0]
            || spec.create_definitions?.definition?.[0]
            || spec.constraint?.definition?.[0]
          )

          // Extract reference info
          const refDef = spec.reference_definition || spec.reference || spec.create_definitions?.reference_definition
          const targetTableName = extractStringValue(refDef?.table?.[0] || refDef?.table)
          const targetColName = extractStringValue(refDef?.definition?.[0] || refDef?.columns?.[0])

          if (!sourceColName || !targetTableName || !targetColName) continue

          const sourceColumn = tableInfo.columns.find(c =>
            c.name.toLowerCase() === sourceColName.toLowerCase()
          )
          const targetTable = tableMap.get(targetTableName.toLowerCase())
          const targetColumn = targetTable?.columns.find(c =>
            c.name.toLowerCase() === targetColName.toLowerCase()
          )

          if (!sourceColumn || !targetTable || !targetColumn) continue

          let onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' = 'NO ACTION'
          let onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' = 'NO ACTION'

          // Extract ON DELETE and ON UPDATE from on_action array (PostgreSQL format)
          if (refDef?.on_action && Array.isArray(refDef.on_action)) {
            for (const action of refDef.on_action) {
              const actionType = String(action.type || '').toLowerCase()
              const actionValue = extractStringValue(action.value)?.toUpperCase()

              if (actionType.includes('delete') && actionValue) {
                if (actionValue === 'CASCADE') onDelete = 'CASCADE'
                else if (actionValue === 'SET NULL') onDelete = 'SET NULL'
                else if (actionValue === 'RESTRICT') onDelete = 'RESTRICT'
              } else if (actionType.includes('update') && actionValue) {
                if (actionValue === 'CASCADE') onUpdate = 'CASCADE'
                else if (actionValue === 'SET NULL') onUpdate = 'SET NULL'
                else if (actionValue === 'RESTRICT') onUpdate = 'RESTRICT'
              }
            }
          }

          // Fallback to legacy properties
          if (onDelete === 'NO ACTION' && refDef?.on_delete) {
            const action = refDef.on_delete.toUpperCase()
            if (action === 'CASCADE') onDelete = 'CASCADE'
            else if (action === 'SET NULL') onDelete = 'SET NULL'
            else if (action === 'RESTRICT') onDelete = 'RESTRICT'
          }

          if (onUpdate === 'NO ACTION' && refDef?.on_update) {
            const action = refDef.on_update.toUpperCase()
            if (action === 'CASCADE') onUpdate = 'CASCADE'
            else if (action === 'SET NULL') onUpdate = 'SET NULL'
            else if (action === 'RESTRICT') onUpdate = 'RESTRICT'
          }

          relations.push({
            id: generateId(),
            sourceTableId: tableInfo.id,
            sourceColumnId: sourceColumn.id,
            targetTableId: targetTable.id,
            targetColumnId: targetColumn.id,
            type: RelationType.ONE_TO_MANY,
            onDelete,
            onUpdate
          })
        }
      }

      return {
        success: true,
        tables,
        relations,
        errors: []
      }
    } catch (e: any) {
      errors.push({
        message: `Parsing error: ${e.message}`,
        line: 1,
        column: 1
      })

      return {
        success: false,
        tables: [],
        relations: [],
        errors
      }
    }
  }

  /**
   * Valide si le SQL est syntaxiquement correct
   */
  const validateSql = (sql: string, dialect: 'PostgreSQL' | 'MySQL' | 'SQLite' = 'PostgreSQL'): { valid: boolean, errors: SqlParseError[] } => {
    const result = parseSql(sql, dialect)
    return {
      valid: result.success,
      errors: result.errors
    }
  }

  return {
    parseSql,
    validateSql
  }
}
