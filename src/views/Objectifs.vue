<template>
  <div class="animate-fade-in">

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Objectifs</h1>
        <p>Suivez vos projets d'épargne et atteignez vos rêves</p>
      </div>
      <button class="btn btn-primary" @click="showModal = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Nouvel objectif
      </button>
    </div>

    <!-- KPIs -->
    <div class="grid-4" style="margin-bottom:28px">
      <div class="card card-accent">
        <div class="kpi-label">Total à épargner</div>
        <div class="kpi-value text-accent">{{ formatAmount(totalCible) }}</div>
        <div class="kpi-sub">{{ financeStore.objectifs.length }} objectif(s)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Déjà épargné</div>
        <div class="kpi-value" style="color:var(--green)">{{ formatAmount(totalActuel) }}</div>
        <div class="kpi-sub">{{ progressionGlobale }}% accompli</div>
      </div>
      <div class="card">
        <div class="kpi-label">Reste à atteindre</div>
        <div class="kpi-value">{{ formatAmount(totalCible - totalActuel) }}</div>
        <div class="kpi-sub">tous objectifs confondus</div>
      </div>
      <div class="card">
        <div class="kpi-label">Objectifs atteints</div>
        <div class="kpi-value" style="color:var(--green)">{{ nbAtteints }} 🎉</div>
        <div class="kpi-sub">sur {{ financeStore.objectifs.length }} total</div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="financeStore.objectifs.length === 0" class="card" style="text-align:center;padding:64px 24px">
      <div style="font-size:4rem;margin-bottom:16px">🎯</div>
      <h2 style="margin-bottom:8px">Aucun objectif défini</h2>
      <p style="margin-bottom:28px;max-width:400px;margin-inline:auto">
        Définissez des objectifs d'épargne pour vos projets : voyage, voiture, PC, fonds d'urgence...
      </p>
      <button class="btn btn-primary" style="margin:auto" @click="showModal = true">
        + Créer mon premier objectif
      </button>
    </div>

    <!-- Objectifs atteints en premier, puis les autres triés par % -->
    <div v-else class="objectifs-grid">

      <div
        v-for="obj in objectifsTries"
        :key="obj.id"
        class="objectif-card card"
        :class="{ 'completed': obj.pct >= 100 }"
      >
        <!-- Ruban "Atteint" -->
        <div v-if="obj.pct >= 100" class="completed-ribbon">✅ Atteint !</div>

        <!-- Header -->
        <div class="obj-header">
          <div class="obj-emoji-wrap" :style="{ background: obj.couleur + '20', border: '1px solid ' + obj.couleur + '40' }">
            {{ obj.emoji }}
          </div>
          <div class="obj-info">
            <div class="obj-title">{{ obj.nom }}</div>
            <div class="obj-subtitle">{{ obj.description || 'Objectif d\'épargne' }}</div>
          </div>
          <div class="obj-actions">
            <button class="icon-btn" @click="editerObjectif(obj)" title="Modifier">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="icon-btn danger" @click="supprimerObjectif(obj.id)" title="Supprimer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Montants -->
        <div class="obj-amounts">
          <div>
            <div class="obj-amount-label">Épargné</div>
            <div class="obj-amount-val" :style="{ color: obj.couleur }">{{ formatAmount(obj.montantActuel) }}</div>
          </div>
          <div style="text-align:center">
            <div class="obj-pct-circle" :style="{ '--pct-color': obj.couleur }">
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--bg-elevated)" stroke-width="5"/>
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  :stroke="obj.couleur" stroke-width="5"
                  stroke-linecap="round"
                  :stroke-dasharray="138.2"
                  :stroke-dashoffset="138.2 - (138.2 * Math.min(obj.pct, 100) / 100)"
                  transform="rotate(-90 28 28)"
                  style="transition: stroke-dashoffset 1s ease"
                />
              </svg>
              <span class="obj-pct-text" :style="{ color: obj.couleur }">{{ obj.pct }}%</span>
            </div>
          </div>
          <div style="text-align:right">
            <div class="obj-amount-label">Objectif</div>
            <div class="obj-amount-val">{{ formatAmount(obj.montantCible) }}</div>
          </div>
        </div>

        <!-- Barre de progression -->
        <div class="obj-bar-track">
          <div
            class="obj-bar-fill"
            :style="{ width: Math.min(obj.pct, 100) + '%', background: obj.pct >= 100 ? 'var(--green)' : obj.couleur }"
          ></div>
        </div>

        <!-- Reste + deadline -->
        <div class="obj-footer">
          <div>
            <span class="obj-footer-label">Reste : </span>
            <span style="font-weight:600">{{ formatAmount(Math.max(obj.montantCible - obj.montantActuel, 0)) }}</span>
          </div>
          <div v-if="obj.dateEcheance" class="obj-deadline" :class="{ urgent: joursRestants(obj) <= 30 && obj.pct < 100 }">
            📅 {{ joursRestants(obj) > 0 ? joursRestants(obj) + ' jours' : 'Échéance dépassée' }}
          </div>
        </div>

        <!-- Simulation -->
        <div v-if="obj.pct < 100 && financeStore.solde > 0" class="simulation-box">
          <div class="simulation-title">💡 Simulation</div>
          <div class="simulation-rows">
            <div class="simulation-row">
              <span>À épargner / mois</span>
              <span class="text-accent">{{ formatAmount(epargneRequise(obj)) }}</span>
            </div>
            <div class="simulation-row">
              <span>Temps restant estimé</span>
              <span class="text-accent">{{ tempsRestant(obj) }}</span>
            </div>
          </div>
        </div>

        <!-- Bouton + épargne -->
        <div style="margin-top:14px;display:flex;gap:8px">
          <input
            v-model.number="versements[obj.id]"
            type="number"
            class="input"
            :placeholder="'Ajouter €'"
            min="0.01" step="0.01"
            style="flex:1;font-size:14px;padding:9px 12px"
          />
          <button
            class="btn btn-primary"
            style="padding:9px 16px;font-size:13px"
            :disabled="!versements[obj.id] || versements[obj.id] <= 0"
            @click="ajouterVersement(obj)"
          >
            + Épargner
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Modal ─────────────────────────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editMode ? 'Modifier l\'objectif' : 'Nouvel objectif' }}</h3>
              <button class="icon-btn" @click="closeModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSauvegarder" class="modal-body">

              <!-- Emoji picker -->
              <div class="form-group">
                <label>Icône</label>
                <div class="emoji-picker">
                  <button
                    v-for="e in emojisDisponibles" :key="e"
                    type="button"
                    class="emoji-btn"
                    :class="{ active: form.emoji === e }"
                    @click="form.emoji = e"
                  >{{ e }}</button>
                </div>
              </div>

              <!-- Nom -->
              <div class="form-group">
                <label>Nom de l'objectif</label>
                <input v-model="form.nom" type="text" class="input" placeholder="Ex: Voyage au Japon, Nouveau PC..." required />
              </div>

              <!-- Description -->
              <div class="form-group">
                <label>Description <span style="color:var(--text-muted)">(optionnel)</span></label>
                <input v-model="form.description" type="text" class="input" placeholder="Quelques mots sur cet objectif..." />
              </div>

              <!-- Montant cible -->
              <div class="form-group">
                <label>Montant cible (€)</label>
                <div style="position:relative">
                  <input
                    v-model.number="form.montantCible"
                    type="number" class="input"
                    placeholder="0.00" step="1" min="1" required
                    style="padding-left:36px;font-size:1.2rem;font-weight:700"
                  />
                  <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
                </div>
              </div>

              <!-- Montant actuel -->
              <div class="form-group">
                <label>Déjà épargné (€)</label>
                <div style="position:relative">
                  <input
                    v-model.number="form.montantActuel"
                    type="number" class="input"
                    placeholder="0.00" step="0.01" min="0"
                    style="padding-left:36px"
                  />
                  <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-weight:600">€</span>
                </div>
              </div>

              <!-- Date échéance -->
              <div class="form-group">
                <label>Date d'échéance <span style="color:var(--text-muted)">(optionnel)</span></label>
                <input v-model="form.dateEcheance" type="date" class="input" />
              </div>

              <!-- Couleur -->
              <div class="form-group">
                <label>Couleur</label>
                <div class="color-picker">
                  <button
                    v-for="c in couleursDisponibles" :key="c"
                    type="button"
                    class="color-btn"
                    :class="{ active: form.couleur === c }"
                    :style="{ background: c }"
                    @click="form.couleur = c"
                  ></button>
                </div>
              </div>

              <!-- Aperçu -->
              <div v-if="form.nom && form.montantCible > 0" class="apercu-objectif">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                  <span style="font-size:24px">{{ form.emoji }}</span>
                  <div>
                    <div style="font-weight:700;font-size:15px">{{ form.nom }}</div>
                    <div style="font-size:12px;color:var(--text-muted)">{{ formatAmount(form.montantActuel || 0) }} / {{ formatAmount(form.montantCible) }}</div>
                  </div>
                  <span class="badge badge-green" style="margin-left:auto">
                    {{ form.montantCible > 0 ? Math.round(((form.montantActuel || 0) / form.montantCible) * 100) : 0 }}%
                  </span>
                </div>
                <div class="obj-bar-track">
                  <div
                    class="obj-bar-fill"
                    :style="{
                      width: form.montantCible > 0 ? Math.min(((form.montantActuel || 0) / form.montantCible) * 100, 100) + '%' : '0%',
                      background: form.couleur
                    }"
                  ></div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" @click="closeModal">Annuler</button>
                <button type="submit" class="btn btn-primary" :disabled="submitting">
                  <div v-if="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                  <span v-else>{{ editMode ? 'Mettre à jour' : 'Créer l\'objectif' }}</span>
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
const showModal  = ref(false)
const editMode   = ref(false)
const submitting = ref(false)
const versements = ref({}) // { [objectifId]: montant }

