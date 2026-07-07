<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ToolPage from '@/components/ToolPage.vue'
import TButton from '@/components/TButton.vue'
import SegmentTabs from '@/components/SegmentTabs.vue'
import {
  DEFAULT_THEME,
  THEME_GROUPS,
  THEME_MAP,
  type MdTheme,
} from '@/data/mdThemes'
import {
  SAMPLE_MARKDOWN,
  buildPreviewCss,
  buildSwatchColors,
  computeStats,
  inlineImages,
  loadStoredDraft,
  loadStoredTheme,
  parseMarkdown,
  saveDraft,
  saveTheme,
} from '@/utils/mdEditor'
import type { ExportProgress } from '@/utils/mdExport'
import { useFocusMode } from '@/composables/useFocusMode'
import { useMediaQuery } from '@vueuse/core'

const { focusMode, toggleFocusMode, setFocusMode } = useFocusMode()
const isDesktop = useMediaQuery('(min-width: 900px)')

const input = ref(loadStoredDraft() ?? SAMPLE_MARKDOWN)
const themeId = ref(loadStoredTheme())
const syncScroll = ref(true)
const mobileTab = ref<'input' | 'preview'>('input')
const mobileTabs = [
  { value: 'input' as const, label: '编辑' },
  { value: 'preview' as const, label: '预览' },
]
const styleMenuOpen = ref(false)
const previewHtml = ref('')
const exportingFormat = ref<'png' | 'pdf' | null>(null)
const exportProgress = ref<ExportProgress | null>(null)
const exportError = ref('')

const inputRef = ref<HTMLTextAreaElement | null>(null)
const inputScrollRef = ref<HTMLElement | null>(null)
const previewScrollRef = ref<HTMLElement | null>(null)
const previewBodyRef = ref<HTMLElement | null>(null)
const styleSelectRef = ref<HTMLElement | null>(null)

let themeStyleEl: HTMLStyleElement | null = null
let syncing = false
let draftTimer: ReturnType<typeof setTimeout> | null = null

const currentTheme = computed(() => THEME_MAP[themeId.value] ?? THEME_MAP[DEFAULT_THEME])
const previewCss = computed(() => buildPreviewCss(currentTheme.value))
const stats = computed(() => computeStats(input.value))
const hasContent = computed(() => Boolean(input.value.trim()))
const isExporting = computed(() => exportingFormat.value !== null)
const exportProgressLabel = computed(() => formatProgressLabel(exportProgress.value))
const exportProgressPercent = computed(() => {
  const p = exportProgress.value
  if (!p || p.total <= 0) return 0
  return Math.min(100, Math.round((p.current / p.total) * 100))
})

function formatProgressLabel(progress: ExportProgress | null): string {
  if (!progress) return '导出中…'
  switch (progress.phase) {
    case 'preparing':
      return '准备中…'
    case 'capturing':
      return progress.total > 1 ? `截图 ${progress.current}/${progress.total}` : '截图中…'
    case 'assembling':
      return progress.total > 1 ? `生成 PDF ${progress.current}/${progress.total}` : '生成文件…'
    case 'saving':
      return '保存中…'
  }
}

function handleExportProgress(progress: ExportProgress) {
  exportProgress.value = progress
}

async function renderPreview() {
  const rawMd = input.value.trim()

  if (!rawMd) {
    previewHtml.value = ''
    return
  }

  previewHtml.value = parseMarkdown(rawMd)
  await nextTick()

  if (previewBodyRef.value) {
    await inlineImages(previewBodyRef.value)
  }
}

function applyTheme(id: string) {
  themeId.value = THEME_MAP[id] ? id : DEFAULT_THEME
  saveTheme(themeId.value)
}

function selectTheme(id: string) {
  applyTheme(id)
  styleMenuOpen.value = false
}

function toggleStyleMenu(event?: MouseEvent) {
  event?.stopPropagation()
  styleMenuOpen.value = !styleMenuOpen.value
}

function closeStyleMenu(event: MouseEvent) {
  if (styleSelectRef.value?.contains(event.target as Node)) return
  styleMenuOpen.value = false
}

function toggleSync() {
  syncScroll.value = !syncScroll.value
}

function syncScrollFromInput() {
  if (!isDesktop.value || !syncScroll.value || syncing || !inputScrollRef.value || !previewScrollRef.value) return
  syncing = true
  const inputEl = inputScrollRef.value
  const previewEl = previewScrollRef.value
  const pct = inputEl.scrollTop / (inputEl.scrollHeight - inputEl.clientHeight || 1)
  previewEl.scrollTop = pct * (previewEl.scrollHeight - previewEl.clientHeight)
  syncing = false
}

