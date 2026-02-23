<template>
  <div class="animate-fade-in">

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Dépenses</h1>
        <p>{{ moisCourant }} — {{ financeStore.depenses.length }} transaction(s)</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" @click="showQuickAdd = !showQuickAdd">
          ⚡ Ajout rapide
        </button>
        <button class="btn btn-primary" @click="showModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Ajouter
        </button>
      </div>
    </div>

    <!-- Quick Add Bar -->
    <transition name="slide-down">
      <div v-if="showQuickAdd" class="quick-add-bar card" style="margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">⚡ Ajout rapide — clique une catégorie, tape le montant</div>
        <div class="quick-cats">
          <button
            v-for="cat in categories" :key="cat.nom"
            class="quick-cat-btn"
            :class="{ active: quickForm.categorie === cat.nom }"
            @click="quickForm.categorie = cat.nom"
          >
            <span>{{ cat.emoji }}</span>
            <span>{{ cat.nom }}</span>
          </button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <input v-model="quickForm.description" type="text" class="input" placeholder="Description..." style="flex:1" />
          <div style="position:relative;width:160px">
            <input v-model.number="quickForm.montant" type="number" class="input" placeholder="0.00" step="0.01" min="0.01" style="padding-left:28px" />
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
          </div>
          <button class="btn btn-primary" @click="handleQuickAdd" :disabled="!quickForm.montant || !quickForm.categorie">
            Ajouter
          </button>
        </div>
      </div>
    </transition>

    <!-- KPI Cards -->
    <div class="grid-4" style="margin-bottom:28px">
      <div class="card" style="border-color:rgba(255,107,107,0.2)">
        <div class="kpi-label">Total du mois</div>
        <div class="kpi-value" style="color:var(--red)">{{ formatAmount(totalMois) }}</div>
        <div class="kpi-sub">{{ financeStore.depenses.length }} dépense(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Dépense moyenne</div>
        <div class="kpi-value">{{ formatAmount(moyennePar) }}</div>
        <div class="kpi-sub">par transaction</div>
      </div>
      <div class="card">
        <div class="kpi-label">Plus grosse dépense</div>
        <div class="kpi-value">{{ formatAmount(plusGrosse?.montant) }}</div>
        <div class="kpi-sub">{{ plusGrosse?.description || '—' }}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Récurrentes</div>
        <div class="kpi-value">{{ formatAmount(totalRecurrents) }}</div>
        <div class="kpi-sub">{{ nbRecurrents }} abonnement(s)</div>
      </div>
    </div>

    <!-- Catégories + Récurrentes -->
    <div class="grid-2" style="margin-bottom:28px">
      <!-- Répartition par catégorie -->
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Par catégorie</h3>
        <div v-if="categoriesStats.length === 0" class="empty-state-small">
          <p>Aucune dépense enregistrée</p>
        </div>
        <div v-else class="category-bars">
          <div v-for="cat in categoriesStats" :key="cat.nom" class="category-row">
            <div class="cat-header">
              <div class="cat-info">
                <span class="cat-emoji">{{ cat.emoji }}</span>
                <span class="cat-name">{{ cat.nom }}</span>
              </div>
              <div class="cat-amounts">
                <span class="cat-amount">{{ formatAmount(cat.total) }}</span>
                <span class="cat-pct" :style="{ color: pctColor(cat.pct) }">{{ cat.pct }}%</span>
              </div>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: cat.pct + '%', background: cat.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dépenses récurrentes -->
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Abonnements & Récurrents</h3>
        <div v-if="depensesRecurrentes.length === 0" class="empty-state-small">
          <span style="font-size:1.5rem">📦</span>
          <p>Aucune dépense récurrente</p>
          <button class="btn btn-ghost" style="font-size:13px;margin-top:8px" @click="showModal = true">+ Ajouter</button>
        </div>
        <div v-else class="recurring-list">
          <div v-for="d in depensesRecurrentes" :key="d.id" class="recurring-item">
            <div class="recurring-icon" :style="{ background: categorieColor(d.categorie) + '20' }">
              {{ categorieEmoji(d.categorie) }}
            </div>
            <div class="recurring-info">
              <span class="recurring-name">{{ d.description }}</span>
              <span class="recurring-type">{{ d.categorie }}</span>
            </div>
            <div class="recurring-amount amount-negative">-{{ formatAmount(d.montant) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historique -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <h3 style="font-family:var(--font-display)">Historique</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <select v-model="filtreCategorie" class="input" style="width:auto;padding:8px 12px;font-size:13px">
            <option value="">Toutes les catégories</option>
            <option v-for="cat in categories" :key="cat.nom" :value="cat.nom">{{ cat.emoji }} {{ cat.nom }}</option>
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

      <div v-if="depensesFiltrees.length === 0" class="empty-history">
        <div style="font-size:2.5rem;margin-bottom:12px">🧾</div>
        <h3>Aucune dépense trouvée</h3>
        <p>{{ financeStore.depenses.length === 0 ? 'Commencez par ajouter votre première dépense.' : 'Modifiez vos filtres.' }}</p>
        <button v-if="financeStore.depenses.length === 0" class="btn btn-primary" style="margin-top:16px" @click="showModal = true">
          + Ajouter une dépense
        </button>
      </div>

      <div v-else class="transactions-list">
        <div v-for="depense in depensesFiltrees" :key="depense.id" class="transaction-row">
          <div class="tx-icon" :style="{ background: categorieColor(depense.categorie) + '18' }">
            {{ categorieEmoji(depense.categorie) }}
          </div>
          <div class="tx-main">
            <div class="tx-desc">{{ depense.description }}</div>
            <div class="tx-meta">
              <span class="badge" :style="{ background: categorieColor(depense.categorie) + '18', color: categorieColor(depense.categorie) }">
                {{ depense.categorie }}
              </span>
              <span v-if="depense.recurrent" class="badge badge-blue">🔄 Récurrent</span>
              <span class="tx-date">{{ formatDate(depense.createdAt) }}</span>
            </div>
          </div>
          <div class="tx-amount amount-negative">-{{ formatAmount(depense.montant) }}</div>
          <div class="tx-actions">
            <button class="icon-btn danger" @click="supprimerDepense(depense.id)" title="Supprimer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="depensesFiltrees.length > 0" class="list-footer">
        <span style="color:var(--text-muted);font-size:14px">{{ depensesFiltrees.length }} résultat(s)</span>
        <span class="amount-negative" style="font-size:15px;font-weight:700">Total : -{{ formatAmount(totalFiltres) }}</span>
      </div>
    </div>

    <!-- ─── Modal Ajout ─────────────────────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Ajouter une dépense</h3>
              <button class="icon-btn" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleAjouter" class="modal-body">
              <!-- Catégorie -->
              <div class="form-group">
                <label>Catégorie</label>
                <div class="cat-selector">
                  <button
                    v-for="cat in categories" :key="cat.nom"
                    type="button"
                    class="cat-btn"
                    :class="{ active: form.categorie === cat.nom }"
                    :style="form.categorie === cat.nom ? { background: cat.color + '20', borderColor: cat.color, color: cat.color } : {}"
                    @click="form.categorie = cat.nom"
                  >
                    <span style="font-size:18px">{{ cat.emoji }}</span>
                    <span>{{ cat.nom }}</span>
                  </button>
                </div>
              </div>

              <!-- Description -->
              <div class="form-group">
                <label>Description</label>
                <input v-model="form.description" type="text" class="input" placeholder="Ex: Courses Carrefour, Netflix..." required />
              </div>

              <!-- Montant -->
              <div class="form-group">
                <label>Montant (€)</label>
                <div style="position:relative">
                  <input
                    v-model.number="form.montant"
                    type="number" class="input"
                    placeholder="0.00" step="0.01" min="0.01" required
                    style="padding-left:36px;font-size:1.1rem;font-weight:600"
                  />
                  <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
                </div>
              </div>

              <!-- Date -->
              <div class="form-group">
                <label>Date</label>
                <input v-model="form.date" type="date" class="input" required />
              </div>

              <!-- Toggle récurrent -->
              <div class="toggle-row">
                <div>
                  <div style="font-weight:500;font-size:14px">Dépense récurrente</div>
                  <div style="font-size:13px;color:var(--text-muted)">Abonnement, loyer, etc.</div>
                </div>
                <button type="button" class="toggle-btn" :class="{ active: form.recurrent }" @click="form.recurrent = !form.recurrent">
                  <span class="toggle-knob"></span>
                </button>
              </div>

              <!-- Aperçu -->
              <div v-if="form.montant > 0" class="preview-box" style="background:rgba(255,107,107,0.08);border-color:rgba(255,107,107,0.25)">
                <span>{{ categorieEmoji(form.categorie) }} {{ form.description || 'Nouvelle dépense' }}</span>
                <span class="amount-negative">-{{ formatAmount(form.montant) }}</span>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <div v-if="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                  <span v-else>Ajouter la dépense</span>
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

// ─── State ────────────────────────────────────────────────────────
const showModal    = ref(false)
const showQuickAdd = ref(false)
const submitting   = ref(false)
const filtreCategorie  = ref('')
const filtreRecurrence = ref('')
const recherche    = ref('')

const form = ref({
  categorie: 'Nourriture',
  description: '',
  montant: null,
  date: new Date().toISOString().split('T')[0],
  recurrent: false
})

const quickForm = ref({
  categorie: '',
  description: '',
  montant: null
})

// ─── Catégories ───────────────────────────────────────────────────
const categories = [
  { nom: 'Loyer',        emoji: '🏠', color: '#4facfe' },
  { nom: 'Nourriture',   emoji: '🍔', color: '#00e5a0' },
  { nom: 'Transport',    emoji: '🚗', color: '#ff9f43' },
  { nom: 'Loisirs',      emoji: '🎮', color: '#c084fc' },
  { nom: 'Abonnements',  emoji: '📦', color: '#fb7185' },
  { nom: 'Santé',        emoji: '🏥', color: '#34d399' },
  { nom: 'Vêtements',    emoji: '👕', color: '#f472b6' },
  { nom: 'Autres',       emoji: '💳', color: '#94a3b8' }
]

function categorieColor(nom) { return categories.find(c => c.nom === nom)?.color || '#94a3b8' }
function categorieEmoji(nom) { return categories.find(c => c.nom === nom)?.emoji || '💳' }
function pctColor(pct) {
  if (pct >= 50) return 'var(--red)'
  if (pct >= 30) return 'var(--orange)'
  return 'var(--text-muted)'
}

// ─── Computed ─────────────────────────────────────────────────────
const moisCourant = computed(() =>
  new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

const totalMois   = computed(() => financeStore.depenses.reduce((s, d) => s + d.montant, 0))
const moyennePar  = computed(() => financeStore.depenses.length ? totalMois.value / financeStore.depenses.length : 0)
const plusGrosse  = computed(() => [...financeStore.depenses].sort((a, b) => b.montant - a.montant)[0])

const depensesRecurrentes = computed(() => financeStore.depenses.filter(d => d.recurrent))
const totalRecurrents     = computed(() => depensesRecurrentes.value.reduce((s, d) => s + d.montant, 0))
const nbRecurrents        = computed(() => depensesRecurrentes.value.length)

const categoriesStats = computed(() => {
  if (!financeStore.depenses.length) return []
  const map = {}
  financeStore.depenses.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
  const total = totalMois.value || 1
  return Object.entries(map).map(([nom, t]) => ({
    nom, total: t,
    pct: Math.round((t / total) * 100),
    emoji: categorieEmoji(nom),
    color: categorieColor(nom)
  })).sort((a, b) => b.total - a.total)
})

const depensesFiltrees = computed(() =>
  financeStore.depenses.filter(d => {
    if (filtreCategorie.value && d.categorie !== filtreCategorie.value) return false
    if (filtreRecurrence.value === 'recurrent' && !d.recurrent) return false
    if (filtreRecurrence.value === 'ponctuel' && d.recurrent) return false
    if (recherche.value && !d.description.toLowerCase().includes(recherche.value.toLowerCase())) return false
    return true
  })
)

const totalFiltres = computed(() => depensesFiltrees.value.reduce((s, d) => s + d.montant, 0))

// ─── Méthodes ─────────────────────────────────────────────────────
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
  form.value = {
    categorie: 'Nourriture', description: '',
    montant: null, date: new Date().toISOString().split('T')[0], recurrent: false
  }
}

async function handleAjouter() {
  if (!form.value.montant || form.value.montant <= 0) return
  submitting.value = true
  try {
    await financeStore.ajouterDepense({
      categorie:   form.value.categorie,
      description: form.value.description,
      montant:     form.value.montant,
      date:        form.value.date,
      recurrent:   form.value.recurrent
    })
    closeModal()
  } finally {
    submitting.value = false
  }
}

async function handleQuickAdd() {
  if (!quickForm.value.montant || !quickForm.value.categorie) return
  await financeStore.ajouterDepense({
    categorie:   quickForm.value.categorie,
    description: quickForm.value.description || quickForm.value.categorie,
    montant:     quickForm.value.montant,
    date:        new Date().toISOString().split('T')[0],
    recurrent:   false
  })
  quickForm.value = { categorie: quickForm.value.categorie, description: '', montant: null }
}

async function supprimerDepense(id) {
  if (!confirm('Supprimer cette dépense ?')) return
  await financeStore.supprimerDepense(id)
}

// ─── Lifecycle ────────────────────────────────────────────────────
let unsub
onMounted(() => { unsub = financeStore.ecouter_depenses() })
onUnmounted(() => { if (unsub) unsub() })
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.quick-add-bar { padding:20px }
.quick-cats    { display:flex;gap:8px;flex-wrap:wrap }
.quick-cat-btn {
  display:flex;align-items:center;gap:6px;padding:7px 12px;
  background:var(--bg-elevated);border:1px solid var(--border);
  border-radius:99px;cursor:pointer;font-size:13px;font-weight:500;
  color:var(--text-secondary);font-family:var(--font-body);transition:all var(--transition);
}
.quick-cat-btn:hover { border-color:var(--border-accent);color:var(--text-primary) }
.quick-cat-btn.active { background:rgba(255,107,107,0.1);border-color:rgba(255,107,107,0.4);color:var(--red) }

.category-bars { display:flex;flex-direction:column;gap:16px }
.category-row  { display:flex;flex-direction:column;gap:6px }
.cat-header    { display:flex;justify-content:space-between;align-items:center }
.cat-info      { display:flex;align-items:center;gap:8px }
.cat-amounts   { display:flex;align-items:center;gap:10px }
.bar-track { height:6px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.bar-fill  { height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1) }

.recurring-list { display:flex;flex-direction:column;gap:10px }
.recurring-item { display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg-elevated);border-radius:var(--radius) }
.recurring-icon { width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0 }
.recurring-info { flex:1;min-width:0 }
.recurring-name { display:block;font-size:14px;font-weight:500 }
.recurring-type { display:block;font-size:12px;color:var(--text-muted) }

.transactions-list { display:flex;flex-direction:column }
.transaction-row { display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border) }
.transaction-row:last-child { border-bottom:none }
.tx-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0 }
.tx-main { flex:1;min-width:0 }
.tx-desc { font-size:14px;font-weight:500;margin-bottom:4px }
.tx-meta { display:flex;align-items:center;gap:6px;flex-wrap:wrap }
.tx-date { font-size:12px;color:var(--text-muted) }

.list-footer { display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-top:8px;border-top:1px solid var(--border) }

.empty-state-small { display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center;color:var(--text-muted);font-size:14px }
.empty-history { display:flex;flex-direction:column;align-items:center;padding:48px;text-align:center;gap:8px }
.empty-history h3 { font-family:var(--font-display) }
.empty-history p  { color:var(--text-muted);font-size:14px }

.preview-box { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:var(--radius);font-size:14px;font-weight:500 }
</style>