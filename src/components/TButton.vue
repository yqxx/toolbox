<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'default' | 'sm'
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'secondary',
    size: 'default',
    type: 'button',
    disabled: false,
  },
)

const variantClass = computed(() => {
  if (props.variant === 'primary') return 'btn-primary'
  if (props.variant === 'ghost') return 'btn-ghost'
  return 'btn-secondary'
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="btn"
    :class="[variantClass, size === 'sm' && 'btn-sm']"
  >
    <slot />
  </button>
</template>