const defaultForm = () => ({
  nom: '',
  description: '',
  emoji: '🎯',
  montantCible: null,
  montantActuel: 0,
  dateEcheance: '',
  couleur: '#00e5a0'
})
const form = ref(defaultForm())

// ─── Options ──────────────────────────────────────────────────────
const emojisDisponibles = ['🎯','✈️','🚗','💻','🏠','📱','🎓','💍','🏖️','🎮','🏋️','🌍','🎸','📷','⌚','🛋️','🐶','👶']
const couleursDisponibles = ['#00e5a0','#4facfe','#ff9f43','#c084fc','#fb7185','#34d399','#f472b6','#fbbf24','#60a5fa','#f87171']

// ─── Helpers ──────────────────────────────────────────────────────
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

function joursRestants(obj) {
  if (!obj.dateEcheance) return null
  const diff = new Date(obj.dateEcheance) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function epargneRequise(obj) {
  const reste = obj.montantCible - obj.montantActuel
  if (reste <= 0) return 0
  // Basé sur l'épargne mensuelle actuelle (solde du store)
  const epargneActuelle = financeStore.solde
  return Math.max(reste / 12, 0) // fallback 12 mois si pas de données
}

function tempsRestant(obj) {
  const reste = obj.montantCible - obj.montantActuel
  if (reste <= 0) return 'Objectif atteint !'
  const epargne = financeStore.solde > 0 ? financeStore.solde : 100
  const mois = Math.ceil(reste / epargne)
  if (mois < 1)  return 'Moins d\'un mois'
  if (mois < 12) return `${mois} mois`
  const ans  = Math.floor(mois / 12)
  const rem  = mois % 12
  return rem > 0 ? `${ans} an${ans > 1 ? 's' : ''} et ${rem} mois` : `${ans} an${ans > 1 ? 's' : ''}`
}

// ─── Computed ─────────────────────────────────────────────────────
const objectifsAvecStats = computed(() =>
  financeStore.objectifs.map(o => ({
    ...o,
    pct: o.montantCible > 0 ? Math.round((o.montantActuel / o.montantCible) * 100) : 0
  }))
)

const objectifsTries = computed(() =>
  [...objectifsAvecStats.value].sort((a, b) => b.pct - a.pct)
)

const totalCible   = computed(() => financeStore.objectifs.reduce((s, o) => s + (o.montantCible || 0), 0))
const totalActuel  = computed(() => financeStore.objectifs.reduce((s, o) => s + (o.montantActuel || 0), 0))
const nbAtteints   = computed(() => objectifsAvecStats.value.filter(o => o.pct >= 100).length)
const progressionGlobale = computed(() =>
  totalCible.value > 0 ? Math.round((totalActuel.value / totalCible.value) * 100) : 0
)

// ─── Actions ──────────────────────────────────────────────────────
function editerObjectif(obj) {
  form.value = {
    id:           obj.id,
    nom:          obj.nom,
    description:  obj.description || '',
    emoji:        obj.emoji || '🎯',
    montantCible: obj.montantCible,
    montantActuel:obj.montantActuel || 0,
    dateEcheance: obj.dateEcheance || '',
    couleur:      obj.couleur || '#00e5a0'
  }
  editMode.value  = true
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editMode.value  = false
  form.value      = defaultForm()
}

async function handleSauvegarder() {
  if (!form.value.montantCible || form.value.montantCible <= 0) return
  submitting.value = true
  try {
    const data = {
      nom:          form.value.nom,
      description:  form.value.description,
      emoji:        form.value.emoji,
      montantCible: form.value.montantCible,
      montantActuel:form.value.montantActuel || 0,
      dateEcheance: form.value.dateEcheance || null,
      couleur:      form.value.couleur
    }
    if (editMode.value && form.value.id) {
      await financeStore.mettreAJourObjectif(form.value.id, data)
    } else {
      await financeStore.ajouterObjectif(data)
    }
    closeModal()
  } finally {
    submitting.value = false
  }
}

async function ajouterVersement(obj) {
  const montant = versements.value[obj.id]
  if (!montant || montant <= 0) return
  const nouvelActuel = (obj.montantActuel || 0) + montant
  await financeStore.mettreAJourObjectif(obj.id, {
    montantActuel: Math.min(nouvelActuel, obj.montantCible)
  })
  versements.value[obj.id] = null
}

async function supprimerObjectif(id) {
  if (!confirm('Supprimer cet objectif ?')) return
  await financeStore.supprimerObjectif(id)
}

// ─── Lifecycle ────────────────────────────────────────────────────
let unsubs = []
onMounted(() => {
  unsubs.push(financeStore.ecouter_objectifs())
  unsubs.push(financeStore.ecouter_revenus())
  unsubs.push(financeStore.ecouter_depenses())
})
onUnmounted(() => unsubs.forEach(fn => fn && fn()))
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

/* Grid */
.objectifs-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));
  gap:20px;
}

