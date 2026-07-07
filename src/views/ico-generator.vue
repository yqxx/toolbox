<script setup lang="ts">
import { ref, watch, useTemplateRef, nextTick, onUnmounted } from 'vue'
import ToolPage from '@/components/ToolPage.vue'
import TButton from '@/components/TButton.vue'
import {
  generateIco,
  loadImageFromFile,
  renderPreview,
  PREVIEW_SIZES,
  type PreviewSize,
} from '@/utils/icoGenerator'

const image = ref<HTMLImageElement | null>(null)
const imageUrl = ref('')
const fileName = ref('')
const previewSize = ref<PreviewSize>(32)
const error = ref('')
const isDragging = ref(false)
const isGenerating = ref(false)

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const previewCanvas = useTemplateRef<HTMLCanvasElement>('previewCanvas')

function revokeImageUrl() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

async function handleFile(file: File) {
  error.value = ''
  try {
    revokeImageUrl()
    const loaded = await loadImageFromFile(file)
    image.value = loaded.image
    imageUrl.value = loaded.url
    fileName.value = file.name.replace(/\.[^.]+$/, '')
  } catch (e) {
    image.value = null
    fileName.value = ''
    error.value = e instanceof Error ? e.message : '图片加载失败'
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function openFilePicker() {
  fileInput.value?.click()
}

function clearImage() {
  revokeImageUrl()
  image.value = null
  fileName.value = ''
  error.value = ''
}

async function downloadIco() {
  if (!image.value) return

  isGenerating.value = true
  error.value = ''
  try {
    const blob = await generateIco(image.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'favicon.ico'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'ICO 生成失败'
  } finally {
    isGenerating.value = false
  }
}

watch([image, previewSize], async () => {
  if (!image.value) return
  await nextTick()
  if (previewCanvas.value) {
    renderPreview(image.value, previewSize.value, previewCanvas.value)
  }
})

onUnmounted(revokeImageUrl)
</script>

<template>
  <ToolPage>
    <div class="tool-panel">
        <div class="ico-layout">
          <!-- Upload -->
          <div class="ico-upload-section">
            <input
              ref="fileInput"
              type="file"
              accept="image/png,image/jpeg,image/gif"
              class="ico-file-input"
              @change="onFileChange"
            />

            <div
              v-if="!image"
              class="ico-dropzone"
              :class="{ 'ico-dropzone--active': isDragging }"
              role="button"
              tabindex="0"
              @click="openFilePicker"
              @keydown.enter="openFilePicker"
              @keydown.space.prevent="openFilePicker"
              @drop="onDrop"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
            >
              <svg class="ico-dropzone__icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p class="ico-dropzone__title">点击或拖拽图片到此处</p>
              <p class="ico-dropzone__hint">支持 PNG、JPG、GIF 格式</p>
            </div>

            <div v-else class="ico-source">
              <img :src="imageUrl" :alt="fileName" class="ico-source__img" />
              <TButton size="sm" @click="clearImage">重新上传</TButton>
            </div>

            <p v-if="error" class="field-error" role="alert">{{ error }}</p>
          </div>

          <!-- Preview -->
          <div class="ico-preview-section">
            <h2 class="ico-section-title">预览</h2>

            <div class="ico-preview-wrap">
              <div class="ico-preview-box" :style="{ width: `${Math.min(previewSize, 256)}px`, height: `${Math.min(previewSize, 256)}px` }">
                <canvas
                  v-show="image"
                  ref="previewCanvas"
                  class="ico-preview-canvas"
                />
                <div v-if="!image" class="ico-preview-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              </div>
              <p v-if="image" class="ico-preview-size-label">图标大小: {{ previewSize }}px</p>
            </div>

            <div class="ico-size-picker">
              <span class="field-label">选择预览尺寸</span>
              <div class="ico-size-grid">
                <button
                  v-for="size in PREVIEW_SIZES"
                  :key="size"
                  class="ico-size-btn"
                  :class="{ 'ico-size-btn--active': previewSize === size }"
                  :disabled="!image"
                  @click="previewSize = size"
                >
                  {{ size }}px
                </button>
              </div>
            </div>

            <div class="tool-actions" style="margin-top: 1.5rem">
              <TButton
                variant="primary"
                :disabled="!image || isGenerating"
                @click="downloadIco"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {{ isGenerating ? '生成中…' : '下载 favicon.ico' }}
              </TButton>
            </div>
          </div>
        </div>

        <div class="ico-instructions">
          <h3 class="ico-instructions__title">使用说明</h3>
          <ol class="ico-instructions__list">
            <li>上传 PNG、JPG 或 GIF 格式的图片</li>
            <li>选择适合的图标尺寸预览效果</li>
            <li>点击下载按钮获取 favicon.ico 文件（内含 16–256px 多尺寸）</li>
          </ol>
          <p class="ico-instructions__tip">
            <strong>小贴士：</strong>推荐使用 32px 或 64px 尺寸预览，PNG 格式可保留透明背景
          </p>
        </div>
      </div>
  </ToolPage>
</template>

<style scoped>
.ico-layout {
  display: grid;
  gap: 2rem;
}

@media (min-width: 768px) {
  .ico-layout {
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
  }
}

.ico-file-input {
  display: none;
}

.ico-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 14rem;
  padding: 2rem;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color var(--transition), background-color var(--transition);
}

.ico-dropzone:hover,
.ico-dropzone--active {
  border-color: var(--color-cta);
  background: color-mix(in srgb, var(--color-cta) 6%, var(--color-bg));
}

.ico-dropzone__icon {
  color: var(--color-text-subtle);
}

.ico-dropzone__title {
  font-size: 0.9375rem;
  font-weight: 600;
}

.ico-dropzone__hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.ico-source {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.ico-source__img {
  max-width: 100%;
  max-height: 12rem;
  object-fit: contain;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--color-border);
  background:
    repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px;
}

[data-theme='dark'] .ico-source__img {
  background:
    repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 50% / 16px 16px;
}

.ico-section-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.ico-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.ico-preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background:
    repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 12px 12px;
  overflow: hidden;
}

[data-theme='dark'] .ico-preview-box {
  background:
    repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 50% / 12px 12px;
}

.ico-preview-canvas {
  display: block;
  image-rendering: pixelated;
}

.ico-preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 8rem;
  color: var(--color-text-subtle);
}

.ico-preview-size-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.ico-size-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.ico-size-btn {
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  cursor: pointer;
  transition: background-color var(--transition), color var(--transition), border-color var(--transition);
}

.ico-size-btn:hover:not(:disabled) {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.ico-size-btn--active {
  background: var(--color-cta);
  color: #171717;
  border-color: var(--color-cta);
}

.ico-size-btn--active:hover:not(:disabled) {
  background: var(--color-cta-hover);
  border-color: var(--color-cta-hover);
  color: #171717;
}

.ico-size-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ico-instructions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1.5px solid var(--color-border);
}

.ico-instructions__title {
  font-size: 0.9375rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.ico-instructions__list {
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.ico-instructions__tip {
  margin-top: 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-subtle);
  line-height: 1.6;
}

.ico-instructions__tip strong {
  color: var(--color-text-muted);
  font-weight: 600;
}
</style>
