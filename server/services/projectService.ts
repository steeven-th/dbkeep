import { eq, and, desc } from 'drizzle-orm'
import { db } from '../database/drizzle'
import { project } from '../database/schema'

/**
 * Service de gestion des projets
 * Centralise toutes les opérations Drizzle pour les projets
 * Découplé de l'authentification pour supporter le mode invité
 */

// ID de l'utilisateur invité (mode guest)
export const GUEST_USER_ID = 'guest-user'

export interface CreateProjectInput {
  name: string
  engine: 'PostgreSQL' | 'MySQL' | 'SQLite'
  data?: unknown
  userId: string
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
  createdAt: Date
  updatedAt: Date
}

export interface ProjectListItem {
  id: string
  name: string
  engine: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Récupère la liste des projets d'un utilisateur
 */
export async function listProjects(userId: string): Promise<ProjectListItem[]> {
  const projects = await db
    .select({
      id: project.id,
      name: project.name,
      engine: project.engine,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    })
    .from(project)
    .where(eq(project.userId, userId))
    .orderBy(desc(project.updatedAt))

  return projects
}

/**
 * Récupère un projet par son ID
 * Vérifie que le projet appartient à l'utilisateur
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
 * Crée un nouveau projet
 */
export async function createProject(input: CreateProjectInput): Promise<ProjectOutput> {
  const [newProject] = await db
    .insert(project)
    .values({
      name: input.name,
      engine: input.engine,
      data: input.data ? JSON.stringify(input.data) : null,
      userId: input.userId
    })
    .returning()

  return {
    ...newProject,
    data: newProject.data ? JSON.parse(newProject.data) : null
  }
}

/**
 * Met à jour un projet existant
 * Vérifie que le projet appartient à l'utilisateur
 */
export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<ProjectOutput | null> {
  // Vérifier que le projet existe et appartient à l'utilisateur
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

  // Préparer les données à mettre à jour
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

  // Mettre à jour le projet
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
 * Supprime un projet
 * Vérifie que le projet appartient à l'utilisateur
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
