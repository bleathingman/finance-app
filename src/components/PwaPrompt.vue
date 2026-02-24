<template>
  <!-- Bandeau d'installation -->
  <teleport to="body">
    <transition name="pwa-slide">
      <div v-if="showPrompt" class="pwa-banner">
        <div class="pwa-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#00e5a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="pwa-text">
          <strong>Installer FinanceFlow</strong>
          <span>Accès rapide depuis votre écran d'accueil</span>
        </div>
        <div class="pwa-actions">
          <button class="pwa-btn-install" @click="install">Installer</button>
          <button class="pwa-btn-dismiss" @click="dismiss">Plus tard</button>
        </div>
      </div>
    </transition>

    <!-- iOS : instructions spécifiques (pas de beforeinstallprompt sur Safari) -->
    <transition name="pwa-slide">
      <div v-if="showIosHint" class="pwa-banner pwa-ios">
        <div class="pwa-icon">📱</div>
        <div class="pwa-text">
          <strong>Installer sur iPhone/iPad</strong>
          <span>Appuyez sur <strong>□↑</strong> puis "Sur l'écran d'accueil"</span>
        </div>
        <button class="pwa-btn-dismiss" @click="showIosHint = false">✕</button>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showPrompt  = ref(false)
const showIosHint = ref(false)
let deferredPrompt = null

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}
function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
}

onMounted(() => {
  // Déjà installée → on ne montre rien
  if (isInStandaloneMode()) return

  // Android / Chrome : événement natif
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    // Montre le prompt après 3 secondes (pas agressif)
    setTimeout(() => { showPrompt.value = true }, 3000)
  })

  // iOS Safari : pas d'événement, on affiche notre hint manuel
  if (isIos()) {
    const dismissed = localStorage.getItem('pwa-ios-dismissed')
    if (!dismissed) {
      setTimeout(() => { showIosHint.value = true }, 4000)
    }
  }
})

async function install() {
  if (!deferredPrompt) return
  showPrompt.value = false
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  if (outcome === 'accepted') {
    console.log('✅ PWA installée')
  }
  deferredPrompt = null
}

function dismiss() {
  showPrompt.value = false
  localStorage.setItem('pwa-ios-dismissed', '1')
}
</script>

<style scoped>
.pwa-banner {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  z-index: 9998;
  max-width: 420px;
  width: calc(100vw - 32px);
}

.pwa-icon {
  width: 40px; height: 40px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
}

.pwa-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pwa-text strong { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.pwa-text span   { font-size: 12px; color: var(--text-muted); }

.pwa-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }

.pwa-btn-install {
  padding: 7px 14px;
  background: var(--accent);
  color: #0c0e14;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}
.pwa-btn-install:hover { background: #00ffb3; }

.pwa-btn-dismiss {
  padding: 5px 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-body);
  text-align: center;
  transition: color var(--transition);
}
.pwa-btn-dismiss:hover { color: var(--text-primary); }

/* Animations */
.pwa-slide-enter-active { transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1) }
.pwa-slide-leave-active { transition: all 0.25s ease }
.pwa-slide-enter-from   { opacity: 0; transform: translateX(-50%) translateY(20px) }
.pwa-slide-leave-to     { opacity: 0; transform: translateX(-50%) translateY(12px) }
</style>
