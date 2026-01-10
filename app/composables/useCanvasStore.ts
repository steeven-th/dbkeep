import type { Node, Edge } from '@vue-flow/core'
import type {
  Project,
  TableData,
  GroupData,
  NoteData,
  Relation,
  NodePosition
} from '~/types/database'
import { DEFAULT_TABLE_COLOR, DEFAULT_GROUP_COLOR, DEFAULT_NOTE_COLOR } from '~/types/database'

/**
 * Store pour la gestion de l'état du canvas Vue Flow
 * Gère les nodes (tables, groupes) et edges (relations)
 */
export const useCanvasStore = () => {
  // État des noeuds Vue Flow
  const nodes = useState<Node[]>('canvasNodes', () => [])

  // État des edges Vue Flow
  const edges = useState<Edge[]>('canvasEdges', () => [])

  // Compteur pour les positions par défaut
  const nodeCounter = useState<number>('nodeCounter', () => 0)

  // === Helpers ===

  /**
   * Calcule la prochaine position pour un nouveau noeud
   */
  const getNextNodePosition = (): NodePosition => {
    const offset = nodeCounter.value * 30
    nodeCounter.value++
    return {
      x: 100 + offset,
      y: 100 + offset
    }
  }

  // === Synchronisation avec le Project Store ===

  /**
   * Synchronise l'état du canvas depuis un projet
   * Restaure les positions, parentNode et styles sauvegardés
   */
  const syncFromProject = async (project: Project) => {
    nodeCounter.value = 0

    // Construire tous les nodes avec parentNode directement inclus
    const allNodes: Node[] = []

    // Ajouter les groupes d'abord
    project.groups.forEach((group, index) => {
      const position = group.position || {
        x: 50 + index * 450,
        y: 50
      }
      const node = createGroupNode(group, position)

      if (group.style) {
        node.style = group.style
      }

      allNodes.push(node)
    })

    // Ajouter les notes (zIndex 500 : entre groupes et tables)
    if (project.notes) {
      project.notes.forEach((note, index) => {
        const position = note.position || {
          x: 50 + index * 250,
          y: 200
        }
        const node = createNoteNode(note, position)

        if (note.style) {
          node.style = note.style
        }

        allNodes.push(node)
      })
    }

    // Ajouter les tables avec parentNode
    project.tables.forEach((table, index) => {
      const position = table.position || {
        x: 100 + index * 300,
        y: 150
      }

      // Créer le node avec parentNode directement dans l'objet
      const node: Node = {
        id: table.id,
        type: 'dbTable',
        position,
        data: table,
        zIndex: 1000,
        ...(table.parentNode ? { parentNode: table.parentNode } : {})
      }

      allNodes.push(node)
    })

    // Créer les edges
    const newEdges: Edge[] = []
    project.relations.forEach((relation) => {
      const sourceNode = allNodes.find(n => n.id === relation.sourceTableId)
      const targetNode = allNodes.find(n => n.id === relation.targetTableId)

      if (sourceNode && targetNode) {
        newEdges.push({
          id: relation.id,
          type: 'relation',
          source: relation.sourceTableId,
          target: relation.targetTableId,
          sourceHandle: `${relation.sourceColumnId}-source`,
          targetHandle: `${relation.targetColumnId}-target`,
          data: relation
        })
      }
    })

    // Assigner en une seule fois
    nodes.value = allNodes
    edges.value = newEdges
  }

  /**
   * Met à jour uniquement les données des tables sans recréer les nodes
   * Préserve les positions et parentNode existants
   */
  const updateTablesData = (tables: TableData[]) => {
    // Modifier directement les propriétés data des nodes existants
    // Sans toucher au tableau lui-même pour éviter que Vue Flow réagisse
    for (const node of nodes.value) {
      if (node.type === 'dbTable') {
        const updatedTable = tables.find(t => t.id === node.id)
        if (updatedTable) {
          // Mettre à jour les propriétés de data une par une
          Object.assign(node.data, updatedTable)
        }
      }
    }
  }

  /**
   * Met à jour les edges depuis les relations
   */
  const updateEdgesFromRelations = (relations: import('~/types/database').Relation[]) => {
    const newEdges: Edge[] = relations.map(relation => ({
      id: relation.id,
      type: 'relation',
      source: relation.sourceTableId,
      target: relation.targetTableId,
      sourceHandle: `${relation.sourceColumnId}-source`,
      targetHandle: `${relation.targetColumnId}-target`,
      data: relation
    })).filter(edge => {
      // Vérifier que les nodes source et target existent
      return nodes.value.some(n => n.id === edge.source) &&
             nodes.value.some(n => n.id === edge.target)
    })

    edges.value = newEdges
  }

  // === Actions Nodes ===

  /**
   * Crée un noeud table Vue Flow
   * zIndex élevé pour que les tables soient toujours au-dessus des groupes
   */
  const createTableNode = (table: TableData, position?: NodePosition): Node => ({
    id: table.id,
    type: 'dbTable',
    position: position || getNextNodePosition(),
    data: table,
    zIndex: 1000
  })

  /**
   * Crée un noeud groupe Vue Flow
   * zIndex bas pour que les groupes soient toujours derrière les tables
   */
  const createGroupNode = (group: GroupData, position?: NodePosition): Node => ({
    id: group.id,
    type: 'dbGroup',
    position: position || getNextNodePosition(),
    data: group,
    zIndex: 0,
    style: {
      width: '400px',
      height: '300px'
    }
  })

  /**
   * Crée un noeud note Vue Flow
   * zIndex intermédiaire (500) pour être devant les groupes mais derrière les tables
   */
  const createNoteNode = (note: NoteData, position?: NodePosition): Node => ({
    id: note.id,
    type: 'dbNote',
    position: position || getNextNodePosition(),
    data: note,
    zIndex: 500,
    style: {
      width: '200px',
      height: '150px'
    }
  })

  /**
   * Ajoute un noeud table au canvas
   */
  const addTableNode = (table: TableData, position?: NodePosition): Node => {
    const node = createTableNode(table, position)
    nodes.value.push(node)
    return node
  }

  /**
   * Ajoute un noeud groupe au canvas
   */
  const addGroupNode = (group: GroupData, position?: NodePosition): Node => {
    const node = createGroupNode(group, position)
    nodes.value.push(node)
    return node
  }

  /**
   * Ajoute un noeud note au canvas
   */
  const addNoteNode = (note: NoteData, position?: NodePosition): Node => {
    const node = createNoteNode(note, position)
    nodes.value.push(node)
    return node
  }

  /**
   * Met à jour la position d'un noeud
   * Force la réactivité en réassignant le tableau pour que Vue Flow détecte le changement
   */
  const updateNodePosition = (nodeId: string, position: NodePosition) => {
    nodes.value = nodes.value.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          position
        }
      }
      return node
    })
  }

  /**
   * Met à jour les données d'un noeud
   * Force la réactivité en réassignant le tableau pour que Vue Flow détecte le changement
   */
  const updateNodeData = (nodeId: string, data: Partial<TableData | GroupData>) => {
    const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
    if (nodeIndex !== -1) {
      // Créer un nouveau tableau pour forcer Vue Flow à détecter le changement
      nodes.value = nodes.value.map((node, index) => {
        if (index === nodeIndex) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          }
        }
        return node
      })
    }
  }

  /**
   * Met à jour le style d'un noeud (pour les groupes redimensionnés)
   * Force la réactivité en réassignant le tableau pour que Vue Flow détecte le changement
   */
  const updateNodeStyle = (nodeId: string, style: Record<string, string>) => {
    nodes.value = nodes.value.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          style: {
            ...node.style,
            ...style
          }
        }
      }
      return node
    })
  }

  /**
   * Supprime un noeud du canvas
   */
  const removeNode = (nodeId: string) => {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)

    // Supprimer aussi les edges connectés à ce noeud
    edges.value = edges.value.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )
  }

  /**
   * Assigne un noeud à un groupe (nested nodes)
   * Force la réactivité en réassignant le tableau pour que Vue Flow détecte le changement
   * Note: On n'utilise pas extent: 'parent' pour permettre de sortir la table du groupe en la déplaçant
   */
  const assignToGroup = (nodeId: string, groupId: string | null) => {
    nodes.value = nodes.value.map((node) => {
      if (node.id === nodeId) {
        if (groupId) {
          return {
            ...node,
            parentNode: groupId
          }
        } else {
          // Retirer du groupe
          const { parentNode, extent, ...rest } = node
          return rest as Node
        }
      }
      return node
    })
  }

  /**
   * Récupère un noeud par son ID
   */
  const getNode = (nodeId: string): Node | undefined => {
    return nodes.value.find(n => n.id === nodeId)
  }

  /**
   * Récupère tous les noeuds enfants d'un groupe
   */
  const getGroupChildren = (groupId: string): Node[] => {
    return nodes.value.filter(n => n.parentNode === groupId)
  }

  // === Actions Edges ===

  /**
   * Crée un edge relation Vue Flow
   */
  const createRelationEdge = (relation: Relation): Edge | null => {
    // Vérifier que les tables existent
    const sourceNode = nodes.value.find(n => n.id === relation.sourceTableId)
    const targetNode = nodes.value.find(n => n.id === relation.targetTableId)

    if (!sourceNode || !targetNode) return null

    return {
      id: relation.id,
      type: 'relation',
      source: relation.sourceTableId,
      target: relation.targetTableId,
      sourceHandle: `${relation.sourceColumnId}-source`,
      targetHandle: `${relation.targetColumnId}-target`,
      data: relation
    }
  }

  /**
   * Ajoute un edge au canvas
   */
  const addEdge = (relation: Relation): Edge | null => {
    const edge = createRelationEdge(relation)
    if (edge) {
      edges.value.push(edge)
    }
    return edge
  }

  /**
   * Met à jour un edge existant
   * Force la réactivité en réassignant le tableau pour que Vue Flow détecte le changement
   */
  const updateEdge = (edgeId: string, updates: Partial<Relation>) => {
    edges.value = edges.value.map((edge) => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            ...updates
          }
        }
      }
      return edge
    })
  }

  /**
   * Supprime un edge du canvas
   */
  const removeEdge = (edgeId: string) => {
    edges.value = edges.value.filter(e => e.id !== edgeId)
  }

  /**
   * Récupère un edge par son ID
   */
  const getEdge = (edgeId: string): Edge | undefined => {
    return edges.value.find(e => e.id === edgeId)
  }

  // === Actions Batch ===

  /**
   * Réinitialise complètement le canvas
   */
  const clearCanvas = () => {
    nodes.value = []
    edges.value = []
    nodeCounter.value = 0
  }

  /**
   * Applique les changements de nodes depuis Vue Flow
   */
  const applyNodeChanges = (changes: Node[]) => {
    nodes.value = changes
  }

  /**
   * Applique les changements d'edges depuis Vue Flow
   */
  const applyEdgeChanges = (changes: Edge[]) => {
    edges.value = changes
  }

  return {
    // État
    nodes,
    edges,

    // Synchronisation
    syncFromProject,
    updateTablesData,
    updateEdgesFromRelations,

    // Actions Nodes
    addTableNode,
    addGroupNode,
    addNoteNode,
    updateNodePosition,
    updateNodeData,
    updateNodeStyle,
    removeNode,
    assignToGroup,
    getNode,
    getGroupChildren,

    // Actions Edges
    addEdge,
    updateEdge,
    removeEdge,
    getEdge,

    // Actions Batch
    clearCanvas,
    applyNodeChanges,
    applyEdgeChanges,

    // Helpers
    getNextNodePosition
  }
}
