import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { tools, type ToolItem } from '@/config/tools'

export function getToolById(id: string): ToolItem | undefined {
  return tools.find((tool) => tool.id === id)
}

export function useToolMeta() {
  const route = useRoute()

  return computed(() => {
    const id = String(route.name ?? '')
    return getToolById(id) ?? null
  })
}
