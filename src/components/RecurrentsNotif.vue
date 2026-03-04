<template>
  <transition name="slide-up">
    <div v-if="visible" class="recurrents-notif">
      <div class="notif-icon">🔄</div>
      <div class="notif-body">
        <div class="notif-title">Récurrentes générées automatiquement</div>
        <div class="notif-text">
          <span v-if="result.depenses > 0">{{ result.depenses }} dépense{{ result.depenses > 1 ? 's' : '' }}</span>
          <span v-if="result.depenses > 0 && result.revenus > 0"> et </span>
          <span v-if="result.revenus > 0">{{ result.revenus }} revenu{{ result.revenus > 1 ? 's' : '' }}</span>
          {{ ' ' }}ajouté{{ (result.depenses + result.revenus) > 1 ? 's' : '' }} pour {{ moisLabel }}
        </div>
      </div>
      <div class="notif-actions">
        <router-link to="/depenses" class="notif-link" @click="dismiss">Voir</router-link>
        <button class="notif-close" @click="dismiss">×</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'

const financeStore = useFinanceStore()

const visible = ref(false)
const result  = ref({ depenses: 0, revenus: 0 })

const moisLabel = computed(() => {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

function dismiss() { visible.value = false }

onMounted(async () => {
  // Attendre que les listeners Firestore soient prêts
  await new Promise(r => setTimeout(r, 1200))

  const res = await financeStore.genererRecurrents()
  result.value = res

  if (res.depenses + res.revenus > 0) {
    visible.value = true
    // Auto-dismiss après 8 secondes
    setTimeout(() => { visible.value = false }, 8000)
  }
})
</script>

<style scoped>
.recurrents-notif {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-surface);
  border: 1px solid var(--border-accent);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 229, 160, 0.1);
  z-index: 9999;
  max-width: 420px;
  width: calc(100vw - 48px);
}

.notif-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.notif-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.notif-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.notif-link {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  padding: 4px 10px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 99px;
  transition: all var(--transition);
}
.notif-link:hover { background: var(--accent); color: #fff }

.notif-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1;
  padding: 4px;
  border-radius: 6px;
  transition: all var(--transition);
}
.notif-close:hover { color: var(--text-primary); background: var(--bg-elevated) }

/* Animation */
.slide-up-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) }
.slide-up-leave-active { transition: all 0.2s ease }
.slide-up-enter-from   { opacity: 0; transform: translateX(-50%) translateY(20px) }
.slide-up-leave-to     { opacity: 0; transform: translateX(-50%) translateY(10px) }
</style>