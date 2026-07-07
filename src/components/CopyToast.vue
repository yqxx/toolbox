<script setup lang="ts">
withDefaults(
  defineProps<{
    show: boolean
    message?: string
  }>(),
  {
    message: '已复制到剪贴板',
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="copy-toast" role="status">{{ message }}</div>
  </Teleport>
</template>
