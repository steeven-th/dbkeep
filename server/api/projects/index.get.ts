import { listProjects } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

/**
 * GET /api/projects
 * Récupère la liste des projets de l'utilisateur connecté (ou invité)
 */
export default defineEventHandler(async (event) => {
  // Obtenir l'ID utilisateur (authentifié ou invité)
  const userId = await requireAuth(event)

  // Récupérer les projets via le service
  return await listProjects(userId)
})
