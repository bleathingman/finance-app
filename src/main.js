import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
const app   = createApp(App)

app.use(pinia)
app.use(router)

let appMounted = false
onAuthStateChanged(auth, () => {
  if (!appMounted) {
    app.mount('#app')
    appMounted = true
  }
})