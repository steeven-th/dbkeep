import { deleteProject } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'

/**
 * DELETE /api/projects/:id
 * Deletes a project for the authenticated user (or guest)
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

  // Delete project via service
  const deleted = await deleteProject(projectId, userId)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found'
    })
  }

  return { success: true, id: projectId }
})
