import { ref, watch, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'devtoolbox-theme'

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

const theme = ref<Theme>('light')

export function useTheme() {
  onMounted(() => {
    theme.value = getStoredTheme() ?? getSystemTheme()
    applyTheme(theme.value)
  })

  watch(theme, (val) => {
    applyTheme(val)
    localStorage.setItem(STORAGE_KEY, val)
  })

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, toggleTheme }
}

export function initTheme() {
  const initial = getStoredTheme() ?? getSystemTheme()
  theme.value = initial
  applyTheme(initial)
}
