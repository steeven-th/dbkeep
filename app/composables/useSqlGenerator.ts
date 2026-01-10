import type { Project, TableData, Column, Relation } from '~/types/database'
import { DatabaseEngine, ColumnType } from '~/types/database'

/**
 * Composable pour générer le SQL à partir d'un projet
 */
export const useSqlGenerator = () => {
  const projectStore = useProjectStore()

  /**
   * Mappe un type de colonne vers le type SQL du moteur
   * Utilise les paramètres de la colonne (length, precision, scale, dimension) si définis
   */
  const mapColumnType = (column: Column, engine: DatabaseEngine): string => {
    const { type, length, precision, scale, dimension } = column

    // SQLite a des types très simplifiés
    if (engine === DatabaseEngine.SQLite) {
      return mapColumnTypeForSQLite(type)
    }

    // PostgreSQL et MySQL
    switch (type) {
      // === Types numériques ===
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

      // === Types auto-incrémentation ===
      case ColumnType.SMALLSERIAL:
        return engine === DatabaseEngine.MySQL ? 'SMALLINT AUTO_INCREMENT' : 'SMALLSERIAL'
      case ColumnType.SERIAL:
        return engine === DatabaseEngine.MySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'
      case ColumnType.BIGSERIAL:
        return engine === DatabaseEngine.MySQL ? 'BIGINT AUTO_INCREMENT' : 'BIGSERIAL'

      // === Types chaînes de caractères ===
      case ColumnType.CHAR:
        return `CHAR(${length || 1})`
      case ColumnType.VARCHAR:
        return `VARCHAR(${length || 255})`
      case ColumnType.TEXT:
        return 'TEXT'
      case ColumnType.BYTEA:
        return engine === DatabaseEngine.MySQL ? 'BLOB' : 'BYTEA'

      // === Types date et heure ===
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

      // === Type booléen ===
      case ColumnType.BOOLEAN:
        return engine === DatabaseEngine.MySQL ? 'TINYINT(1)' : 'BOOLEAN'

      // === Types géométriques (PostgreSQL uniquement) ===
      case ColumnType.POINT:
      case ColumnType.LINE:
      case ColumnType.LSEG:
      case ColumnType.BOX:
      case ColumnType.PATH:
      case ColumnType.POLYGON:
      case ColumnType.CIRCLE:
        return engine === DatabaseEngine.MySQL ? 'TEXT' : type

      // === Types réseau (PostgreSQL uniquement) ===
      case ColumnType.CIDR:
      case ColumnType.INET:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(45)' : type
      case ColumnType.MACADDR:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(17)' : 'MACADDR'
      case ColumnType.MACADDR8:
        return engine === DatabaseEngine.MySQL ? 'VARCHAR(23)' : 'MACADDR8'

      // === Types bits ===
      case ColumnType.BIT:
        return `BIT(${length || 1})`
      case ColumnType.VARBIT:
        return engine === DatabaseEngine.MySQL ? `BIT(${length || 64})` : `VARBIT(${length || 64})`

      // === Types recherche texte (PostgreSQL uniquement) ===
      case ColumnType.TSVECTOR:
      case ColumnType.TSQUERY:
        return engine === DatabaseEngine.MySQL ? 'TEXT' : type

      // === Types JSON ===
      case ColumnType.JSON:
        return 'JSON'
      case ColumnType.JSONB:
        return engine === DatabaseEngine.MySQL ? 'JSON' : 'JSONB'

      // === Autres types ===
      case ColumnType.UUID:
        return engine === DatabaseEngine.MySQL ? 'CHAR(36)' : 'UUID'
      case ColumnType.XML:
        return engine === DatabaseEngine.MySQL ? 'TEXT' : 'XML'

      // === Types vecteurs (PostgreSQL pgvector) ===
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
   * Mapping simplifié pour SQLite (types très limités)
   */
  const mapColumnTypeForSQLite = (type: ColumnType): string => {
    // SQLite n'a que 5 types : NULL, INTEGER, REAL, TEXT, BLOB
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
   * Génère le SQL pour une colonne
   * @param column La colonne à générer
   * @param engine Le moteur de base de données
   * @param isCompositePk True si la table a une PK composée (plusieurs colonnes PK)
   */
  const generateColumnSql = (
    column: Column,
    engine: DatabaseEngine,
    isCompositePk: boolean = false
  ): string => {
    const parts: string[] = []

    // Nom de la colonne
    parts.push(`  ${column.name}`)

    // Type (avec paramètres length, precision, scale)
    parts.push(mapColumnType(column, engine))

    // Contraintes PRIMARY KEY (seulement si PK simple, pas composite)
    if (column.primaryKey && !isCompositePk) {
      if (engine === DatabaseEngine.SQLite && column.type === ColumnType.SERIAL) {
        parts.push('PRIMARY KEY AUTOINCREMENT')
      } else if (engine !== DatabaseEngine.PostgreSQL || column.type !== ColumnType.SERIAL) {
        parts.push('PRIMARY KEY')
      }
    }

    // NOT NULL (si PK composée, les colonnes PK doivent être NOT NULL)
    if (!column.nullable && !column.primaryKey) {
      parts.push('NOT NULL')
    } else if (column.primaryKey && isCompositePk) {
      // PK composée : les colonnes doivent être NOT NULL explicitement
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
   * Génère le SQL pour créer une table
   */
  const generateTableSql = (table: TableData, engine: DatabaseEngine): string => {
    // Détecter si on a une PK composée (plusieurs colonnes PK)
    const pkColumns = table.columns.filter(c => c.primaryKey)
    const isCompositePk = pkColumns.length > 1

    // Générer les colonnes avec le flag isCompositePk
    const columns = table.columns.map(col => generateColumnSql(col, engine, isCompositePk))

    // Ajouter la contrainte PRIMARY KEY
    if (isCompositePk) {
      // PK composée : une seule contrainte à la fin
      const pkColumnNames = pkColumns.map(c => c.name).join(', ')
      columns.push(`  PRIMARY KEY (${pkColumnNames})`)
    } else if (engine === DatabaseEngine.PostgreSQL) {
      // PostgreSQL avec SERIAL : ajouter la contrainte PK séparément
      const pkColumn = pkColumns.find(c => c.type === ColumnType.SERIAL)
      if (pkColumn) {
        columns.push(`  PRIMARY KEY (${pkColumn.name})`)
      }
    }

    return `CREATE TABLE ${table.name} (\n${columns.join(',\n')}\n);`
  }

  /**
   * Génère le SQL pour une clé étrangère
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
   * Génère le SQL complet du projet
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
   * SQL réactif basé sur le projet courant
   */
  const sql = computed(() => generateSql())

  return {
    generateSql,
    sql
  }
}
