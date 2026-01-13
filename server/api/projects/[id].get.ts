import { getProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

/**
 * GET /api/projects/:id
 * Returns a specific project for the authenticated user (or guest)
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

  // Fetch project via service
  const project = await getProject(projectId, userId)

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found'
    })
  }

  return project
})
