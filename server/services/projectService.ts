import { eq, and, desc } from 'drizzle-orm'
import { db } from '../database/drizzle'
import { project, user } from '../database/schema'

/**
 * Project management service
 * Centralizes all Drizzle operations for projects
 * Decoupled from authentication to support guest mode
 */

// Guest user ID (guest mode)
export const GUEST_USER_ID = 'guest-user'

export interface CreateProjectInput {
  name: string
  engine: 'PostgreSQL' | 'MySQL' | 'SQLite'
  data?: unknown
  userId: string
  // Optional for backward compatibility - defaults to userId
  ownerId?: string
  // Optional for backward compatibility - defaults to 'user'
  ownerType?: 'user' | 'team'
}

export interface UpdateProjectInput {
  name?: string
  engine?: 'PostgreSQL' | 'MySQL' | 'SQLite'
  data?: unknown
}

export interface ProjectOutput {
  id: string
  name: string
  engine: string
  data: unknown | null
  userId: string
  ownerId: string
  ownerType: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectListItem {
  id: string
  name: string
  engine: string
  ownerId: string
  ownerType: string
  createdAt: Date
  updatedAt: Date
  /** Nom de l'utilisateur qui a créé le projet */
  createdByName: string | null
}

export interface ListProjectsOptions {
  userId: string
  // If specified, filter by workspace (otherwise uses userId)
  workspaceId?: string
  workspaceType?: 'user' | 'team'
}

/**
 * Returns the list of projects for a user or workspace
 */
export async function listProjects(options: string | ListProjectsOptions): Promise<ProjectListItem[]> {
  // Backward compatibility: if just a string, it's the userId
  const opts: ListProjectsOptions = typeof options === 'string'
    ? { userId: options }
    : options

  const { workspaceId, workspaceType } = opts

  // If workspace specified, filter by ownerId/ownerType
  // Otherwise, filter by userId (default standalone behavior)
  const whereClause = workspaceId && workspaceType
    ? and(
        eq(project.ownerId, workspaceId),
        eq(project.ownerType, workspaceType)
      )
    : eq(project.userId, opts.userId)

  const projects = await db
    .select({
      id: project.id,
      name: project.name,
      engine: project.engine,
      ownerId: project.ownerId,
      ownerType: project.ownerType,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdByName: user.name
    })
    .from(project)
    .leftJoin(user, eq(project.userId, user.id))
    .where(whereClause)
    .orderBy(desc(project.updatedAt))

  return projects
}

/**
 * Returns a project by its ID
 * Verifies that the project belongs to the user
 */
export async function getProject(projectId: string, userId: string): Promise<ProjectOutput | null> {
  const [foundProject] = await db
    .select()
    .from(project)
    .where(
      and(
        eq(project.id, projectId),
        eq(project.userId, userId)
      )
    )

  if (!foundProject) {
    return null
  }

  return {
    ...foundProject,
    data: foundProject.data ? JSON.parse(foundProject.data) : null
  }
}

/**
 * Creates a new project
 */
export async function createProject(input: CreateProjectInput): Promise<ProjectOutput> {
  const [newProject] = await db
    .insert(project)
    .values({
      name: input.name,
      engine: input.engine,
      data: input.data ? JSON.stringify(input.data) : null,
      userId: input.userId,
      // By default, the owner is the user who creates the project
      ownerId: input.ownerId || input.userId,
      ownerType: input.ownerType || 'user'
    })
    .returning()

  return {
    ...newProject,
    data: newProject.data ? JSON.parse(newProject.data) : null
  }
}

/**
 * Updates an existing project
 * Verifies that the project belongs to the user
 */
export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<ProjectOutput | null> {
  // Verify that the project exists and belongs to the user
  const [existingProject] = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.id, projectId),
        eq(project.userId, userId)
      )
    )

  if (!existingProject) {
    return null
  }

  // Prepare data to update
  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (input.name !== undefined) {
    updateData.name = input.name
  }
  if (input.engine !== undefined) {
    updateData.engine = input.engine
  }
  if (input.data !== undefined) {
    updateData.data = JSON.stringify(input.data)
  }

  // Update the project
  const [updatedProject] = await db
    .update(project)
    .set(updateData)
    .where(eq(project.id, projectId))
    .returning()

  return {
    ...updatedProject,
    data: updatedProject.data ? JSON.parse(updatedProject.data) : null
  }
}

/**
 * Deletes a project
 * Verifies that the project belongs to the user
 */
export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const [deletedProject] = await db
    .delete(project)
    .where(
      and(
        eq(project.id, projectId),
        eq(project.userId, userId)
      )
    )
    .returning({ id: project.id })

  return !!deletedProject
}
