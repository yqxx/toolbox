<script setup lang="ts">
import { computed } from 'vue'
import { useToolMeta } from '@/composables/useToolMeta'

const props = defineProps<{
  title?: string
  description?: string
  pageClass?: string | (string | Record<string, boolean>)[]
  containerClass?: string
  variant?: 'default' | 'immersive'
  hideHeader?: boolean
}>()

const meta = useToolMeta()
const title = computed(() => props.title ?? meta.value?.name ?? '')
const description = computed(() => props.description ?? meta.value?.description ?? '')
const isImmersive = computed(() => props.variant === 'immersive')
</script>

<template>
  <div
    class="tool-page"
    :class="[pageClass, isImmersive && 'tool-page--immersive']"
  >
    <div class="container" :class="containerClass">
      <header
        v-if="!hideHeader"
        class="tool-header"
        :class="{ 'tool-header--immersive': isImmersive }"
      >
        <h1 class="tool-header__title" :title="isImmersive ? description : undefined">
          {{ title }}
        </h1>
        <p v-if="!isImmersive && description" class="tool-header__desc">{{ description }}</p>
      </header>

      <slot />
    </div>
  </div>
</template>

<style scoped>
.tool-header--immersive {
  margin-bottom: 0.75rem;
}

.tool-header--immersive .tool-header__title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0;
}
</style>
