import type { Node, Edge } from '@vue-flow/core'
import type {
  Project,
  TableData,
  GroupData,
  NoteData,
  Relation,
  NodePosition
} from '~/types/database'
// Colors are used implicitly via the types but not directly in this file

/**
 * Store for managing Vue Flow canvas state
 * Manages nodes (tables, groups) and edges (relations)
 */
export const useCanvasStore = () => {
  // Vue Flow nodes state
  const nodes = useState<Node[]>('canvasNodes', () => [])

  // Vue Flow edges state
  const edges = useState<Edge[]>('canvasEdges', () => [])

  // Counter for default positions
  const nodeCounter = useState<number>('nodeCounter', () => 0)

  // === Helpers ===

  /**
   * Builds source handle ID from a relation
   * Format: columnId-side-source
   */
  const buildSourceHandle = (relation: Relation): string => {
    const side = relation.sourceHandlePosition || 'right'
    return `${relation.sourceColumnId}-${side}-source`
  }

  /**
   * Builds target handle ID from a relation
   * Format: columnId-side-target
   */
  const buildTargetHandle = (relation: Relation): string => {
    const side = relation.targetHandlePosition || 'left'
    return `${relation.targetColumnId}-${side}-target`
  }

  /**
   * Calculates the next position for a new node
   */
  const getNextNodePosition = (): NodePosition => {
    const offset = nodeCounter.value * 30
    nodeCounter.value++
    return {
      x: 100 + offset,
      y: 100 + offset
    }
  }

  // === Project Store Synchronization ===

  /**
   * Synchronizes canvas state from a project
   * Restores saved positions, parentNode and styles
   */
  const syncFromProject = async (project: Project) => {
    nodeCounter.value = 0

    // Build all nodes with parentNode directly included
    const allNodes: Node[] = []

    // Add groups first
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

    // Add notes (zIndex 500: between groups and tables)
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

    // Add tables with parentNode
    project.tables.forEach((table, index) => {
      const position = table.position || {
        x: 100 + index * 300,
        y: 150
      }

      // Create node with parentNode directly in the object
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

    // Create edges
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
          sourceHandle: buildSourceHandle(relation),
          targetHandle: buildTargetHandle(relation),
          data: relation,
          zIndex: 1001 // Above tables (1000) and groups (0)
        })
      }
    })

    // Assign all at once
    nodes.value = allNodes
    edges.value = newEdges
  }

  /**
   * Updates only table data without recreating nodes
   * Preserves existing positions and parentNode
   */
  const updateTablesData = (tables: TableData[]) => {
    // Directly modify data properties of existing nodes
    // Without touching the array itself to prevent Vue Flow from reacting
    for (const node of nodes.value) {
      if (node.type === 'dbTable') {
        const updatedTable = tables.find(t => t.id === node.id)
        if (updatedTable) {
          // Update data properties one by one
          Object.assign(node.data, updatedTable)
        }
      }
    }
  }

  /**
   * Updates edges from relations
   */
  const updateEdgesFromRelations = (relations: import('~/types/database').Relation[]) => {
    const newEdges: Edge[] = relations.map(relation => ({
      id: relation.id,
      type: 'relation',
      source: relation.sourceTableId,
      target: relation.targetTableId,
      sourceHandle: buildSourceHandle(relation),
      targetHandle: buildTargetHandle(relation),
      data: relation,
      zIndex: 1001 // Above tables (1000) and groups (0)
    })).filter((edge) => {
      // Verify that source and target nodes exist
      return nodes.value.some(n => n.id === edge.source)
        && nodes.value.some(n => n.id === edge.target)
    })

    edges.value = newEdges
  }

  // === Node Actions ===

  /**
   * Creates a Vue Flow table node
   * High zIndex so tables are always above groups
   */
  const createTableNode = (table: TableData, position?: NodePosition): Node => ({
    id: table.id,
    type: 'dbTable',
    position: position || getNextNodePosition(),
    data: table,
    zIndex: 1000
  })

  /**
   * Creates a Vue Flow group node
   * Low zIndex so groups are always behind tables
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
   * Creates a Vue Flow note node
   * Intermediate zIndex (500) to be in front of groups but behind tables
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
   * Adds a table node to the canvas
   */
  const addTableNode = (table: TableData, position?: NodePosition): Node => {
    const node = createTableNode(table, position)
    nodes.value.push(node)
    return node
  }

  /**
   * Adds a group node to the canvas
   */
  const addGroupNode = (group: GroupData, position?: NodePosition): Node => {
    const node = createGroupNode(group, position)
    nodes.value.push(node)
    return node
  }

  /**
   * Adds a note node to the canvas
   */
  const addNoteNode = (note: NoteData, position?: NodePosition): Node => {
    const node = createNoteNode(note, position)
    nodes.value.push(node)
    return node
  }

  /**
   * Updates a node's position
   * Forces reactivity by reassigning the array so Vue Flow detects the change
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
   * Updates a node's data
   * Forces reactivity by reassigning the array so Vue Flow detects the change
   */
  const updateNodeData = (nodeId: string, data: Partial<TableData | GroupData>) => {
    const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
    if (nodeIndex !== -1) {
      // Create a new array to force Vue Flow to detect the change
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
   * Updates a node's style (for resized groups)
   * Forces reactivity by reassigning the array so Vue Flow detects the change
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
   * Removes a node from the canvas
   */
  const removeNode = (nodeId: string) => {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)

    // Also remove edges connected to this node
    edges.value = edges.value.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )
  }

  /**
   * Assigns a node to a group (nested nodes)
   * Forces reactivity by reassigning the array so Vue Flow detects the change
   * Note: We don't use extent: 'parent' to allow moving the table out of the group by dragging
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
          // Remove from group
          const { parentNode, extent, ...rest } = node
          return rest as Node
        }
      }
      return node
    })
  }

  /**
   * Gets a node by its ID
   */
  const getNode = (nodeId: string): Node | undefined => {
    return nodes.value.find(n => n.id === nodeId)
  }

  /**
   * Gets all child nodes of a group
   */
  const getGroupChildren = (groupId: string): Node[] => {
    return nodes.value.filter(n => n.parentNode === groupId)
  }

  // === Edge Actions ===

  /**
   * Creates a Vue Flow relation edge
   */
  const createRelationEdge = (relation: Relation): Edge | null => {
    // Verify that tables exist
    const sourceNode = nodes.value.find(n => n.id === relation.sourceTableId)
    const targetNode = nodes.value.find(n => n.id === relation.targetTableId)

    if (!sourceNode || !targetNode) return null

    return {
      id: relation.id,
      type: 'relation',
      source: relation.sourceTableId,
      target: relation.targetTableId,
      sourceHandle: buildSourceHandle(relation),
      targetHandle: buildTargetHandle(relation),
      data: relation,
      zIndex: 1001 // Above tables (1000) and groups (0)
    }
  }

  /**
   * Adds an edge to the canvas
   */
  const addEdge = (relation: Relation): Edge | null => {
    const edge = createRelationEdge(relation)
    if (edge) {
      edges.value.push(edge)
    }
    return edge
  }

  /**
   * Updates an existing edge
   * Forces reactivity by reassigning the array so Vue Flow detects the change
   */
  const updateEdge = (edgeId: string, updates: Partial<Relation>) => {
    edges.value = edges.value.map((edge) => {
      if (edge.id === edgeId) {
        const newData = { ...edge.data, ...updates } as Relation
        const sourceSide = newData.sourceHandlePosition || 'right'
        const targetSide = newData.targetHandlePosition || 'left'
        return {
          ...edge,
          source: newData.sourceTableId,
          target: newData.targetTableId,
          sourceHandle: `${newData.sourceColumnId}-${sourceSide}-source`,
          targetHandle: `${newData.targetColumnId}-${targetSide}-target`,
          data: newData
        }
      }
      return edge
    })
  }

  /**
   * Removes an edge from the canvas
   */
  const removeEdge = (edgeId: string) => {
    edges.value = edges.value.filter(e => e.id !== edgeId)
  }

  /**
   * Gets an edge by its ID
   */
  const getEdge = (edgeId: string): Edge | undefined => {
    return edges.value.find(e => e.id === edgeId)
  }

  // === Batch Actions ===

  /**
   * Completely resets the canvas
   */
  const clearCanvas = () => {
    nodes.value = []
    edges.value = []
    nodeCounter.value = 0
  }

  /**
   * Applies node changes from Vue Flow
   */
  const applyNodeChanges = (changes: Node[]) => {
    nodes.value = changes
  }

  /**
   * Applies edge changes from Vue Flow
   */
  const applyEdgeChanges = (changes: Edge[]) => {
    edges.value = changes
  }

  return {
    // State
    nodes,
    edges,

    // Synchronization
    syncFromProject,
    updateTablesData,
    updateEdgesFromRelations,

    // Node Actions
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

    // Edge Actions
    addEdge,
    updateEdge,
    removeEdge,
    getEdge,

    // Batch Actions
    clearCanvas,
    applyNodeChanges,
    applyEdgeChanges,

    // Helpers
    getNextNodePosition
  }
}
