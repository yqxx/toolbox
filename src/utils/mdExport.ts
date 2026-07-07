import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import type { MdTheme, MdThemeStyles } from '@/data/mdThemes'
import { themeBg } from '@/utils/mdEditor'

/** 浏览器单张 canvas 边长上限（Chrome 约 16384px） */
const MAX_CANVAS_PX = 16384
const CANVAS_SCALE = 2
/** 每段截图的内容高度（px），避免单次 canvas 超限 */
const SLICE_CONTENT_HEIGHT = 4000
/** PNG 允许的最大内容高度（scale 后需低于 MAX_CANVAS_PX） */
const MAX_PNG_CONTENT_HEIGHT = Math.floor(MAX_CANVAS_PX / CANVAS_SCALE) - 64

export interface ExportProgress {
  phase: 'preparing' | 'capturing' | 'assembling' | 'saving'
  current: number
  total: number
}

export interface ExportOptions {
  onProgress?: (progress: ExportProgress) => void
}

export function formatExportProgress(progress: ExportProgress): string {
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

const STYLE_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'strong',
  'em',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'table',
  'th',
  'td',
  'tr',
  'img',
] as const

export function extractTitle(md: string): string {
  const m = md.match(/^# (.+)$/m)
  return m ? m[1].trim() : ''
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return cleaned.slice(0, 80) || 'markdown-export'
}

export function buildExportFilename(md: string, ext: 'png' | 'pdf'): string {
  const title = extractTitle(md)
  const base = title ? sanitizeFilename(title) : `markdown-${Date.now()}`
  return `${base}.${ext}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function applyInlineThemeStyles(root: HTMLElement, theme: MdTheme) {
  const s = theme.styles
  root.style.cssText = s.container

  STYLE_TAGS.forEach((tag) => {
    const css = s[tag as keyof MdThemeStyles]
    if (!css) return
    root.querySelectorAll(tag).forEach((el) => {
      ;(el as HTMLElement).style.cssText = css
    })
  })

  root.querySelectorAll('pre').forEach((pre) => {
    ;(pre as HTMLElement).style.cssText = `${s.pre}white-space:pre-wrap;word-break:break-all;`
    const code = pre.querySelector('code')
    if (code) {
      ;(code as HTMLElement).style.cssText =
        'background:none;color:inherit;padding:0;font-size:inherit;border-radius:0;'
    }
  })

  root.querySelectorAll('code').forEach((el) => {
    if (el.closest('pre')) return
    ;(el as HTMLElement).style.cssText = s.code
  })

  root.querySelectorAll('blockquote p').forEach((p) => {
    ;(p as HTMLElement).style.backgroundColor = 'transparent'
  })
}

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        }),
    ),
  )
}

function getContentHeight(root: HTMLElement) {
  return root.scrollHeight || root.offsetHeight
}

function assertExportRoot(root: HTMLElement) {
  if (!getContentHeight(root)) {
    throw new Error('预览内容为空，无法导出')
  }
}

function assertCanvas(canvas: HTMLCanvasElement) {
  if (!canvas.width || !canvas.height) {
    throw new Error('导出图片为空，请稍后重试')
  }
}

interface ExportContext {
  host: HTMLElement
  root: HTMLElement
  width: number
}

async function createExportRoot(source: HTMLElement, theme: MdTheme): Promise<ExportContext & { cleanup: () => void }> {
  const width = Math.round(source.getBoundingClientRect().width) || source.offsetWidth
  if (width <= 0) throw new Error('预览区域宽度异常')

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = [
    'position:fixed',
    'top:0',
    `left:${-(width + 64)}px`,
    `width:${width}px`,
    'pointer-events:none',
    'z-index:1',
    'overflow:hidden',
  ].join(';')

  const root = document.createElement('div')
  root.className = 'md-editor-preview__body'
  root.innerHTML = source.innerHTML
  applyInlineThemeStyles(root, theme)

  host.appendChild(root)
  document.body.appendChild(host)

  await waitForImages(root)
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  assertExportRoot(root)

  return {
    host,
    root,
    width,
    cleanup: () => host.remove(),
  }
}

async function captureSlices(
  ctx: ExportContext,
  theme: MdTheme,
  onProgress?: (progress: ExportProgress) => void,
): Promise<HTMLCanvasElement[]> {
  const { host, root, width } = ctx
  const backgroundColor = themeBg(theme)
  const totalHeight = getContentHeight(root)
  const sliceCount = Math.max(1, Math.ceil(totalHeight / SLICE_CONTENT_HEIGHT))
  const canvases: HTMLCanvasElement[] = []

  for (let offsetY = 0, sliceIndex = 0; offsetY < totalHeight; offsetY += SLICE_CONTENT_HEIGHT, sliceIndex++) {
    onProgress?.({ phase: 'capturing', current: sliceIndex + 1, total: sliceCount })

    const height = Math.min(SLICE_CONTENT_HEIGHT, totalHeight - offsetY)
    host.style.height = `${height}px`
    root.style.transform = `translateY(-${offsetY}px)`

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const canvas = await html2canvas(host, {
      scale: CANVAS_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
    })

    assertCanvas(canvas)
    canvases.push(canvas)
  }

  root.style.transform = ''
  host.style.height = ''

  return canvases
}

function stitchCanvases(canvases: HTMLCanvasElement[]): HTMLCanvasElement {
  const width = canvases[0].width
  const totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0)

  if (totalHeight > MAX_CANVAS_PX || width > MAX_CANVAS_PX) {
    throw new Error('内容过长，无法导出为单张 PNG，请使用 PDF 导出')
  }

  const result = document.createElement('canvas')
  result.width = width
  result.height = totalHeight

  const ctx = result.getContext('2d')
  if (!ctx) throw new Error('PNG 生成失败')

  let offsetY = 0
  for (const canvas of canvases) {
    ctx.drawImage(canvas, 0, offsetY)
    offsetY += canvas.height
  }

  return result
}

function saveCanvasesToPdf(
  canvases: HTMLCanvasElement[],
  filename: string,
  onProgress?: (progress: ExportProgress) => void,
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  let isFirstPage = true
  let pageIndex = 0
  const totalPages = canvases.reduce((sum, canvas) => {
    const pageSliceHeightPx = Math.max(1, Math.floor((pageHeight * canvas.width) / imgWidth))
    return sum + Math.ceil(canvas.height / pageSliceHeightPx)
  }, 0)

  for (const canvas of canvases) {
    const pageSliceHeightPx = Math.max(1, Math.floor((pageHeight * canvas.width) / imgWidth))
    let offsetY = 0

    while (offsetY < canvas.height) {
      pageIndex += 1
      onProgress?.({ phase: 'assembling', current: pageIndex, total: totalPages })
      if (!isFirstPage) pdf.addPage()
      isFirstPage = false

      const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - offsetY)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx

      const ctx = sliceCanvas.getContext('2d')
      if (!ctx) throw new Error('PDF 生成失败')

      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      )

      const sliceHeightMm = (sliceHeightPx * imgWidth) / canvas.width
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, sliceHeightMm)

      offsetY += sliceHeightPx
    }
  }

  onProgress?.({ phase: 'saving', current: 1, total: 1 })
  pdf.save(filename)
}

async function withExportRoot(
  source: HTMLElement,
  theme: MdTheme,
  run: (ctx: ExportContext) => Promise<void>,
  onProgress?: (progress: ExportProgress) => void,
) {
  onProgress?.({ phase: 'preparing', current: 0, total: 1 })
  const { cleanup, ...ctx } = await createExportRoot(source, theme)
  onProgress?.({ phase: 'preparing', current: 1, total: 1 })

  try {
    await run(ctx)
  } finally {
    cleanup()
  }
}

export async function exportPreviewToPng(
  element: HTMLElement,
  theme: MdTheme,
  filename: string,
  options?: ExportOptions,
): Promise<void> {
  const onProgress = options?.onProgress

  await withExportRoot(
    element,
    theme,
    async (ctx) => {
      const contentHeight = getContentHeight(ctx.root)
      if (contentHeight > MAX_PNG_CONTENT_HEIGHT) {
        throw new Error(
          `内容过长（约 ${Math.ceil(contentHeight / 1122)} 屏），无法导出为单张 PNG，请使用 PDF 导出`,
        )
      }

      const canvases = await captureSlices(ctx, theme, onProgress)
      onProgress?.({ phase: 'assembling', current: 0, total: 1 })
      const canvas = canvases.length === 1 ? canvases[0] : stitchCanvases(canvases)
      onProgress?.({ phase: 'saving', current: 0, total: 1 })
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('PNG 生成失败')
      downloadBlob(blob, filename)
    },
    onProgress,
  )
}

export async function exportPreviewToPdf(
  element: HTMLElement,
  theme: MdTheme,
  filename: string,
  options?: ExportOptions,
): Promise<void> {
  const onProgress = options?.onProgress

  await withExportRoot(
    element,
    theme,
    async (ctx) => {
      const canvases = await captureSlices(ctx, theme, onProgress)
      saveCanvasesToPdf(canvases, filename, onProgress)
    },
    onProgress,
  )
}
