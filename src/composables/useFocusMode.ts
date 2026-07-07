import { ref } from 'vue'

const focusMode = ref(false)

export function useFocusMode() {
  function setFocusMode(value: boolean) {
    focusMode.value = value
  }

  function toggleFocusMode() {
    focusMode.value = !focusMode.value
  }

  return {
    focusMode,
    setFocusMode,
    toggleFocusMode,
  }
}
