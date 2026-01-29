<script setup lang="ts">
import type { ProjectCardData, ProjectCardMenuItem } from '~/types/project-card'

/**
 * Reusable project card component
 * Displays a project with its metadata and actions
 */

const props = withDefaults(defineProps<{
  /** Project data to display */
  project: ProjectCardData
  /** Menu items for the dropdown (grouped arrays) */
  menuItems?: ProjectCardMenuItem[][]
  /** Always show the menu button (not just on hover) */
  alwaysShowMenu?: boolean
  /** Whether the project is in a restricted state */
  restricted?: boolean
  /** Message to display when restricted */
  restrictedMessage?: string
  /** Label for the restricted badge */
  restrictedBadgeLabel?: string
  /** Label for the action button when restricted */
  restrictedActionLabel?: string
}>(), {
  menuItems: undefined,
  alwaysShowMenu: false,
  restricted: false,
  restrictedMessage: '',
  restrictedBadgeLabel: '',
  restrictedActionLabel: ''
})

const emit = defineEmits<{
  open: [projectId: string]
  rename: [projectId: string, currentName: string]
  delete: [projectId: string]
  restrictedAction: [projectId: string]
}>()

const { t } = useI18n()

/**
 * Default menu items if none provided
 */
const defaultMenuItems = computed<ProjectCardMenuItem[][]>(() => [
  [
    {
      label: t('project.open'),
      icon: 'i-lucide-folder-open',
      onSelect: () => emit('open', props.project.id)
    },
    {
      label: t('project.rename'),
      icon: 'i-lucide-pencil',
      onSelect: () => emit('rename', props.project.id, props.project.name)
    }
  ],
  [
    {
      label: t('project.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('delete', props.project.id)
    }
  ]
])

/**
 * Resolved menu items
 */
const resolvedMenuItems = computed(() => props.menuItems ?? defaultMenuItems.value)

/**
 * Returns the database engine icon
 */
const getEngineIcon = (engine: string) => {
  switch (engine) {
    case 'PostgreSQL':
      return 'i-simple-icons-postgresql'
    case 'MySQL':
      return 'i-simple-icons-mysql'
    case 'SQLite':
      return 'i-simple-icons-sqlite'
    default:
      return 'i-lucide-database'
  }
}

/**
 * Formats a date for display
 */
const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div
    :class="[
      'bg-default rounded-lg border p-4 transition-colors group',
      restricted
        ? 'border-warning/50 opacity-75'
        : 'border-default hover:border-primary'
    ]"
  >
    <!-- Header: name + menu -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <UIcon
          :name="restricted ? 'i-lucide-lock' : getEngineIcon(project.engine)"
          :class="['w-5 h-5 shrink-0', restricted ? 'text-warning' : 'text-muted']"
        />
        <h3 class="font-medium truncate">
          {{ project.name }}
        </h3>
        <!-- Restricted badge -->
        <UBadge
          v-if="restricted && restrictedBadgeLabel"
          color="warning"
          size="xs"
          :ui="{ base: 'shrink-0' }"
        >
          <UIcon
            name="i-lucide-lock"
            class="w-3 h-3 mr-1"
          />
          {{ restrictedBadgeLabel }}
        </UBadge>
      </div>

      <!-- Menu dropdown -->
      <UDropdownMenu
        v-if="resolvedMenuItems.length > 0"
        :items="resolvedMenuItems"
      >
        <UButton
          icon="i-lucide-more-vertical"
          variant="ghost"
          size="xs"
          :class="[
            'text-muted hover:text-default',
            alwaysShowMenu ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'
          ]"
        />
      </UDropdownMenu>
    </div>

    <!-- Restricted alert -->
    <div
      v-if="restricted && restrictedMessage"
      class="mb-3 p-2 bg-warning/10 border border-warning/20 rounded-md"
    >
      <p class="text-xs text-warning">
        {{ restrictedMessage }}
      </p>
    </div>

    <!-- Metadata -->
    <div class="text-xs text-muted space-y-1">
      <div class="flex items-center gap-1">
        <UIcon
          name="i-lucide-clock"
          class="w-3 h-3"
        />
        <span>{{ t('project.last_modified') }}: {{ formatDate(project.updatedAt) }}</span>
      </div>
      <div
        v-if="project.createdByName"
        class="flex items-center gap-1"
      >
        <UIcon
          name="i-lucide-user"
          class="w-3 h-3"
        />
        <span>{{ t('project.created_by') }}: {{ project.createdByName }}</span>
      </div>
    </div>

    <!-- Action button -->
    <slot name="action">
      <UButton
        v-if="restricted && restrictedActionLabel"
        class="w-full mt-4"
        color="warning"
        variant="soft"
        @click="$emit('restrictedAction', project.id)"
      >
        <UIcon
          name="i-lucide-crown"
          class="w-4 h-4 mr-1"
        />
        {{ restrictedActionLabel }}
      </UButton>
      <UButton
        v-else
        class="w-full mt-4"
        variant="soft"
        @click="$emit('open', project.id)"
      >
        {{ t('project.open') }}
      </UButton>
    </slot>
  </div>
</template>
