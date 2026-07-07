import { marked } from 'marked'
import {
  DEFAULT_THEME,
  THEME_MAP,
  type MdTheme,
} from '@/data/mdThemes'

marked.setOptions({ breaks: true })

export const THEME_STORAGE_KEY = 'toolbox-md-editor-theme'
export const DRAFT_STORAGE_KEY = 'toolbox-md-editor-draft'

const LEGACY_THEME_STORAGE_KEY = 'toolbox-md-wechat-theme'
const LEGACY_DRAFT_STORAGE_KEY = 'toolbox-md-wechat-draft'
const THEME_ID_ALIASES: Record<string, string> = { wechat: 'native-green' }

export const SAMPLE_MARKDOWN = `# 示例文章标题

这是一段 **Markdown** 正文，支持 *斜体*、[链接](https://example.com) 等格式。

## 二级标题

- 列表项一
- 列表项二

> 引用块示例

\`\`\`js
console.log('hello')
\`\`\`
`

export function preprocessMarkdown(rawMd: string): string {
  return rawMd
    .replace(/^# .+\n?/m, '')
    .replace(/\n\n(```)/g, '\n$1')
    .replace(/(```[^\n]*)\n\n/g, '$1\n')
    .trim()
}

export function parseMarkdown(rawMd: string): string {
  const md = preprocessMarkdown(rawMd)
  if (!md) return ''
  return marked.parse(md) as string
}

export function computeStats(rawMd: string): string {
  if (!rawMd.trim()) return '0 字'
  const chars = rawMd.replace(/\s/g, '').length
  const lines = rawMd.split('\n').length
  return `${chars} 字 · ${lines} 行`
}

export function themeBg(theme: MdTheme): string {
  const m = theme.styles.container.match(/background-color:\s*([^;!]+)/i)
  return m ? m[1].trim() : '#ffffff'
}

export function cssVal(style: string, prop: string): string {
  const m = (style || '').match(new RegExp(`${prop}\\s*:\\s*([^;!]+)`, 'i'))
  return m ? m[1].trim() : ''
}

export function buildPreviewCss(theme: MdTheme): string {
  const s = theme.styles
  const sel = (tag: string, css: string) => (css ? `.md-editor-preview__body ${tag}{${css}}` : '')
  return [
    `.md-editor-preview__body{${s.container}}`,
    sel('h1', s.h1),
    sel('h2', s.h2),
    sel('h3', s.h3),
    sel('h4', s.h4),
    sel('p', s.p),
    sel('strong', s.strong),
    sel('em', s.em),
    sel('a', s.a),
    sel('ul', s.ul),
    sel('ol', s.ol),
    sel('li', s.li),
    sel('blockquote', s.blockquote),
    sel('code', s.code),
    sel('pre', s.pre),
    '.md-editor-preview__body pre code{background:none !important;color:inherit !important;padding:0 !important;font-size:inherit !important;border-radius:0 !important;}',
    sel('hr', s.hr),
    sel('img', s.img),
    sel('table', s.table),
    sel('th', s.th),
    sel('td', s.td),
    sel('tr', s.tr),
    `.md-editor-preview__empty{background:${themeBg(theme)};}`,
  ].join('\n')
}

export function buildSwatchColors(theme: MdTheme) {
  const s = theme.styles
  const bg = themeBg(theme)
  const title = cssVal(s.h1, 'color') || '#111'
  const text = cssVal(s.p, 'color') || cssVal(s.container, 'color') || '#333'
  const accent = cssVal(s.strong, 'color') || cssVal(s.a, 'color') || title
  return { bg, title, text, accent }
}

function toBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL())
    }
    img.onerror = reject
    img.src = src
  })
}

export async function inlineImages(container: HTMLElement): Promise<void> {
  const imgs = container.querySelectorAll('img')
  await Promise.all(
    Array.from(imgs).map(async (img) => {
      if (img.src.startsWith('data:')) return
      try {
        img.src = await toBase64(img.src)
      } catch {
        /* keep original src */
      }
    }),
  )
}

function normalizeThemeId(themeId: string | null | undefined): string {
  const aliased = THEME_ID_ALIASES[themeId ?? ''] ?? themeId ?? DEFAULT_THEME
  return THEME_MAP[aliased] ? aliased : DEFAULT_THEME
}

export function loadStoredTheme(): string {
  try {
    let saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (!saved) {
      saved = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
      if (saved) saveTheme(saved)
    }
    return normalizeThemeId(saved)
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(themeId: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalizeThemeId(themeId))
  } catch {
    /* ignore */
  }
}

export function loadStoredDraft(): string | null {
  try {
    return localStorage.getItem(DRAFT_STORAGE_KEY) ?? localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveDraft(content: string): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, content)
  } catch {
    /* ignore */
  }
}
