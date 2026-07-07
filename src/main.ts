import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'
import { applySeo, initRouteSeo } from './composables/useSeo'
import { getRouteSeo } from './config/seo'
import './styles/app.css'

initTheme()
initRouteSeo(router)

createApp(App).use(router).mount('#app')

router.isReady().then(() => {
  const route = router.currentRoute.value
  applySeo(getRouteSeo(route.name), route.path, route.name)
})
