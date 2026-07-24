export interface FormatResult {
  output: string
  error?: string
}

export function formatJson(input: string, indentSize = 2): FormatResult {
  if (!input.trim()) return { output: '' }

  try {
    const parsed = JSON.parse(input)
    const indent = indentSize === 0 ? '\t' : indentSize
    return { output: JSON.stringify(parsed, null, indent) }
  } catch (e) {
    const message = e instanceof SyntaxError ? e.message : 'JSON 解析失败'
    return { output: '', error: message }
  }
}

export function minifyJson(input: string): FormatResult {
  if (!input.trim()) return { output: '' }

  try {
    const parsed = JSON.parse(input)
    return { output: JSON.stringify(parsed) }
  } catch (e) {
    const message = e instanceof SyntaxError ? e.message : 'JSON 解析失败'
    return { output: '', error: message }
  }
}
