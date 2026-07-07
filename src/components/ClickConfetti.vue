<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import '@/styles/confetti.css'

interface Burst {
  id: number
  x: number
  y: number
}

const bursts = ref<Burst[]>([])
let nextId = 0
let reducedMotion = false

function spawn(x: number, y: number) {
  if (reducedMotion) return

  const id = ++nextId
  bursts.value.push({ id, x, y })

  window.setTimeout(() => {
    bursts.value = bursts.value.filter((burst) => burst.id !== id)
  }, 1000)
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  spawn(e.clientX, e.clientY)
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.addEventListener('pointerdown', onPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-for="burst in bursts"
      :key="burst.id"
      class="click-confetti confetti-button animate"
      data-confetti-text=""
      :style="{ left: `${burst.x}px`, top: `${burst.y}px` }"
      aria-hidden="true"
    />
  </Teleport>
</template>

<style scoped>
.click-confetti {
  position: fixed;
  z-index: 9999;
  width: 48px;
  height: 48px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  overflow: visible;
  isolation: isolate;
}

.click-confetti::before,
.click-confetti::after {
  z-index: 1;
  width: 160px;
  height: 48px;
  left: 50%;
  margin-left: -80px;
}

.click-confetti::before {
  transform: rotate(-8deg);
}
</style>
