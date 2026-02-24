<template>
  <!-- Écran de chargement -->
  <div v-if="authStore.loading" class="loading-screen">
    <div class="loading-inner">
      <div class="loading-logo">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#00e5a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span>FinanceFlow</span>
    </div>
  </div>

  <template v-else>
    <!-- Authentifié -->
    <div v-if="authStore.isAuthenticated" class="app-shell">
      <Sidebar />
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Non authentifié -->
    <router-view v-else />
  </template>

  <!-- Toast déconnexion automatique -->
  <teleport to="body">
    <transition name="toast">
      <div v-if="showToast" class="toast-logout">
        <span>🔒</span>
        <span>Déconnecté automatiquement après 10 min d'inactivité</span>
      </div>
    </transition>
  </teleport>

  <!-- PWA install prompt -->
  <PwaPrompt />
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '@/components/Sidebar.vue'
import PwaPrompt from '@/components/PwaPrompt.vue'

const authStore = useAuthStore()
const showToast = ref(false)
let prevAuth    = false

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (prevAuth && !isAuth) {
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 4000)
  }
  prevAuth = isAuth
})
</script>

<style scoped>
.loading-screen {
  position: fixed; inset: 0;
  background: var(--bg-base);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.loading-inner {
  display: flex; align-items: center; gap: 14px;
  font-family: var(--font-display); font-weight: 800; font-size: 22px;
  color: var(--text-primary);
  animation: pulse-loading 1.5s ease infinite;
}
.loading-logo {
  width: 48px; height: 48px;
  background: var(--accent-dim); border: 1px solid var(--border-accent);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}
@keyframes pulse-loading { 0%,100% { opacity:1 } 50% { opacity:0.4 } }

.toast-logout {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  padding: 14px 22px;
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  font-size: 14px; font-weight: 500; color: var(--text-primary);
  z-index: 9999; white-space: nowrap;
}
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) }
.toast-leave-active { transition: all 0.25s ease }
.toast-enter-from   { opacity: 0; transform: translateX(-50%) translateY(16px) }
.toast-leave-to     { opacity: 0; transform: translateX(-50%) translateY(8px) }
</style>
