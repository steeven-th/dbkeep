/**
 * Types for the ProjectCard component
 */

/**
 * Project data structure for display in cards
 */
export interface ProjectCardData {
  id: string
  name: string
  engine: string
  updatedAt: Date | string
  createdByName?: string | null
  /** Generic flag for any restriction state (optional) */
  isLocked?: boolean
}

/**
 * Menu item for the project card dropdown
 */
export interface ProjectCardMenuItem {
  label: string
  icon: string
  color?: string
  onSelect: () => void
}
