import { z } from 'zod'
import { createProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

// Schéma de validation pour la création d'un projet
const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  engine: z.enum(['PostgreSQL', 'MySQL', 'SQLite']).default('PostgreSQL'),
  data: z.any().optional()
})

/**
 * POST /api/projects
 * Crée un nouveau projet pour l'utilisateur connecté (ou invité)
 */
export default defineEventHandler(async (event) => {
  // Obtenir l'ID utilisateur (authentifié ou invité)
  const userId = await requireAuth(event)

  // Valider le body
  const body = await readBody(event)
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données invalides',
      data: parsed.error.flatten()
    })
  }

  // Créer le projet via le service
  return await createProject({
    name: parsed.data.name,
    engine: parsed.data.engine,
    data: parsed.data.data,
    userId
  })
})
