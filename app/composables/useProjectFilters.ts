/**
 * Composable for project list filtering and sorting
 * Handles search, engine filter, and sort with localStorage persistence
 */
export type SortOption = 'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc'

const SORT_STORAGE_KEY = 'dbkeep-projects-sort'
const VALID_SORT_OPTIONS: SortOption[] = ['updated_desc', 'updated_asc', 'created_desc', 'created_asc', 'name_asc', 'name_desc']

interface ProjectForFilter {
  name: string
  engine: string
  createdAt: string | Date
  updatedAt: string | Date
}

export function useProjectFilters<T extends ProjectForFilter>(projects: Ref<T[]>) {
  const { t } = useI18n()

  // Search query
  const searchQuery = ref('')

  // Engine filter
  const selectedEngine = ref<string | null>(null)

  // Sort option with localStorage persistence
  const getInitialSort = (): SortOption => {
    if (import.meta.client) {
      const saved = localStorage.getItem(SORT_STORAGE_KEY)
      if (saved && VALID_SORT_OPTIONS.includes(saved as SortOption)) {
        return saved as SortOption
      }
    }
    return 'updated_desc' // Default: recently modified first
  }

  const selectedSort = ref<SortOption>(getInitialSort())

  // Persist sort preference to localStorage
  watch(selectedSort, (newSort) => {
    if (import.meta.client) {
      localStorage.setItem(SORT_STORAGE_KEY, newSort)
    }
  })

  // Sort options for the selector
  const sortOptions = computed(() => [
    { label: t('project.sort_updated_desc'), value: 'updated_desc' },
    { label: t('project.sort_updated_asc'), value: 'updated_asc' },
    { label: t('project.sort_created_desc'), value: 'created_desc' },
    { label: t('project.sort_created_asc'), value: 'created_asc' },
    { label: t('project.sort_name_asc'), value: 'name_asc' },
    { label: t('project.sort_name_desc'), value: 'name_desc' }
  ])

  // Engine filter options
  const engineOptions = computed(() => [
    { label: t('project.all_engines'), value: null },
    { label: 'PostgreSQL', value: 'PostgreSQL' },
    { label: 'MySQL', value: 'MySQL' },
    { label: 'SQLite', value: 'SQLite' }
  ])

  // Filtered and sorted projects
  const filteredProjects = computed(() => {
    let result = [...projects.value]

    // Filter by text search
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter(p => p.name.toLowerCase().includes(query))
    }

    // Filter by engine
    if (selectedEngine.value) {
      result = result.filter(p => p.engine === selectedEngine.value)
    }

    // Sort according to selected option
    switch (selectedSort.value) {
      case 'updated_desc':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
      case 'updated_asc':
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        break
      case 'created_desc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'created_asc':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
    }

    return result
  })

  // Clear all filters
  const clearFilters = () => {
    searchQuery.value = ''
    selectedEngine.value = null
  }

  return {
    searchQuery,
    selectedEngine,
    selectedSort,
    sortOptions,
    engineOptions,
    filteredProjects,
    clearFilters
  }
}
