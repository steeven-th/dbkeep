<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const toast = useToast()
const { user } = useAuth()

// Onglet actif
const activeTab = ref('profile')

// État de chargement
const isLoading = ref(false)

// Schéma de validation pour le profil
const profileSchema = z.object({
  name: z.string().min(2, t('auth.name_min_length'))
})

// Schéma de validation pour le mot de passe
const passwordSchema = z.object({
  currentPassword: z.string().min(1, t('auth.password_required')),
  newPassword: z.string().min(8, t('auth.password_min_length')),
  confirmPassword: z.string().min(1, t('auth.password_required'))
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t('auth.passwords_not_match'),
  path: ['confirmPassword']
})

type ProfileSchema = z.output<typeof profileSchema>
type PasswordSchema = z.output<typeof passwordSchema>

// État du formulaire profil
const profileState = ref({
  name: user.value?.name || ''
})

// État du formulaire mot de passe
const passwordState = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Mettre à jour le nom quand l'utilisateur change
watch(() => user.value, (newUser) => {
  if (newUser) {
    profileState.value.name = newUser.name || ''
  }
}, { immediate: true })

// Réinitialiser le formulaire mot de passe à l'ouverture
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    passwordState.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  }
})

// Soumettre le profil
const onProfileSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  isLoading.value = true
  try {
    const { authClient } = await import('~/utils/auth-client')
    await authClient.updateUser({
      name: event.data.name
    })

    toast.add({
      title: t('profile.update_success'),
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: t('profile.update_error'),
      description: error.message,
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Soumettre le changement de mot de passe
const onPasswordSubmit = async (event: FormSubmitEvent<PasswordSchema>) => {
  isLoading.value = true
  try {
    const { authClient } = await import('~/utils/auth-client')
    await authClient.changePassword({
      currentPassword: event.data.currentPassword,
      newPassword: event.data.newPassword
    })

    toast.add({
      title: t('profile.password_success'),
      color: 'success'
    })

    // Réinitialiser le formulaire
    passwordState.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error: any) {
    toast.add({
      title: t('profile.password_error'),
      description: error.message,
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Fermer le modal
const closeModal = () => {
  emit('update:open', false)
}

// Onglets
const tabs = computed(() => [
  { label: t('profile.tab_profile'), value: 'profile', icon: 'i-lucide-user' },
  { label: t('profile.tab_security'), value: 'security', icon: 'i-lucide-shield' }
])
</script>

<template>
  <UModal
    :open="open"
    @update:open="$emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-user-cog"
          class="size-5"
        />
        <span class="font-semibold">{{ t('profile.title') }}</span>
      </div>
    </template>

    <template #body>
      <UTabs
        v-model="activeTab"
        :items="tabs"
        class="w-full"
      />

      <!-- Onglet Profil -->
      <div
        v-if="activeTab === 'profile'"
        class="mt-4"
      >
        <UForm
          :schema="profileSchema"
          :state="profileState"
          class="space-y-4"
          @submit="onProfileSubmit"
        >
          <!-- Email (lecture seule) -->
          <UFormField :label="t('auth.email')">
            <UInput
              :model-value="user?.email || ''"
              disabled
              icon="i-lucide-mail"
              class="w-full"
            />
            <template #hint>
              <span class="text-xs text-muted">{{ t('profile.email_readonly') }}</span>
            </template>
          </UFormField>

          <!-- Nom -->
          <UFormField
            :label="t('auth.name')"
            name="name"
          >
            <UInput
              v-model="profileState.name"
              :placeholder="t('auth.name_placeholder')"
              icon="i-lucide-user"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton
              :label="t('common.cancel')"
              color="neutral"
              variant="ghost"
              @click="closeModal"
            />
            <UButton
              type="submit"
              :label="t('common.save')"
              :loading="isLoading"
            />
          </div>
        </UForm>
      </div>

      <!-- Onglet Sécurité -->
      <div
        v-if="activeTab === 'security'"
        class="mt-4"
      >
        <UForm
          :schema="passwordSchema"
          :state="passwordState"
          class="space-y-4"
          @submit="onPasswordSubmit"
        >
          <!-- Mot de passe actuel -->
          <UFormField
            :label="t('profile.current_password')"
            name="currentPassword"
          >
            <UInput
              v-model="passwordState.currentPassword"
              type="password"
              :placeholder="t('profile.current_password_placeholder')"
              icon="i-lucide-lock"
              class="w-full"
            />
          </UFormField>

          <!-- Nouveau mot de passe -->
          <UFormField
            :label="t('profile.new_password')"
            name="newPassword"
          >
            <UInput
              v-model="passwordState.newPassword"
              type="password"
              :placeholder="t('profile.new_password_placeholder')"
              icon="i-lucide-key"
              class="w-full"
            />
          </UFormField>

          <!-- Confirmer le nouveau mot de passe -->
          <UFormField
            :label="t('auth.confirm_password')"
            name="confirmPassword"
          >
            <UInput
              v-model="passwordState.confirmPassword"
              type="password"
              :placeholder="t('auth.confirm_password_placeholder')"
              icon="i-lucide-key"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-4">
            <UButton
              :label="t('common.cancel')"
              color="neutral"
              variant="ghost"
              @click="closeModal"
            />
            <UButton
              type="submit"
              :label="t('profile.change_password')"
              :loading="isLoading"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
