<template>
  <div class="animate-fade-in">

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Budget</h1>
        <p>{{ moisCourant }} — Définissez vos limites par catégorie</p>
      </div>
      <button class="btn btn-primary" @click="showModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Définir un budget
      </button>
    </div>

    <!-- Alertes dépassement -->
    <div v-if="alertes.length > 0" class="alertes-section" style="margin-bottom:24px">
      <div v-for="alerte in alertes" :key="alerte.categorie" class="alerte-card" :class="alerte.type">
        <span class="alerte-icon">{{ alerte.emoji }}</span>
        <div class="alerte-body">
          <div class="alerte-title">{{ alerte.title }}</div>
          <div class="alerte-text">{{ alerte.text }}</div>
        </div>
        <span class="alerte-montant" :class="alerte.type === 'danger' ? 'amount-negative' : ''">
          {{ alerte.montant }}
        </span>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid-3" style="margin-bottom:28px">
      <div class="card card-accent">
        <div class="kpi-label">Budget total défini</div>
        <div class="kpi-value text-accent">{{ formatAmount(totalBudget) }}</div>
        <div class="kpi-sub">sur {{ financeStore.budgets.length }} catégorie(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Dépensé ce mois</div>
        <div class="kpi-value" :style="{ color: tauxGlobal > 100 ? 'var(--red)' : tauxGlobal > 75 ? 'var(--orange)' : 'var(--text-primary)' }">
          {{ formatAmount(totalDepenseBudgete) }}
        </div>
        <div class="kpi-sub">{{ tauxGlobal }}% du budget utilisé</div>
      </div>
      <div class="card">
        <div class="kpi-label">Reste disponible</div>
        <div class="kpi-value" :style="{ color: resteGlobal >= 0 ? 'var(--green)' : 'var(--red)' }">
          {{ formatAmount(Math.abs(resteGlobal)) }}
        </div>
        <div class="kpi-sub">{{ resteGlobal >= 0 ? 'encore disponible' : 'de dépassement !' }}</div>
      </div>
    </div>

    <!-- Barre globale -->
    <div class="card" style="margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="font-family:var(--font-display)">Progression globale du mois</h3>
        <span class="badge" :class="badgeClass(tauxGlobal)">{{ tauxGlobal }}%</span>
      </div>
      <div class="global-bar-track">
        <div
          class="global-bar-fill"
          :style="{
            width: Math.min(tauxGlobal, 100) + '%',
            background: barColor(tauxGlobal)
          }"
        ></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px;color:var(--text-muted)">
        <span>0€</span>
        <span v-if="previsionFinMois > 0" style="color:var(--orange)">
          📅 Prévision fin de mois : {{ formatAmount(previsionFinMois) }}
        </span>
        <span>{{ formatAmount(totalBudget) }}</span>
      </div>
    </div>

    <!-- Grid budgets par catégorie -->
    <div v-if="financeStore.budgets.length === 0" class="card" style="text-align:center;padding:56px 24px">
      <div style="font-size:3rem;margin-bottom:16px">🎯</div>
      <h2 style="margin-bottom:8px">Aucun budget défini</h2>
      <p style="margin-bottom:24px">Définissez des limites par catégorie pour suivre vos dépenses.</p>
      <button class="btn btn-primary" @click="showModal = true">+ Définir mon premier budget</button>
    </div>

    <div v-else class="budget-grid">
      <div
        v-for="budget in budgetsAvecStats"
        :key="budget.categorie"
        class="budget-card card"
        :class="{ 'over-budget': budget.taux > 100 }"
      >
        <!-- Header carte -->
        <div class="budget-card-header">
          <div class="budget-cat-info">
            <div class="budget-emoji" :style="{ background: budget.color + '20' }">{{ budget.emoji }}</div>
            <div>
              <div class="budget-cat-name">{{ budget.categorie }}</div>
              <div class="budget-cat-limit">Limite : {{ formatAmount(budget.montant) }}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="badge" :class="badgeClass(budget.taux)">{{ budget.taux }}%</span>
            <button class="icon-btn" @click="editerBudget(budget)" title="Modifier">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-btn danger" @click="supprimerBudget(budget.categorie)" title="Supprimer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Barre de progression -->
        <div class="budget-bar-track">
          <div
            class="budget-bar-fill"
            :style="{
              width: Math.min(budget.taux, 100) + '%',
              background: barColor(budget.taux)
            }"
          ></div>
          <!-- Marqueur de dépassement -->
          <div v-if="budget.taux > 100" class="over-marker"></div>
        </div>

        <!-- Montants -->
        <div class="budget-amounts">
          <div>
            <div class="budget-amount-label">Dépensé</div>
            <div class="budget-amount-val" :style="{ color: barColor(budget.taux) }">
              {{ formatAmount(budget.depense) }}
            </div>
          </div>
          <div style="text-align:center">
            <div class="budget-amount-label">Reste</div>
            <div class="budget-amount-val" :style="{ color: budget.reste >= 0 ? 'var(--green)' : 'var(--red)' }">
              {{ budget.reste >= 0 ? formatAmount(budget.reste) : '-' + formatAmount(Math.abs(budget.reste)) }}
            </div>
          </div>
          <div style="text-align:right">
            <div class="budget-amount-label">Prévision</div>
            <div class="budget-amount-val" :style="{ color: budget.prevision > budget.montant ? 'var(--orange)' : 'var(--text-secondary)' }">
              {{ formatAmount(budget.prevision) }}
            </div>
          </div>
        </div>

        <!-- Alerte dépassement inline -->
        <div v-if="budget.taux > 100" class="budget-alert-inline">
          🚨 Dépassement de {{ formatAmount(Math.abs(budget.reste)) }}
        </div>
        <div v-else-if="budget.taux > 80" class="budget-alert-inline warn">
          ⚠️ Plus que {{ formatAmount(budget.reste) }} disponible
        </div>
      </div>

      <!-- Carte : catégories sans budget -->
      <div
        v-for="cat in categoriesSansBudget"
        :key="cat.nom"
        class="budget-card card no-budget"
        @click="preselectionnerCategorie(cat.nom)"
      >
        <div class="budget-card-header">
          <div class="budget-cat-info">
            <div class="budget-emoji" :style="{ background: cat.color + '15' }">{{ cat.emoji }}</div>
            <div>
              <div class="budget-cat-name" style="color:var(--text-muted)">{{ cat.nom }}</div>
              <div class="budget-cat-limit" style="color:var(--text-muted)">Pas de budget défini</div>
            </div>
          </div>
          <span style="font-size:20px;color:var(--text-muted)">+</span>
        </div>
        <div v-if="depenseParCat[cat.nom]" style="margin-top:8px;font-size:13px;color:var(--text-muted)">
          {{ formatAmount(depenseParCat[cat.nom]) }} dépensé ce mois
        </div>
      </div>
    </div>

    <!-- ─── Modal ─────────────────────────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editMode ? 'Modifier le budget' : 'Définir un budget' }}</h3>
              <button class="icon-btn" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSauvegarder" class="modal-body">
              <!-- Sélection catégorie -->
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

              <!-- Montant limite -->
              <div class="form-group">
                <label>Limite mensuelle (€)</label>
                <div style="position:relative">
                  <input
                    v-model.number="form.montant"
                    type="number" class="input"
                    placeholder="0.00" step="1" min="1" required
                    style="padding-left:36px;font-size:1.2rem;font-weight:700"
                  />
                  <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
                </div>
              </div>

              <!-- Aperçu en temps réel -->
              <div v-if="form.montant > 0 && form.categorie" class="preview-budget">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <span style="font-weight:600">
                    {{ categorieEmoji(form.categorie) }} {{ form.categorie }}
                  </span>
                  <span style="font-size:13px;color:var(--text-muted)">
                    Dépensé : {{ formatAmount(depenseParCat[form.categorie] || 0) }} / {{ formatAmount(form.montant) }}
                  </span>
                </div>
                <div class="global-bar-track">
                  <div
                    class="global-bar-fill"
                    :style="{
                      width: Math.min(((depenseParCat[form.categorie] || 0) / form.montant) * 100, 100) + '%',
                      background: barColor(((depenseParCat[form.categorie] || 0) / form.montant) * 100)
                    }"
                  ></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px;color:var(--text-muted)">
                  <span>Reste : {{ formatAmount(form.montant - (depenseParCat[form.categorie] || 0)) }}</span>
                  <span>{{ Math.round(((depenseParCat[form.categorie] || 0) / form.montant) * 100) }}% utilisé</span>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <div v-if="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                  <span v-else>{{ editMode ? 'Mettre à jour' : 'Enregistrer' }}</span>
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
import { deleteDoc, doc, query, collection, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'

const financeStore = useFinanceStore()
const authStore    = useAuthStore()

// ─── State ────────────────────────────────────────────────────────
const showModal  = ref(false)
const editMode   = ref(false)
const submitting = ref(false)
const form = ref({ categorie: 'Nourriture', montant: null })

// ─── Catégories ───────────────────────────────────────────────────
const categories = [
  { nom: 'Loyer',       emoji: '🏠', color: '#4facfe' },
  { nom: 'Nourriture',  emoji: '🍔', color: '#00e5a0' },
  { nom: 'Transport',   emoji: '🚗', color: '#ff9f43' },
  { nom: 'Loisirs',     emoji: '🎮', color: '#c084fc' },
  { nom: 'Abonnements', emoji: '📦', color: '#fb7185' },
  { nom: 'Santé',       emoji: '🏥', color: '#34d399' },
  { nom: 'Vêtements',   emoji: '👕', color: '#f472b6' },
  { nom: 'Autres',      emoji: '💳', color: '#94a3b8' }
]
function categorieEmoji(nom) { return categories.find(c => c.nom === nom)?.emoji || '💳' }
function categorieColor(nom) { return categories.find(c => c.nom === nom)?.color || '#94a3b8' }

// ─── Helpers ──────────────────────────────────────────────────────
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

function barColor(pct) {
  if (pct >= 100) return 'var(--red)'
  if (pct >= 75)  return 'var(--orange)'
  return 'var(--green)'
}

function badgeClass(pct) {
  if (pct >= 100) return 'badge-red'
  if (pct >= 75)  return 'badge-orange'
  return 'badge-green'
}

// Calcul du jour du mois pour la prévision
const jourDuMois = new Date().getDate()
const joursTotal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()

// ─── Computed ─────────────────────────────────────────────────────
const moisCourant = computed(() =>
  new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

// Dépenses par catégorie ce mois
const depenseParCat = computed(() => {
  const now = new Date()
  const map = {}
  financeStore.depenses.forEach(d => {
    if (!d.createdAt) return
    const date = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      map[d.categorie] = (map[d.categorie] || 0) + d.montant
    }
  })
  return map
})

const budgetsAvecStats = computed(() =>
  financeStore.budgets.map(b => {
    const depense  = depenseParCat.value[b.categorie] || 0
    const taux     = b.montant > 0 ? Math.round((depense / b.montant) * 100) : 0
    const reste    = b.montant - depense
    // Prévision : extrapolation au rythme actuel
    const prevision = jourDuMois > 0 ? Math.round((depense / jourDuMois) * joursTotal) : 0
    return {
      ...b,
      depense, taux, reste, prevision,
      emoji: categorieEmoji(b.categorie),
      color: categorieColor(b.categorie)
    }
  }).sort((a, b) => b.taux - a.taux)
)

const categoriesSansBudget = computed(() =>
  categories.filter(cat => !financeStore.budgets.find(b => b.categorie === cat.nom))
)

const totalBudget = computed(() => financeStore.budgets.reduce((s, b) => s + b.montant, 0))
const totalDepenseBudgete = computed(() =>
  financeStore.budgets.reduce((s, b) => s + (depenseParCat.value[b.categorie] || 0), 0)
)
const tauxGlobal  = computed(() => totalBudget.value > 0 ? Math.round((totalDepenseBudgete.value / totalBudget.value) * 100) : 0)
const resteGlobal = computed(() => totalBudget.value - totalDepenseBudgete.value)

const previsionFinMois = computed(() => {
  if (!totalDepenseBudgete.value || jourDuMois === 0) return 0
  return Math.round((totalDepenseBudgete.value / jourDuMois) * joursTotal)
})

// Alertes
const alertes = computed(() => {
  const list = []
  budgetsAvecStats.value.forEach(b => {
    if (b.taux >= 100) {
      list.push({
        type: 'danger',
        emoji: '🚨',
        categorie: b.categorie,
        title: `Budget ${b.categorie} dépassé !`,
        text: `Vous avez dépensé ${formatAmount(b.depense)} sur ${formatAmount(b.montant)} prévus.`,
        montant: '+' + formatAmount(Math.abs(b.reste))
      })
    } else if (b.taux >= 80) {
      list.push({
        type: 'warn',
        emoji: '⚠️',
        categorie: b.categorie,
        title: `Budget ${b.categorie} presque atteint`,
        text: `Il ne reste que ${formatAmount(b.reste)} sur votre budget de ${formatAmount(b.montant)}.`,
        montant: b.taux + '%'
      })
    }
  })
  return list
})

// ─── Actions ──────────────────────────────────────────────────────
function editerBudget(budget) {
  form.value = { categorie: budget.categorie, montant: budget.montant }
  editMode.value = true
  showModal.value = true
}

function preselectionnerCategorie(nom) {
  form.value = { categorie: nom, montant: null }
  editMode.value = false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editMode.value  = false
  form.value = { categorie: 'Nourriture', montant: null }
}

async function handleSauvegarder() {
  if (!form.value.montant || form.value.montant <= 0) return
  submitting.value = true
  try {
    await financeStore.definirBudget(form.value.categorie, form.value.montant)
    closeModal()
  } finally {
    submitting.value = false
  }
}

async function supprimerBudget(categorie) {
  if (!confirm(`Supprimer le budget pour "${categorie}" ?`)) return
  const uid = authStore.user?.uid
  if (!uid) return
  const budget = financeStore.budgets.find(b => b.categorie === categorie)
  if (budget?.id) {
    await deleteDoc(doc(db, 'budgets', budget.id))
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────
let unsubs = []
onMounted(() => {
  unsubs.push(financeStore.ecouter_budgets())
  unsubs.push(financeStore.ecouter_depenses())
})
onUnmounted(() => unsubs.forEach(fn => fn && fn()))
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.alertes-section { display:flex;flex-direction:column;gap:8px }
.alerte-card { display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:var(--radius);border:1px solid }
.alerte-card.danger { background:rgba(255,107,107,0.07);border-color:rgba(255,107,107,0.25) }
.alerte-card.warn   { background:rgba(255,159,67,0.07);border-color:rgba(255,159,67,0.25) }
.alerte-icon  { font-size:20px;flex-shrink:0 }
.alerte-body  { flex:1;min-width:0 }
.alerte-title { font-size:14px;font-weight:700;margin-bottom:2px }
.alerte-text  { font-size:13px;color:var(--text-secondary) }
.alerte-montant { font-size:14px;font-weight:700;flex-shrink:0 }

.global-bar-track { height:10px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.global-bar-fill  { height:100%;border-radius:99px;transition:width 1s cubic-bezier(0.4,0,0.2,1) }

.budget-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px }

.budget-card { padding:20px;cursor:default;transition:all var(--transition) }
.budget-card.over-budget { border-color:rgba(255,107,107,0.3) }
.budget-card.no-budget   { border-style:dashed;cursor:pointer;opacity:0.65 }
.budget-card.no-budget:hover { opacity:1;border-color:var(--border-accent) }
.budget-card-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px }
.budget-cat-info    { display:flex;align-items:center;gap:12px }
.budget-emoji       { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0 }
.budget-cat-name    { font-size:15px;font-weight:700 }
.budget-cat-limit   { font-size:12px;color:var(--text-muted);margin-top:2px }

.budget-bar-track { height:8px;background:var(--bg-elevated);border-radius:99px;overflow:hidden;position:relative;margin-bottom:14px }
.budget-bar-fill  { height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1) }
.over-marker      { position:absolute;right:0;top:0;bottom:0;width:3px;background:var(--red);border-radius:99px }

.budget-amounts { display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px }
.budget-amount-label { font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px }
.budget-amount-val   { font-size:14px;font-weight:700;font-family:var(--font-display) }

.budget-alert-inline { padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;background:rgba(255,107,107,0.1);color:var(--red) }
.budget-alert-inline.warn { background:rgba(255,159,67,0.1);color:var(--orange) }

.preview-budget { padding:16px;background:var(--bg-elevated);border-radius:var(--radius);margin-top:4px }

@media (max-width:640px) { .budget-grid { grid-template-columns:1fr } .cat-selector { grid-template-columns:repeat(2,1fr) } }
</style>