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

// Active tab
const activeTab = ref('profile')

// Loading state
const isLoading = ref(false)

// Profile validation schema
const profileSchema = z.object({
  name: z.string().min(2, t('auth.name_min_length'))
})

// Password validation schema
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

// Profile form state
const profileState = ref({
  name: user.value?.name || ''
})

// Password form state
const passwordState = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Update name when user changes
watch(() => user.value, (newUser) => {
  if (newUser) {
    profileState.value.name = newUser.name || ''
  }
}, { immediate: true })

// Reset password form on open
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    passwordState.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  }
})

// Submit profile
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

// Submit password change
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

    // Reset the form
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

// Close the modal
const closeModal = () => {
  emit('update:open', false)
}

// Tabs
const tabs = computed(() => [
  { label: t('profile.tab_profile'), value: 'profile', icon: 'i-lucide-user' },
  { label: t('profile.tab_security'), value: 'security', icon: 'i-lucide-shield' }
])
</script>

<template>
  <UModal
    :open="open"
    :title="t('profile.title')"
    :description="t('profile.edit_profile')"
    :icon="{ name: 'i-lucide-user-cog' }"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <UTabs
        v-model="activeTab"
        :items="tabs"
        class="w-full"
      />

      <!-- Profile Tab -->
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
          <!-- Email (read-only) -->
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

          <!-- Name -->
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

      <!-- Security Tab -->
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
          <!-- Current password -->
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

          <!-- New password -->
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

          <!-- Confirm new password -->
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
