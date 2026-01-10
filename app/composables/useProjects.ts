import type { Project } from '~/types/database'
import { DatabaseEngine } from '~/types/database'

/**
 * Type pour un projet dans la liste (sans les données complètes)
 */
export interface ProjectListItem {
  id: string
  name: string
  engine: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Composable pour la gestion persistante des projets
 * Gère les appels API et la synchronisation avec le store local
 */
export const useProjects = () => {
  const projectStore = useProjectStore()
  const canvasStore = useCanvasStore()
  const toast = useToast()
  const { t } = useI18n()

  // Liste des projets de l'utilisateur
  const projects = useState<ProjectListItem[]>('projects-list', () => [])

  // États de chargement (useState pour partager entre composants)
  const isLoadingList = useState<boolean>('projects-loading-list', () => true)
  const isLoadingProject = useState<boolean>('projects-loading-project', () => false)
  const isSaving = useState<boolean>('projects-saving', () => false)
  const hasLoadedOnce = useState<boolean>('projects-loaded-once', () => false)

  // Timestamp de la dernière sauvegarde (pour éviter les doubles saves)
  const lastSaveTime = useState<number>('projects-last-save-time', () => 0)

  /**
   * Charge la liste des projets de l'utilisateur
   */
  const fetchProjects = async () => {
    isLoadingList.value = true
    try {
      const data = await $fetch<ProjectListItem[]>('/api/projects')
      projects.value = data
      return data
    } catch (error: any) {
      toast.add({
        title: t('project.error_load_list'),
        description: error.message,
        color: 'error'
      })
      return []
    } finally {
      isLoadingList.value = false
      hasLoadedOnce.value = true
    }
  }

  /**
   * Crée un nouveau projet et le sauvegarde en BDD
   */
  const createProject = async (name: string, engine: DatabaseEngine) => {
    isSaving.value = true
    try {
      // Créer le projet localement d'abord
      const localProject = projectStore.createProject(name, engine)

      // Préparer les données pour l'API
      const projectData = {
        tables: localProject.tables,
        groups: localProject.groups,
        notes: localProject.notes,
        relations: localProject.relations
      }

      // Sauvegarder en BDD
      const savedProject = await $fetch<any>('/api/projects', {
        method: 'POST',
        body: {
          name,
          engine,
          data: projectData
        }
      })

      // Mettre à jour l'ID du projet local avec celui de la BDD
      projectStore.updateProject({
        id: savedProject.id,
        name: savedProject.name,
        engine: savedProject.engine as DatabaseEngine
      })

      // Synchroniser le canvas
      await canvasStore.syncFromProject(projectStore.currentProject.value!)

      // Rafraîchir la liste des projets
      await fetchProjects()

      toast.add({
        title: t('project.created_success'),
        color: 'success'
      })

      return savedProject
    } catch (error: any) {
      // En cas d'erreur, fermer le projet local
      projectStore.closeProject()

      toast.add({
        title: t('project.error_create'),
        description: error.message,
        color: 'error'
      })
      return null
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Charge un projet depuis la BDD
   */
  const loadProject = async (projectId: string) => {
    isLoadingProject.value = true
    try {
      const data = await $fetch<any>(`/api/projects/${projectId}`)

      // Reconstruire l'objet Project complet
      const project: Project = {
        id: data.id,
        name: data.name,
        engine: data.engine as DatabaseEngine,
        tables: data.data?.tables || [],
        groups: data.data?.groups || [],
        notes: data.data?.notes || [],
        relations: data.data?.relations || [],
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      }

      // Charger dans le store
      projectStore.updateProject(project)

      // Forcer la mise à jour du currentProject
      const currentProject = useState<Project | null>('currentProject')
      currentProject.value = project

      // Synchroniser le canvas
      await canvasStore.syncFromProject(project)

      return project
    } catch (error: any) {
      toast.add({
        title: t('project.error_load'),
        description: error.message,
        color: 'error'
      })
      return null
    } finally {
      isLoadingProject.value = false
    }
  }

  /**
   * Sauvegarde le projet courant en BDD
   * Enrichit les données avec les infos de présentation Vue Flow (positions, parentNode, style)
   */
  const saveProject = async () => {
    const currentProject = projectStore.currentProject.value
    if (!currentProject?.id) return false

    isSaving.value = true
    try {
      // Récupérer les nodes Vue Flow pour enrichir les données
      const nodes = canvasStore.nodes.value

      // Enrichir les tables avec leurs positions et parentNode depuis Vue Flow
      const tablesWithPositions = currentProject.tables.map((table) => {
        const node = nodes.find(n => n.id === table.id)
        return {
          ...table,
          position: node?.position,
          parentNode: node?.parentNode
        }
      })

      // Enrichir les groupes avec leurs positions et styles depuis Vue Flow
      const groupsWithPositions = currentProject.groups.map((group) => {
        const node = nodes.find(n => n.id === group.id)
        return {
          ...group,
          position: node?.position,
          style: node?.style as { width: string; height: string } | undefined
        }
      })

      // Enrichir les notes avec leurs positions et styles depuis Vue Flow
      const notesWithPositions = currentProject.notes.map((note) => {
        const node = nodes.find(n => n.id === note.id)
        return {
          ...note,
          position: node?.position,
          style: node?.style as { width: string; height: string } | undefined
        }
      })

      // Préparer les données
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

      // Rafraîchir la liste
      await fetchProjects()

      // Mettre à jour le timestamp de la dernière sauvegarde
      lastSaveTime.value = Date.now()

      return true
    } catch (error: any) {
      toast.add({
        title: t('project.error_save'),
        description: error.message,
        color: 'error'
      })
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Supprime un projet
   */
  const deleteProject = async (projectId: string) => {
    try {
      await $fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      // Fermer le projet si c'est celui en cours
      if (projectStore.currentProject.value?.id === projectId) {
        projectStore.closeProject()
        canvasStore.clearCanvas()
      }

      // Rafraîchir la liste
      await fetchProjects()

      toast.add({
        title: t('project.deleted_success'),
        color: 'success'
      })

      return true
    } catch (error: any) {
      toast.add({
        title: t('project.error_delete'),
        description: error.message,
        color: 'error'
      })
      return false
    }
  }

  /**
   * Ferme le projet courant (sans supprimer)
   */
  const closeProject = () => {
    projectStore.closeProject()
    canvasStore.clearCanvas()
  }

  return {
    // État
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
