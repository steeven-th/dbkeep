<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'landing'
})

const { t } = useI18n()
const { login, isLoading } = useAuth()
const { isRegisterEnabled, isGuestModeEnabled } = useAppMode()
const router = useRouter()

// État du formulaire
const formError = ref<string | null>(null)

// Schéma de validation avec Zod
const schema = z.object({
  email: z.string().email(t('auth.invalid_email')),
  password: z.string().min(1, t('auth.password_required'))
})

type Schema = z.output<typeof schema>

// État initial du formulaire
const state = reactive<Schema>({
  email: '',
  password: ''
})

/**
 * Soumission du formulaire de connexion
 */
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  formError.value = null

  const result = await login({
    email: event.data.email,
    password: event.data.password
  })

  if (!result.success) {
    formError.value = result.error || t('auth.error_login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted flex items-center justify-center px-4">
    <div class="w-full max-w-md">
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
        <h1 class="text-2xl font-bold">{{ t('auth.login_title') }}</h1>
        <p class="text-muted mt-2">{{ t('auth.login_subtitle') }}</p>
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

          <!-- Bouton de connexion -->
          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
          >
            {{ t('auth.login_button') }}
          </UButton>
        </UForm>

        <!-- Lien vers inscription (si activée) -->
        <template #footer>
          <div class="text-center text-sm space-y-3">
            <!-- Lien inscription -->
            <div v-if="isRegisterEnabled">
              <span class="text-muted">{{ t('auth.no_account') }}</span>
              {{ ' ' }}
              <NuxtLink
                to="/register"
                class="text-primary hover:underline font-medium"
              >
                {{ t('auth.register_link') }}
              </NuxtLink>
            </div>

            <!-- Option mode invité -->
            <div v-if="isGuestModeEnabled">
              <UButton
                variant="soft"
                color="neutral"
                block
                @click="router.push('/app')"
              >
                {{ t('guest.mode_label') }}
              </UButton>
            </div>
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
    </div>
  </div>
</template>
