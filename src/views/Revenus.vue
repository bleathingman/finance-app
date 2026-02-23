<template>
  <div class="animate-fade-in">

    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Revenus</h1>
        <p>{{ moisCourant }} — {{ financeStore.revenus.length }} transaction(s)</p>
      </div>
      <button class="btn btn-primary" @click="ouvrirAjout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Ajouter un revenu
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid-4" style="margin-bottom:28px">
      <div class="card card-accent">
        <div class="kpi-label">Total du mois</div>
        <div class="kpi-value text-accent">{{ formatAmount(financeStore.totalRevenus) }}</div>
        <div class="kpi-sub">{{ financeStore.revenus.length }} transaction(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Récurrents</div>
        <div class="kpi-value">{{ formatAmount(totalRecurrents) }}</div>
        <div class="kpi-sub">{{ nbRecurrents }} source(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Ponctuels</div>
        <div class="kpi-value">{{ formatAmount(totalPonctuels) }}</div>
        <div class="kpi-sub">{{ nbPonctuels }} transaction(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Plus grosse source</div>
        <div class="kpi-value" style="font-size:1.2rem">{{ plusGros?.description || '—' }}</div>
        <div class="kpi-sub">{{ plusGros ? formatAmount(plusGros.montant) : '—' }}</div>
      </div>
    </div>

    <!-- Répartition + Récurrents -->
    <div class="grid-2" style="margin-bottom:28px">
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Répartition par type</h3>
        <div v-if="!financeStore.revenus.length" class="empty-state"><p>Aucun revenu enregistré</p></div>
        <div v-else class="type-bars">
          <div v-for="t in typesStats" :key="t.nom" class="type-row">
            <div class="type-header">
              <div style="display:flex;align-items:center;gap:8px">
                <span>{{ t.emoji }}</span>
                <span style="font-size:14px;font-weight:500">{{ t.nom }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:14px;font-weight:600">{{ formatAmount(t.total) }}</span>
                <span style="font-size:12px;font-weight:600;min-width:36px;text-align:right" :style="{ color: t.pct > 50 ? 'var(--accent)' : 'var(--text-muted)' }">{{ t.pct }}%</span>
              </div>
            </div>
            <div class="bar-track"><div class="bar-fill" :style="{ width: t.pct + '%', background: t.color }"></div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Sources récurrentes</h3>
        <div v-if="!recurrents.length" class="empty-state">
          <span style="font-size:2rem">💼</span>
          <p>Aucune source récurrente</p>
          <button class="btn btn-ghost" style="font-size:13px;margin-top:8px" @click="ouvrirAjout">+ Ajouter</button>
        </div>
        <div v-else class="recurring-list">
          <div v-for="r in recurrents" :key="r.id" class="recurring-item">
            <div class="recurring-icon" :style="{ background: typeColor(r.type) + '20' }">{{ typeEmoji(r.type) }}</div>
            <div class="recurring-info">
              <span class="recurring-name">{{ r.description }}</span>
              <span class="recurring-sub">{{ r.type }}</span>
            </div>
            <span class="amount-positive">+{{ formatAmount(r.montant) }}</span>
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
            <option v-for="t in types" :key="t.nom" :value="t.nom">{{ t.emoji }} {{ t.nom }}</option>
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

      <div v-if="!revenusFiltres.length" class="empty-history">
        <div style="font-size:2.5rem;margin-bottom:12px">💰</div>
        <h3>{{ !financeStore.revenus.length ? 'Aucun revenu enregistré' : 'Aucun résultat' }}</h3>
        <p>{{ !financeStore.revenus.length ? 'Commencez par ajouter votre premier revenu.' : 'Modifiez vos filtres.' }}</p>
        <button v-if="!financeStore.revenus.length" class="btn btn-primary" style="margin-top:16px" @click="ouvrirAjout">+ Ajouter</button>
      </div>

      <div v-else>
        <div v-for="r in revenusFiltres" :key="r.id" class="tx-row">
          <div class="tx-icon" :style="{ background: typeColor(r.type) + '18' }">{{ typeEmoji(r.type) }}</div>
          <div class="tx-main">
            <div class="tx-desc">{{ r.description }}</div>
            <div class="tx-meta">
              <span class="badge" :style="{ background: typeColor(r.type) + '18', color: typeColor(r.type) }">{{ r.type }}</span>
              <span v-if="r.recurrent" class="badge badge-blue">🔄 Récurrent</span>
              <span v-if="r.autoGenere" class="badge badge-blue">🤖 Auto</span>
              <span style="font-size:12px;color:var(--text-muted)">{{ formatDate(r.createdAt) }}</span>
            </div>
          </div>
          <div class="amount-positive" style="font-size:15px;flex-shrink:0">+{{ formatAmount(r.montant) }}</div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="icon-btn" @click="ouvrirEdition(r)" title="Modifier">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-btn danger" @click="financeStore.supprimerRevenu(r.id)" title="Supprimer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="list-footer">
          <span style="color:var(--text-muted);font-size:14px">{{ revenusFiltres.length }} résultat(s)</span>
          <span class="amount-positive" style="font-size:15px;font-weight:700">Total : +{{ formatAmount(totalFiltres) }}</span>
        </div>
      </div>
    </div>

    <!-- ─── Modal Ajout / Édition ─────────────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editMode ? '✏️ Modifier le revenu' : 'Ajouter un revenu' }}</h3>
              <button class="icon-btn" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="handleSauvegarder" class="modal-body">
              <div class="form-group">
                <label>Type de revenu</label>
                <div class="cat-selector">
                  <button v-for="t in types" :key="t.nom" type="button" class="cat-btn"
                    :class="{ active: form.type === t.nom }"
                    :style="form.type === t.nom ? { background: t.color+'20', borderColor: t.color, color: t.color } : {}"
                    @click="form.type = t.nom">
                    <span style="font-size:18px">{{ t.emoji }}</span>
                    <span>{{ t.nom }}</span>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <input v-model="form.description" type="text" class="input" placeholder="Ex: Salaire novembre..." required />
              </div>
              <div class="form-group">
                <label>Montant (€)</label>
                <div style="position:relative">
                  <input v-model.number="form.montant" type="number" class="input" placeholder="0.00" step="0.01" min="0.01" required style="padding-left:36px;font-size:1.1rem;font-weight:600"/>
                  <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
                </div>
              </div>
              <div class="form-group">
                <label>Date</label>
                <input v-model="form.date" type="date" class="input" lang="fr" required />
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
                  <span v-else>{{ editMode ? 'Enregistrer les modifications' : 'Ajouter' }}</span>
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
const showModal    = ref(false)
const editMode     = ref(false)
const editId       = ref(null)
const submitting   = ref(false)
const filtreType       = ref('')
const filtreRecurrence = ref('')
const recherche        = ref('')

const types = [
  { nom: 'Salaire',            emoji: '💼', color: '#00e5a0' },
  { nom: 'Freelance',          emoji: '🧑‍💻', color: '#4facfe' },
  { nom: 'Revenus passifs',    emoji: '📈', color: '#ff9f43' },
  { nom: 'Banque / Assurance', emoji: '🏦', color: '#60a5fa' },
  { nom: 'Autres',             emoji: '💡', color: '#c084fc' }
]

const defaultForm = () => ({
  type: 'Salaire', description: '', montant: null,
  date: new Date().toISOString().split('T')[0], recurrent: false
})
const form = ref(defaultForm())

function typeColor(nom) { return types.find(t => t.nom === nom)?.color || '#94a3b8' }
function typeEmoji(nom) { return types.find(t => t.nom === nom)?.emoji || '💰' }

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}
function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const moisCourant    = computed(() => new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
const recurrents     = computed(() => financeStore.revenus.filter(r => r.recurrent))
const totalRecurrents= computed(() => recurrents.value.reduce((s, r) => s + r.montant, 0))
const nbRecurrents   = computed(() => recurrents.value.length)
const ponctuels      = computed(() => financeStore.revenus.filter(r => !r.recurrent))
const totalPonctuels = computed(() => ponctuels.value.reduce((s, r) => s + r.montant, 0))
const nbPonctuels    = computed(() => ponctuels.value.length)
const plusGros       = computed(() => [...financeStore.revenus].sort((a, b) => b.montant - a.montant)[0])

const typesStats = computed(() => {
  if (!financeStore.revenus.length) return []
  const map = {}
  financeStore.revenus.forEach(r => { map[r.type] = (map[r.type] || 0) + r.montant })
  const total = financeStore.totalRevenus || 1
  return Object.entries(map).map(([nom, t]) => ({
    nom, total: t, pct: Math.round((t / total) * 100),
    emoji: typeEmoji(nom), color: typeColor(nom)
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

function ouvrirAjout() {
  editMode.value = false
  editId.value   = null
  form.value     = defaultForm()
  showModal.value = true
}

function ouvrirEdition(revenu) {
  editMode.value = true
  editId.value   = revenu.id
  // Récupère la date stockée
  const d = revenu.createdAt?.toDate ? revenu.createdAt.toDate() : new Date(revenu.createdAt || Date.now())
  const dateStr = revenu.date || d.toISOString().split('T')[0]
  form.value = {
    type:        revenu.type,
    description: revenu.description,
    montant:     revenu.montant,
    date:        dateStr,
    recurrent:   revenu.recurrent || false
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editMode.value  = false
  editId.value    = null
  form.value      = defaultForm()
}

async function handleSauvegarder() {
  if (!form.value.montant || form.value.montant <= 0) return
  submitting.value = true
  try {
    if (editMode.value && editId.value) {
      await financeStore.modifierRevenu(editId.value, { ...form.value })
    } else {
      await financeStore.ajouterRevenu({ ...form.value })
    }
    closeModal()
  } finally { submitting.value = false }
}

let unsub
onMounted(() => { unsub = financeStore.ecouter_revenus() })
onUnmounted(() => { if (unsub) unsub() })
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.type-bars { display:flex;flex-direction:column;gap:16px }
.type-row  { display:flex;flex-direction:column;gap:6px }
.type-header { display:flex;justify-content:space-between;align-items:center }
.bar-track { height:6px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.bar-fill  { height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1) }

.recurring-list { display:flex;flex-direction:column;gap:10px }
.recurring-item { display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg-elevated);border-radius:var(--radius) }
.recurring-icon { width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0 }
.recurring-info { flex:1;min-width:0 }
.recurring-name { display:block;font-size:14px;font-weight:500 }
.recurring-sub  { display:block;font-size:12px;color:var(--text-muted) }

.tx-row   { display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border) }
.tx-row:last-child { border-bottom:none }
.tx-icon  { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0 }
.tx-main  { flex:1;min-width:0 }
.tx-desc  { font-size:14px;font-weight:500;margin-bottom:4px }
.tx-meta  { display:flex;align-items:center;gap:6px;flex-wrap:wrap }

.list-footer { display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-top:8px;border-top:1px solid var(--border) }
.empty-state { display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center;color:var(--text-muted);font-size:14px }
.empty-history { display:flex;flex-direction:column;align-items:center;padding:48px;text-align:center;gap:8px }
.empty-history h3 { font-family:var(--font-display) }
.empty-history p  { color:var(--text-muted);font-size:14px }
.preview-box { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:var(--radius);background:var(--accent-dim);border:1px solid var(--border-accent);font-size:14px;font-weight:500 }
</style>