function syncScrollFromPreview() {
  if (!isDesktop.value || !syncScroll.value || syncing || !inputScrollRef.value || !previewScrollRef.value) return
  syncing = true
  const inputEl = inputScrollRef.value
  const previewEl = previewScrollRef.value
  const pct = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight || 1)
  inputEl.scrollTop = pct * (inputEl.scrollHeight - inputEl.clientHeight)
  syncing = false
}

function reloadDraft() {
  input.value = SAMPLE_MARKDOWN
}

function clearAll() {
  input.value = ''
  exportError.value = ''
}

async function downloadPng() {
  if (!previewBodyRef.value || !hasContent.value) return

  exportingFormat.value = 'png'
  exportProgress.value = null
  exportError.value = ''
  try {
    await inlineImages(previewBodyRef.value)
    const { buildExportFilename, exportPreviewToPng } = await import('@/utils/mdExport')
    await exportPreviewToPng(
      previewBodyRef.value,
      currentTheme.value,
      buildExportFilename(input.value, 'png'),
      { onProgress: handleExportProgress },
    )
  } catch (e) {
    exportError.value = e instanceof Error ? e.message : 'PNG 下载失败'
  } finally {
    exportingFormat.value = null
    exportProgress.value = null
  }
}

async function downloadPdf() {
  if (!previewBodyRef.value || !hasContent.value) return

  exportingFormat.value = 'pdf'
  exportProgress.value = null
  exportError.value = ''
  try {
    await inlineImages(previewBodyRef.value)
    const { buildExportFilename, exportPreviewToPdf } = await import('@/utils/mdExport')
    await exportPreviewToPdf(
      previewBodyRef.value,
      currentTheme.value,
      buildExportFilename(input.value, 'pdf'),
      { onProgress: handleExportProgress },
    )
  } catch (e) {
    exportError.value = e instanceof Error ? e.message : 'PDF 下载失败'
  } finally {
    exportingFormat.value = null
    exportProgress.value = null
  }
}

function toggleFocus() {
  toggleFocusMode()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !focusMode.value) return
  if (styleMenuOpen.value || isExporting.value) return
  setFocusMode(false)
}

watch(focusMode, (active) => {
  if (active) styleMenuOpen.value = false
})

function swatchStyle(theme: MdTheme) {
  const { bg, title, text, accent } = buildSwatchColors(theme)
  return {
    background: bg,
    '--sw-title': title,
    '--sw-text': text,
    '--sw-accent': accent,
  } as Record<string, string>
}

watch(input, () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => saveDraft(input.value), 400)
  void renderPreview()
})

watch(previewCss, (css) => {
  if (themeStyleEl) themeStyleEl.textContent = css
})

onMounted(() => {
  themeStyleEl = document.createElement('style')
  themeStyleEl.id = 'md-editor-theme-css'
  themeStyleEl.textContent = previewCss.value
  document.head.appendChild(themeStyleEl)
  document.addEventListener('click', closeStyleMenu)
  document.addEventListener('keydown', onDocumentKeydown)
  void renderPreview()
})

onUnmounted(() => {
  themeStyleEl?.remove()
  document.removeEventListener('click', closeStyleMenu)
  document.removeEventListener('keydown', onDocumentKeydown)
  setFocusMode(false)
  if (draftTimer) clearTimeout(draftTimer)
})
</script>

