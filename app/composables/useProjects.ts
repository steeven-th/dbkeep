import type { Project } from '~/types/database'
import { DatabaseEngine } from '~/types/database'

/**
 * Type for a project in the list (without full data)
 */
export interface ProjectListItem {
  id: string
  name: string
  engine: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Composable for persistent project management
 * Handles API calls and synchronization with local store
 */
export const useProjects = () => {
  const projectStore = useProjectStore()
  const canvasStore = useCanvasStore()
  const toast = useToast()
  const { t } = useI18n()
  const { parseError } = useAppError()
  const { user } = useAuth()

  // User's project list
  const projects = useState<ProjectListItem[]>('projects-list', () => [])

  // Loading states (useState to share between components)
  const isLoadingList = useState<boolean>('projects-loading-list', () => true)
  const isLoadingProject = useState<boolean>('projects-loading-project', () => false)
  const isSaving = useState<boolean>('projects-saving', () => false)
  const hasLoadedOnce = useState<boolean>('projects-loaded-once', () => false)

  // Last save timestamp (to avoid double saves)
  const lastSaveTime = useState<number>('projects-last-save-time', () => 0)

  /**
   * Loads the user's project list
   */
  const fetchProjects = async () => {
    isLoadingList.value = true
    try {
      const data = await $fetch<ProjectListItem[]>('/api/projects')
      projects.value = data
      return data
    } catch (error: unknown) {
      toast.add({
        title: t('project.error_load_list'),
        description: parseError(error).message,
        color: 'error'
      })
      return []
    } finally {
      isLoadingList.value = false
      hasLoadedOnce.value = true
    }
  }

  /**
   * Creates a new project and saves it to database
   * @param name Project name
   * @param engine Database engine
   * @param initialData Optional initial data for import
   */
  const createProject = async (
    name: string,
    engine: DatabaseEngine,
    initialData?: {
      tables?: Project['tables']
      groups?: Project['groups']
      notes?: Project['notes']
      relations?: Project['relations']
    }
  ) => {
    isSaving.value = true
    try {
      // Create project locally first
      const localProject = projectStore.createProject(name, engine)

      // Use initial data if provided (for import), otherwise use local project data
      const projectData = {
        tables: initialData?.tables ?? localProject.tables,
        groups: initialData?.groups ?? localProject.groups,
        notes: initialData?.notes ?? localProject.notes,
        relations: initialData?.relations ?? localProject.relations
      }

      // Save to database
      const savedProject = await $fetch<any>('/api/projects', {
        method: 'POST',
        body: {
          name,
          engine,
          data: projectData
        }
      })

      // Update local project with database ID and imported data
      projectStore.updateProject({
        id: savedProject.id,
        name: savedProject.name,
        engine: savedProject.engine as DatabaseEngine,
        tables: projectData.tables,
        groups: projectData.groups,
        notes: projectData.notes,
        relations: projectData.relations
      })

      // Sync canvas with the updated project
      await canvasStore.syncFromProject(projectStore.currentProject.value!)

      // Refresh project list
      await fetchProjects()

      toast.add({
        title: t('project.created_success'),
        color: 'success'
      })

      return savedProject
    } catch (error: unknown) {
      // On error, close local project
      projectStore.closeProject()

      toast.add({
        title: t('project.error_create'),
        description: parseError(error).message,
        color: 'error'
      })
      return null
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Loads a project from database
   */
  const loadProject = async (projectId: string) => {
    isLoadingProject.value = true
    try {
      const data = await $fetch<any>(`/api/projects/${projectId}`)

      // Rebuild complete Project object
      const project: Project = {
        id: data.id,
        name: data.name,
        engine: data.engine as DatabaseEngine,
        tables: data.data?.tables || [],
        groups: data.data?.groups || [],
        notes: data.data?.notes || [],
        relations: data.data?.relations || [],
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        // Ownership fields (for multi-tenant deployments)
        ownerType: data.ownerType,
        ownerId: data.ownerId
      }

      // Load into store
      projectStore.updateProject(project)

      // Force currentProject update
      const currentProject = useState<Project | null>('currentProject')
      currentProject.value = project

      // Sync canvas
      await canvasStore.syncFromProject(project)

      return project
    } catch (error: unknown) {
      toast.add({
        title: t('project.error_load'),
        description: parseError(error).message,
        color: 'error'
      })
      return null
    } finally {
      isLoadingProject.value = false
    }
  }

  /**
   * Saves current project to database
   * Enriches data with Vue Flow presentation info (positions, parentNode, style)
   */
  const saveProject = async () => {
    const currentProject = projectStore.currentProject.value
    if (!currentProject?.id) return false

    isSaving.value = true
    try {
      // Get Vue Flow nodes to enrich data
      const nodes = canvasStore.nodes.value

      // Enrich tables with their positions and parentNode from Vue Flow
      const tablesWithPositions = currentProject.tables.map((table) => {
        const node = nodes.find(n => n.id === table.id)
        return {
          ...table,
          position: node?.position,
          parentNode: node?.parentNode
        }
      })

      // Enrich groups with their positions and styles from Vue Flow
      const groupsWithPositions = currentProject.groups.map((group) => {
        const node = nodes.find(n => n.id === group.id)
        return {
          ...group,
          position: node?.position,
          style: node?.style as { width: string; height: string } | undefined
        }
      })

      // Enrich notes with their positions and styles from Vue Flow
      const notesWithPositions = currentProject.notes.map((note) => {
        const node = nodes.find(n => n.id === note.id)
        return {
          ...note,
          position: node?.position,
          style: node?.style as { width: string; height: string } | undefined
        }
      })

      // Prepare data
      const projectData = {
        tables: tablesWithPositions,
        groups: groupsWithPositions,
        notes: notesWithPositions,
        relations: currentProject.relations
      }

      await $fetch(`/api/projects/${currentProject.id}`, {
        method: 'PUT',
        body: {
          name: currentProject.name,
          engine: currentProject.engine,
          data: projectData
        }
      })

      // Refresh list
      await fetchProjects()

      // Update last save timestamp
      lastSaveTime.value = Date.now()

      return true
    } catch (error: unknown) {
      toast.add({
        title: t('project.error_save'),
        description: parseError(error).message,
        color: 'error'
      })
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Deletes a project
   */
  const deleteProject = async (projectId: string) => {
    try {
      await $fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      // Close project if it's the current one
      if (projectStore.currentProject.value?.id === projectId) {
        projectStore.closeProject()
        canvasStore.clearCanvas()
      }

      // Refresh list
      await fetchProjects()

      toast.add({
        title: t('project.deleted_success'),
        color: 'success'
      })

      return true
    } catch (error: unknown) {
      toast.add({
        title: t('project.error_delete'),
        description: parseError(error).message,
        color: 'error'
      })
      return false
    }
  }

  /**
   * Closes current project (without deleting)
   */
  const closeProject = () => {
    projectStore.closeProject()
    canvasStore.clearCanvas()
  }

  /**
   * Resets the project list (used when user changes)
   */
  const resetProjectsList = () => {
    projects.value = []
    hasLoadedOnce.value = false
  }

  // Reset projects when user changes or logs out
  watch(
    () => user.value,
    (newUser, oldUser) => {
      // Logout: clear everything
      if (!newUser) {
        resetProjectsList()
        return
      }

      // User changed: reset and let the page reload
      if (oldUser && oldUser.id !== newUser.id) {
        resetProjectsList()
      }
    }
  )

  return {
    // State
    projects: readonly(projects),
    isLoadingList,
    isLoadingProject,
    isSaving,
    hasLoadedOnce,
    lastSaveTime,

    // Actions
    fetchProjects,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    closeProject
  }
}
