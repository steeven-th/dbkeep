<script setup lang="ts">
// État du modal de nouveau projet
const showNewProjectModal = ref(false)

// État du modal de profil
const showProfileModal = ref(false)

// Ouvre le modal de création de projet
const openNewProjectModal = () => {
  showNewProjectModal.value = true
}
</script>

<template>
  <UApp class="h-screen">
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Navbar -->
      <LayoutNavbar
        @open-new-project="openNewProjectModal"
        @open-profile="showProfileModal = true"
      />

      <!-- Contenu principal -->
      <main class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- Modal de création de projet -->
    <CanvasNewProjectModal v-model:open="showNewProjectModal" />

    <!-- Modal d'édition du profil -->
    <ProfileEditModal v-model:open="showProfileModal" />
  </UApp>
</template>
