<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const router = useRouter()
const { t } = useI18n()
const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth()
const { isGuestModeEnabled, guestUser } = useAppMode()

// État du modal de nouveau projet
const showNewProjectModal = ref(false)

// État du modal de profil
const showProfileModal = ref(false)

// Utilisateur effectif (réel ou invité)
const effectiveUser = computed(() => {
  if (isGuestModeEnabled.value) {
    return guestUser.value
  }
  return user.value
})

// Vérifie si l'utilisateur est considéré comme connecté (auth réelle ou mode invité)
const isEffectivelyAuthenticated = computed(() => {
  return isGuestModeEnabled.value || isAuthenticated.value
})

// Ouvre le modal de création de projet
const openNewProjectModal = () => {
  showNewProjectModal.value = true
}

// Retourne à la liste des projets
const goToProjectList = () => {
  router.push('/app')
}

// Items du dropdown menu utilisateur (adapté selon le mode)
const userMenuItems = computed<DropdownMenuItem[][]>(() => {
  // En mode invité, menu simplifié sans profil/paramètres
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

  // Mode normal avec authentification
  return [
    [
      {
        label: t('profile.edit_profile'),
        icon: 'i-lucide-user-cog',
        onSelect: () => {
          showProfileModal.value = true
        }
      },
      {
        label: t('sidebar.settings'),
        icon: 'i-lucide-settings',
        onSelect: () => {
          router.push('/app/settings')
        }
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
  <UApp class="h-screen">
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Navbar -->
      <header class="h-14 border-b border-default bg-default flex items-center px-4 shrink-0">
        <!-- Logo à gauche -->
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.svg"
              alt="DBKeep"
              class="size-8"
            >
            <span class="font-bold text-lg hidden sm:inline">
              {{ $t('app_name') }}
            </span>
          </NuxtLink>
        </div>

        <!-- Actions centrales (wrapped to prevent hydration mismatch on icons) -->
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
              @click="openNewProjectModal"
            />
            <template #fallback>
              <div class="flex gap-2">
                <div class="size-8 rounded bg-muted" />
                <div class="size-8 rounded bg-muted" />
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- Actions à droite -->
        <div class="flex items-center gap-2">
          <!-- Sélecteur de thème (wrapped to prevent hydration mismatch) -->
          <ClientOnly>
            <UColorModeButton />
            <template #fallback>
              <div class="size-8" />
            </template>
          </ClientOnly>

          <!-- Sélecteur de langue (wrapped to prevent hydration mismatch) -->
          <ClientOnly>
            <LanguageSwitcher />
            <template #fallback>
              <div class="size-8" />
            </template>
          </ClientOnly>

          <!-- Menu utilisateur -->
          <ClientOnly>
            <!-- Skeleton pendant le chargement (sauf en mode invité) -->
            <USkeleton
              v-if="isAuthLoading && !isGuestModeEnabled"
              class="size-8 rounded-full"
            />

            <!-- Utilisateur connecté (auth réelle ou mode invité) -->
            <UDropdownMenu
              v-else-if="isEffectivelyAuthenticated"
              :items="userMenuItems"
            >
              <button class="p-1 rounded-full hover:bg-elevated transition-colors cursor-pointer">
                <UAvatar
                  :alt="effectiveUser?.name || ''"
                  size="sm"
                  :ui="{ fallback: 'bg-primary text-white' }"
                />
              </button>
            </UDropdownMenu>

            <!-- Fallback SSR -->
            <template #fallback>
              <USkeleton class="size-8 rounded-full" />
            </template>
          </ClientOnly>
        </div>
      </header>

      <!-- Contenu principal -->
      <main class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- Modal de création de projet (accessible depuis la navbar) -->
    <CanvasNewProjectModal v-model:open="showNewProjectModal" />

    <!-- Modal d'édition du profil -->
    <ProfileEditModal v-model:open="showProfileModal" />
  </UApp>
</template>

<style scoped>
/* Cursor pointer sur tous les boutons du header */
header :deep(button) {
  cursor: pointer;
}
</style>
