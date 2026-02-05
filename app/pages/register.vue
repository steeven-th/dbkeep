<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'landing',
  middleware: 'guest',
})

const { t } = useI18n()
const { register, isLoading } = useAuth()
const { isRegisterEnabled } = useAppMode()
const router = useRouter()

// Redirect if registration is disabled
onMounted(() => {
  if (!isRegisterEnabled.value) {
    router.push('/login')
  }
})

// Form state
const formError = ref<string | null>(null)

/**
 * Maps Better Auth error messages to i18n keys
 */
const mapErrorToI18n = (error: string | undefined): string => {
  if (!error) return t('auth.error_register')

  // Map known Better Auth errors to translations
  const errorLower = error.toLowerCase()
  if (errorLower.includes('already exists') || errorLower.includes('already in use')) {
    return t('auth.error_email_exists')
  }

  // Default fallback
  return t('auth.error_register')
}

// Zod validation schema
const schema = z.object({
  name: z.string().min(2, t('auth.name_min_length')),
  email: z.string().email(t('auth.invalid_email')),
  password: z.string().min(8, t('auth.password_min_length')),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: t('auth.passwords_not_match'),
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

// Initial form state
const state = reactive<Schema>({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

/**
 * Registration form submission
 */
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  formError.value = null

  const result = await register({
    name: event.data.name,
    email: event.data.email,
    password: event.data.password
  })

  if (!result.success) {
    formError.value = mapErrorToI18n(result.error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Message if registration disabled -->
      <template v-if="!isRegisterEnabled">
        <div class="text-center">
          <UIcon
            name="i-lucide-user-x"
            class="size-16 text-muted mx-auto mb-4"
          />
          <h1 class="text-2xl font-bold mb-2">
            {{ t('register_disabled.title') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('register_disabled.description') }}
          </p>
          <UButton
            to="/login"
            icon="i-lucide-arrow-left"
          >
            {{ t('auth.login_link') }}
          </UButton>
        </div>
      </template>

      <!-- Registration form -->
      <template v-else>
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
            {{ t('auth.register_title') }}
          </h1>
          <p class="text-muted mt-2">
            {{ t('auth.register_subtitle') }}
          </p>
        </div>

        <!-- Form -->
        <UCard>
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

            <!-- Name -->
            <UFormField
              :label="t('auth.name')"
              name="name"
            >
              <UInput
                v-model="state.name"
                type="text"
                :placeholder="t('auth.name_placeholder')"
                icon="i-lucide-user"
                size="lg"
                class="w-full"
              />
            </UFormField>

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

            <!-- Password -->
            <UFormField
              :label="t('auth.password')"
              name="password"
            >
              <UInput
                v-model="state.password"
                type="password"
                :placeholder="t('auth.password_placeholder')"
                icon="i-lucide-lock"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <!-- Confirm Password -->
            <UFormField
              :label="t('auth.confirm_password')"
              name="confirmPassword"
            >
              <UInput
                v-model="state.confirmPassword"
                type="password"
                :placeholder="t('auth.confirm_password_placeholder')"
                icon="i-lucide-lock"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <!-- Register button -->
            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
            >
              {{ t('auth.register_button') }}
            </UButton>
          </UForm>

          <!-- Link to login -->
          <template #footer>
            <div class="text-center text-sm">
              <span class="text-muted">{{ t('auth.have_account') }}</span>
              {{ ' ' }}
              <NuxtLink
                to="/login"
                class="text-primary hover:underline font-medium"
              >
                {{ t('auth.login_link') }}
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
      </template>
    </div>
  </div>
</template>
