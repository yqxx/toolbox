<script setup lang="ts">
import { ref, watch } from 'vue'
import ToolPage from '@/components/ToolPage.vue'
import CopyToast from '@/components/CopyToast.vue'
import TButton from '@/components/TButton.vue'
import SegmentTabs from '@/components/SegmentTabs.vue'
import { useClipboard } from '@/composables/useClipboard'

const input = ref('')
const output = ref('')
const error = ref('')
const mode = ref<'encode' | 'decode'>('encode')

const modeTabs = [
  { value: 'encode' as const, label: '编码' },
  { value: 'decode' as const, label: '解码' },
]

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
  <ToolPage>
    <div class="tool-panel">
        <SegmentTabs v-model="mode" :tabs="modeTabs" aria-label="编解码模式" />

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
          <TButton size="sm" @click="swap">交换输入/输出</TButton>
          <TButton size="sm" @click="clearAll">清空</TButton>
          <TButton
            v-if="output"
            variant="primary"
            size="sm"
            @click="copy(output)"
          >
            {{ copied ? '已复制' : '复制结果' }}
          </TButton>
        </div>
      </div>
  </ToolPage>

  <CopyToast :show="copied" />
</template>
