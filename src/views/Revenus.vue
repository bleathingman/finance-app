<template>
  <div class="animate-fade-in">

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Revenus</h1>
        <p>{{ moisCourant }} — {{ financeStore.revenus.length }} transaction(s)</p>
      </div>
      <button class="btn btn-primary" @click="showModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Ajouter un revenu
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="grid-3" style="margin-bottom:28px">
      <div class="card card-accent">
        <div class="kpi-label">Total du mois</div>
        <div class="kpi-value text-accent">{{ formatAmount(totalMois) }}</div>
        <div class="kpi-sub">{{ nbTotal }} entrée(s) ce mois</div>
      </div>
      <div class="card">
        <div class="kpi-label">Revenus récurrents</div>
        <div class="kpi-value">{{ formatAmount(totalRecurrents) }}</div>
        <div class="kpi-sub">{{ nbRecurrents }} source(s) stable(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Revenus ponctuels</div>
        <div class="kpi-value">{{ formatAmount(totalPonctuels) }}</div>
        <div class="kpi-sub">{{ nbPonctuels }} entrée(s) ponctuelle(s)</div>
      </div>
    </div>

    <!-- Répartition + Récurrents -->
    <div class="grid-2" style="margin-bottom:28px">
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Répartition par type</h3>
        <div v-if="categoriesStats.length === 0" class="empty-state-small">
          <p>Aucun revenu enregistré</p>
        </div>
        <div v-else class="category-bars">
          <div v-for="cat in categoriesStats" :key="cat.type" class="category-row">
            <div class="cat-header">
              <div class="cat-info">
                <span class="cat-emoji">{{ cat.emoji }}</span>
                <span class="cat-name">{{ cat.type }}</span>
              </div>
              <div class="cat-amounts">
                <span class="cat-amount">{{ formatAmount(cat.total) }}</span>
                <span class="cat-pct">{{ cat.pct }}%</span>
              </div>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: cat.pct + '%', background: cat.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Sources récurrentes</h3>
        <div v-if="recurringItems.length === 0" class="empty-state-small">
          <span style="font-size:1.5rem">🔄</span>
          <p>Aucun revenu récurrent configuré</p>
          <button class="btn btn-ghost" style="font-size:13px;margin-top:8px" @click="showModal = true">+ Ajouter</button>
        </div>
        <div v-else class="recurring-list">
          <div v-for="r in recurringItems" :key="r.id" class="recurring-item">
            <div class="recurring-icon" :style="{ background: typeColor(r.type) + '20' }">{{ typeEmoji(r.type) }}</div>
            <div class="recurring-info">
              <span class="recurring-name">{{ r.description }}</span>
              <span class="recurring-type">{{ r.type }}</span>
            </div>
            <div class="recurring-amount amount-positive">+{{ formatAmount(r.montant) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historique -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <h3 style="font-family:var(--font-display)">Historique</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <select v-model="filtreType" class="input" style="width:auto;padding:8px 12px;font-size:13px">
            <option value="">Tous les types</option>
            <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <select v-model="filtreRecurrence" class="input" style="width:auto;padding:8px 12px;font-size:13px">
            <option value="">Tous</option>
            <option value="recurrent">Récurrents</option>
            <option value="ponctuel">Ponctuels</option>
          </select>
          <div style="position:relative">
            <input v-model="recherche" type="text" class="input" placeholder="Rechercher..." style="padding-left:36px;font-size:13px;width:180px"/>
            <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted)" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div v-if="revenusFiltres.length === 0" class="empty-history">
        <div style="font-size:2.5rem;margin-bottom:12px">🪹</div>
        <h3>Aucun revenu trouvé</h3>
        <p>{{ financeStore.revenus.length === 0 ? 'Commencez par ajouter votre premier revenu.' : 'Modifiez vos filtres.' }}</p>
        <button v-if="financeStore.revenus.length === 0" class="btn btn-primary" style="margin-top:16px" @click="showModal = true">
          + Ajouter un revenu
        </button>
      </div>

      <div v-else class="transactions-list">
        <div v-for="revenu in revenusFiltres" :key="revenu.id" class="transaction-row">
          <div class="tx-icon" :style="{ background: typeColor(revenu.type) + '18' }">{{ typeEmoji(revenu.type) }}</div>
          <div class="tx-main">
            <div class="tx-desc">{{ revenu.description }}</div>
            <div class="tx-meta">
              <span class="badge" :style="{ background: typeColor(revenu.type) + '18', color: typeColor(revenu.type) }">{{ revenu.type }}</span>
              <span v-if="revenu.recurrent" class="badge badge-blue">🔄 Récurrent</span>
              <span class="tx-date">{{ formatDate(revenu.createdAt) }}</span>
            </div>
          </div>
          <div class="tx-amount amount-positive">+{{ formatAmount(revenu.montant) }}</div>
          <div class="tx-actions">
            <button class="icon-btn danger" @click="supprimerRevenu(revenu.id)" title="Supprimer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="revenusFiltres.length > 0" class="list-footer">
        <span style="color:var(--text-muted);font-size:14px">{{ revenusFiltres.length }} résultat(s)</span>
        <span class="amount-positive" style="font-size:15px;font-weight:700">Total : +{{ formatAmount(totalFiltres) }}</span>
      </div>
    </div>

    <!-- Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Ajouter un revenu</h3>
              <button class="icon-btn" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="handleAjouter" class="modal-body">
              <div class="form-group">
                <label>Type de revenu</label>
                <div class="type-selector">
                  <button v-for="t in typeOptions" :key="t.value" type="button" class="type-btn" :class="{ active: form.type === t.value }" @click="form.type = t.value">
                    <span>{{ t.emoji }}</span>
                    <span>{{ t.label }}</span>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <input v-model="form.description" type="text" class="input" placeholder="Ex: Salaire Mars, Mission freelance..." required/>
              </div>
              <div class="form-group">
                <label>Montant (€)</label>
                <div style="position:relative">
                  <input v-model.number="form.montant" type="number" class="input" placeholder="0.00" step="0.01" min="0.01" required style="padding-left:36px;font-size:1.1rem;font-weight:600"/>
                  <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
                </div>
              </div>
              <div class="form-group">
                <label>Date de réception</label>
                <input v-model="form.date" type="date" class="input" required/>
              </div>
              <div class="toggle-row">
                <div>
                  <div style="font-weight:500;font-size:14px">Revenu récurrent</div>
                  <div style="font-size:13px;color:var(--text-muted)">Se répète chaque mois</div>
                </div>
                <button type="button" class="toggle-btn" :class="{ active: form.recurrent }" @click="form.recurrent = !form.recurrent">
                  <span class="toggle-knob"></span>
                </button>
              </div>
              <div v-if="form.montant > 0" class="preview-box">
                <span>{{ typeEmoji(form.type) }} {{ form.description || 'Nouveau revenu' }}</span>
                <span class="amount-positive">+{{ formatAmount(form.montant) }}</span>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <div v-if="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                  <span v-else>Ajouter le revenu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'

const financeStore = useFinanceStore()

const showModal  = ref(false)
const submitting = ref(false)
const filtreType = ref('')
const filtreRecurrence = ref('')
const recherche  = ref('')

const form = ref({
  type: 'Salaire',
  description: '',
  montant: null,
  date: new Date().toISOString().split('T')[0],
  recurrent: false
})

const typeOptions = [
  { value: 'Salaire',         label: 'Salaire',   emoji: '💼' },
  { value: 'Freelance',       label: 'Freelance',  emoji: '🧑‍💻' },
  { value: 'Revenus passifs', label: 'Passifs',    emoji: '📈' },
  { value: 'Autres',          label: 'Autres',     emoji: '💡' }
]

const typeColors = { 'Salaire': '#00e5a0', 'Freelance': '#4facfe', 'Revenus passifs': '#ff9f43', 'Autres': '#c084fc' }

function typeColor(type) { return typeColors[type] || '#8892a4' }
function typeEmoji(type) { return typeOptions.find(t => t.value === type)?.emoji || '💰' }

const moisCourant   = computed(() => new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
const totalMois     = computed(() => financeStore.revenus.reduce((s, r) => s + r.montant, 0))
const nbTotal       = computed(() => financeStore.revenus.length)
const recurringItems= computed(() => financeStore.revenus.filter(r => r.recurrent))
const totalRecurrents = computed(() => recurringItems.value.reduce((s, r) => s + r.montant, 0))
const nbRecurrents  = computed(() => recurringItems.value.length)
const totalPonctuels= computed(() => totalMois.value - totalRecurrents.value)
const nbPonctuels   = computed(() => financeStore.revenus.filter(r => !r.recurrent).length)

const categoriesStats = computed(() => {
  if (!financeStore.revenus.length) return []
  const map = {}
  financeStore.revenus.forEach(r => { map[r.type] = (map[r.type] || 0) + r.montant })
  const total = totalMois.value || 1
  return Object.entries(map).map(([type, t]) => ({
    type, total: t, pct: Math.round((t / total) * 100),
    emoji: typeEmoji(type), color: typeColor(type)
  })).sort((a, b) => b.total - a.total)
})

const revenusFiltres = computed(() =>
  financeStore.revenus.filter(r => {
    if (filtreType.value && r.type !== filtreType.value) return false
    if (filtreRecurrence.value === 'recurrent' && !r.recurrent) return false
    if (filtreRecurrence.value === 'ponctuel' && r.recurrent) return false
    if (recherche.value && !r.description.toLowerCase().includes(recherche.value.toLowerCase())) return false
    return true
  })
)

const totalFiltres = computed(() => revenusFiltres.value.reduce((s, r) => s + r.montant, 0))

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function closeModal() {
  showModal.value = false
  form.value = { type: 'Salaire', description: '', montant: null, date: new Date().toISOString().split('T')[0], recurrent: false }
}

async function handleAjouter() {
  if (!form.value.montant || form.value.montant <= 0) return
  submitting.value = true
  try {
    await financeStore.ajouterRevenu({
      type: form.value.type, description: form.value.description,
      montant: form.value.montant, date: form.value.date, recurrent: form.value.recurrent
    })
    closeModal()
  } finally {
    submitting.value = false
  }
}

async function supprimerRevenu(id) {
  if (!confirm('Supprimer ce revenu ?')) return
  await financeStore.supprimerRevenu(id)
}

let unsub
onMounted(() => { unsub = financeStore.ecouter_revenus() })
onUnmounted(() => { if (unsub) unsub() })
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.category-bars { display:flex;flex-direction:column;gap:16px }
.category-row  { display:flex;flex-direction:column;gap:6px }
.cat-header    { display:flex;justify-content:space-between;align-items:center }
.cat-info      { display:flex;align-items:center;gap:8px }
.cat-emoji     { font-size:16px }
.cat-name      { font-size:14px;font-weight:500 }
.cat-amounts   { display:flex;align-items:center;gap:10px }
.cat-amount    { font-size:14px;font-weight:600 }
.cat-pct       { font-size:12px;color:var(--text-muted);min-width:36px;text-align:right }
.bar-track     { height:6px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.bar-fill      { height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1) }

.recurring-list { display:flex;flex-direction:column;gap:10px }
.recurring-item { display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg-elevated);border-radius:var(--radius) }
.recurring-icon { width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0 }
.recurring-info { flex:1;min-width:0 }
.recurring-name { display:block;font-size:14px;font-weight:500 }
.recurring-type { display:block;font-size:12px;color:var(--text-muted) }
.recurring-amount { font-size:14px;flex-shrink:0 }

.transactions-list { display:flex;flex-direction:column }
.transaction-row { display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border) }
.transaction-row:last-child { border-bottom:none }
.tx-icon  { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0 }
.tx-main  { flex:1;min-width:0 }
.tx-desc  { font-size:14px;font-weight:500;margin-bottom:4px }
.tx-meta  { display:flex;align-items:center;gap:6px;flex-wrap:wrap }
.tx-date  { font-size:12px;color:var(--text-muted) }
.tx-amount{ font-size:15px;font-weight:700;flex-shrink:0 }
.tx-actions{ flex-shrink:0 }

.list-footer { display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-top:8px;border-top:1px solid var(--border) }

.icon-btn { width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;color:var(--text-muted);transition:all var(--transition) }
.icon-btn:hover { background:var(--bg-elevated);color:var(--text-primary) }
.icon-btn.danger:hover { background:rgba(255,107,107,0.1);color:var(--red);border-color:rgba(255,107,107,0.3) }

.empty-state-small { display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center;color:var(--text-muted);font-size:14px }
.empty-history { display:flex;flex-direction:column;align-items:center;padding:48px;text-align:center;gap:8px }
.empty-history h3 { font-family:var(--font-display) }
.empty-history p  { color:var(--text-muted);font-size:14px }

.modal-overlay { position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px }
.modal-card    { background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.5) }
.modal-header  { display:flex;justify-content:space-between;align-items:center;padding:24px 24px 0 }
.modal-header h3 { font-family:var(--font-display);font-size:1.1rem }
.modal-body    { padding:24px;display:flex;flex-direction:column;gap:4px }
.modal-footer  { display:flex;gap:10px;justify-content:flex-end;margin-top:20px }

.type-selector { display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:4px }
.type-btn { display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;color:var(--text-secondary);font-size:13px;font-weight:500;font-family:var(--font-body);transition:all var(--transition) }
.type-btn:hover { border-color:var(--border-accent);color:var(--text-primary) }
.type-btn.active { background:var(--accent-dim);border-color:var(--border-accent);color:var(--accent) }

.toggle-row { display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--bg-elevated);border-radius:var(--radius);margin-bottom:4px }
.toggle-btn { width:44px;height:24px;background:var(--bg-hover);border:none;border-radius:99px;cursor:pointer;position:relative;transition:background var(--transition);flex-shrink:0 }
.toggle-btn.active { background:var(--accent) }
.toggle-knob { position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:white;transition:transform var(--transition);box-shadow:0 1px 4px rgba(0,0,0,0.3) }
.toggle-btn.active .toggle-knob { transform:translateX(20px) }

.preview-box { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--accent-dim);border:1px solid var(--border-accent);border-radius:var(--radius);font-size:14px;font-weight:500 }

.modal-enter-active,.modal-leave-active { transition:all 0.25s ease }
.modal-enter-from,.modal-leave-to { opacity:0;transform:scale(0.96) }
</style>
