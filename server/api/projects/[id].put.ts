import { z } from 'zod'
import { updateProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

// Validation schema for project update
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  engine: z.enum(['PostgreSQL', 'MySQL', 'SQLite']).optional(),
  data: z.any().optional()
})

/**
 * PUT /api/projects/:id
 * Updates a project for the authenticated user (or guest)
 */
export default defineEventHandler(async (event) => {
  // Get user ID (authenticated or guest)
  const userId = await requireAuth(event)

  // Get project ID
  const projectId = getRouterParam(event, 'id')

  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing project ID'
    })
  }

  // Validate body
  const body = await readBody(event)
  const parsed = updateProjectSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid data',
      data: parsed.error.flatten()
    })
  }

  // Update project via service
  const project = await updateProject(projectId, userId, parsed.data)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found'
    })
  }

  return project
})
