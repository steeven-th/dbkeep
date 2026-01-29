<script setup lang="ts">
// Nuxt UI locale synced with i18n
const nuxtUiLocale = useNuxtUiLocale()

// Profile modal state
const showProfileModal = ref(false)
</script>

<template>
  <UApp
    class="h-screen"
    :locale="nuxtUiLocale"
  >
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Navbar -->
      <LayoutNavbar
        @open-profile="showProfileModal = true"
      />

      <!-- Main content -->
      <main class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- Profile edit modal -->
    <ProfileEditModal v-model:open="showProfileModal" />
  </UApp>
</template>
