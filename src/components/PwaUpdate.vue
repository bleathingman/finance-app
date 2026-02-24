<template>
  <teleport to="body">
    <transition name="update-slide">
      <div v-if="showUpdate" class="update-toast">
        <div class="update-icon">✨</div>
        <div class="update-text">
          <strong>Nouvelle version disponible</strong>
          <span>Une mise à jour a été téléchargée</span>
        </div>
        <div class="update-actions">
          <button class="update-btn-apply" @click="applyUpdate">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Mettre à jour
          </button>
          <button class="update-btn-dismiss" @click="dismiss">Plus tard</button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showUpdate       = ref(false)
let waitingWorker      = null

onMounted(() => {
  if (!('serviceWorker' in navigator)) return

  // Écoute les SW en attente (update déjà téléchargée)
  navigator.serviceWorker.ready.then(registration => {
    // Cas 1 : un SW en attente existe déjà au chargement
    if (registration.waiting) {
      waitingWorker = registration.waiting
      showUpdate.value = true
      return
    }

    // Cas 2 : une nouvelle version arrive pendant la session
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nouvelle version installée et prête, l'ancienne tourne encore
          waitingWorker = newWorker
          showUpdate.value = true
        }
      })
    })
  })

  // Écoute le message de confirmation du SW (après skipWaiting)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Le nouveau SW a pris le contrôle → reload propre
    window.location.reload()
  })
})

function applyUpdate() {
  showUpdate.value = false
  if (waitingWorker) {
    // Demande au SW en attente de prendre le contrôle immédiatement
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  } else {
    // Fallback : reload direct
    window.location.reload()
  }
}

function dismiss() {
  showUpdate.value = false
  // On réaffichera au prochain mount (pas de localStorage ici — la MAJ est importante)
}
</script>

<style scoped>
.update-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px var(--border-accent);
  z-index: 9995;
  max-width: 420px;
  width: calc(100vw - 32px);
}

.update-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.update-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.update-text strong { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.update-text span   { font-size: 12px; color: var(--text-muted); }

.update-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.update-btn-apply {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
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
.update-btn-apply:hover {
  background: #00ffb3;
  box-shadow: 0 0 16px var(--accent-glow);
}

.update-btn-dismiss {
  padding: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-body);
  text-align: center;
  transition: color var(--transition);
}
.update-btn-dismiss:hover { color: var(--text-secondary); }

/* Animation — entre par le haut */
.update-slide-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.update-slide-leave-active { transition: all 0.25s ease; }
.update-slide-enter-from   { opacity: 0; transform: translateX(-50%) translateY(-20px); }
.update-slide-leave-to     { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>