/* Carte objectif */
.objectif-card { padding:22px;position:relative;overflow:hidden;transition:all var(--transition) }
.objectif-card.completed { border-color:rgba(0,229,160,0.3);background:linear-gradient(135deg, var(--bg-surface) 80%, rgba(0,229,160,0.04)) }
.objectif-card:hover { transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.2) }

.completed-ribbon {
  position:absolute;top:14px;right:-28px;
  background:var(--green);color:#0c0e14;
  font-size:11px;font-weight:800;padding:4px 36px;
  transform:rotate(35deg);letter-spacing:0.05em;
}

/* Header */
.obj-header  { display:flex;align-items:flex-start;gap:12px;margin-bottom:18px }
.obj-emoji-wrap { width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0 }
.obj-info    { flex:1;min-width:0 }
.obj-title   { font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:2px }
.obj-subtitle{ font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.obj-actions { display:flex;gap:6px;flex-shrink:0 }

/* Montants + cercle */
.obj-amounts { display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-bottom:14px }
.obj-amount-label { font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px;font-weight:600 }
.obj-amount-val   { font-family:var(--font-display);font-size:15px;font-weight:700 }

.obj-pct-circle { position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center;margin:auto }
.obj-pct-text   { position:absolute;font-family:var(--font-display);font-size:13px;font-weight:800 }

/* Barre */
.obj-bar-track { height:8px;background:var(--bg-elevated);border-radius:99px;overflow:hidden;margin-bottom:12px }
.obj-bar-fill  { height:100%;border-radius:99px;transition:width 1s cubic-bezier(0.4,0,0.2,1) }

/* Footer */
.obj-footer { display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font-size:13px;color:var(--text-secondary) }
.obj-footer-label { color:var(--text-muted) }
.obj-deadline { font-size:12px;padding:3px 10px;background:var(--bg-elevated);border-radius:99px }
.obj-deadline.urgent { background:rgba(255,107,107,0.1);color:var(--red) }

/* Simulation */
.simulation-box { background:var(--bg-elevated);border-radius:var(--radius);padding:12px;margin-bottom:12px }
.simulation-title { font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em }
.simulation-rows  { display:flex;flex-direction:column;gap:6px }
.simulation-row   { display:flex;justify-content:space-between;font-size:13px }

/* Icon buttons */
.icon-btn { width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:none;border:1px solid var(--border);border-radius:7px;cursor:pointer;color:var(--text-muted);transition:all var(--transition) }
.icon-btn:hover { background:var(--bg-elevated);color:var(--text-primary) }
.icon-btn.danger:hover { background:rgba(255,107,107,0.1);color:var(--red);border-color:rgba(255,107,107,0.3) }

/* Modal */
.modal-overlay { position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px }
.modal-card    { background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.5) }
.modal-header  { display:flex;justify-content:space-between;align-items:center;padding:24px 24px 0 }
.modal-header h3 { font-family:var(--font-display);font-size:1.1rem }
.modal-body    { padding:24px;display:flex;flex-direction:column;gap:4px }
.modal-footer  { display:flex;gap:10px;justify-content:flex-end;margin-top:20px }

/* Emoji picker */
.emoji-picker { display:flex;flex-wrap:wrap;gap:6px;margin-top:4px }
.emoji-btn    { width:36px;height:36px;font-size:18px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:8px;background:var(--bg-elevated);cursor:pointer;transition:all var(--transition) }
.emoji-btn:hover { border-color:var(--border-accent) }
.emoji-btn.active { border-color:var(--accent);background:var(--accent-dim) }

/* Color picker */
.color-picker { display:flex;gap:8px;flex-wrap:wrap;margin-top:4px }
.color-btn    { width:28px;height:28px;border-radius:50%;border:3px solid transparent;cursor:pointer;transition:all var(--transition) }
.color-btn:hover { transform:scale(1.15) }
.color-btn.active { border-color:white;transform:scale(1.2);box-shadow:0 0 0 2px var(--bg-surface) }

/* Aperçu */
.apercu-objectif { padding:16px;background:var(--bg-elevated);border-radius:var(--radius);margin-top:4px }

.modal-enter-active,.modal-leave-active { transition:all 0.25s ease }
.modal-enter-from,.modal-leave-to { opacity:0;transform:scale(0.96) }

@media (max-width:640px) {
  .objectifs-grid { grid-template-columns:1fr }
}
</style>
