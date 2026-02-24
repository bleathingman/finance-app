<template>
  <teleport to="body">

    <!-- ── Android / Chrome : prompt natif ─────────────────────────── -->
    <transition name="pwa-slide">
      <div v-if="showAndroid" class="pwa-banner">
        <div class="pwa-app-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#00e5a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="pwa-text">
          <strong>Installer FinanceFlow</strong>
          <span>Accès rapide depuis l'écran d'accueil, fonctionne hors ligne</span>
        </div>
        <div class="pwa-actions">
          <button class="pwa-btn-install" @click="installAndroid">
            Installer
          </button>
          <button class="pwa-btn-dismiss" @click="dismissAndroid">Plus tard</button>
        </div>
      </div>
    </transition>

    <!-- ── iOS Safari : guide visuel étape par étape ───────────────── -->
    <transition name="pwa-slide">
      <div v-if="showIos" class="pwa-ios-modal">
        <div class="pwa-ios-header">
          <div class="pwa-app-icon large">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#00e5a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <strong>Installer FinanceFlow</strong>
            <span>Suivez ces 2 étapes dans Safari</span>
          </div>
          <button class="pwa-close" @click="dismissIos">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="pwa-ios-steps">
          <div class="pwa-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <div class="step-title">Appuyez sur le bouton Partager</div>
              <div class="step-desc">En bas au centre de Safari</div>
              <!-- Vrai icône Share iOS -->
              <div class="step-icon-preview">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 1 1 0 2.684M12 6l.01-.014m-.01.014L5.368 9.316M12 6v12" stroke="#4facfe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span style="color:var(--blue);font-size:12px;font-weight:600">Partager</span>
              </div>
            </div>
          </div>

          <div class="step-arrow">↓</div>

          <div class="pwa-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <div class="step-title">Appuyez sur "Sur l'écran d'accueil"</div>
              <div class="step-desc">Dans le menu qui s'ouvre, faites défiler vers le bas</div>
              <div class="step-icon-preview">
                <!-- Icône Add to Home Screen iOS -->
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#00e5a0" stroke-width="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#00e5a0" stroke-width="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#00e5a0" stroke-width="2"/>
                  <line x1="17.5" y1="14" x2="17.5" y2="21" stroke="#00e5a0" stroke-width="2" stroke-linecap="round"/>
                  <line x1="14" y1="17.5" x2="21" y2="17.5" stroke="#00e5a0" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span style="color:var(--accent);font-size:12px;font-weight:600">Sur l'écran d'accueil</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Flèche qui pointe vers le bas (bouton share) -->
        <div class="pwa-ios-arrow">▼</div>
      </div>
    </transition>

  </teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showAndroid = ref(false)
const showIos     = ref(false)

function isIos() {
  // iOS : iPhone, iPad, iPod — y compris iPadOS 13+ qui se dit macOS
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isSafariBrowser() {
  // Chrome sur iOS se déclare aussi comme Safari, mais on veut le vrai Safari
  return /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent)
}

function isDismissed(key) {
  try { return !!localStorage.getItem(key) } catch { return false }
}
function setDismissed(key) {
  try { localStorage.setItem(key, '1') } catch {}
}

onMounted(() => {
  // App déjà installée → rien à faire
  if (isInStandaloneMode()) return

  // ── Android / Chrome ──────────────────────────────────────────
  if (isDismissed('pwa-android-dismissed')) return

  // Le prompt a peut-être déjà été capturé dans main.js avant le mount
  if (window.__pwaPrompt) {
    setTimeout(() => { showAndroid.value = true }, 2500)
  } else {
    // Sinon on écoute l'event custom dispatché par main.js
    window.addEventListener('pwa-prompt-ready', () => {
      setTimeout(() => { showAndroid.value = true }, 2500)
    }, { once: true })
  }

  // ── iOS Safari ────────────────────────────────────────────────
  if (isIos() && isSafariBrowser() && !isDismissed('pwa-ios-dismissed')) {
    setTimeout(() => { showIos.value = true }, 3000)
  }
})

