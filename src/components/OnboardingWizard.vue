<template>
  <teleport to="body">
    <transition name="onboarding-fade">
      <div v-if="visible" class="onboarding-overlay">
        <div class="onboarding-modal">

          <!-- Progress bar -->
          <div class="ob-progress-wrap">
            <div class="ob-progress-bar" :style="{ width: progressPct + '%' }"></div>
          </div>

          <!-- Steps indicator -->
          <div class="ob-steps">
            <div
              v-for="(s, i) in steps" :key="i"
              class="ob-step-dot"
              :class="{ done: i < currentStep, active: i === currentStep }"
              @click="i < currentStep && (currentStep = i)"
            >
              <span v-if="i < currentStep">✓</span>
              <span v-else>{{ i + 1 }}</span>
            </div>
          </div>

          <!-- ══ STEP 0 : Bienvenue + solde initial ══ -->
          <transition name="step-slide" mode="out-in">
            <div v-if="currentStep === 0" key="0" class="ob-body">
              <div class="ob-emoji">👋</div>
              <h2>Bienvenue sur FinanceFlow</h2>
              <p class="ob-subtitle">Commençons par configurer votre compte principal. Vous pouvez modifier ces informations à tout moment.</p>

              <div class="form-group">
                <label>Nom du compte</label>
                <input v-model="s0.nomCompte" type="text" class="input" placeholder="Ex : Compte courant" />
              </div>
              <div class="form-group">
                <label>Solde actuel (€)</label>
                <div style="position:relative">
                  <input v-model.number="s0.solde" type="number" class="input" placeholder="0.00" step="0.01" style="padding-left:32px" />
                  <span class="input-prefix">€</span>
                </div>
                <div class="form-hint">Le solde réel de votre compte bancaire aujourd'hui</div>
              </div>
            </div>

            <!-- ══ STEP 1 : Dépenses récurrentes ══ -->
            <div v-else-if="currentStep === 1" key="1" class="ob-body">
              <div class="ob-emoji">🔄</div>
              <h2>Vos dépenses fixes</h2>
              <p class="ob-subtitle">Ajoutez vos abonnements et charges mensuelles. Ils seront recréés automatiquement chaque mois.</p>

              <!-- Suggestions rapides -->
              <div class="ob-suggestions">
                <button
                  v-for="s in recurrentSuggestions" :key="s.description"
                  type="button" class="ob-suggestion-btn"
                  :class="{ used: s1.items.some(i => i.description === s.description) }"
                  @click="addSuggestion(s)"
                >
                  {{ s.emoji }} {{ s.description }}
                </button>
              </div>

              <!-- Items ajoutés -->
              <div v-if="s1.items.length" class="ob-recurring-list">
                <div v-for="(item, idx) in s1.items" :key="idx" class="ob-recurring-item">
                  <span class="ob-rec-emoji">{{ item.emoji }}</span>
                  <input v-model="item.description" type="text" class="input input-sm" placeholder="Description" style="flex:1" />
                  <div style="position:relative;width:110px">
                    <input v-model.number="item.montant" type="number" class="input input-sm" placeholder="0" step="0.01" style="padding-left:24px" />
                    <span class="input-prefix" style="font-size:12px">€</span>
                  </div>
                  <button type="button" class="ob-remove-btn" @click="s1.items.splice(idx, 1)">×</button>
                </div>
              </div>

              <!-- Ajouter manuellement -->
              <button type="button" class="ob-add-btn" @click="addBlankRecurrent">
                + Ajouter manuellement
              </button>
            </div>

            <!-- ══ STEP 2 : Budgets ══ -->
            <div v-else-if="currentStep === 2" key="2" class="ob-body">
              <div class="ob-emoji">🎯</div>
              <h2>Vos limites de budget</h2>
              <p class="ob-subtitle">Définissez un plafond mensuel par catégorie. Laissez à 0 pour ignorer une catégorie.</p>

              <div class="ob-budgets-grid">
                <div v-for="cat in categories" :key="cat.nom" class="ob-budget-row">
                  <div class="ob-budget-cat">
                    <span :style="{ color: cat.color }">{{ cat.emoji }}</span>
                    <span class="ob-budget-label">{{ cat.nom }}</span>
                  </div>
                  <div style="position:relative;width:120px">
                    <input
                      v-model.number="s2.budgets[cat.nom]"
                      type="number"
                      class="input input-sm"
                      placeholder="—"
                      step="10"
                      min="0"
                      style="padding-left:24px;text-align:right"
                    />
                    <span class="input-prefix" style="font-size:12px">€</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ══ STEP 3 : Objectif ══ -->
            <div v-else-if="currentStep === 3" key="3" class="ob-body">
              <div class="ob-emoji">🏆</div>
              <h2>Un objectif pour vous motiver</h2>
              <p class="ob-subtitle">Définissez votre premier objectif d'épargne. Vous pouvez en créer d'autres plus tard.</p>

              <div class="form-group">
                <label>Nom de l'objectif</label>
                <input v-model="s3.nom" type="text" class="input" placeholder="Ex : Vacances, Voiture, Fonds urgence..." />
              </div>
              <div class="form-group">
                <label>Montant cible (€)</label>
                <div style="position:relative">
                  <input v-model.number="s3.cible" type="number" class="input" placeholder="0" step="100" style="padding-left:32px" />
                  <span class="input-prefix">€</span>
                </div>
              </div>
              <div class="ob-row-2">
                <div class="form-group" style="flex:1">
                  <label>Montant déjà épargné</label>
                  <div style="position:relative">
                    <input v-model.number="s3.actuel" type="number" class="input" placeholder="0" step="10" style="padding-left:32px" />
                    <span class="input-prefix">€</span>
                  </div>
                </div>
                <div class="form-group" style="flex:1">
                  <label>Date cible</label>
                  <input v-model="s3.date" type="date" class="input" />
                </div>
              </div>

              <!-- Preview barre de progression -->
              <div v-if="s3.cible > 0" class="ob-goal-preview">
                <div class="ob-goal-preview-header">
                  <span>{{ s3.nom || 'Mon objectif' }}</span>
                  <span>{{ Math.round(((s3.actuel || 0) / s3.cible) * 100) }}%</span>
                </div>
                <div class="ob-goal-bar-track">
                  <div class="ob-goal-bar-fill" :style="{ width: Math.min(((s3.actuel || 0) / s3.cible) * 100, 100) + '%' }"></div>
                </div>
                <div class="ob-goal-preview-sub">
                  {{ formatAmount(s3.actuel || 0) }} / {{ formatAmount(s3.cible) }}
                </div>
              </div>
            </div>
          </transition>

          <!-- Footer navigation -->
          <div class="ob-footer">
            <button v-if="currentStep > 0" class="btn btn-ghost" @click="currentStep--">
              ← Retour
            </button>
            <div style="flex:1"></div>
            <button class="btn btn-ghost ob-skip" @click="skipStep">
              {{ currentStep === steps.length - 1 ? 'Passer' : 'Ignorer' }}
            </button>
            <button class="btn btn-primary" @click="nextStep" :disabled="saving">
              <div v-if="saving" class="spinner" style="width:14px;height:14px;border-width:2px"></div>
              <span v-else-if="currentStep < steps.length - 1">Continuer →</span>
              <span v-else>Terminer 🎉</span>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'
