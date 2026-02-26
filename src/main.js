import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// ─── Capture PWA install prompt le plus tôt possible ─────────────
window.__pwaPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaPrompt = e
  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'))
})
window.addEventListener('appinstalled', () => { window.__pwaPrompt = null })

// ─── Montage Vue ──────────────────────────────────────────────────
const pinia = createPinia()
const app   = createApp(App)
app.use(pinia)
app.use(router)

let mounted = false
onAuthStateChanged(auth, async (user) => {
  if (!mounted) {
    app.mount('#app')
    mounted = true
  }
  // Démarre/arrête l'écoute du plan selon l'état auth
  const { useSubscriptionStore } = await import('@/stores/subscription')
  const { useThemeStore }         = await import('@/stores/theme')
  const subStore   = useSubscriptionStore()
  const themeStore = useThemeStore()
  if (user) {
    subStore.startListening()
    // Petite attente pour que le plan soit chargé avant d'appliquer le thème
    setTimeout(() => themeStore.init(), 500)
  } else {
    subStore.stopListening()
    themeStore.applyTheme('dark')
  }
})
