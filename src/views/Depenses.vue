<template>
  <div class="animate-fade-in">

    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Dépenses</h1>
        <p>{{ moisCourantLabel }} — {{ txDuMois.length }} transaction(s)</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" @click="showQuickAdd = !showQuickAdd">⚡ Ajout rapide</button>
        <button class="btn btn-primary" @click="ouvrirAjout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Ajouter
        </button>
      </div>
    </div>

    <!-- Quick Add -->
    <transition name="slide-down">
      <div v-if="showQuickAdd" class="quick-add-bar card" style="margin-bottom:20px">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">⚡ Ajout rapide</div>
        <div class="quick-cats">
          <button v-for="cat in categories" :key="cat.nom" class="quick-cat-btn"
            :class="{ active: quickForm.categorie === cat.nom }" @click="quickForm.categorie = cat.nom">
            <span>{{ cat.emoji }}</span><span>{{ cat.nom }}</span>
          </button>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <input v-model="quickForm.description" type="text" class="input" placeholder="Description..." style="flex:1" />
          <div style="position:relative;width:160px">
            <input v-model.number="quickForm.montant" type="number" class="input" placeholder="0.00" step="0.01" min="0.01" style="padding-left:28px" />
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
          </div>
          <button class="btn btn-primary" @click="handleQuickAdd" :disabled="!quickForm.montant || !quickForm.categorie">Ajouter</button>
        </div>
      </div>
    </transition>

    <!-- KPIs -->
    <div class="grid-4" style="margin-bottom:28px">
      <div class="card" style="border-color:rgba(255,107,107,0.2)">
        <div class="kpi-label">Total du mois</div>
        <div class="kpi-value" style="color:var(--red)">{{ formatAmount(totalMois) }}</div>
        <div class="kpi-sub">{{ txDuMois.length }} dépense(s)</div>
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
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Par catégorie</h3>
        <div v-if="!categoriesStats.length" class="empty-state"><p>Aucune dépense enregistrée</p></div>
        <div v-else class="category-bars">
          <div v-for="cat in categoriesStats" :key="cat.nom" class="category-row">
            <div class="cat-header">
              <div class="cat-info"><span>{{ cat.emoji }}</span><span style="font-size:14px;font-weight:500">{{ cat.nom }}</span></div>
              <div class="cat-amounts">
                <span style="font-size:14px;font-weight:600">{{ formatAmount(cat.total) }}</span>
                <span style="font-size:12px;font-weight:600;min-width:36px;text-align:right" :style="{ color: cat.pct >= 50 ? 'var(--red)' : cat.pct >= 30 ? 'var(--orange)' : 'var(--text-muted)' }">{{ cat.pct }}%</span>
              </div>
            </div>
            <div class="bar-track"><div class="bar-fill" :style="{ width: cat.pct + '%', background: cat.color }"></div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Abonnements & Récurrents</h3>
        <div v-if="!depensesRecurrentes.length" class="empty-state">
          <span style="font-size:1.5rem">📦</span><p>Aucune dépense récurrente</p>
          <button class="btn btn-ghost" style="font-size:13px;margin-top:8px" @click="ouvrirAjout">+ Ajouter</button>
        </div>
        <div v-else class="recurring-list">
          <div v-for="d in depensesRecurrentes" :key="d.id" class="recurring-item">
            <div class="recurring-icon" :style="{ background: categorieColor(d.categorie) + '20' }">{{ categorieEmoji(d.categorie) }}</div>
            <div class="recurring-info">
              <span class="recurring-name">{{ d.description }}</span>
              <span class="recurring-sub">{{ d.categorie }}</span>
            </div>
            <div class="amount-negative">-{{ formatAmount(d.montant) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bannière limite historique -->
    <div v-if="!subStore.can('advancedCharts')" class="history-limit-banner">
      <span>🔒</span>
      <span>Historique limité au <strong>mois en cours</strong> —
        <router-link to="/pricing" style="color:var(--accent);font-weight:700">Passer Premium</router-link>
        pour accéder aux 12 derniers mois
      </span>
    </div>

    <!-- Historique -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <h3 style="font-family:var(--font-display)">Historique</h3>
          <div v-if="subStore.can('advancedCharts')" style="display:flex;align-items:center;gap:6px">
            <button class="icon-btn" @click="prevMois" title="Mois précédent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <select v-model="moisSelectionne" class="input" style="width:auto;padding:6px 10px;font-size:13px;font-weight:600">
              <option :value="null">Mois courant</option>
              <option v-for="m in moisDisponibles" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
            <button class="icon-btn" @click="nextMois" :disabled="!moisSelectionne" title="Mois suivant">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
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

      <div v-if="!depensesFiltrees.length" class="empty-history">
        <div style="font-size:2.5rem;margin-bottom:12px">🧾</div>
        <h3>{{ !txDuMois.length ? 'Aucune dépense enregistrée' : 'Aucun résultat' }}</h3>
        <p>{{ !txDuMois.length ? 'Commencez par ajouter votre première dépense.' : 'Modifiez vos filtres.' }}</p>
        <button v-if="!txDuMois.length" class="btn btn-primary" style="margin-top:16px" @click="ouvrirAjout">+ Ajouter</button>
      </div>

      <div v-else>
        <div v-for="depense in depensesFiltrees" :key="depense.id" class="tx-row">
          <div class="tx-icon" :style="{ background: categorieColor(depense.categorie) + '18' }">{{ categorieEmoji(depense.categorie) }}</div>
          <div class="tx-main">
            <div class="tx-desc">{{ depense.description }}</div>
            <div class="tx-meta">
              <span class="badge" :style="{ background: categorieColor(depense.categorie) + '18', color: categorieColor(depense.categorie) }">{{ depense.categorie }}</span>
              <span v-if="depense.recurrent" class="badge badge-blue">🔄 Récurrent</span>
              <span style="font-size:12px;color:var(--text-muted)">{{ formatDate(depense.createdAt) }}</span>
            </div>
          </div>
          <div class="amount-negative" style="font-size:15px;flex-shrink:0">-{{ formatAmount(depense.montant) }}</div>
          <div style="display:flex;gap:6px;flex-shrink:0">
            <button class="icon-btn" @click="ouvrirEdition(depense)" title="Modifier">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-btn danger" @click="financeStore.supprimerDepense(depense.id)" title="Supprimer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="list-footer">
          <span style="color:var(--text-muted);font-size:14px">{{ depensesFiltrees.length }} résultat(s)</span>
          <span class="amount-negative" style="font-size:15px;font-weight:700">Total : -{{ formatAmount(totalFiltres) }}</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editMode ? '✏️ Modifier la dépense' : 'Ajouter une dépense' }}</h3>
              <button class="icon-btn" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="handleSauvegarder" class="modal-body">
              <div class="form-group">
                <label>Catégorie</label>
                <div class="cat-selector">
                  <button v-for="cat in categories" :key="cat.nom" type="button" class="cat-btn"
                    :class="{ active: form.categorie === cat.nom }"
                    :style="form.categorie === cat.nom ? { background: cat.color+'20', borderColor: cat.color, color: cat.color } : {}"
                    @click="form.categorie = cat.nom">
                    <span style="font-size:18px">{{ cat.emoji }}</span>
                    <span>{{ cat.nom }}</span>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <input v-model="form.description" type="text" class="input" placeholder="Ex: Courses Carrefour..." required />
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
              <div v-if="subStore.can('multiAccounts') && comptesStore.comptes.length > 0" class="form-group">
                <label>Compte bancaire (optionnel)</label>
                <select class="input" v-model="form.compteId">
                  <option :value="null">— Aucun compte spécifique —</option>
                  <option v-for="compte in comptesStore.comptes" :key="compte.id" :value="compte.id">
                    {{ compte.nom }}
                  </option>
                </select>
              </div>
              </div>
              <div class="toggle-row">
                <div>
                  <div style="font-weight:500;font-size:14px">Dépense récurrente</div>
                  <div style="font-size:13px;color:var(--text-muted)">Abonnement, loyer, etc.</div>
                </div>
                <button type="button" class="toggle-btn" :class="{ active: form.recurrent }" @click="form.recurrent = !form.recurrent">
                  <span class="toggle-knob"></span>
                </button>
              </div>
              <div v-if="form.montant > 0" class="preview-box" style="background:rgba(255,107,107,0.08);border-color:rgba(255,107,107,0.25)">
                <span>{{ categorieEmoji(form.categorie) }} {{ form.description || 'Nouvelle dépense' }}</span>
                <span class="amount-negative">-{{ formatAmount(form.montant) }}</span>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <div v-if="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                  <span v-else>{{ editMode ? 'Enregistrer les modifications' : 'Ajouter la dépense' }}</span>
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
import { useComptesStore } from '@/stores/comptes'
import { useSubscriptionStore } from '@/stores/subscription'
import { useSubscriptionStore } from '@/stores/subscription'