<template>
  <ToolPage
    variant="immersive"
    :page-class="['md-editor-page', { 'md-editor-page--focus': focusMode }]"
    :hide-header="focusMode"
  >
    <div class="md-editor-shell">
        <div
          class="md-editor-toolbar"
          :class="{ 'md-editor-toolbar--focus': focusMode }"
        >
          <div ref="styleSelectRef" class="md-editor-style-select" :class="{ 'md-editor-style-select--open': styleMenuOpen }">
            <button type="button" class="md-editor-style-btn" aria-haspopup="listbox" :aria-expanded="styleMenuOpen" @click="toggleStyleMenu">
              <span class="md-editor-style-btn__label">风格</span>
              <span class="md-editor-style-btn__name">{{ currentTheme.name }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div v-show="styleMenuOpen" class="md-editor-style-menu" role="listbox">
              <div v-for="group in THEME_GROUPS" :key="group.label" class="md-editor-style-group">
                <div class="md-editor-style-group__label">{{ group.label }}</div>
                <div class="md-editor-style-grid">
                  <button
                    v-for="id in group.ids"
                    :key="id"
                    type="button"
                    class="md-editor-style-item"
                    :class="{ 'md-editor-style-item--active': themeId === id }"
                    :title="THEME_MAP[id] ? `${THEME_MAP[id].name} — ${THEME_MAP[id].description}` : ''"
                    role="option"
                    :aria-selected="themeId === id"
                    @click="selectTheme(id)"
                  >
                    <div v-if="THEME_MAP[id]" class="md-editor-swatch" :style="swatchStyle(THEME_MAP[id])">
                      <div class="md-editor-swatch__bar md-editor-swatch__bar--title" />
                      <div class="md-editor-swatch__bar md-editor-swatch__bar--text" />
                      <div class="md-editor-swatch__bar md-editor-swatch__bar--accent" />
                    </div>
                    <div v-if="THEME_MAP[id]" class="md-editor-style-item__name">{{ THEME_MAP[id].name }}</div>
                    <div v-if="THEME_MAP[id]" class="md-editor-style-item__desc">{{ THEME_MAP[id].description }}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            v-show="isDesktop"
            type="button"
            class="md-editor-sync-btn"
            :class="{ 'md-editor-sync-btn--on': syncScroll }"
            :aria-pressed="syncScroll"
            title="滚动同步"
            @click="toggleSync"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 3v18" />
              <path d="m8 7 4-4 4 4" />
              <path d="m8 17 4 4 4-4" />
            </svg>
            <span class="md-editor-sync-btn__text">滚动同步</span>
          </button>

          <TButton
            v-show="!focusMode"
            size="sm"
            @click="reloadDraft"
          >
            重新加载示例
          </TButton>

          <TButton size="sm" @click="clearAll">清空</TButton>

          <div class="md-editor-toolbar__actions">
            <TButton
              size="sm"
              :disabled="!hasContent || isExporting"
              @click="downloadPng"
            >
              {{ exportingFormat === 'png' ? exportProgressLabel : '下载 PNG' }}
            </TButton>
            <TButton
              size="sm"
              :disabled="!hasContent || isExporting"
              @click="downloadPdf"
            >
              {{ exportingFormat === 'pdf' ? exportProgressLabel : '下载 PDF' }}
            </TButton>
            <TButton
              size="sm"
              class="md-editor-focus-btn"
              :class="{ 'md-editor-focus-btn--active': focusMode }"
              :title="focusMode ? '退出专注模式 (Esc)' : '专注模式'"
              :aria-pressed="focusMode"
              @click="toggleFocus"
            >
              <svg v-if="!focusMode" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
              </svg>
              <span class="md-editor-focus-btn__text">{{ focusMode ? '退出专注' : '专注模式' }}</span>
            </TButton>
          </div>
        </div>

        <p v-if="focusMode" class="md-editor-focus-hint">按 Esc 退出专注模式</p>

        <div
          v-if="isExporting"
          class="md-editor-export-progress"
          role="status"
          aria-live="polite"
        >
          <div class="md-editor-export-progress__track">
            <div
              class="md-editor-export-progress__bar"
              :style="{ width: `${exportProgressPercent}%` }"
            />
          </div>
          <span class="md-editor-export-progress__label">{{ exportProgressLabel }}</span>
        </div>

        <p v-if="exportError" class="md-editor-export-error" role="alert">{{ exportError }}</p>

        <div v-if="!isDesktop" class="md-editor-mobile-tabs">
          <SegmentTabs
            v-model="mobileTab"
            :tabs="mobileTabs"
            aria-label="编辑视图"
          />
        </div>

        <div class="md-editor-editor" :class="{ 'md-editor-editor--desktop': isDesktop }">
          <div
            v-show="isDesktop || mobileTab === 'input'"
            class="md-editor-pane md-editor-pane--input"
          >
            <div class="md-editor-pane__header">
              <span class="md-editor-pane__title">Markdown 输入</span>
              <span class="md-editor-pane__stats">{{ stats }}</span>
            </div>
            <div
              ref="inputScrollRef"
              class="md-editor-pane__scroll"
              @scroll="syncScrollFromInput"
            >
              <textarea
                ref="inputRef"
                v-model="input"
                class="md-editor-textarea"
                placeholder="在此粘贴 Markdown 内容…"
                spellcheck="false"
              />
            </div>
          </div>

          <div
            v-show="isDesktop || mobileTab === 'preview'"
            class="md-editor-pane md-editor-pane--preview"
          >
            <div v-if="isDesktop" class="md-editor-pane__header">
              <span class="md-editor-pane__title">预览</span>
            </div>
            <div
              ref="previewScrollRef"
              class="md-editor-pane__scroll md-editor-preview"
              @scroll="syncScrollFromPreview"
            >
              <div v-if="!hasContent" class="md-editor-preview__empty">
                {{ isDesktop ? '左侧粘贴 Markdown，这里实时预览' : '切换到「编辑」输入 Markdown，这里实时预览' }}
              </div>
              <div
                v-else
                ref="previewBodyRef"
                class="md-editor-preview__body"
                v-html="previewHtml"
              />
            </div>
          </div>
        </div>
      </div>
  </ToolPage>
</template>

<!-- 布局类挂在 ToolPage 根节点，需用非 scoped 样式 -->
<style>
.tool-page.md-editor-page {
  --md-editor-chrome: 11rem;
  --md-editor-page-footer: var(--footer-height);
}

.tool-page.md-editor-page--focus {
  --md-editor-chrome: 7.5rem;
  --md-editor-page-footer: 0px;
}

.tool-page.md-editor-page.tool-page--immersive .tool-header {
  margin-bottom: 0.75rem;
}
</style>

<style scoped>
.md-editor-shell {
  display: flex;
  flex-direction: column;
}

.md-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  position: sticky;
  top: var(--nav-height);
  z-index: 20;
  padding: 0.5rem 0;
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.md-editor-toolbar--focus {
  margin-bottom: 0.375rem;
}

.md-editor-style-select {
  position: relative;
}

.md-editor-style-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  transition: border-color var(--transition);
}

