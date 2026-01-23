import type { Project, TableData, Column, Relation } from '~/types/database'
import { DatabaseEngine, ColumnType } from '~/types/database'

/**
 * Composable for generating SQL from a project
 */
export const useSqlGenerator = () => {
  const projectStore = useProjectStore()

  /**
   * Maps a column type to the SQL type for the engine
   * Uses column parameters (length, precision, scale, dimension) if defined
   */
  const mapColumnType = (column: Column, engine: DatabaseEngine): string => {
    const { type, length, precision, scale, dimension } = column

    // SQLite has very simplified types
    if (engine === DatabaseEngine.SQLite) {
      return mapColumnTypeForSQLite(type)
    }

    // PostgreSQL and MySQL
    switch (type) {
      // === Numeric types ===
      case ColumnType.SMALLINT:
        return engine === DatabaseEngine.MySQL ? 'SMALLINT' : 'SMALLINT'
      case ColumnType.INT:
      case ColumnType.INTEGER:
        return engine === DatabaseEngine.MySQL ? 'INT' : 'INTEGER'
      case ColumnType.BIGINT:
        return 'BIGINT'
      case ColumnType.DECIMAL:
      case ColumnType.NUMERIC: {
        const p = precision || 10
        const s = scale || 2
        return `${type === ColumnType.NUMERIC ? 'NUMERIC' : 'DECIMAL'}(${p},${s})`
      }
      case ColumnType.REAL:
        return engine === DatabaseEngine.MySQL ? 'FLOAT' : 'REAL'
      case ColumnType.DOUBLE_PRECISION:
        return engine === DatabaseEngine.MySQL ? 'DOUBLE' : 'DOUBLE PRECISION'
      case ColumnType.FLOAT:
        return 'FLOAT'
      case ColumnType.MONEY:
        return engine === DatabaseEngine.MySQL ? 'DECIMAL(19,4)' : 'MONEY'

      // === Auto-increment types ===
      case ColumnType.SMALLSERIAL:
        return engine === DatabaseEngine.MySQL ? 'SMALLINT AUTO_INCREMENT' : 'SMALLSERIAL'
      case ColumnType.SERIAL:
        return engine === DatabaseEngine.MySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'
      case ColumnType.BIGSERIAL:
        return engine === DatabaseEngine.MySQL ? 'BIGINT AUTO_INCREMENT' : 'BIGSERIAL'

      // === Character string types ===
      case ColumnType.CHAR:
        return `CHAR(${length || 1})`
      case ColumnType.VARCHAR:
        return `VARCHAR(${length || 255})`
      case ColumnType.TEXT:
        return 'TEXT'
      case ColumnType.BYTEA:
        return engine === DatabaseEngine.MySQL ? 'BLOB' : 'BYTEA'

      // === Date and time types ===
      case ColumnType.DATE:
        return 'DATE'
      case ColumnType.TIME:
        return 'TIME'
      case ColumnType.TIMETZ:
        return engine === DatabaseEngine.MySQL ? 'TIME' : 'TIMETZ'
      case ColumnType.TIMESTAMP:
        return 'TIMESTAMP'
      case ColumnType.TIMESTAMPTZ:
        return engine === DatabaseEngine.MySQL ? 'TIMESTAMP' : 'TIMESTAMPTZ'
      case ColumnType.INTERVAL:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(255)' : 'INTERVAL'

      // === Boolean type ===
      case ColumnType.BOOLEAN:
        return engine === DatabaseEngine.MySQL ? 'TINYINT(1)' : 'BOOLEAN'

      // === Geometric types (PostgreSQL only) ===
      case ColumnType.POINT:
      case ColumnType.LINE:
      case ColumnType.LSEG:
      case ColumnType.BOX:
      case ColumnType.PATH:
      case ColumnType.POLYGON:
      case ColumnType.CIRCLE:
        return engine === DatabaseEngine.MySQL ? 'TEXT' : type

      // === Network types (PostgreSQL only) ===
      case ColumnType.CIDR:
      case ColumnType.INET:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(45)' : type
      case ColumnType.MACADDR:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(17)' : 'MACADDR'
      case ColumnType.MACADDR8:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(23)' : 'MACADDR8'

      // === Bit types ===
      case ColumnType.BIT:
        return `BIT(${length || 1})`
      case ColumnType.VARBIT:
        return engine === DatabaseEngine.MySQL ? `BIT(${length || 64})` : `VARBIT(${length || 64})`

      // === Text search types (PostgreSQL only) ===
      case ColumnType.TSVECTOR:
      case ColumnType.TSQUERY:
        return engine === DatabaseEngine.MySQL ? 'TEXT' : type

      // === JSON types ===
      case ColumnType.JSON:
        return 'JSON'
      case ColumnType.JSONB:
        return engine === DatabaseEngine.MySQL ? 'JSON' : 'JSONB'

      // === Other types ===
      case ColumnType.UUID:
        return engine === DatabaseEngine.MySQL ? 'CHAR(36)' : 'UUID'
      case ColumnType.XML:
        return engine === DatabaseEngine.MySQL ? 'TEXT' : 'XML'

      // === Vector types (PostgreSQL pgvector) ===
      case ColumnType.VECTOR:
      case ColumnType.HALFVEC:
      case ColumnType.SPARSEVEC:
        if (engine === DatabaseEngine.MySQL) return 'JSON'
        return dimension ? `${type}(${dimension})` : type

      default:
        return type
    }
  }

  /**
   * Simplified mapping for SQLite (very limited types)
   */
  const mapColumnTypeForSQLite = (type: ColumnType): string => {
    // SQLite only has 5 types: NULL, INTEGER, REAL, TEXT, BLOB
    switch (type) {
      case ColumnType.SMALLINT:
      case ColumnType.INT:
      case ColumnType.INTEGER:
      case ColumnType.BIGINT:
      case ColumnType.SMALLSERIAL:
      case ColumnType.SERIAL:
      case ColumnType.BIGSERIAL:
      case ColumnType.BOOLEAN:
        return 'INTEGER'

      case ColumnType.DECIMAL:
      case ColumnType.NUMERIC:
      case ColumnType.REAL:
      case ColumnType.DOUBLE_PRECISION:
      case ColumnType.FLOAT:
      case ColumnType.MONEY:
        return 'REAL'

      case ColumnType.BYTEA:
        return 'BLOB'

      default:
        return 'TEXT'
    }
  }

  /**
   * Generates SQL for a column
   * @param column The column to generate
   * @param engine The database engine
   * @param isCompositePk True if the table has a composite PK (multiple PK columns)
   */
  const generateColumnSql = (
    column: Column,
    engine: DatabaseEngine,
    isCompositePk: boolean = false
  ): string => {
    const parts: string[] = []

    // Column name
    parts.push(`  ${column.name}`)

    // Type (with length, precision, scale parameters)
    parts.push(mapColumnType(column, engine))

    // PRIMARY KEY constraints (only for simple PK, not composite)
    if (column.primaryKey && !isCompositePk) {
      if (engine === DatabaseEngine.SQLite && column.type === ColumnType.SERIAL) {
        parts.push('PRIMARY KEY AUTOINCREMENT')
      } else if (engine !== DatabaseEngine.PostgreSQL || column.type !== ColumnType.SERIAL) {
        parts.push('PRIMARY KEY')
      }
    }

    // NOT NULL (for composite PK, PK columns must be NOT NULL)
    if (!column.nullable && !column.primaryKey) {
      parts.push('NOT NULL')
    } else if (column.primaryKey && isCompositePk) {
      // Composite PK: columns must be explicitly NOT NULL
      parts.push('NOT NULL')
    }

    if (column.unique && !column.primaryKey) {
      parts.push('UNIQUE')
    }

    if (column.default) {
      parts.push(`DEFAULT ${column.default}`)
    }

    return parts.join(' ')
  }

  /**
   * Generates SQL to create a table
   */
  const generateTableSql = (table: TableData, engine: DatabaseEngine): string => {
    // Detect if we have a composite PK (multiple PK columns)
    const pkColumns = table.columns.filter(c => c.primaryKey)
    const isCompositePk = pkColumns.length > 1

    // Generate columns with isCompositePk flag
    const columns = table.columns.map(col => generateColumnSql(col, engine, isCompositePk))

    // Add PRIMARY KEY constraint
    if (isCompositePk) {
      // Composite PK: single constraint at the end
      const pkColumnNames = pkColumns.map(c => c.name).join(', ')
      columns.push(`  PRIMARY KEY (${pkColumnNames})`)
    } else if (engine === DatabaseEngine.PostgreSQL) {
      // PostgreSQL with SERIAL: add PK constraint separately
      const pkColumn = pkColumns.find(c => c.type === ColumnType.SERIAL)
      if (pkColumn) {
        columns.push(`  PRIMARY KEY (${pkColumn.name})`)
      }
    }

    return `CREATE TABLE ${table.name} (\n${columns.join(',\n')}\n);`
  }

  /**
   * Generates SQL for a foreign key
   */
  const generateForeignKeySql = (
    relation: Relation,
    tables: TableData[],
    engine: DatabaseEngine
  ): string | null => {
    const sourceTable = tables.find(t => t.id === relation.sourceTableId)
    const targetTable = tables.find(t => t.id === relation.targetTableId)
    const sourceColumn = sourceTable?.columns.find(c => c.id === relation.sourceColumnId)
    const targetColumn = targetTable?.columns.find(c => c.id === relation.targetColumnId)

    if (!sourceTable || !targetTable || !sourceColumn || !targetColumn) {
      return null
    }

    const constraintName = `fk_${sourceTable.name}_${sourceColumn.name}`
    const onDelete = relation.onDelete ? ` ON DELETE ${relation.onDelete}` : ''
    const onUpdate = relation.onUpdate ? ` ON UPDATE ${relation.onUpdate}` : ''

    return `ALTER TABLE ${sourceTable.name}
  ADD CONSTRAINT ${constraintName}
  FOREIGN KEY (${sourceColumn.name})
  REFERENCES ${targetTable.name}(${targetColumn.name})${onDelete}${onUpdate};`
  }

  /**
   * Generates the complete SQL for the project
   */
  const generateSql = (project: Project | null = null): string => {
    const currentProject = project || projectStore.currentProject.value

    if (!currentProject) {
      return '-- No project loaded'
    }

    const { tables, relations, engine } = currentProject
    const lines: string[] = []

    // Header
    lines.push(`-- Generated by DBKeep`)
    lines.push(`-- Database: ${engine}`)
    lines.push(`-- Generated at: ${new Date().toISOString()}`)
    lines.push('')

    // Tables
    if (tables.length > 0) {
      lines.push('-- Tables')
      lines.push('')
      tables.forEach((table) => {
        lines.push(generateTableSql(table, engine))
        lines.push('')
      })
    }

    // Foreign keys
    if (relations.length > 0) {
      lines.push('-- Foreign Keys')
      lines.push('')
      relations.forEach((relation) => {
        const fkSql = generateForeignKeySql(relation, tables, engine)
        if (fkSql) {
          lines.push(fkSql)
          lines.push('')
        }
      })
    }

    return lines.join('\n').trim()
  }

  /**
   * Reactive SQL based on current project
   */
  const sql = computed(() => generateSql())

  return {
    generateSql,
    sql
  }
}
