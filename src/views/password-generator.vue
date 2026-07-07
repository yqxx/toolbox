<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@/composables/useClipboard'
import {
  DEFAULT_PASSWORD_OPTIONS,
  estimateStrength,
  generatePassword,
  strengthLabels,
  type PasswordOptions,
} from '@/utils/passwordGenerator'

const options = ref<PasswordOptions>({ ...DEFAULT_PASSWORD_OPTIONS })
const count = ref(1)
const passwords = ref<string[]>([])
const error = ref('')

const { copied, copy } = useClipboard()

const strength = computed(() => {
  if (!passwords.value[0]) return null
  return estimateStrength(passwords.value[0], options.value)
})

const hasSelection = computed(
  () =>
    options.value.lowercase ||
    options.value.uppercase ||
    options.value.numbers ||
    options.value.symbols,
)

function generate() {
  error.value = ''
  if (!hasSelection.value) {
    error.value = '请至少选择一种字符类型'
    passwords.value = []
    return
  }

  try {
    passwords.value = Array.from({ length: count.value }, () => generatePassword(options.value))
  } catch (e) {
    passwords.value = []
    error.value = e instanceof Error ? e.message : '生成失败'
  }
}

function copyAll() {
  if (!passwords.value.length) return
  copy(passwords.value.join('\n'))
}

generate()
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
        <h1 class="tool-header__title">随机密码生成</h1>
        <p class="tool-header__desc">使用加密级随机数生成安全密码，支持自定义长度与字符集</p>
      </header>

      <div class="tool-panel">
        <div class="pwd-options">
          <div class="pwd-option">
            <label class="field-label" for="pwd-length">
              密码长度
              <span class="pwd-option__value">{{ options.length }}</span>
            </label>
            <input
              id="pwd-length"
              v-model.number="options.length"
              type="range"
              class="pwd-range"
              min="6"
              max="64"
              step="1"
              @change="generate"
            />
          </div>

          <div class="pwd-option">
            <label class="field-label" for="pwd-count">
              生成数量
              <span class="pwd-option__value">{{ count }}</span>
            </label>
            <input
              id="pwd-count"
              v-model.number="count"
              type="range"
              class="pwd-range"
              min="1"
              max="10"
              step="1"
              @change="generate"
            />
          </div>
        </div>

        <div class="pwd-charset">
          <span class="field-label">字符类型</span>
          <div class="pwd-charset__grid">
            <label class="pwd-check">
              <input v-model="options.lowercase" type="checkbox" @change="generate" />
              <span>小写字母 a-z</span>
            </label>
            <label class="pwd-check">
              <input v-model="options.uppercase" type="checkbox" @change="generate" />
              <span>大写字母 A-Z</span>
            </label>
            <label class="pwd-check">
              <input v-model="options.numbers" type="checkbox" @change="generate" />
              <span>数字 0-9</span>
            </label>
            <label class="pwd-check">
              <input v-model="options.symbols" type="checkbox" @change="generate" />
              <span>符号 !@#$…</span>
            </label>
            <label class="pwd-check pwd-check--full">
              <input v-model="options.excludeAmbiguous" type="checkbox" @change="generate" />
              <span>排除易混淆字符（0/O、1/l/I）</span>
            </label>
          </div>
        </div>

        <div class="pwd-result">
          <div class="pwd-result__header">
            <label class="field-label" for="pwd-output">生成结果</label>
            <span
              v-if="strength"
              class="pwd-strength"
              :class="`pwd-strength--${strength}`"
            >
              强度：{{ strengthLabels[strength] }}
            </span>
          </div>
          <textarea
            id="pwd-output"
            :value="passwords.join('\n')"
            class="field-textarea pwd-output"
            readonly
            spellcheck="false"
            placeholder="点击重新生成获取密码"
          />
          <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        </div>

        <div class="tool-actions">
          <button class="btn btn-primary btn-sm" @click="generate">重新生成</button>
          <button
            v-if="passwords.length"
            class="btn btn-secondary btn-sm"
            @click="copyAll"
          >
            {{ copied ? '已复制' : '复制全部' }}
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
.pwd-options {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .pwd-options {
    grid-template-columns: 1fr 1fr;
  }
}

.pwd-option__value {
  float: right;
  font-weight: 500;
  color: var(--color-text-muted);
}

.pwd-range {
  width: 100%;
  margin-top: 0.5rem;
  accent-color: var(--color-cta);
}

.pwd-charset {
  margin-top: 1.5rem;
}

.pwd-charset__grid {
  display: grid;
  gap: 0.625rem;
  margin-top: 0.5rem;
}

@media (min-width: 768px) {
  .pwd-charset__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pwd-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
}

.pwd-check--full {
  grid-column: 1 / -1;
}

.pwd-check input {
  accent-color: var(--color-cta);
}

.pwd-result {
  margin-top: 1.5rem;
}

.pwd-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.375rem;
}

.pwd-output {
  min-height: 6rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.pwd-strength {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
}

.pwd-strength--weak {
  background: #fee2e2;
  color: #991b1b;
}

.pwd-strength--fair {
  background: #fef3c7;
  color: #92400e;
}

.pwd-strength--strong {
  background: #dcfce7;
  color: #166534;
}

.pwd-strength--very-strong {
  background: color-mix(in srgb, var(--color-cta) 20%, transparent);
  color: #171717;
}

[data-theme='dark'] .pwd-strength--weak {
  background: #450a0a;
  color: #fca5a5;
}

[data-theme='dark'] .pwd-strength--fair {
  background: #451a03;
  color: #fcd34d;
}

[data-theme='dark'] .pwd-strength--strong {
  background: #052e16;
  color: #86efac;
}

[data-theme='dark'] .pwd-strength--very-strong {
  color: var(--color-cta);
}
</style>
