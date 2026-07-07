<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { tools } from '@/config/tools'
import ToolIcon from '@/components/ToolIcon.vue'

const route = useRoute()
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const open = ref(false)
const canHoverOpen = useMediaQuery('(hover: hover) and (pointer: fine)')

let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

const activeRoute = computed(() => route.path)

function clearTimers() {
  if (openTimer) clearTimeout(openTimer)
  if (closeTimer) clearTimeout(closeTimer)
  openTimer = null
  closeTimer = null
}

function setOpen(value: boolean) {
  clearTimers()
  open.value = value
}

function openWithDelay() {
  if (!canHoverOpen.value) return
  clearTimers()
  closeTimer = null
  openTimer = setTimeout(() => {
    open.value = true
  }, 150)
}

function closeWithDelay() {
  if (!canHoverOpen.value) return
  clearTimers()
  openTimer = null
  closeTimer = setTimeout(() => {
    open.value = false
  }, 150)
}

function togglePanel() {
  if (canHoverOpen.value) return
  open.value = !open.value
}

function onTriggerClick() {
  if (!canHoverOpen.value) togglePanel()
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  const root = rootRef.value
  if (root?.contains(event.target as Node)) return
  setOpen(false)
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') setOpen(false)
}

function isActive(toolRoute: string) {
  return activeRoute.value === toolRoute
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})

watch(() => route.path, () => setOpen(false))

onUnmounted(() => {
  clearTimers()
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div
    ref="rootRef"
    class="nav-tools"
    @mouseenter="openWithDelay"
    @mouseleave="closeWithDelay"
  >
    <button
      type="button"
      class="nav-tools__trigger"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="onTriggerClick"
    >
      <span>所有工具</span>
      <svg
        class="nav-tools__chevron"
        :class="{ 'nav-tools__chevron--open': open }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div
      v-show="open"
      class="nav-tools__panel"
      role="menu"
      aria-label="所有工具"
      @mouseenter="openWithDelay"
      @mouseleave="closeWithDelay"
    >
      <RouterLink
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.route"
        class="nav-tools__item"
        :class="{ 'nav-tools__item--active': isActive(tool.route) }"
        role="menuitem"
        @click="setOpen(false)"
      >
        <span class="nav-tools__icon" aria-hidden="true">
          <ToolIcon :icon="tool.icon" />
        </span>
        <span class="nav-tools__name">{{ tool.name }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.nav-tools {
  position: relative;
}

.nav-tools__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.nav-tools__trigger:hover,
.nav-tools__trigger[aria-expanded='true'] {
  color: var(--color-text);
  background: var(--color-surface);
}

.nav-tools__chevron {
  transition: transform var(--transition);
}

.nav-tools__chevron--open {
  transform: rotate(180deg);
}

.nav-tools__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 60;
  width: 22rem;
  max-width: calc(100vw - 2.5rem);
  padding: 0.5rem;
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
}

.nav-tools__panel::before {
  content: '';
  position: absolute;
  top: -0.625rem;
  left: 0;
  right: 0;
  height: 0.625rem;
}

.nav-tools__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--color-text);
  transition:
    background-color var(--transition),
    border-color var(--transition);
}

.nav-tools__item:hover {
  background: var(--color-surface);
}

.nav-tools__item--active {
  background: color-mix(in srgb, var(--color-cta) 12%, var(--color-bg));
  border: 1px solid color-mix(in srgb, var(--color-cta) 40%, transparent);
}

.nav-tools__item--active:hover {
  background: color-mix(in srgb, var(--color-cta) 18%, var(--color-bg));
}

.nav-tools__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--color-cta);
}

.nav-tools__icon :deep(.tool-icon) {
  width: 18px;
  height: 18px;
}

.nav-tools__name {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
  min-width: 0;
}
</style>
