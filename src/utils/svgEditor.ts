export interface SvgEditorOptions {
  color: string
  size: number
  strokeWidth: number
}

const DEFAULT_SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
</svg>`

export const SAMPLE_SVG = DEFAULT_SAMPLE

export function parseSvg(input: string): { svg: SVGSVGElement } | { error: string } {
  const trimmed = input.trim()
  if (!trimmed) {
    return { error: '请输入 SVG 代码' }
  }

  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return { error: 'SVG 格式无效，请检查代码' }
  }

  const root = doc.documentElement
  if (root.tagName.toLowerCase() !== 'svg') {
    return { error: '根节点必须是 <svg> 元素' }
  }

  const svg = root as unknown as SVGSVGElement
  sanitizeSvg(svg)
  return { svg }
}

function sanitizeSvg(svg: SVGSVGElement) {
  svg.querySelectorAll('script, foreignObject').forEach((el) => el.remove())
}

function isColorValue(value: string | null): boolean {
  if (!value) return false
  return value !== 'none' && value !== 'transparent'
}

function applyColor(el: Element, color: string) {
  const stroke = el.getAttribute('stroke')
  if (stroke && isColorValue(stroke)) {
    el.setAttribute('stroke', color)
  }

  const fill = el.getAttribute('fill')
  if (fill && isColorValue(fill)) {
    el.setAttribute('fill', color)
  }
}

export function applySvgOptions(svg: SVGSVGElement, options: SvgEditorOptions): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  sanitizeSvg(clone)

  clone.setAttribute('width', String(options.size))
  clone.setAttribute('height', String(options.size))
  clone.setAttribute('stroke-width', String(options.strokeWidth))

  applyColor(clone, options.color)
  clone.querySelectorAll('*').forEach((el) => {
    applyColor(el, options.color)
    if (el.hasAttribute('stroke-width')) {
      el.setAttribute('stroke-width', String(options.strokeWidth))
    }
  })

  return formatSvg(clone)
}

export function formatSvg(svg: SVGSVGElement): string {
  const raw = new XMLSerializer().serializeToString(svg)
  return raw.replace(/></g, '>\n  <').replace(/^<svg /, '<svg\n  ')
}

export function detectInitialOptions(svg: SVGSVGElement): Partial<SvgEditorOptions> {
  const options: Partial<SvgEditorOptions> = {}

  const width = Number(svg.getAttribute('width'))
  if (Number.isFinite(width) && width > 0) {
    options.size = width
  }

  const strokeWidth = Number(svg.getAttribute('stroke-width'))
  if (Number.isFinite(strokeWidth) && strokeWidth > 0) {
    options.strokeWidth = strokeWidth
  }

  const stroke = svg.getAttribute('stroke')
  if (stroke && isColorValue(stroke) && stroke !== 'currentColor') {
    options.color = stroke
  }

  return options
}

export function svgToPng(svgString: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建画布'))
        return
      }

      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)

      canvas.toBlob(
        (pngBlob) => {
          if (!pngBlob) {
            reject(new Error('PNG 转换失败'))
            return
          }
          resolve(pngBlob)
        },
        'image/png',
      )
    }

    img.onerror = () => {
      reject(new Error('SVG 渲染失败'))
    }

    img.src = dataUrl
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
