import themeData from './mdThemes.json'

export interface MdThemeStyles {
  container: string
  h1: string
  h2: string
  h3: string
  h4: string
  p: string
  strong: string
  em: string
  a: string
  ul: string
  ol: string
  li: string
  blockquote: string
  code: string
  pre: string
  hr: string
  img: string
  table: string
  th: string
  td: string
  tr: string
}

export interface MdTheme {
  id: string
  name: string
  description: string
  styles: MdThemeStyles
}

export interface MdThemeGroup {
  label: string
  ids: string[]
}

export const THEME_DATA = themeData as {
  themes: MdTheme[]
  groups: MdThemeGroup[]
}

export const THEMES = THEME_DATA.themes
export const THEME_GROUPS = THEME_DATA.groups
export const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<string, MdTheme>
export const DEFAULT_THEME = 'claude'
