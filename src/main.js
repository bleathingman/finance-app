import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// ─── Capture PWA install prompt le plus tôt possible ─────────────
// beforeinstallprompt se déclenche très tôt, avant que Vue soit monté
// On le stocke dans window pour que PwaPrompt.vue puisse le récupérer
window.__pwaPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaPrompt = e
  // Notifie PwaPrompt s'il est déjà monté
  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'))
  console.log('✅ PWA installable — prompt capturé')
})

window.addEventListener('appinstalled', () => {
  window.__pwaPrompt = null
  console.log('✅ PWA installée avec succès')
})

// ─── Montage Vue ──────────────────────────────────────────────────
const pinia = createPinia()
const app   = createApp(App)
app.use(pinia)
app.use(router)

let mounted = false
onAuthStateChanged(auth, () => {
  if (!mounted) { app.mount('#app'); mounted = true }
})