import { useComptesStore } from '@/stores/comptes'

const authStore    = useAuthStore()
const financeStore = useFinanceStore()
const comptesStore = useComptesStore()

const visible     = ref(false)
const currentStep = ref(0)
const saving      = ref(false)

const steps = ['Compte', 'Récurrentes', 'Budgets', 'Objectif']

const progressPct = computed(() => ((currentStep.value) / steps.length) * 100)

// ── Step 0 data ───────────────────────────────────────────────────
const s0 = reactive({ nomCompte: 'Compte courant', solde: null })

// ── Step 1 data ───────────────────────────────────────────────────
const s1 = reactive({ items: [] })

const recurrentSuggestions = [
  { emoji: '🏠', description: 'Loyer',       categorie: 'Loyer',       montant: null },
  { emoji: '📦', description: 'Netflix',     categorie: 'Abonnements', montant: 17 },
  { emoji: '📦', description: 'Spotify',     categorie: 'Abonnements', montant: 11 },
  { emoji: '🚗', description: 'Assurance auto', categorie: 'Banque / Assurance', montant: null },
  { emoji: '📱', description: 'Téléphone',   categorie: 'Abonnements', montant: null },
  { emoji: '🏥', description: 'Mutuelle',    categorie: 'Santé',       montant: null },
  { emoji: '⚡', description: 'Électricité', categorie: 'Autres',      montant: null },
  { emoji: '🌐', description: 'Internet',    categorie: 'Abonnements', montant: null },
]

