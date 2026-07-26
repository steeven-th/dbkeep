<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

const { t } = useI18n()
const route = useRoute()

// Better Auth redirects here after processing the verification link.
// On failure it appends an `error` query param; its absence means success.
const hasError = computed(() => !!route.query.error)
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
          {{ t('auth.verify_email_title') }}
        </h1>
      </div>

      <!-- Error state: invalid or expired link -->
      <UCard v-if="hasError">
        <div class="space-y-4">
          <UAlert
            color="error"
            icon="i-lucide-alert-circle"
            :title="t('auth.verify_email_error_title')"
            :description="t('auth.verify_email_error_message')"
          />

          <UButton
            to="/login"
            block
            size="lg"
            variant="soft"
          >
            {{ t('auth.verify_email_back_login') }}
          </UButton>
        </div>
      </UCard>

      <!-- Success state: email verified -->
      <UCard v-else>
        <div class="space-y-4">
          <UAlert
            color="success"
            icon="i-lucide-check-circle"
            :title="t('auth.verify_email_success_title')"
            :description="t('auth.verify_email_success_message')"
          />

          <UButton
            to="/app"
            block
            size="lg"
          >
            {{ t('auth.verify_email_continue') }}
          </UButton>
        </div>
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
