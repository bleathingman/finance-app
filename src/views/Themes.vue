<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <div><h1>Thèmes</h1><p>Personnalisez l'apparence de FinanceFlow</p></div>
    </div>

    <!-- Banner si pas premium -->
    <div v-if="!subStore.can('customThemes')" class="premium-banner">
      <div style="font-size:28px">🎨</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:15px;margin-bottom:4px">Thèmes customs — feature Premium</div>
        <div style="font-size:13px;color:var(--text-muted)">Débloquez 4 thèmes supplémentaires et le créateur de thème</div>
      </div>
      <router-link to="/pricing" class="btn btn-primary">💎 Passer Premium</router-link>
    </div>

    <!-- Thèmes prédéfinis -->
    <h3 class="section-title">Thèmes prédéfinis</h3>
    <div class="themes-grid" style="margin-bottom:40px">
      <div v-for="theme in THEMES" :key="theme.id"
        class="theme-card"
        :class="{ active: themeStore.currentId === theme.id, locked: !themeStore.canUse(theme.id) }"
        @click="handleSelect(theme)">
        <div class="theme-preview" :style="{ background: theme.bg }">
          <div class="preview-sidebar" :style="{ background: theme.bg, borderColor: theme.accent + '20' }">
            <div class="preview-logo" :style="{ background: theme.accent + '20', borderColor: theme.accent + '40' }">
              <div style="width:8px;height:8px;border-radius:50%" :style="{ background: theme.accent }"></div>
            </div>
            <div v-for="i in 4" :key="i" class="preview-nav-item"
              :style="{ background: i===1 ? theme.accent+'20':'transparent', borderColor: i===1 ? theme.accent+'40':'transparent' }">
              <div class="preview-nav-dot" :style="{ background: i===1 ? theme.accent : theme.accent+'30' }"></div>
              <div class="preview-nav-line" :style="{ background: i===1 ? theme.accent+'80' : theme.accent+'20' }"></div>
            </div>
          </div>
          <div class="preview-content">
            <div class="preview-card" :style="{ background: theme.accent+'15', borderColor: theme.accent+'30' }">
              <div style="height:6px;border-radius:3px;width:60%" :style="{ background: theme.accent+'50' }"></div>
              <div style="height:14px;border-radius:4px;width:80%;margin-top:6px" :style="{ background: theme.accent }"></div>
            </div>
            <div class="preview-grid">
              <div v-for="j in 3" :key="j" class="preview-mini-card" :style="{ background: theme.accent+'08', borderColor: theme.accent+'15' }">
                <div style="height:4px;border-radius:2px" :style="{ background: theme.accent+'40' }"></div>
                <div style="height:8px;border-radius:3px;margin-top:4px;width:70%" :style="{ background: theme.accent+'60' }"></div>
              </div>
            </div>
          </div>
          <div v-if="!themeStore.canUse(theme.id)" class="preview-lock">
            <div class="lock-icon">🔒</div>
            <div style="font-size:11px;font-weight:600;color:white;margin-top:4px">Premium</div>
          </div>
          <div v-if="themeStore.currentId === theme.id" class="preview-active" :style="{ background: theme.accent }">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#0c0e14" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <div class="theme-info">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">{{ theme.emoji }}</span>
            <div>
              <div style="font-weight:700;font-size:14px">{{ theme.name }}</div>
              <div style="font-size:12px;color:var(--text-muted)">{{ theme.description }}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="accent-dot" :style="{ background: theme.accent }"></div>
            <span v-if="theme.free" class="badge" style="font-size:11px">Gratuit</span>
            <span v-else class="badge" style="font-size:11px;background:var(--accent-dim);color:var(--accent);border-color:var(--border-accent)">💎 Premium</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Créateur thème custom (Pro) -->
    <template v-if="subStore.can('customThemes')">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <h3 class="section-title" style="margin:0">✨ Créer mon thème</h3>
        <span class="badge" style="background:rgba(139,92,246,0.15);color:#a78bfa;border-color:rgba(139,92,246,0.3);font-size:11px">🚀 Pro</span>
      </div>
      <div class="custom-builder">

        <!-- Contrôles -->
        <div class="builder-controls card">
          <div class="form-group">
            <label>Nom du thème</label>
            <input class="input" v-model="customForm.name" placeholder="Mon thème" maxlength="24" />
          </div>
          <div class="form-group">
            <label>Couleur d'accentuation</label>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Boutons, liens, valeurs positives…</p>
            <div class="color-picker-row">
              <input type="color" class="color-input" v-model="customForm.accent" @input="livePreview" />
              <input class="input input-hex" v-model="customForm.accent" placeholder="#00e5a0" @input="livePreview" />
            </div>
            <div class="color-swatches">
              <button v-for="c in accentSuggestions" :key="c" class="swatch"
                :style="{ background: c }" :class="{ active: customForm.accent === c }"
                @click="customForm.accent = c; livePreview()"></button>
            </div>
          </div>
          <div class="form-group">
            <label>Couleur de fond</label>
            <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Fond principal de l'application</p>
            <div class="color-picker-row">
              <input type="color" class="color-input" v-model="customForm.bg" @input="livePreview" />
              <input class="input input-hex" v-model="customForm.bg" placeholder="#0c0e14" @input="livePreview" />
            </div>
            <div class="color-swatches">
              <button v-for="c in bgSuggestions" :key="c" class="swatch"
                :style="{ background: c }" :class="{ active: customForm.bg === c }"
                @click="customForm.bg = c; livePreview()"></button>
            </div>
          </div>
          <div class="builder-actions">
            <button class="btn btn-ghost" @click="resetPreview">Annuler</button>
            <button class="btn btn-primary" :disabled="saving" @click="applyAndSave">
              {{ saving ? 'Enregistrement...' : '✅ Appliquer & Sauvegarder' }}
            </button>
          </div>
          <div v-if="saveMsg" class="msg-success">{{ saveMsg }}</div>
        </div>

        <!-- Preview live -->
        <div class="builder-preview">
          <div class="preview-label">Aperçu en direct</div>
          <div class="live-preview" :style="{ background: customForm.bg, borderColor: customForm.accent + '30' }">
            <div class="lp-sidebar" :style="{ borderColor: customForm.accent + '15' }">
              <div class="lp-logo" :style="{ background: customForm.accent+'20', borderColor: customForm.accent+'30' }">
                <span :style="{ color: customForm.accent, fontSize:'10px', fontWeight:'800' }">FF</span>
              </div>
              <div v-for="i in 5" :key="i" class="lp-nav"
                :style="i===1 ? { background: customForm.accent+'20', borderColor: customForm.accent+'30' } : {}">
                <div class="lp-nav-dot" :style="{ background: i===1 ? customForm.accent : customForm.accent+'25' }"></div>
                <div class="lp-nav-line" :style="{ background: i===1 ? customForm.accent+'70' : customForm.accent+'15' }"></div>
              </div>
            </div>
            <div class="lp-content">
              <div class="lp-kpis">
                <div class="lp-kpi" :style="{ background: customForm.accent+'12', borderColor: customForm.accent+'25' }">
                  <div class="lp-kpi-label" :style="{ background: customForm.accent+'25' }"></div>
                  <div class="lp-kpi-val" :style="{ background: customForm.accent }"></div>
                </div>
                <div v-for="j in 3" :key="j" class="lp-kpi" :style="{ borderColor: customForm.accent+'12' }">
                  <div class="lp-kpi-label" :style="{ background: customForm.accent+'15' }"></div>
                  <div class="lp-kpi-val" :style="{ background: customForm.accent+'40' }"></div>
                </div>
              </div>
              <div class="lp-chart" :style="{ borderColor: customForm.accent+'15' }">
                <div v-for="k in 8" :key="k" class="lp-bar"
                  :style="{ height: barHeights[k-1]+'%', background: k%2===0 ? customForm.accent : customForm.accent+'50' }"></div>
              </div>
              <div v-for="l in 3" :key="l" class="lp-tx" :style="{ borderColor: customForm.accent+'10' }">
                <div class="lp-tx-icon" :style="{ background: customForm.accent+'15' }"></div>
                <div style="flex:1">
                  <div class="lp-tx-line" :style="{ background: customForm.accent+'30', width: (50+l*12)+'%' }"></div>
                  <div class="lp-tx-line" :style="{ background: customForm.accent+'15', width:'40%', marginTop:'3px', height:'4px' }"></div>
                </div>
                <div class="lp-tx-amount" :style="{ background: l===1 ? customForm.accent : customForm.accent+'35' }"></div>
              </div>
            </div>
          </div>
          <div v-if="themeStore.currentId === 'custom'" class="active-custom-badge" :style="{ borderColor: customForm.accent+'40', color: customForm.accent }">
            ✨ Thème actif — {{ themeStore.customTheme?.name || 'Mon thème' }}
          </div>
        </div>

      </div>
    </template>

    <!-- Lock Pro si Premium mais pas Pro -->
    <div v-else-if="subStore.isPaid && !subStore.isPro" class="pro-lock card">
      <span style="font-size:36px">✨</span>
      <div>
        <div style="font-weight:700;font-size:15px">Créateur de thème custom</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Choisissez vos propres couleurs</div>
      </div>
      <router-link to="/pricing" class="btn btn-primary" style="flex-shrink:0">🚀 Passer Pro</router-link>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useThemeStore, THEMES } from '@/stores/theme'
