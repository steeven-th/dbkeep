import { z } from 'zod'
import { createProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'
import { getWorkspaceContext, resolveOwner } from '../../utils/workspace'

// Validation schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  engine: z.enum(['PostgreSQL', 'MySQL', 'SQLite']).default('PostgreSQL'),
  data: z.any().optional()
})

/**
 * POST /api/projects
 * Creates a new project for the authenticated user (or guest)
 * Supports optional workspace context for multi-tenant deployments
 */
export default defineEventHandler(async (event) => {
  // Get user ID (authenticated or guest)
  const userId = await requireAuth(event)

  // Get optional workspace context for multi-tenancy
  const workspace = getWorkspaceContext(event)

  // Validate request body
  const body = await readBody(event)
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid data',
      data: parsed.error.flatten()
    })
  }

  // Resolve ownership (workspace or user)
  const { ownerId, ownerType } = resolveOwner(userId, workspace)

  // Create project via service
  return await createProject({
    name: parsed.data.name,
    engine: parsed.data.engine,
    data: parsed.data.data,
    userId,
    ownerId,
    ownerType
  })
})
