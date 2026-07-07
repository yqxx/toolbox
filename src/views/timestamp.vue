<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ToolPage from '@/components/ToolPage.vue'
import CopyToast from '@/components/CopyToast.vue'
import TButton from '@/components/TButton.vue'
import SegmentTabs from '@/components/SegmentTabs.vue'
import { useClipboard } from '@/composables/useClipboard'

const timestampInput = ref('')
const dateInput = ref('')
const unit = ref<'s' | 'ms'>('s')
const unitTabs = [
  { value: 's' as const, label: '秒 (s)' },
  { value: 'ms' as const, label: '毫秒 (ms)' },
]
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
  <ToolPage>
    <div class="now-bar">
        <div class="now-bar__item">
          <span class="now-bar__label">当前时间戳</span>
          <code class="now-bar__value">{{ currentTimestamp }}</code>
        </div>
        <div class="now-bar__item">
          <span class="now-bar__label">当前时间</span>
          <code class="now-bar__value">{{ currentDate }}</code>
        </div>
        <TButton size="sm" @click="useNow">使用当前时间</TButton>
      </div>

      <div class="tool-panel">
        <SegmentTabs
          v-model="unit"
          :tabs="unitTabs"
          aria-label="时间戳单位"
          @update:model-value="parseTimestamp(timestampInput)"
        />

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
          <TButton size="sm" @click="clearAll">清空</TButton>
          <TButton
            v-if="timestampInput"
            variant="primary"
            size="sm"
            @click="copy(timestampInput)"
          >
            复制时间戳
          </TButton>
          <TButton
            v-if="dateInput"
            variant="primary"
            size="sm"
            @click="copy(dateInput)"
          >
            复制日期
          </TButton>
        </div>
      </div>
  </ToolPage>

  <CopyToast :show="copied" />
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
</style>
