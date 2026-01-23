<script setup lang="ts">
// Nuxt UI locale synced with i18n
const nuxtUiLocale = useNuxtUiLocale()

// New project modal state
const showNewProjectModal = ref(false)

// Profile modal state
const showProfileModal = ref(false)

// Opens new project creation modal
const openNewProjectModal = () => {
  showNewProjectModal.value = true
}
</script>

<template>
  <UApp class="h-screen" :locale="nuxtUiLocale">
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Navbar -->
      <LayoutNavbar
        @open-new-project="openNewProjectModal"
        @open-profile="showProfileModal = true"
      />

      <!-- Main content -->
      <main class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- New project creation modal -->
    <CanvasNewProjectModal v-model:open="showNewProjectModal" />

    <!-- Profile edit modal -->
    <ProfileEditModal v-model:open="showProfileModal" />
  </UApp>
</template>