async function installAndroid() {
  const prompt = window.__pwaPrompt
  if (!prompt) return
  showAndroid.value = false
  try {
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      window.__pwaPrompt = null
      setDismissed('pwa-android-dismissed')
    } else {
      // Refusé : on reposera la question dans 7 jours
      setDismissed('pwa-android-dismissed')
    }
  } catch (e) {
    console.error('Install error:', e)
  }
}

function dismissAndroid() {
  showAndroid.value = false
  setDismissed('pwa-android-dismissed')
}

function dismissIos() {
  showIos.value = false
  setDismissed('pwa-ios-dismissed')
}
</script>

<style scoped>
/* ── Banner Android ──────────────────────────────────────────────── */
.pwa-banner {
  position: fixed;
  bottom: 24px; left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  z-index: 9990;
  max-width: 420px;
  width: calc(100vw - 32px);
}

.pwa-app-icon {
  width: 44px; height: 44px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pwa-app-icon.large { width: 50px; height: 50px; border-radius: 14px; }

.pwa-text {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 3px;
}
.pwa-text strong { font-size: 14px; font-weight: 700; color: var(--text-primary); display: block; }
.pwa-text span   { font-size: 12px; color: var(--text-muted); }

.pwa-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }

.pwa-btn-install {
  padding: 8px 16px;
  background: var(--accent); color: #0c0e14;
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 700;
  font-family: var(--font-body);
  cursor: pointer; transition: all var(--transition);
  white-space: nowrap;
}
.pwa-btn-install:hover { background: #00ffb3; box-shadow: 0 0 16px var(--accent-glow); }

.pwa-btn-dismiss {
  padding: 4px; background: none; border: none;
  color: var(--text-muted); font-size: 12px;
  cursor: pointer; font-family: var(--font-body);
  text-align: center; transition: color var(--transition);
}
.pwa-btn-dismiss:hover { color: var(--text-secondary); }

/* ── Modal iOS ────────────────────────────────────────────────────── */
.pwa-ios-modal {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  border-radius: 24px 24px 0 0;
  padding: 20px 20px 36px;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
  z-index: 9990;
}

.pwa-ios-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.pwa-ios-header > div {
  flex: 1;
  display: flex; flex-direction: column; gap: 2px;
}
.pwa-ios-header strong { font-size: 15px; font-weight: 700; }
.pwa-ios-header span   { font-size: 12px; color: var(--text-muted); }

.pwa-close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 50%; cursor: pointer; color: var(--text-muted);
  transition: all var(--transition); flex-shrink: 0;
}
.pwa-close:hover { color: var(--text-primary); }

.pwa-ios-steps { display: flex; flex-direction: column; gap: 4px; }

.pwa-step {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 14px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.step-num {
  width: 26px; height: 26px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: var(--accent);
  flex-shrink: 0; margin-top: 1px;
}

.step-content { flex: 1; }
.step-title   { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.step-desc    { font-size: 12px; color: var(--text-muted); margin-bottom: 8px; }

.step-icon-preview {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.step-arrow {
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
  padding: 2px 0;
}

/* Flèche qui pointe vers le bouton Share en bas */
.pwa-ios-arrow {
  text-align: center;
  margin-top: 12px;
  font-size: 20px;
  color: var(--accent);
  animation: bounce-arrow 1.2s ease infinite;
}
@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(5px); }
}

/* ── Animations ───────────────────────────────────────────────────── */
.pwa-slide-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pwa-slide-leave-active { transition: all 0.25s ease; }
.pwa-slide-enter-from   { opacity: 0; transform: translateX(-50%) translateY(24px); }
.pwa-slide-leave-to     { opacity: 0; transform: translateX(-50%) translateY(12px); }

/* Pour le modal iOS (pas de translateX) */
.pwa-ios-modal.pwa-slide-enter-from { transform: translateY(100%); opacity: 1; }
.pwa-ios-modal.pwa-slide-leave-to   { transform: translateY(100%); opacity: 1; }
</style>
