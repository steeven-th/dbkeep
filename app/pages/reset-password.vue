<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { resetPassword } from '~/utils/auth-client'

definePageMeta({
  layout: 'landing',
  middleware: 'guest'
})

const { t } = useI18n()
const route = useRoute()

// Token from query params
const token = computed(() => route.query.token as string | undefined)

// Form state
const formError = ref<string | null>(null)
const isLoading = ref(false)
const resetSuccess = ref(false)

// Zod validation schema
const schema = z.object({
  password: z.string().min(8, t('auth.password_min_length')),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: t('auth.passwords_not_match'),
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

const state = reactive({
  password: '',
  confirmPassword: ''
})

/**
 * Submit password reset
 */
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  if (isLoading.value) return
  if (!token.value) return

  formError.value = null
  isLoading.value = true

  try {
    const { error } = await resetPassword({
      newPassword: event.data.password,
      token: token.value
    })

    if (error) {
      formError.value = t('auth.error_reset_password')
    } else {
      resetSuccess.value = true
    }
  } catch {
    formError.value = t('auth.error_reset_password')
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
          {{ t('auth.reset_password_title') }}
        </h1>
        <p class="text-muted mt-2">
          {{ t('auth.reset_password_subtitle') }}
        </p>
      </div>

      <!-- No token: error state -->
      <UCard v-if="!token">
        <div class="space-y-4">
          <UAlert
            color="error"
            icon="i-lucide-alert-circle"
            :title="t('auth.reset_password_no_token')"
          />

          <UButton
            to="/forgot-password"
            block
            size="lg"
            variant="soft"
          >
            {{ t('auth.reset_password_request_new') }}
          </UButton>
        </div>
      </UCard>

      <!-- Success message -->
      <UCard v-else-if="resetSuccess">
        <div class="space-y-4">
          <UAlert
            color="success"
            icon="i-lucide-check-circle"
            :title="t('auth.reset_password_success_title')"
            :description="t('auth.reset_password_success_message')"
          />

          <UButton
            to="/login"
            block
            size="lg"
          >
            {{ t('auth.login_button') }}
          </UButton>
        </div>
      </UCard>

      <!-- Reset form -->
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

          <!-- New password -->
          <UFormField
            :label="t('auth.reset_password_new_password')"
            name="password"
          >
            <UInput
              v-model="state.password"
              type="password"
              :placeholder="t('auth.reset_password_new_password_placeholder')"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <!-- Confirm password -->
          <UFormField
            :label="t('auth.reset_password_confirm_password')"
            name="confirmPassword"
          >
            <UInput
              v-model="state.confirmPassword"
              type="password"
              :placeholder="t('auth.reset_password_confirm_password_placeholder')"
              icon="i-lucide-lock"
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
            {{ t('auth.reset_password_button') }}
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
