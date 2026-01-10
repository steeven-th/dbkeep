import { deleteProject } from '~~/server/services/projectService'
import { requireAuth } from '~~/server/utils/appMode'

/**
 * DELETE /api/projects/:id
 * Supprime un projet de l'utilisateur connecté (ou invité)
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

  // Supprimer le projet via le service
  const deleted = await deleteProject(projectId, userId)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  return { success: true, id: projectId }
})