const financeStore = useFinanceStore()
const comptesStore = useComptesStore()
const subStore     = useSubscriptionStore()
const subStore     = useSubscriptionStore()

const showModal    = ref(false)
const showQuickAdd = ref(false)
const editMode     = ref(false)
const editId       = ref(null)
const submitting   = ref(false)
const filtreCategorie  = ref('')
const filtreRecurrence = ref('')
const recherche        = ref('')

const categories = [
  { nom: 'Loyer',              emoji: '🏠', color: '#4facfe' },
  { nom: 'Nourriture',         emoji: '🍔', color: '#00e5a0' },
  { nom: 'Transport',          emoji: '🚗', color: '#ff9f43' },
  { nom: 'Loisirs',            emoji: '🎮', color: '#c084fc' },
  { nom: 'Abonnements',        emoji: '📦', color: '#fb7185' },
  { nom: 'Santé',              emoji: '🏥', color: '#34d399' },
  { nom: 'Vêtements',          emoji: '👕', color: '#f472b6' },
  { nom: 'Banque / Assurance', emoji: '🏦', color: '#60a5fa' },
  { nom: 'Autres',             emoji: '💳', color: '#94a3b8' }
]

const defaultForm = () => ({
  categorie: 'Nourriture', description: '', montant: null,
  date: new Date().toISOString().split('T')[0], recurrent: false,
  compteId: null
})
const form      = ref(defaultForm())
const quickForm = ref({ categorie: '', description: '', montant: null })

