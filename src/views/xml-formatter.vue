<script setup lang="ts">
import { ref, watch } from 'vue'
import ToolPage from '@/components/ToolPage.vue'
import CopyToast from '@/components/CopyToast.vue'
import TButton from '@/components/TButton.vue'
import SegmentTabs from '@/components/SegmentTabs.vue'
import { useClipboard } from '@/composables/useClipboard'
import { formatXml, minifyXml } from '@/utils/xmlFormat'

const input = ref('')
const output = ref('')
const error = ref('')
const mode = ref<'format' | 'minify'>('format')
const indent = ref<2 | 4 | 0>(2)

const modeTabs = [
  { value: 'format' as const, label: '格式化' },
  { value: 'minify' as const, label: '压缩' },
]

const indentOptions = [
  { value: 2, label: '2 空格' },
  { value: 4, label: '4 空格' },
  { value: 0, label: 'Tab' },
]

const { copied, copy } = useClipboard()

function process() {
  error.value = ''
  output.value = ''
  if (!input.value.trim()) return

  const result =
    mode.value === 'format'
      ? formatXml(input.value, indent.value)
      : minifyXml(input.value)

  output.value = result.output
  error.value = result.error ?? ''
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}

watch([input, mode, indent], process)
</script>

<template>
  <ToolPage>
    <div class="tool-panel">
      <div class="formatter-toolbar">
        <SegmentTabs v-model="mode" :tabs="modeTabs" aria-label="XML 处理模式" />

        <label v-if="mode === 'format'" class="formatter-indent">
          <span class="field-label">缩进</span>
          <select v-model="indent" class="field-select">
            <option v-for="opt in indentOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="tool-grid-2" style="margin-top: 1.5rem">
        <div>
          <label class="field-label" for="xml-input">输入 XML</label>
          <textarea
            id="xml-input"
            v-model="input"
            class="field-textarea field-textarea--code"
            placeholder="<root><item id=&quot;1&quot;>Hello</item></root>"
            spellcheck="false"
          />
        </div>
        <div>
          <label class="field-label" for="xml-output">输出</label>
          <textarea
            id="xml-output"
            :value="output"
            class="field-textarea field-textarea--code"
            readonly
            placeholder="结果将显示在这里"
            spellcheck="false"
          />
          <p v-if="error" class="field-error" role="alert">{{ error }}</p>
        </div>
      </div>

      <div class="tool-actions">
        <TButton size="sm" @click="clearAll">清空</TButton>
        <TButton v-if="output" variant="primary" size="sm" @click="copy(output)">
          {{ copied ? '已复制' : '复制结果' }}
        </TButton>
      </div>
    </div>
  </ToolPage>

  <CopyToast :show="copied" />
</template>

<style scoped>
.formatter-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.5rem;
}

.formatter-indent {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-select {
  min-width: 7rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--bg);
  color: var(--text);
  font: inherit;
}

.field-textarea--code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  min-height: 20rem;
}
</style>
