<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'landing'
})

const { t } = useI18n()
const { register, isLoading } = useAuth()
const { isRegisterEnabled } = useAppMode()
const router = useRouter()

// Rediriger si l'inscription est désactivée
onMounted(() => {
  if (!isRegisterEnabled.value) {
    router.push('/login')
  }
})

// État du formulaire
const formError = ref<string | null>(null)

// Schéma de validation avec Zod
const schema = z.object({
  name: z.string().min(2, t('auth.name_min_length')),
  email: z.string().email(t('auth.invalid_email')),
  password: z.string().min(8, t('auth.password_min_length')),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.passwords_not_match'),
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

// État initial du formulaire
const state = reactive<Schema>({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

/**
 * Soumission du formulaire d'inscription
 */
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  formError.value = null

  const result = await register({
    name: event.data.name,
    email: event.data.email,
    password: event.data.password
  })

  if (!result.success) {
    formError.value = result.error || t('auth.error_register')
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Message si inscription désactivée -->
      <template v-if="!isRegisterEnabled">
        <div class="text-center">
          <UIcon
            name="i-lucide-user-x"
            class="size-16 text-muted mx-auto mb-4"
          />
          <h1 class="text-2xl font-bold mb-2">{{ t('register_disabled.title') }}</h1>
          <p class="text-muted mb-6">{{ t('register_disabled.description') }}</p>
          <UButton
            to="/login"
            icon="i-lucide-arrow-left"
          >
            {{ t('auth.login_link') }}
          </UButton>
        </div>
      </template>

      <!-- Formulaire d'inscription -->
      <template v-else>
        <!-- Logo et titre -->
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
          <h1 class="text-2xl font-bold">{{ t('auth.register_title') }}</h1>
          <p class="text-muted mt-2">{{ t('auth.register_subtitle') }}</p>
        </div>

        <!-- Formulaire -->
        <UCard>
          <UForm
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <!-- Message d'erreur global -->
            <UAlert
              v-if="formError"
              color="error"
              icon="i-lucide-alert-circle"
              :title="formError"
              :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
              @close="formError = null"
            />

            <!-- Nom -->
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

            <!-- Bouton d'inscription -->
            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
            >
              {{ t('auth.register_button') }}
            </UButton>
          </UForm>

          <!-- Lien vers connexion -->
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

        <!-- Retour à l'accueil -->
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
