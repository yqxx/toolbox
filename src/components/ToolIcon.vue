<script setup lang="ts">
import type { ToolItem } from '@/config/tools'

defineProps<{
  icon: ToolItem['icon']
}>()
</script>

<template>
  <svg
    class="tool-icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- link -->
    <template v-if="icon === 'link'">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </template>
    <!-- clock -->
    <template v-else-if="icon === 'clock'">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </template>
    <!-- code -->
    <template v-else-if="icon === 'code'">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </template>
    <!-- hash -->
    <template v-else-if="icon === 'hash'">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </template>
    <!-- json -->
    <template v-else-if="icon === 'json'">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
      <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
    </template>
    <!-- base64 -->
    <template v-else-if="icon === 'base64'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 8h4v8H7z" />
      <path d="M13 8h4l-2 8z" />
    </template>
    <!-- ico -->
    <template v-else-if="icon === 'ico'">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </template>
    <!-- svg -->
    <template v-else-if="icon === 'svg'">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414L14.5 12.5l-3 1 1-3Z" />
    </template>
  </svg>
</template>

<style scoped>
.tool-icon {
  flex-shrink: 0;
}
</style>
