<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const emit = defineEmits<{
  'open-profile': []
}>()

const router = useRouter()
const colorMode = useColorMode()
const { t, locale, setLocale } = useI18n()
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

// Toggle theme (light/dark)
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Toggle language (fr/en)
const toggleLanguage = () => {
  setLocale(locale.value === 'fr' ? 'en' : 'fr')
}

// Flag icon for target language (the one we'll switch TO)
const targetLanguageFlag = computed(() => {
  return locale.value === 'fr' ? '🇺🇸' : '🇫🇷'
})

// Theme icon based on current mode
const themeIcon = computed(() => {
  return colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'
})

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
    <!-- Logo and navigation on the left -->
    <div class="flex items-center gap-2">
      <NuxtLink
        to="/"
        class="flex items-center cursor-pointer hover:opacity-80 transition-opacity pe-1.5"
      >
        <img
          src="/dbkeep-light.svg"
          alt="DBKeep"
          class="size-8"
        >
      </NuxtLink>

      <!-- Home button -->
      <ClientOnly>
        <UButton
          icon="i-lucide-home"
          variant="ghost"
          color="neutral"
          size="sm"
          @click="goToProjectList"
        />
        <template #fallback>
          <div class="size-8 rounded bg-muted" />
        </template>
      </ClientOnly>

      <!-- Slot for additional elements (e.g., WorkspaceSwitcher) -->
      <slot name="after-logo" />
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right actions -->
    <div class="flex items-center gap-2">
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

          <!-- Theme and language toggles at the top of the dropdown -->
          <template #header>
            <div class="flex items-center justify-center gap-2 px-2 py-1.5 border-b border-default">
              <!-- Theme toggle -->
              <UButton
                :icon="themeIcon"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="toggleTheme"
              />
              <!-- Language toggle (flag of target language) -->
              <UButton
                variant="ghost"
                color="neutral"
                size="sm"
                @click="toggleLanguage"
              >
                <span class="text-base">{{ targetLanguageFlag }}</span>
              </UButton>
            </div>
          </template>
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
