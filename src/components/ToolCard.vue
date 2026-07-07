<script setup lang="ts">

import { RouterLink } from 'vue-router'

import type { ToolItem } from '@/config/tools'

import ToolIcon from './ToolIcon.vue'



defineProps<{

  tool: ToolItem

}>()

</script>



<template>

  <RouterLink :to="tool.route" class="tool-card" :aria-label="`${tool.name}：${tool.description}`">

    <div class="tool-card__icon">

      <ToolIcon :icon="tool.icon" />

    </div>

    <div class="tool-card__body">

      <h3 class="tool-card__title">{{ tool.name }}</h3>

      <p class="tool-card__desc">{{ tool.description }}</p>

    </div>

    <svg

      class="tool-card__arrow"

      width="20"

      height="20"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      stroke-width="2"

      stroke-linecap="round"

      stroke-linejoin="round"

      aria-hidden="true"

    >

      <line x1="5" y1="12" x2="19" y2="12" />

      <polyline points="12 5 19 12 12 19" />

    </svg>

  </RouterLink>

</template>



<style scoped>

.tool-card {

  display: flex;

  align-items: flex-start;

  gap: 1rem;

  padding: 1.25rem 1.5rem;

  background: var(--color-bg);

  border: 1.5px solid var(--color-border);

  border-radius: var(--radius-md);

  cursor: pointer;

  transition: border-color var(--transition), background-color var(--transition);

}



.tool-card:hover {

  border-color: var(--color-cta);

  background: var(--color-surface);

}



.tool-card__icon {

  display: flex;

  align-items: center;

  justify-content: center;

  width: 2.75rem;

  height: 2.75rem;

  flex-shrink: 0;

  background: var(--color-surface);

  border: 1.5px solid var(--color-border);

  border-radius: var(--radius-sm);

  color: var(--color-cta);

}



.tool-card__body {

  flex: 1;

  min-width: 0;

}



.tool-card__title {

  font-size: 1rem;

  font-weight: 600;

  letter-spacing: -0.01em;

  margin-bottom: 0.25rem;

}



.tool-card__desc {

  font-size: 0.875rem;

  color: var(--color-text-muted);

  line-height: 1.5;

}



.tool-card__arrow {

  flex-shrink: 0;

  margin-top: 0.25rem;

  color: var(--color-text-subtle);

  transition: color var(--transition), transform var(--transition);

}



.tool-card:hover .tool-card__arrow {

  color: var(--color-cta);

  transform: translateX(2px);

}

</style>


