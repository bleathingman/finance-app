import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

// Attendre que Firebase confirme l'état auth avant de monter l'app
// Évite le flash de redirection non désiré
let appMounted = false
onAuthStateChanged(auth, () => {
  if (!appMounted) {
    app.mount('#app')
    appMounted = true
  }
})
