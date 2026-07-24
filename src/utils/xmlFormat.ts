export interface FormatResult {
  output: string
  error?: string
}

function getParseError(doc: Document): string | null {
  const node = doc.querySelector('parsererror')
  if (!node) return null
  return node.textContent?.replace(/\s+/g, ' ').trim() || 'XML 解析失败'
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function prettyPrintElement(element: Element, indent: string, level: number): string {
  const pad = indent.repeat(level)
  const attrs = [...element.attributes]
    .map((attr) => ` ${attr.name}="${escapeAttr(attr.value)}"`)
    .join('')

  const childNodes = [...element.childNodes].filter(
    (node) => !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()),
  )

  if (childNodes.length === 0) {
    return `${pad}<${element.tagName}${attrs}/>\n`
  }

  const onlyText =
    childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE

  if (onlyText) {
    const text = childNodes[0].textContent?.trim() ?? ''
    return `${pad}<${element.tagName}${attrs}>${escapeText(text)}</${element.tagName}>\n`
  }

  let result = `${pad}<${element.tagName}${attrs}>\n`
  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim()
      if (text) result += `${indent.repeat(level + 1)}${escapeText(text)}\n`
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      result += prettyPrintElement(child as Element, indent, level + 1)
    }
  }
  result += `${pad}</${element.tagName}>\n`
  return result
}

function parseXml(input: string): { doc: Document; error?: string } {
  const doc = new DOMParser().parseFromString(input.trim(), 'application/xml')
  const error = getParseError(doc)
  if (error) return { doc, error }
  if (!doc.documentElement) return { doc, error: 'XML 内容为空' }
  return { doc }
}

export function formatXml(input: string, indentSize = 2): FormatResult {
  if (!input.trim()) return { output: '' }

  const indent = indentSize === 0 ? '\t' : ' '.repeat(indentSize)
  const { doc, error } = parseXml(input)
  if (error) return { output: '', error }

  const declaration = input.trim().startsWith('<?xml') ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ''
  return { output: declaration + prettyPrintElement(doc.documentElement, indent, 0) }
}

export function minifyXml(input: string): FormatResult {
  if (!input.trim()) return { output: '' }

  const { doc, error } = parseXml(input)
  if (error) return { output: '', error }

  const serialized = new XMLSerializer().serializeToString(doc.documentElement)
  return { output: serialized.replace(/>\s+</g, '><').trim() }
}