function addSuggestion(s) {
  if (s1.items.some(i => i.description === s.description)) return
  s1.items.push({ ...s, montant: s.montant || null })
}
function addBlankRecurrent() {
  s1.items.push({ emoji: '💳', description: '', categorie: 'Autres', montant: null })
}

// ── Step 2 data ───────────────────────────────────────────────────
const categories = [
  { nom: 'Loyer',              emoji: '🏠', color: '#4facfe' },
  { nom: 'Nourriture',         emoji: '🍔', color: '#00e5a0' },
  { nom: 'Transport',          emoji: '🚗', color: '#ff9f43' },
  { nom: 'Loisirs',            emoji: '🎮', color: '#c084fc' },
  { nom: 'Abonnements',        emoji: '📦', color: '#fb7185' },
  { nom: 'Santé',              emoji: '🏥', color: '#34d399' },
  { nom: 'Vêtements',          emoji: '👕', color: '#f472b6' },
  { nom: 'Banque / Assurance', emoji: '🏦', color: '#60a5fa' },
  { nom: 'Autres',             emoji: '💳', color: '#94a3b8' },
]
const s2 = reactive({ budgets: Object.fromEntries(categories.map(c => [c.nom, null])) })

// ── Step 3 data ───────────────────────────────────────────────────
const s3 = reactive({
  nom: '', cible: null, actuel: null,
  date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
})

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

// ── Save each step & advance ──────────────────────────────────────
async function nextStep() {
  saving.value = true
  try {
    await saveCurrentStep()
    if (currentStep.value < steps.length - 1) {
      currentStep.value++
    } else {
      await finish()
    }
  } finally {
    saving.value = false
  }
}

async function skipStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    await finish()
  }
}

async function saveCurrentStep() {
  const uid = authStore.user?.uid
  if (!uid) return

  if (currentStep.value === 0) {
    // Créer / mettre à jour le compte principal
    await comptesStore.initialiserCompteDefaut(s0.nomCompte, s0.solde || 0)
  }

  if (currentStep.value === 1) {
    const today = new Date().toISOString().split('T')[0]
    for (const item of s1.items) {
      if (!item.description || !item.montant) continue
      await financeStore.ajouterDepense({
        categorie:   item.categorie || 'Autres',
        description: item.description,
        montant:     item.montant,
        recurrent:   true,
        date:        today,
        tags:        [],
      })
    }
  }

  if (currentStep.value === 2) {
    for (const [cat, montant] of Object.entries(s2.budgets)) {
      if (montant && montant > 0) {
        await financeStore.definirBudget(cat, montant)
      }
    }
  }

  if (currentStep.value === 3) {
    if (s3.nom && s3.cible > 0) {
      await financeStore.ajouterObjectif({
        nom:         s3.nom,
        cible:       s3.cible,
        actuel:      s3.actuel || 0,
        dateEcheance: s3.date,
        emoji:       '🏆',
      })
    }
  }
}

async function finish() {
  const uid = authStore.user?.uid
  if (!uid) return
  // Marquer l'onboarding comme terminé
  await setDoc(doc(db, 'users', uid), { onboardingDone: true }, { merge: true })
  visible.value = false
}

// ── Init : afficher seulement si jamais fait ──────────────────────
onMounted(async () => {
  const uid = authStore.user?.uid
  if (!uid) return

  // Attendre que les stores soient prêts
  await new Promise(r => setTimeout(r, 800))

  // Vérifier le flag Firestore
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists() && userDoc.data()?.onboardingDone) return

  // Vérifier si le compte est vraiment vide
  const isEmpty =
    financeStore.revenus.length === 0 &&
    financeStore.depenses.length === 0 &&
    financeStore.budgets.length === 0

  if (isEmpty) {
    visible.value = true
  }
})
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.onboarding-modal {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Progress bar */
.ob-progress-wrap {
  height: 3px;
  background: var(--bg-elevated);
}
.ob-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #00b4d8);
  transition: width 0.4s ease;
  border-radius: 0 2px 2px 0;
}