function categorieColor(nom) { return categories.find(c => c.nom === nom)?.color || '#94a3b8' }
function categorieEmoji(nom) { return categories.find(c => c.nom === nom)?.emoji || '💳' }
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}
function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Sélecteur de mois ───────────────────────────────────────────
const moisSelectionne = ref(null)

const moisDisponibles = computed(() => {
  const all = financeStore.depenses || []
  const months = new Set()
  all.forEach(t => {
    if (!t.createdAt) return
    const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
    months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
  })
  return [...months].sort().reverse().map(m => {
    const [y, mo] = m.split('-')
    const label = new Date(Number(y), Number(mo)-1, 1).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
    return { value: m, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })
})

const txDuMois = computed(() => {
  const all = financeStore.depenses || []
  if (!moisSelectionne.value) {
    const now = new Date()
    return all.filter(t => {
      if (!t.createdAt) return false
      const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }
  const [y, mo] = moisSelectionne.value.split('-').map(Number)
  return all.filter(t => {
    if (!t.createdAt) return false
    const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
    return d.getMonth() === mo-1 && d.getFullYear() === y
  })
})

const moisCourantLabel = computed(() =>
  moisSelectionne.value
    ? moisDisponibles.value.find(m => m.value === moisSelectionne.value)?.label || ''
    : new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
)

function prevMois() {
  const months = moisDisponibles.value
  if (!months.length) return
  if (!moisSelectionne.value) { moisSelectionne.value = months[0].value; return }
  const idx = months.findIndex(m => m.value === moisSelectionne.value)
  if (idx < months.length - 1) moisSelectionne.value = months[idx + 1].value
}
function nextMois() {
  const months = moisDisponibles.value
  if (!moisSelectionne.value) return
  const idx = months.findIndex(m => m.value === moisSelectionne.value)
  if (idx === 0) moisSelectionne.value = null
  else moisSelectionne.value = months[idx - 1].value
}

// ─── Computed ─────────────────────────────────────────────────────
const totalMois           = computed(() => txDuMois.value.reduce((s, d) => s + d.montant, 0))
const moyennePar          = computed(() => txDuMois.value.length ? totalMois.value / txDuMois.value.length : 0)
const plusGrosse          = computed(() => [...txDuMois.value].sort((a, b) => b.montant - a.montant)[0])
const depensesRecurrentes = computed(() => txDuMois.value.filter(d => d.recurrent))
const totalRecurrents     = computed(() => depensesRecurrentes.value.reduce((s, d) => s + d.montant, 0))
const nbRecurrents        = computed(() => depensesRecurrentes.value.length)

const categoriesStats = computed(() => {
  if (!txDuMois.value.length) return []
  const map = {}
  txDuMois.value.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
  const total = totalMois.value || 1
  return Object.entries(map).map(([nom, t]) => ({
    nom, total: t, pct: Math.round((t / total) * 100),
    emoji: categorieEmoji(nom), color: categorieColor(nom)
  })).sort((a, b) => b.total - a.total)
})

const depensesFiltrees = computed(() =>
  txDuMois.value.filter(d => {
    if (filtreCategorie.value && d.categorie !== filtreCategorie.value) return false
    if (filtreRecurrence.value === 'recurrent' && !d.recurrent) return false
    if (filtreRecurrence.value === 'ponctuel' && d.recurrent) return false
    if (recherche.value && !d.description.toLowerCase().includes(recherche.value.toLowerCase())) return false
    return true
  })
)
const totalFiltres = computed(() => depensesFiltrees.value.reduce((s, d) => s + d.montant, 0))

// ─── Actions ──────────────────────────────────────────────────────
function ouvrirAjout() {
  editMode.value  = false
  editId.value    = null
  form.value      = defaultForm()
  showModal.value = true
}
function ouvrirEdition(depense) {
  editMode.value = true
  editId.value   = depense.id
  const d = depense.createdAt?.toDate ? depense.createdAt.toDate() : new Date(depense.createdAt || Date.now())
  form.value = {
    categorie:   depense.categorie,
    description: depense.description,
    montant:     depense.montant,
    date:        depense.date || d.toISOString().split('T')[0],
    recurrent:   depense.recurrent || false
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
      await financeStore.modifierDepense(editId.value, { ...form.value })
    } else {
      await financeStore.ajouterDepense({ ...form.value ,
        compteId: form.value.compteId || null
      })
    }
    closeModal()
  } finally { submitting.value = false }
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
.quick-cat-btn { display:flex;align-items:center;gap:6px;padding:7px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:99px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text-secondary);font-family:var(--font-body);transition:all var(--transition) }
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
.preview-box { display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-radius:var(--radius);font-size:14px;font-weight:500 }
.slide-down-enter-active,.slide-down-leave-active { transition:all 0.3s ease }
.slide-down-enter-from,.slide-down-leave-to { opacity:0;transform:translateY(-12px) }
</style>