import { useSubscriptionStore } from '@/stores/subscription'
import { useRouter } from 'vue-router'

const themeStore = useThemeStore()
const subStore   = useSubscriptionStore()
const router     = useRouter()

const barHeights = [45, 70, 35, 80, 55, 65, 40, 75]

function handleSelect(theme) {
  if (!themeStore.canUse(theme.id)) { router.push('/pricing'); return }
  themeStore.applyTheme(theme.id)
}

const customForm = reactive({
  name:   themeStore.customTheme?.name   || 'Mon thème',
  accent: themeStore.customTheme?.accent || '#00e5a0',
  bg:     themeStore.customTheme?.bg     || '#0c0e14'
})

const saving  = ref(false)
const saveMsg = ref('')

const accentSuggestions = [
  '#00e5a0','#4facfe','#c084fc','#fb7185',
  '#ff9f43','#f472b6','#34d399','#fbbf24',
  '#e879f9','#22d3ee','#a3e635','#f97316'
]
const bgSuggestions = [
  '#0c0e14','#070d1a','#0f0a18','#120a05',
  '#0a0f0a','#0d0d0d','#111827','#1a1a2e',
  '#f5f8fc','#fafafa','#f0f4f8','#fffbf5'
]

function livePreview() {
  if (!customForm.accent.match(/^#[0-9a-fA-F]{6}$/) || !customForm.bg.match(/^#[0-9a-fA-F]{6}$/)) return
  themeStore.applyTheme('custom', { ...customForm })
}

async function applyAndSave() {
  if (!customForm.accent.match(/^#[0-9a-fA-F]{6}$/) || !customForm.bg.match(/^#[0-9a-fA-F]{6}$/)) return
  saving.value = true
  saveMsg.value = ''
  try {
    await themeStore.saveCustomTheme({ ...customForm })
    themeStore.applyTheme('custom', { ...customForm })
    saveMsg.value = '✅ Thème sauvegardé et appliqué !'
    setTimeout(() => saveMsg.value = '', 3000)
  } finally {
    saving.value = false
  }
}

function resetPreview() {
  customForm.accent = themeStore.customTheme?.accent || '#00e5a0'
  customForm.bg     = themeStore.customTheme?.bg     || '#0c0e14'
  if (themeStore.currentId === 'custom' && !themeStore.customTheme) themeStore.applyTheme('dark')
}

onMounted(async () => {
  if (subStore.can('customThemes')) {
    const saved = await themeStore.loadCustomTheme()
    if (saved) { customForm.name = saved.name || 'Mon thème'; customForm.accent = saved.accent || '#00e5a0'; customForm.bg = saved.bg || '#0c0e14' }
  }
})
</script>

<style scoped>
.section-title { font-family:var(--font-display);font-size:17px;font-weight:700;margin-bottom:16px }
.premium-banner { display:flex;align-items:center;gap:16px;padding:20px 24px;background:var(--accent-dim);border:1px solid var(--border-accent);border-radius:var(--radius-lg);margin-bottom:28px;flex-wrap:wrap }
.themes-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px }
.theme-card { background:var(--bg-surface);border:2px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;cursor:pointer;transition:all var(--transition) }
.theme-card:hover:not(.locked) { transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.25);border-color:var(--border-accent) }
.theme-card.active { border-color:var(--accent);box-shadow:0 0 24px var(--accent-glow) }
.theme-card.locked { opacity:0.85 }
.theme-preview { position:relative;height:160px;display:flex;overflow:hidden;padding:14px;gap:10px }
.preview-sidebar { width:40px;border:1px solid;border-radius:8px;padding:8px 6px;display:flex;flex-direction:column;gap:6px;flex-shrink:0 }
.preview-logo { width:28px;height:28px;border-radius:6px;border:1px solid;display:flex;align-items:center;justify-content:center;margin-bottom:4px }
.preview-nav-item { height:20px;border-radius:4px;border:1px solid;display:flex;align-items:center;gap:4px;padding:0 4px }
.preview-nav-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0 }
.preview-nav-line { height:3px;border-radius:2px;flex:1 }
.preview-content { flex:1;display:flex;flex-direction:column;gap:8px }
.preview-card { border:1px solid;border-radius:8px;padding:10px;flex-shrink:0 }
.preview-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:6px;flex:1 }
.preview-mini-card { border:1px solid;border-radius:6px;padding:8px }
.preview-lock { position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);display:flex;flex-direction:column;align-items:center;justify-content:center }
.lock-icon { font-size:24px }
.preview-active { position:absolute;top:10px;right:10px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3) }
.theme-info { padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px }
.accent-dot { width:14px;height:14px;border-radius:50%;flex-shrink:0 }
/* Builder */
.custom-builder { display:grid;grid-template-columns:360px 1fr;gap:24px;align-items:start }
.builder-controls { padding:24px }
.form-group { display:flex;flex-direction:column;gap:6px;margin-bottom:20px }
.form-group label { font-size:13px;font-weight:600;color:var(--text-secondary) }
.color-picker-row { display:flex;align-items:center;gap:10px }
.color-input { width:48px;height:42px;border-radius:var(--radius);border:2px solid var(--border);cursor:pointer;padding:2px;background:var(--bg-elevated) }
.input-hex { flex:1;font-family:monospace;font-size:14px }
.color-swatches { display:flex;flex-wrap:wrap;gap:6px;margin-top:8px }
.swatch { width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all 0.2s }
.swatch:hover { transform:scale(1.2) }
.swatch.active { border-color:white;transform:scale(1.15) }
.builder-actions { display:flex;gap:10px;margin-top:4px }
.msg-success { padding:10px 14px;border-radius:var(--radius);font-size:13px;background:rgba(0,229,160,0.1);border:1px solid rgba(0,229,160,0.25);color:var(--green);margin-top:12px }
/* Live preview */
.builder-preview { display:flex;flex-direction:column;gap:12px }
.preview-label { font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em }
.live-preview { border:1px solid;border-radius:var(--radius-xl);overflow:hidden;display:flex;height:320px;transition:background 0.3s }
.lp-sidebar { width:52px;border-right:1px solid;display:flex;flex-direction:column;gap:6px;padding:10px 6px;flex-shrink:0 }
.lp-logo { width:32px;height:32px;border-radius:8px;border:1px solid;display:flex;align-items:center;justify-content:center;margin-bottom:8px }
.lp-nav { height:24px;border-radius:5px;display:flex;align-items:center;gap:5px;padding:0 5px;border:1px solid transparent }
.lp-nav-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0 }
.lp-nav-line { height:3px;border-radius:2px;flex:1 }
.lp-content { flex:1;padding:12px;display:flex;flex-direction:column;gap:10px;overflow:hidden }
.lp-kpis { display:grid;grid-template-columns:repeat(4,1fr);gap:6px }
.lp-kpi { border:1px solid;border-radius:7px;padding:8px;display:flex;flex-direction:column;gap:5px }
.lp-kpi-label { height:4px;border-radius:2px;width:60% }
.lp-kpi-val { height:10px;border-radius:4px;width:80% }
.lp-chart { border:1px solid;border-radius:7px;padding:8px;display:flex;align-items:flex-end;gap:3px;height:80px }
.lp-bar { flex:1;border-radius:3px 3px 0 0;transition:background 0.3s }
.lp-tx { display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid }
.lp-tx-icon { width:24px;height:24px;border-radius:6px;flex-shrink:0 }
.lp-tx-line { height:6px;border-radius:3px }
.lp-tx-amount { width:40px;height:8px;border-radius:4px }
.active-custom-badge { padding:8px 14px;border-radius:99px;border:1px solid;font-size:12px;font-weight:600;text-align:center }
.pro-lock { display:flex;align-items:center;gap:16px;padding:20px;flex-wrap:wrap }
@media (max-width:900px) { .custom-builder { grid-template-columns:1fr } }
@media (max-width:600px) { .themes-grid { grid-template-columns:1fr } .premium-banner { flex-direction:column } }
</style>