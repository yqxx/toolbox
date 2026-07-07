<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@/composables/useClipboard'

const timestampInput = ref('')
const dateInput = ref('')
const unit = ref<'s' | 'ms'>('s')
const now = ref(Date.now())
const tsError = ref('')
const dateError = ref('')

const { copied, copy } = useClipboard()

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const currentTimestamp = computed(() =>
  unit.value === 's' ? Math.floor(now.value / 1000) : now.value,
)

const currentDate = computed(() => formatDate(now.value))

function formatDate(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function parseTimestamp(val: string) {
  tsError.value = ''
  dateError.value = ''
  if (!val.trim()) {
    dateInput.value = ''
    return
  }

  const num = Number(val.trim())
  if (!Number.isFinite(num)) {
    tsError.value = '请输入有效的数字'
    dateInput.value = ''
    return
  }

  const ms = unit.value === 's' ? num * 1000 : num
  if (ms < 0 || ms > 8.64e15) {
    tsError.value = '时间戳超出有效范围'
    dateInput.value = ''
    return
  }

  dateInput.value = formatDate(ms)
}

function parseDate(val: string) {
  dateError.value = ''
  tsError.value = ''
  if (!val.trim()) {
    timestampInput.value = ''
    return
  }

  const ms = new Date(val.trim()).getTime()
  if (Number.isNaN(ms)) {
    dateError.value = '请输入有效的日期时间，如 2026-07-03 15:30:00'
    timestampInput.value = ''
    return
  }

  timestampInput.value = String(unit.value === 's' ? Math.floor(ms / 1000) : ms)
}

function useNow() {
  timestampInput.value = String(currentTimestamp.value)
  dateInput.value = currentDate.value
  tsError.value = ''
  dateError.value = ''
}

function clearAll() {
  timestampInput.value = ''
  dateInput.value = ''
  tsError.value = ''
  dateError.value = ''
}
</script>

<template>
  <div class="tool-page">
    <div class="container">
      <header class="tool-header">
        <RouterLink to="/" class="tool-header__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回首页
        </RouterLink>
        <h1 class="tool-header__title">时间戳转换</h1>
        <p class="tool-header__desc">Unix 时间戳与日期时间互转，支持秒级与毫秒级</p>
      </header>

      <div class="now-bar">
        <div class="now-bar__item">
          <span class="now-bar__label">当前时间戳</span>
          <code class="now-bar__value">{{ currentTimestamp }}</code>
        </div>
        <div class="now-bar__item">
          <span class="now-bar__label">当前时间</span>
          <code class="now-bar__value">{{ currentDate }}</code>
        </div>
        <button class="btn btn-secondary btn-sm" @click="useNow">使用当前时间</button>
      </div>

      <div class="tool-panel">
        <div class="mode-tabs" role="tablist">
          <button
            role="tab"
            class="mode-tab"
            :class="{ 'mode-tab--active': unit === 's' }"
            :aria-selected="unit === 's'"
            @click="unit = 's'; parseTimestamp(timestampInput)"
          >
            秒 (s)
          </button>
          <button
            role="tab"
            class="mode-tab"
            :class="{ 'mode-tab--active': unit === 'ms' }"
            :aria-selected="unit === 'ms'"
            @click="unit = 'ms'; parseTimestamp(timestampInput)"
          >
            毫秒 (ms)
          </button>
        </div>

        <div class="tool-grid-2" style="margin-top: 1.5rem">
          <div>
            <label class="field-label" for="ts-input">时间戳</label>
            <input
              id="ts-input"
              v-model="timestampInput"
              type="text"
              class="field-input"
              inputmode="numeric"
              placeholder="如 1751529600"
              @input="parseTimestamp(timestampInput)"
            />
            <p v-if="tsError" class="field-error" role="alert">{{ tsError }}</p>
          </div>
          <div>
            <label class="field-label" for="date-input">日期时间</label>
            <input
              id="date-input"
              v-model="dateInput"
              type="text"
              class="field-input"
              placeholder="如 2026-07-03 15:30:00"
              @input="parseDate(dateInput)"
            />
            <p v-if="dateError" class="field-error" role="alert">{{ dateError }}</p>
          </div>
        </div>

        <div class="tool-actions">
          <button class="btn btn-secondary btn-sm" @click="clearAll">清空</button>
          <button
            v-if="timestampInput"
            class="btn btn-primary btn-sm"
            @click="copy(timestampInput)"
          >
            复制时间戳
          </button>
          <button
            v-if="dateInput"
            class="btn btn-primary btn-sm"
            @click="copy(dateInput)"
          >
            复制日期
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="copied" class="copy-toast" role="status">已复制到剪贴板</div>
    </Teleport>
  </div>
</template>

<style scoped>
.now-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.now-bar__item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.now-bar__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.now-bar__value {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9375rem;
  font-weight: 500;
}

.mode-tabs {
  display: inline-flex;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.mode-tab {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition);
}

.mode-tab:hover {
  background: var(--color-surface);
}

.mode-tab--active {
  background: var(--color-cta);
  color: #171717;
}

.mode-tab--active:hover {
  background: var(--color-cta-hover);
}
</style>
