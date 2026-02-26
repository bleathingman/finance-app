<template>
  <div class="animate-fade-in">

    <div class="page-header">
      <div>
        <h1>Thèmes</h1>
        <p>Personnalisez l'apparence de FinanceFlow</p>
      </div>
    </div>

    <!-- Banner si pas premium -->
    <div v-if="!subStore.can('customThemes')" class="premium-banner">
      <div style="font-size:28px">🎨</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">Thèmes customs — feature Premium</div>
        <div style="font-size:13px;color:var(--text-muted)">Débloquez 4 thèmes supplémentaires avec un abonnement Premium</div>
      </div>
      <router-link to="/pricing" class="btn btn-primary">
        💎 Passer Premium — 3,99€/mois
      </router-link>
    </div>

    <!-- Grille des thèmes -->
    <div class="themes-grid">
      <div
        v-for="theme in THEMES" :key="theme.id"
        class="theme-card"
        :class="{
          active: themeStore.currentId === theme.id,
          locked: !themeStore.canUse(theme.id)
        }"
        @click="handleSelect(theme)"
      >
        <!-- Preview -->
        <div class="theme-preview" :style="{ background: theme.bg }">
          <!-- Fake sidebar -->
          <div class="preview-sidebar" :style="{ background: theme.bg, borderColor: theme.accent + '20' }">
            <div class="preview-logo" :style="{ background: theme.accent + '20', borderColor: theme.accent + '40' }">
              <div style="width:8px;height:8px;border-radius:50%" :style="{ background: theme.accent }"></div>
            </div>
            <div v-for="i in 4" :key="i" class="preview-nav-item"
              :style="{ background: i === 1 ? theme.accent + '20' : 'transparent', borderColor: i === 1 ? theme.accent + '40' : 'transparent' }">
              <div class="preview-nav-dot" :style="{ background: i === 1 ? theme.accent : theme.accent + '30' }"></div>
              <div class="preview-nav-line" :style="{ background: i === 1 ? theme.accent + '80' : theme.accent + '20' }"></div>
            </div>
          </div>
          <!-- Fake content -->
          <div class="preview-content">
            <div class="preview-card" :style="{ background: theme.accent + '15', borderColor: theme.accent + '30' }">
              <div style="height:6px;border-radius:3px;width:60%" :style="{ background: theme.accent + '50' }"></div>
              <div style="height:14px;border-radius:4px;width:80%;margin-top:6px" :style="{ background: theme.accent }"></div>
            </div>
            <div class="preview-grid">
              <div v-for="j in 3" :key="j" class="preview-mini-card" :style="{ background: theme.accent + '08', borderColor: theme.accent + '15' }">
                <div style="height:4px;border-radius:2px" :style="{ background: theme.accent + '40' }"></div>
                <div style="height:8px;border-radius:3px;margin-top:4px;width:70%" :style="{ background: theme.accent + '60' }"></div>
              </div>
            </div>
          </div>
          <!-- Lock overlay -->
          <div v-if="!themeStore.canUse(theme.id)" class="preview-lock">
            <div class="lock-icon">🔒</div>
            <div style="font-size:11px;font-weight:600;color:white;margin-top:4px">Premium</div>
          </div>
          <!-- Active checkmark -->
          <div v-if="themeStore.currentId === theme.id" class="preview-active" :style="{ background: theme.accent }">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#0c0e14" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Infos -->
        <div class="theme-info">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">{{ theme.emoji }}</span>
            <div>
              <div style="font-weight:700;font-size:14px">{{ theme.name }}</div>
              <div style="font-size:12px;color:var(--text-muted)">{{ theme.description }}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <!-- Pastille couleur accent -->
            <div class="accent-dot" :style="{ background: theme.accent }"></div>
            <span v-if="theme.free" class="badge" style="font-size:11px">Gratuit</span>
            <span v-else class="badge" style="font-size:11px;background:var(--accent-dim);color:var(--accent);border-color:var(--border-accent)">💎 Premium</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useThemeStore, THEMES } from '@/stores/theme'
import { useSubscriptionStore } from '@/stores/subscription'
import { useRouter } from 'vue-router'

const themeStore = useThemeStore()
const subStore   = useSubscriptionStore()
const router     = useRouter()

function handleSelect(theme) {
  if (!themeStore.canUse(theme.id)) {
    router.push('/pricing')
    return
  }
  themeStore.applyTheme(theme.id)
}
</script>

<style scoped>
.premium-banner {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 24px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.theme-card {
  background: var(--bg-surface);
  border: 2px solid var(--border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition);
}
.theme-card:hover:not(.locked) {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
  border-color: var(--border-accent);
}
.theme-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 24px var(--accent-glow);
}
.theme-card.locked { cursor: pointer; opacity: 0.85; }

/* Preview */
.theme-preview {
  position: relative;
  height: 160px;
  display: flex;
  gap: 0;
  overflow: hidden;
  padding: 14px;
  gap: 10px;
}

.preview-sidebar {
  width: 40px;
  border: 1px solid;
  border-radius: 8px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.preview-logo {
  width: 28px; height: 28px;
  border-radius: 6px; border: 1px solid;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.preview-nav-item {
  height: 20px; border-radius: 4px; border: 1px solid;
  display: flex; align-items: center; gap: 4px; padding: 0 4px;
}
.preview-nav-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.preview-nav-line { height: 3px; border-radius: 2px; flex: 1; }

.preview-content {
  flex: 1; display: flex; flex-direction: column; gap: 8px;
}
.preview-card {
  border: 1px solid; border-radius: 8px; padding: 10px; flex-shrink: 0;
}
.preview-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; flex: 1;
}
.preview-mini-card {
  border: 1px solid; border-radius: 6px; padding: 8px;
}

.preview-lock {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(2px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.lock-icon { font-size: 24px; }

.preview-active {
  position: absolute; top: 10px; right: 10px;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Infos */
.theme-info {
  padding: 14px 16px;
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px;
}
.accent-dot {
  width: 14px; height: 14px; border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .themes-grid { grid-template-columns: 1fr; }
  .premium-banner { flex-direction: column; align-items: flex-start; }
}
</style>
