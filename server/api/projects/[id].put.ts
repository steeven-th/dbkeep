import { z } from 'zod'
import { updateProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

// Schéma de validation pour la mise à jour d'un projet
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  engine: z.enum(['PostgreSQL', 'MySQL', 'SQLite']).optional(),
  data: z.any().optional()
})

/**
 * PUT /api/projects/:id
 * Met à jour un projet de l'utilisateur connecté (ou invité)
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

  // Valider le body
  const body = await readBody(event)
  const parsed = updateProjectSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données invalides',
      data: parsed.error.flatten()
    })
  }

  // Mettre à jour le projet via le service
  const project = await updateProject(projectId, userId, parsed.data)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Projet non trouvé'
    })
  }

  return project
})
