<template>
  <!-- Si la feature est disponible → affiche le contenu normalement -->
  <slot v-if="hasAccess" />

  <!-- Sinon → affiche le mur avec CTA -->
  <div v-else class="premium-gate">
    <div class="gate-glow"></div>
    <div class="gate-icon">{{ icon }}</div>
    <h3 class="gate-title">{{ title }}</h3>
    <p class="gate-desc">{{ description }}</p>
    <div class="gate-plan-badge">
      <span>💎</span>
      Disponible en Premium
    </div>
    <router-link to="/pricing" class="btn btn-primary" style="margin-top:4px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Passer Premium — 3,99€/mois
    </router-link>
    <div style="font-size:12px;color:var(--text-muted);margin-top:8px">Annulable à tout moment</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSubscriptionStore } from '@/stores/subscription'

const props = defineProps({
  feature:     { type: String, required: true },
  icon:        { type: String, default: '💎' },
  title:       { type: String, default: 'Feature Premium' },
  description: { type: String, default: 'Cette fonctionnalité est disponible avec un abonnement Premium.' }
})

const subStore  = useSubscriptionStore()
const hasAccess = computed(() => subStore.can(props.feature))
</script>

<style scoped>
.premium-gate {
  position: relative;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 48px 32px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-accent);
  border-radius: var(--radius-xl);
  overflow: hidden;
  gap: 10px;
  min-height: 260px;
}

.gate-glow {
  position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%);
  pointer-events: none;
}

.gate-icon  { font-size: 40px; margin-bottom: 4px; }
.gate-title { font-family: var(--font-display); font-size: 1.2rem; }
.gate-desc  { font-size: 14px; color: var(--text-secondary); max-width: 320px; line-height: 1.5; }

.gate-plan-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 99px;
  font-size: 13px; font-weight: 600; color: var(--accent);
  margin-top: 4px;
}
</style>
