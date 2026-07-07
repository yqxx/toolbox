<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@/composables/useClipboard'

const input = ref('')
const output = ref('')
const error = ref('')
const mode = ref<'encode' | 'decode'>('encode')

const { copied, copy } = useClipboard()

function process() {
  error.value = ''
  output.value = ''
  if (!input.value.trim()) return

  try {
    output.value =
      mode.value === 'encode'
        ? encodeURIComponent(input.value)
        : decodeURIComponent(input.value)
  } catch {
    error.value = mode.value === 'decode' ? '解码失败：输入不是有效的 URL 编码字符串' : '编码失败'
  }
}

function swap() {
  if (output.value) {
    input.value = output.value
    output.value = ''
    error.value = ''
    mode.value = mode.value === 'encode' ? 'decode' : 'encode'
    process()
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}

watch([input, mode], process)
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
        <h1 class="tool-header__title">URL 编解码</h1>
        <p class="tool-header__desc">使用 encodeURIComponent / decodeURIComponent 进行 URL 编码与解码</p>
      </header>

      <div class="tool-panel">
        <div class="mode-tabs" role="tablist">
          <button
            role="tab"
            class="mode-tab"
            :class="{ 'mode-tab--active': mode === 'encode' }"
            :aria-selected="mode === 'encode'"
            @click="mode = 'encode'"
          >
            编码
          </button>
          <button
            role="tab"
            class="mode-tab"
            :class="{ 'mode-tab--active': mode === 'decode' }"
            :aria-selected="mode === 'decode'"
            @click="mode = 'decode'"
          >
            解码
          </button>
        </div>

        <div class="tool-grid-2" style="margin-top: 1.5rem">
          <div>
            <label class="field-label" for="url-input">输入</label>
            <textarea
              id="url-input"
              v-model="input"
              class="field-textarea"
              :placeholder="mode === 'encode' ? '输入需要编码的字符串，如 hello world?foo=bar' : '输入 URL 编码字符串，如 hello%20world%3Ffoo%3Dbar'"
              spellcheck="false"
            />
          </div>
          <div>
            <label class="field-label" for="url-output">输出</label>
            <textarea
              id="url-output"
              :value="output"
              class="field-textarea"
              readonly
              placeholder="结果将显示在这里"
              spellcheck="false"
            />
            <p v-if="error" class="field-error" role="alert">{{ error }}</p>
          </div>
        </div>

        <div class="tool-actions">
          <button class="btn btn-secondary btn-sm" @click="swap">交换输入/输出</button>
          <button class="btn btn-secondary btn-sm" @click="clearAll">清空</button>
          <button
            v-if="output"
            class="btn btn-primary btn-sm"
            @click="copy(output)"
          >
            {{ copied ? '已复制' : '复制结果' }}
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
