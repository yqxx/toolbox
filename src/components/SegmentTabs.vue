<script setup lang="ts" generic="T extends string | number">
export interface SegmentTab<T extends string | number = string> {
  value: T
  label: string
}

const model = defineModel<T>({ required: true })

withDefaults(
  defineProps<{
    tabs: SegmentTab<T>[]
    ariaLabel?: string
  }>(),
  {
    ariaLabel: '选项切换',
  },
)
</script>

<template>
  <div class="segment-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="tab in tabs"
      :key="String(tab.value)"
      type="button"
      role="tab"
      class="segment-tab"
      :class="{ 'segment-tab--active': model === tab.value }"
      :aria-selected="model === tab.value"
      @click="model = tab.value"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.segment-tabs {
  display: inline-flex;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.segment-tab {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition);
}

.segment-tab:hover {
  background: var(--color-surface);
}

.segment-tab--active {
  background: var(--color-cta);
  color: #171717;
}

.segment-tab--active:hover {
  background: var(--color-cta-hover);
}
</style>
