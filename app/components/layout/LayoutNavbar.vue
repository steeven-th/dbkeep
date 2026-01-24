<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const emit = defineEmits<{
  'open-new-project': []
  'open-profile': []
}>()

const router = useRouter()
const { t } = useI18n()
const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth()
const { isGuestModeEnabled, guestUser } = useAppMode()

// Effective user (real or guest)
const effectiveUser = computed(() => {
  if (isGuestModeEnabled.value) {
    return guestUser.value
  }
  return user.value
})

// Check if user is considered logged in (real auth or guest mode)
const isEffectivelyAuthenticated = computed(() => {
  return isGuestModeEnabled.value || isAuthenticated.value
})

// Return to projects list
const goToProjectList = () => {
  router.push('/app')
}

// User dropdown menu items (adapted based on mode)
const userMenuItems = computed<DropdownMenuItem[][]>(() => {
  // In guest mode, simplified menu without profile/settings
  if (isGuestModeEnabled.value) {
    return [
      [
        {
          label: t('guest.mode_label'),
          icon: 'i-lucide-user',
          disabled: true
        }
      ]
    ]
  }

  // Normal mode with authentication
  return [
    [
      {
        label: t('profile.edit_profile'),
        icon: 'i-lucide-user-cog',
        onSelect: () => emit('open-profile')
      },
      {
        label: t('sidebar.settings'),
        icon: 'i-lucide-settings',
        onSelect: () => router.push('/app/settings')
      }
    ],
    [
      {
        label: t('auth.logout'),
        icon: 'i-lucide-log-out',
        color: 'error' as const,
        onSelect: logout
      }
    ]
  ]
})
</script>

<template>
  <header class="h-14 border-b border-default bg-default flex items-center px-4 shrink-0">
    <!-- Logo on the left -->
    <div class="flex items-center gap-2">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <img
          src="/dbkeep-light.svg"
          alt="DBKeep"
          class="size-8"
        >
        <span class="font-bold text-lg hidden sm:inline">
          {{ $t('app_name') }}
        </span>
      </NuxtLink>

      <!-- Slot for additional elements (e.g., WorkspaceSwitcher) -->
      <slot name="after-logo" />
    </div>

    <!-- Center actions -->
    <div class="flex-1 flex items-center justify-center gap-2">
      <ClientOnly>
        <UButton
          icon="i-lucide-home"
          variant="ghost"
          color="neutral"
          @click="goToProjectList"
        />
        <UButton
          icon="i-lucide-plus"
          variant="soft"
          color="primary"
          @click="$emit('open-new-project')"
        />
        <template #fallback>
          <div class="flex gap-2">
            <div class="size-8 rounded bg-muted" />
            <div class="size-8 rounded bg-muted" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-2">
      <!-- Theme selector -->
      <ClientOnly>
        <UColorModeButton />
        <template #fallback>
          <div class="size-8" />
        </template>
      </ClientOnly>

      <!-- Language selector -->
      <ClientOnly>
        <LanguageSwitcher />
        <template #fallback>
          <div class="size-8" />
        </template>
      </ClientOnly>

      <!-- User menu -->
      <ClientOnly>
        <!-- Skeleton during loading (except in guest mode) -->
        <USkeleton
          v-if="isAuthLoading && !isGuestModeEnabled"
          class="size-8 rounded-full"
        />

        <!-- Logged in user (real auth or guest mode) -->
        <UDropdownMenu
          v-else-if="isEffectivelyAuthenticated"
          :items="userMenuItems"
        >
          <button class="p-1 rounded-full hover:bg-elevated transition-colors cursor-pointer">
            <UAvatar
              :alt="effectiveUser?.name || ''"
              size="sm"
              :ui="{ fallback: 'text-white' }"
            />
          </button>
        </UDropdownMenu>

        <!-- SSR Fallback -->
        <template #fallback>
          <USkeleton class="size-8 rounded-full" />
        </template>
      </ClientOnly>
    </div>
  </header>
</template>

<style scoped>
/* Pointer cursor on all header buttons */
header :deep(button) {
  cursor: pointer;
}
</style>
