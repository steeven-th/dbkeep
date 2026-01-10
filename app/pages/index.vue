<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Header -->
    <header class="border-b border-default">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logo.svg"
            alt="DBKeep"
            class="size-8"
          >
          <span class="font-bold text-xl">{{ t('app_name') }}</span>
        </NuxtLink>
        <div class="flex items-center gap-4">
          <UColorModeButton />
          <UButton
            to="https://github.com"
            target="_blank"
            icon="i-simple-icons-github"
            color="neutral"
            variant="ghost"
          />
          <UButton to="/login" color="neutral" variant="ghost">
            {{ t('auth.login_link') }}
          </UButton>
          <UButton to="/register">
            {{ t('auth.register_link') }}
          </UButton>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="py-24 px-4">
      <div class="container mx-auto text-center max-w-4xl">
        <h1 class="text-5xl font-bold mb-6">
          {{ t('landing.hero_title') }}
        </h1>
        <p class="text-xl text-muted mb-8 max-w-2xl mx-auto">
          {{ t('landing.hero_description') }}
        </p>
        <div class="flex items-center justify-center gap-4">
          <UButton to="/app" size="xl" icon="i-lucide-play">
            {{ t('landing.get_started') }}
          </UButton>
          <UButton
            to="https://github.com"
            target="_blank"
            size="xl"
            color="neutral"
            variant="outline"
            icon="i-simple-icons-github"
          >
            GitHub
          </UButton>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 px-4 bg-muted">
      <div class="container mx-auto max-w-6xl">
        <h2 class="text-3xl font-bold text-center mb-12">
          {{ t('landing.features_title') }}
        </h2>
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-default p-6 rounded-xl border border-default">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <UIcon name="i-lucide-mouse-pointer-click" class="size-6 text-primary" />
            </div>
            <h3 class="font-semibold text-lg mb-2">{{ t('landing.feature_visual_title') }}</h3>
            <p class="text-muted">{{ t('landing.feature_visual_description') }}</p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-default p-6 rounded-xl border border-default">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <UIcon name="i-lucide-code" class="size-6 text-primary" />
            </div>
            <h3 class="font-semibold text-lg mb-2">{{ t('landing.feature_export_title') }}</h3>
            <p class="text-muted">{{ t('landing.feature_export_description') }}</p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-default p-6 rounded-xl border border-default">
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <UIcon name="i-lucide-users" class="size-6 text-primary" />
            </div>
            <h3 class="font-semibold text-lg mb-2">{{ t('landing.feature_opensource_title') }}</h3>
            <p class="text-muted">{{ t('landing.feature_opensource_description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 px-4">
      <div class="container mx-auto text-center max-w-2xl">
        <h2 class="text-3xl font-bold mb-4">
          {{ t('landing.cta_title') }}
        </h2>
        <p class="text-muted mb-8">
          {{ t('landing.cta_description') }}
        </p>
        <UButton to="/register" size="xl" icon="i-lucide-arrow-right" trailing>
          {{ t('landing.cta_button') }}
        </UButton>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-default py-8 px-4">
      <div class="container mx-auto text-center text-muted text-sm">
        <p>{{ t('app_name') }} - Open Source Database Designer</p>
        <p class="mt-2">MIT License</p>
      </div>
    </footer>
  </div>
</template>
