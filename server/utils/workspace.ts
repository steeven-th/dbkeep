import type { H3Event } from 'h3'

/**
 * Workspace context for multi-tenancy support
 *
 * This module provides an extension point for workspace/organization filtering.
 * In standalone mode, these values are undefined and the API returns user's personal projects.
 * Extended deployments can inject workspace context via HTTP headers.
 */

export interface WorkspaceContext {
  /** Workspace/organization ID for filtering (undefined in standalone mode) */
  id: string | undefined
  /** Type of workspace: 'user' for personal, 'team' for organization */
  type: 'user' | 'team' | undefined
}

/**
 * Extracts optional workspace context from request headers
 *
 * Extension point: allows multi-tenant deployments to filter projects
 * by workspace/organization. When headers are not present, returns
 * undefined values and the API falls back to user-based filtering.
 *
 * @param event - H3 event object
 * @returns Workspace context (may have undefined values)
 */
export function getWorkspaceContext(event: H3Event): WorkspaceContext {
  return {
    id: getHeader(event, 'x-workspace-id') || undefined,
    type: getHeader(event, 'x-workspace-type') as 'user' | 'team' | undefined
  }
}

/**
 * Determines the owner for a new resource
 *
 * If workspace context is provided, uses workspace as owner.
 * Otherwise, falls back to the user ID.
 *
 * @param userId - Current user ID
 * @param workspace - Workspace context
 * @returns Owner ID and type
 */
export function resolveOwner(
  userId: string,
  workspace: WorkspaceContext
): { ownerId: string, ownerType: 'user' | 'team' } {
  return {
    ownerId: workspace.id || userId,
    ownerType: workspace.type || 'user'
  }
}