.md-editor-style-btn:hover,
.md-editor-style-select--open .md-editor-style-btn {
  border-color: var(--color-cta);
}

.md-editor-style-btn__label {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.md-editor-style-btn__name {
  font-weight: 600;
}

.md-editor-style-menu {
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 0;
  z-index: 50;
  width: min(28rem, calc(100vw - 2.5rem));
  max-height: 24rem;
  overflow-y: auto;
  padding: 0.75rem;
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.md-editor-style-group + .md-editor-style-group {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.md-editor-style-group__label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
}

.md-editor-style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem;
}

@media (min-width: 480px) {
  .md-editor-style-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.md-editor-style-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--color-surface);
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  text-align: left;
  transition: border-color var(--transition), background-color var(--transition);
}

.md-editor-style-item:hover {
  border-color: var(--color-border);
}

.md-editor-style-item--active {
  border-color: var(--color-cta);
  background: var(--color-bg);
}

.md-editor-swatch {
  width: 100%;
  height: 1.75rem;
  border-radius: 4px;
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
}

.md-editor-swatch__bar {
  height: 3px;
  border-radius: 2px;
}

.md-editor-swatch__bar--title {
  width: 66%;
  background: var(--sw-title);
}

.md-editor-swatch__bar--text {
  width: 90%;
  background: var(--sw-text);
}

.md-editor-swatch__bar--accent {
  width: 44%;
  background: var(--sw-accent);
}

.md-editor-style-item__name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.2;
}

.md-editor-style-item__desc {
  font-size: 0.625rem;
  color: var(--color-text-subtle);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.md-editor-sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: border-color var(--transition), color var(--transition);
}

.md-editor-sync-btn--on {
  border-color: var(--color-cta);
  color: var(--color-text);
}

.md-editor-toolbar--focus .md-editor-sync-btn__text {
  display: none;
}

.md-editor-mobile-tabs {
  margin-bottom: 0.75rem;
}

.md-editor-focus-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.md-editor-focus-btn--active {
  border-color: var(--color-cta);
  color: var(--color-text);
}

.md-editor-focus-hint {
  margin: 0 0 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-subtle);
}

.md-editor-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.md-editor-export-error {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: #dc2626;
}

.md-editor-export-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
}

.md-editor-export-progress__track {
  flex: 1;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--color-border, #e5e7eb);
  overflow: hidden;
}

.md-editor-export-progress__bar {
  height: 100%;
  border-radius: inherit;
  background: var(--color-cta, #3b82f6);
  transition: width 0.2s ease;
}

.md-editor-export-progress__label {
  flex-shrink: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted, #6b7280);
  min-width: 5.5rem;
  text-align: right;
}

.md-editor-editor {
  display: grid;
  gap: 0.75rem;
}

.md-editor-editor--desktop {
  height: calc(100dvh - var(--nav-height) - var(--md-editor-page-footer, var(--footer-height)) - var(--md-editor-chrome, 11rem));
  min-height: 20rem;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
}

.md-editor-pane {
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.md-editor-editor--desktop .md-editor-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.md-editor-pane__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.md-editor-pane__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.md-editor-pane__stats {
  font-size: 0.75rem;
  color: var(--color-text-subtle);
}

.md-editor-pane__scroll {
  min-width: 0;
}

.md-editor-editor--desktop .md-editor-pane__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.md-editor-textarea {
  display: block;
  width: 100%;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  field-sizing: content;
}

.md-editor-editor--desktop .md-editor-textarea {
  min-height: 100%;
  resize: none;
  overflow: hidden;
}

.md-editor-editor:not(.md-editor-editor--desktop) .md-editor-textarea {
  min-height: 16rem;
  resize: vertical;
}

.md-editor-textarea:focus {
  outline: none;
}

.md-editor-preview__empty {
  padding: 2rem;
  color: var(--color-text-subtle);
  font-size: 0.9375rem;
  text-align: center;
}

.md-editor-preview__body {
  padding: 1rem;
}

.md-editor-preview__body :deep(img) {
  cursor: default;
}
</style>