/* Steps dots */
.ob-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 24px 0;
}
.ob-step-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  border: 2px solid var(--border);
  color: var(--text-muted);
  background: var(--bg-elevated);
  transition: all 0.2s ease;
  position: relative;
}
.ob-step-dot::after {
  content: '';
  position: absolute;
  left: calc(100% + 2px);
  top: 50%; transform: translateY(-50%);
  width: 8px; height: 2px;
  background: var(--border);
}
.ob-step-dot:last-child::after { display: none; }
.ob-step-dot.done {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  cursor: pointer;
}
.ob-step-dot.done::after { background: var(--accent); }
.ob-step-dot.active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
  box-shadow: 0 0 0 3px rgba(0,229,160,0.15);
}

/* Body */
.ob-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 340px;
}

.ob-emoji {
  font-size: 40px;
  text-align: center;
  margin-bottom: 4px;
}

h2 {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  text-align: center;
  margin: 0;
}

.ob-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.5;
  margin: 0;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.form-hint { font-size: 11px; color: var(--text-muted); }

.input-prefix {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-weight: 600;
}

/* Suggestions */
.ob-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ob-suggestion-btn {
  padding: 6px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all var(--transition);
}
.ob-suggestion-btn:hover { border-color: var(--border-accent); color: var(--accent); }
.ob-suggestion-btn.used { background: var(--accent-dim); border-color: var(--border-accent); color: var(--accent); }

/* Recurring list */
.ob-recurring-list { display: flex; flex-direction: column; gap: 8px; }
.ob-recurring-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
}
.ob-rec-emoji { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
.input-sm { padding: 7px 10px !important; font-size: 13px !important; }
.ob-remove-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 18px;
  line-height: 1; padding: 0 4px; border-radius: 4px;
  transition: all var(--transition);
}
.ob-remove-btn:hover { color: var(--red); background: rgba(255,107,107,0.1); }

.ob-add-btn {
  background: none;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: 8px;
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-body);
  cursor: pointer;
  transition: all var(--transition);
  width: 100%;
}
.ob-add-btn:hover { border-color: var(--border-accent); color: var(--accent); }

/* Budgets grid */
.ob-budgets-grid { display: flex; flex-direction: column; gap: 8px; }
.ob-budget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius);
}
.ob-budget-cat { display: flex; align-items: center; gap: 8px; }
.ob-budget-label { font-size: 13px; font-weight: 500; }

/* Objectif preview */
.ob-row-2 { display: flex; gap: 12px; }
.ob-goal-preview {
  padding: 14px 16px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius);
}
.ob-goal-preview-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.ob-goal-bar-track { height: 6px; background: rgba(0,229,160,0.15); border-radius: 99px; overflow: hidden; }
.ob-goal-bar-fill { height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.4s ease; }
.ob-goal-preview-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; text-align: right; }

/* Footer */
.ob-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border);
}
.ob-skip { color: var(--text-muted); font-size: 13px; }
.ob-skip:hover { color: var(--text-secondary); }

/* Step transition */
.step-slide-enter-active { transition: all 0.25s ease; }
.step-slide-leave-active { transition: all 0.15s ease; }
.step-slide-enter-from { opacity: 0; transform: translateX(20px); }
.step-slide-leave-to  { opacity: 0; transform: translateX(-20px); }

/* Overlay fade */
.onboarding-fade-enter-active { transition: all 0.35s ease; }
.onboarding-fade-leave-active { transition: all 0.25s ease; }
.onboarding-fade-enter-from, .onboarding-fade-leave-to { opacity: 0; }

/* Mobile */
@media (max-width: 600px) {
  .onboarding-modal { border-radius: 16px; }
  .ob-body { padding: 20px 18px; min-height: 300px; }
  .ob-footer { padding: 14px 18px 16px; }
  .ob-row-2 { flex-direction: column; gap: 8px; }
}
</style>
