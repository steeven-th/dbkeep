<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { requestPasswordReset } from '~/utils/auth-client'

definePageMeta({
  layout: 'landing',
  middleware: 'guest'
})

const { t } = useI18n()

// Form state
const formError = ref<string | null>(null)
const isLoading = ref(false)
const emailSent = ref(false)
const sentEmail = ref('')

// Zod validation schema
const schema = z.object({
  email: z.string().email(t('auth.invalid_email'))
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  email: ''
})

/**
 * Submit forgot password request
 */
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  if (isLoading.value) return

  formError.value = null
  isLoading.value = true

  try {
    await requestPasswordReset({
      email: event.data.email,
      redirectTo: '/reset-password'
    })
    // Always show success (security: don't reveal if the email exists)
    sentEmail.value = event.data.email
    emailSent.value = true
  } catch {
    // Still show success for security reasons
    sentEmail.value = event.data.email
    emailSent.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo and title -->
      <div class="text-center mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 mb-4"
        >
          <UIcon
            name="i-lucide-database"
            class="size-10 text-primary"
          />
          <span class="font-bold text-2xl">{{ t('app_name') }}</span>
        </NuxtLink>
        <h1 class="text-2xl font-bold">
          {{ t('auth.forgot_password_title') }}
        </h1>
        <p class="text-muted mt-2">
          {{ t('auth.forgot_password_subtitle') }}
        </p>
      </div>

      <!-- Success message -->
      <UCard v-if="emailSent">
        <div class="space-y-4">
          <UAlert
            color="success"
            icon="i-lucide-mail-check"
            :title="t('auth.forgot_password_success_title')"
            :description="t('auth.forgot_password_success_message', { email: sentEmail })"
          />

          <UButton
            to="/login"
            block
            size="lg"
            variant="soft"
          >
            {{ t('auth.forgot_password_back_login') }}
          </UButton>
        </div>
      </UCard>

      <!-- Form -->
      <UCard v-else>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <!-- Global error message -->
          <UAlert
            v-if="formError"
            color="error"
            icon="i-lucide-alert-circle"
            :title="formError"
            :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
            @close="formError = null"
          />

          <!-- Email -->
          <UFormField
            :label="t('auth.email')"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              :placeholder="t('auth.email_placeholder')"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <!-- Submit button -->
          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
          >
            {{ t('auth.forgot_password_button') }}
          </UButton>
        </UForm>

        <!-- Link back to login -->
        <template #footer>
          <div class="text-center text-sm">
            <NuxtLink
              to="/login"
              class="text-primary hover:underline font-medium"
            >
              {{ t('auth.forgot_password_back_login') }}
            </NuxtLink>
          </div>
        </template>
      </UCard>

      <!-- Back to home -->
      <div class="text-center mt-6">
        <NuxtLink
          to="/"
          class="text-sm text-muted hover:text-default"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4 inline mr-1"
          />
          {{ t('auth.back_home') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
