<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ToolPage from '@/components/ToolPage.vue'
import CopyToast from '@/components/CopyToast.vue'
import TButton from '@/components/TButton.vue'
import { useClipboard } from '@/composables/useClipboard'
import {
  SAMPLE_SVG,
  applySvgOptions,
  detectInitialOptions,
  downloadBlob,
  parseSvg,
  svgToPng,
  type SvgEditorOptions,
} from '@/utils/svgEditor'

const input = ref(SAMPLE_SVG)
const color = ref('#171717')
const size = ref(64)
const strokeWidth = ref(2)
const parseError = ref('')
const downloadError = ref('')
const isDownloading = ref(false)

const { copied, copy } = useClipboard()

const SIZE_PRESETS = [16, 24, 32, 48, 64, 96, 128]

const result = computed(() => {
  const parsed = parseSvg(input.value)
  if ('error' in parsed) {
    parseError.value = parsed.error
    return ''
  }

  parseError.value = ''
  const options: SvgEditorOptions = {
    color: color.value,
    size: size.value,
    strokeWidth: strokeWidth.value,
  }
  return applySvgOptions(parsed.svg, options)
})

const hasPreview = computed(() => Boolean(result.value))

function loadSample() {
  input.value = SAMPLE_SVG
}

function clearAll() {
  input.value = ''
  parseError.value = ''
  downloadError.value = ''
}

async function downloadPng() {
  if (!result.value) return

  isDownloading.value = true
  downloadError.value = ''
  try {
    const blob = await svgToPng(result.value, size.value)
    downloadBlob(blob, `icon-${size.value}.png`)
  } catch (e) {
    downloadError.value = e instanceof Error ? e.message : 'PNG 下载失败'
  } finally {
    isDownloading.value = false
  }
}

let autoDetect = true
watch(input, () => {
  if (!autoDetect) return
  const parsed = parseSvg(input.value)
  if ('error' in parsed) return

  const detected = detectInitialOptions(parsed.svg)
  if (detected.size) size.value = detected.size
  if (detected.strokeWidth) strokeWidth.value = detected.strokeWidth
  if (detected.color) color.value = detected.color
})

watch([color, size, strokeWidth], () => {
  autoDetect = false
})
</script>

<template>
  <ToolPage>
    <div class="tool-panel">
        <div class="svg-editor-layout">
          <div class="svg-editor-input">
            <label class="field-label" for="svg-input">SVG 代码</label>
            <textarea
              id="svg-input"
              v-model="input"
              class="field-textarea svg-editor-textarea"
              placeholder="粘贴 SVG 代码，如从 Lucide 复制的图标"
              spellcheck="false"
            />
            <p v-if="parseError" class="field-error" role="alert">{{ parseError }}</p>
          </div>

          <div class="svg-editor-preview-section">
            <h2 class="svg-editor-section-title">预览</h2>
            <div class="svg-editor-preview-wrap">
              <div class="svg-editor-preview-box">
                <div
                  v-if="hasPreview"
                  class="svg-editor-preview-content"
                  v-html="result"
                />
                <div v-else class="svg-editor-preview-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.375 2.625a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414L14.5 12.5l-3 1 1-3Z" />
                  </svg>
                  <span>粘贴 SVG 后在此预览</span>
                </div>
              </div>
              <p v-if="hasPreview" class="svg-editor-preview-meta">
                {{ size }} × {{ size }}px · 描边 {{ strokeWidth }}px
              </p>
            </div>
          </div>
        </div>

        <div class="svg-editor-controls">
          <div class="svg-editor-control">
            <label class="field-label" for="svg-color">颜色</label>
            <div class="svg-editor-color-row">
              <input
                id="svg-color"
                v-model="color"
                type="color"
                class="svg-editor-color-picker"
              />
              <input
                v-model="color"
                type="text"
                class="field-input svg-editor-color-text"
                spellcheck="false"
              />
            </div>
          </div>

          <div class="svg-editor-control">
            <label class="field-label" for="svg-size">
              尺寸
              <span class="svg-editor-control-value">{{ size }}px</span>
            </label>
            <input
              id="svg-size"
              v-model.number="size"
              type="range"
              class="svg-editor-range"
              min="8"
              max="256"
              step="1"
            />
            <div class="svg-editor-presets">
              <button
                v-for="preset in SIZE_PRESETS"
                :key="preset"
                class="svg-editor-preset-btn"
                :class="{ 'svg-editor-preset-btn--active': size === preset }"
                @click="size = preset"
              >
                {{ preset }}
              </button>
            </div>
          </div>

          <div class="svg-editor-control">
            <label class="field-label" for="svg-stroke">
              描边宽度
              <span class="svg-editor-control-value">{{ strokeWidth }}px</span>
            </label>
            <input
              id="svg-stroke"
              v-model.number="strokeWidth"
              type="range"
              class="svg-editor-range"
              min="0.5"
              max="8"
              step="0.5"
            />
          </div>
        </div>

        <div v-if="hasPreview" class="svg-editor-output">
          <label class="field-label" for="svg-output">输出代码</label>
          <textarea
            id="svg-output"
            :value="result"
            class="field-textarea svg-editor-textarea"
            readonly
            spellcheck="false"
          />
        </div>

        <div class="tool-actions">
          <TButton size="sm" @click="loadSample">加载示例</TButton>
          <TButton size="sm" @click="clearAll">清空</TButton>
          <TButton
            v-if="hasPreview"
            size="sm"
            :disabled="isDownloading"
            @click="downloadPng"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {{ isDownloading ? '生成中…' : '下载 PNG' }}
          </TButton>
          <TButton
            v-if="hasPreview"
            variant="primary"
            size="sm"
            @click="copy(result)"
          >
            {{ copied ? '已复制' : '复制 SVG' }}
          </TButton>
        </div>
        <p v-if="downloadError" class="field-error" role="alert">{{ downloadError }}</p>
      </div>
  </ToolPage>

  <CopyToast :show="copied" />
</template>

<style scoped>
.svg-editor-layout {
  display: grid;
  gap: 2rem;
}

@media (min-width: 768px) {
  .svg-editor-layout {
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
  }
}

.svg-editor-textarea {
  min-height: 14rem;
}

.svg-editor-section-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.svg-editor-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.svg-editor-preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 14rem;
  padding: 2rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background:
    repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px;
}

[data-theme='dark'] .svg-editor-preview-box {
  background:
    repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 50% / 16px 16px;
}

.svg-editor-preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-editor-preview-content :deep(svg) {
  display: block;
  max-width: 100%;
  height: auto;
}

.svg-editor-preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-subtle);
  font-size: 0.875rem;
}

.svg-editor-preview-meta {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.svg-editor-controls {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1.5px solid var(--color-border);
}

@media (min-width: 768px) {
  .svg-editor-controls {
    grid-template-columns: repeat(3, 1fr);
  }
}

.svg-editor-control-value {
  float: right;
  font-weight: 500;
  color: var(--color-text-muted);
}

.svg-editor-color-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.svg-editor-color-picker {
  width: 2.75rem;
  height: 2.75rem;
  padding: 0.125rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  cursor: pointer;
}

.svg-editor-color-text {
  flex: 1;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

.svg-editor-range {
  width: 100%;
  margin-top: 0.5rem;
  accent-color: var(--color-cta);
}

.svg-editor-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.625rem;
}

.svg-editor-preset-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition), border-color var(--transition);
}

.svg-editor-preset-btn:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.svg-editor-preset-btn--active {
  background: var(--color-cta);
  color: #171717;
  border-color: var(--color-cta);
}

.svg-editor-output {
  margin-top: 1.5rem;
}
</style>
