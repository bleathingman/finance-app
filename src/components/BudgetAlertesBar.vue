<template>
  <transition-group name="alerte-slide" tag="div" class="budget-alertes-bar">
    <div
      v-for="alerte in alertesVisibles"
      :key="alerte.categorie"
      class="budget-alerte-toast"
      :class="alerte.type"
    >
      <span class="alerte-emoji">{{ alerte.emoji }}</span>
      <div class="alerte-content">
        <span class="alerte-title">{{ alerte.title }}</span>
        <span class="alerte-sep">—</span>
        <span class="alerte-text">{{ alerte.text }}</span>
      </div>
      <router-link to="/budget" class="alerte-cta">Voir</router-link>
      <button class="alerte-close" @click="dismisser(alerte.categorie)">✕</button>
    </div>
  </transition-group>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBudgetAlertes } from '@/composables/useBudgetAlertes'

const { alertes } = useBudgetAlertes()
const dismissed = ref(new Set())

// Si une alerte passe warn -> danger, on la réaffiche (plus urgent)
watch(alertes, (newVal, oldVal) => {
  newVal.forEach(a => {
    const old = oldVal?.find(o => o.categorie === a.categorie)
    if (old?.type === 'warn' && a.type === 'danger') {
      dismissed.value.delete(a.categorie)
    }
  })
}, { deep: true })

const alertesVisibles = computed(() =>
  alertes.value.filter(a => !dismissed.value.has(a.categorie))
)

function dismisser(categorie) {
  dismissed.value = new Set([...dismissed.value, categorie])
}
</script>

<style scoped>
.budget-alertes-bar { display:flex;flex-direction:column;gap:8px;margin-bottom:20px }

.budget-alerte-toast {
  display:flex;align-items:center;gap:10px;padding:11px 16px;
  border-radius:var(--radius);border:1px solid;font-size:13px;
  animation:alerteIn 0.3s ease;
}
.budget-alerte-toast.danger { background:rgba(255,107,107,0.08);border-color:rgba(255,107,107,0.3) }
.budget-alerte-toast.warn   { background:rgba(255,159,67,0.08);border-color:rgba(255,159,67,0.3) }

.alerte-emoji   { font-size:16px;flex-shrink:0 }
.alerte-content { flex:1;min-width:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap }
.alerte-title   { font-weight:700 }
.alerte-sep     { color:var(--text-muted) }
.alerte-text    { color:var(--text-secondary) }

.alerte-cta {
  padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;
  text-decoration:none;flex-shrink:0;
  background:rgba(255,255,255,0.06);color:var(--text-primary);
  border:1px solid var(--border);transition:all var(--transition);
}
.alerte-cta:hover { background:rgba(255,255,255,0.12) }

.alerte-close {
  background:none;border:none;cursor:pointer;
  color:var(--text-muted);font-size:12px;padding:4px;flex-shrink:0;
  transition:color var(--transition);
}
.alerte-close:hover { color:var(--text-primary) }

.alerte-slide-enter-active { transition:all 0.3s ease }
.alerte-slide-leave-active { transition:all 0.25s ease }
.alerte-slide-enter-from   { opacity:0;transform:translateY(-8px) }
.alerte-slide-leave-to     { opacity:0;transform:translateX(20px) }

@keyframes alerteIn {
  from { opacity:0;transform:translateY(-6px) }
  to   { opacity:1;transform:translateY(0) }
}

@media (max-width:640px) {
  .alerte-sep, .alerte-text { display:none }
}
</style>