import { listProjects } from '../../services/projectService'
import { requireAuth } from '../../utils/appMode'
import { getWorkspaceContext } from '../../utils/workspace'

/**
 * GET /api/projects
 * Returns the list of projects for the authenticated user (or guest)
 * Supports optional workspace filtering for multi-tenant deployments
 */
export default defineEventHandler(async (event) => {
  // Get user ID (authenticated or guest)
  const userId = await requireAuth(event)

  // Get optional workspace context for multi-tenancy
  const workspace = getWorkspaceContext(event)

  // Fetch projects via service
  return await listProjects({
    userId,
    workspaceId: workspace.id,
    workspaceType: workspace.type
  })
})
