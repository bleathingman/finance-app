<template>
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
    <!-- Layout avec sidebar (pages authentifiées) -->
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

    <!-- Page de login sans sidebar -->
    <router-view v-else />
  </template>

  <SpeedInsights />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import Sidebar from '@/components/Sidebar.vue'

const authStore = useAuthStore()
</script>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 22px;
  color: var(--text-primary);
  animation: pulse 1.5s ease infinite;
}

.loading-logo {
  width: 48px; height: 48px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}

@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
</style>
