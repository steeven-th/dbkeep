import { getProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

/**
 * GET /api/projects/:id
 * Récupère un projet spécifique de l'utilisateur connecté (ou invité)
 */
export default defineEventHandler(async (event) => {
  // Obtenir l'ID utilisateur (authentifié ou invité)
  const userId = await requireAuth(event)

  // Récupérer l'ID du projet
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID du projet manquant'
    })
  }

  // Récupérer le projet via le service
  const project = await getProject(projectId, userId)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  return project
})
