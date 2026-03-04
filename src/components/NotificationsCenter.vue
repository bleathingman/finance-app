<template>
  <div class="notif-wrap" ref="wrapRef">

    <!-- Cloche -->
    <button class="notif-bell" @click.stop="toggle" :class="{ active: open }" title="Notifications">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span v-if="store.nonLues > 0" class="notif-badge">
        {{ store.nonLues > 9 ? '9+' : store.nonLues }}
      </span>
    </button>

    <!-- Dropdown -->
    <transition name="notif-drop">
      <div v-if="open" class="notif-dropdown" @click.stop>

        <!-- Header -->
        <div class="notif-header">
          <span class="notif-header-title">Notifications</span>
          <div style="display:flex;gap:8px;align-items:center">
            <button v-if="store.nonLues > 0" class="notif-action-btn" @click="store.marquerToutesLues()">
              Tout lire
            </button>
            <!-- Toggle push -->
            <button
              class="notif-action-btn notif-push-btn"
              :class="{ active: store.pushActivees }"
              @click="togglePush"
              :title="store.pushActivees ? 'Notifications push activées' : 'Activer les notifications push'"
            >
              {{ store.pushActivees ? '🔔' : '🔕' }}
            </button>
          </div>
        </div>

        <!-- Demande permission push -->
        <div v-if="showPushPrompt" class="notif-push-prompt">
          <div class="push-prompt-text">
            <strong>Recevez des alertes en temps réel</strong>
            <span>Budget dépassé, résumé mensuel, rappels...</span>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-primary" style="font-size:12px;padding:6px 12px" @click="activerPush">
              Activer
            </button>
            <button class="btn btn-ghost" style="font-size:12px;padding:6px 10px" @click="showPushPrompt = false">
              Plus tard
            </button>
          </div>
        </div>

        <!-- Liste -->
        <div class="notif-list" v-if="store.notifs.length">
          <div
            v-for="n in store.notifs" :key="n.id"
            class="notif-item"
            :class="{ unread: !n.lue }"
            @click="handleClick(n)"
          >
            <div class="notif-item-icon">{{ getIcon(n.type) }}</div>
            <div class="notif-item-body">
              <div class="notif-item-titre">{{ n.titre }}</div>
              <div class="notif-item-msg">{{ n.message }}</div>
              <div class="notif-item-date">{{ formatDate(n.createdAt) }}</div>
            </div>
            <button class="notif-item-del" @click.stop="store.supprimer(n.id)" title="Supprimer">×</button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="notif-empty">
          <span style="font-size:2rem">🎉</span>
          <span>Tout est à jour !</span>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'

const store  = useNotificationsStore()
const router = useRouter()

const open          = ref(false)
const wrapRef       = ref(null)
const showPushPrompt = ref(false)

let unsub

onMounted(() => {
  unsub = store.ecouter_notifs()

  // Proposer push si pas encore activé et pas refusé
  if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => { showPushPrompt.value = true }, 3000)
  }

  // Close on outside click
  document.addEventListener('click', onOutside)
})

onUnmounted(() => {
  if (unsub) unsub()
  document.removeEventListener('click', onOutside)
})

function onOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) open.value = false
}

function toggle() { open.value = !open.value }

async function handleClick(n) {
  if (!n.lue) await store.marquerLue(n.id)
  if (n.lien) { router.push(n.lien); open.value = false }
}

async function activerPush() {
  showPushPrompt.value = false
  const ok = await store.demanderPermissionPush()
  if (!ok) alert('Impossible d\'activer les notifications. Vérifiez les permissions de votre navigateur.')
}

function togglePush() {
  if (store.pushActivees) return // ne peut pas désactiver programmatiquement
  activerPush()
}

function getIcon(type) {
  const icons = {
    budget_alert:   '⚠️',
    budget_depasse: '🚨',
    recurrents:     '🔄',
    inactivite:     '💡',
    resume_mensuel: '📊',
    push:           '🔔',
  }
  return icons[type] || '🔔'
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000)    return 'À l\'instant'
  if (diff < 3600000)  return `Il y a ${Math.round(diff / 60000)} min`
  if (diff < 86400000) return `Il y a ${Math.round(diff / 3600000)} h`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
</script>

<style scoped>
.notif-wrap { position: relative; }

/* Cloche */
.notif-bell {
  position: relative;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition);
}
.notif-bell:hover, .notif-bell.active {
  background: var(--bg-elevated);
  border-color: var(--border);
  color: var(--text-primary);
}
.notif-badge {
  position: absolute;
  top: 4px; right: 4px;
  min-width: 16px; height: 16px;
  background: var(--red);
  color: #fff;
  border-radius: 99px;
  font-size: 9px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--bg-surface);
}

/* Dropdown */
.notif-dropdown {
  position: absolute;
  right: 0; top: calc(100% + 8px);
  width: 340px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  z-index: 500;
  overflow: hidden;
  max-height: 480px;
  display: flex;
  flex-direction: column;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.notif-header-title { font-size: 14px; font-weight: 700; }
.notif-action-btn {
  background: none; border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: var(--accent);
  padding: 4px 8px; border-radius: 6px;
  font-family: var(--font-body);
  transition: all var(--transition);
}
.notif-action-btn:hover { background: var(--accent-dim); }
.notif-push-btn { font-size: 16px; padding: 2px 6px; color: var(--text-muted); }
.notif-push-btn.active { color: var(--accent); }

/* Push prompt */
.notif-push-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--accent-dim);
  border-bottom: 1px solid var(--border-accent);
  flex-shrink: 0;
}
.push-prompt-text {
  display: flex; flex-direction: column; gap: 2px;
  font-size: 12px;
}
.push-prompt-text strong { font-size: 13px; color: var(--text-primary); }
.push-prompt-text span { color: var(--text-muted); }

/* List */
.notif-list { overflow-y: auto; flex: 1; }
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background var(--transition);
  position: relative;
}
.notif-item:last-child { border-bottom: none; }
.notif-item:hover { background: var(--bg-elevated); }
.notif-item.unread { background: rgba(0,229,160,0.04); }
.notif-item.unread::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.notif-item-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.notif-item-body { flex: 1; min-width: 0; }
.notif-item-titre { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
.notif-item-msg   { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
.notif-item-date  { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.notif-item-del {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 16px; line-height: 1;
  padding: 2px 4px; border-radius: 4px; flex-shrink: 0;
  opacity: 0; transition: all var(--transition);
}
.notif-item:hover .notif-item-del { opacity: 1; }
.notif-item-del:hover { color: var(--red); background: rgba(255,107,107,0.1); }

/* Empty */
.notif-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 40px 16px;
  font-size: 13px; color: var(--text-muted);
}

/* Animation */
.notif-drop-enter-active { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.notif-drop-leave-active { transition: all 0.15s ease; }
.notif-drop-enter-from   { opacity: 0; transform: translateY(-8px) scale(0.97); }
.notif-drop-leave-to     { opacity: 0; transform: translateY(-4px); }

/* Mobile */
@media (max-width: 480px) {
  .notif-dropdown {
    position: fixed;
    top: auto;
    bottom: 0; left: 0; right: 0;
    width: 100%;
    border-radius: 20px 20px 0 0;
    max-height: 70vh;
  }
}
</style>
