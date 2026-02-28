<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <div>
        <h1>Mes comptes</h1>
        <p>Gérez vos comptes bancaires et suivez chacun séparément</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">+ Nouveau compte</button>
    </div>

    <PremiumGate feature="multiAccounts" icon="🏦" title="Multi-comptes — Plan Pro"
      description="Gérez plusieurs comptes bancaires et suivez vos finances compte par compte.">

      <!-- Liste des comptes -->
      <div v-if="comptes.length === 0" class="empty-state card">
        <div style="font-size:48px">🏦</div>
        <h3>Aucun compte créé</h3>
        <p>Créez votre premier compte pour organiser vos finances</p>
        <button class="btn btn-primary" @click="openModal()">+ Créer un compte</button>
      </div>

      <div v-else class="comptes-grid">
        <div v-for="compte in comptesAvecStats" :key="compte.id"
          class="compte-card card"
          :class="{ active: comptesStore.compteActifId === compte.id }"
          :style="{ '--compte-color': compte.couleur }"
          @click="comptesStore.setCompteActif(compte.id === comptesStore.compteActifId ? null : compte.id)">

          <!-- Header -->
          <div class="compte-header">
            <div class="compte-icon">{{ getTypeInfo(compte.type).emoji }}</div>
            <div class="compte-actions" @click.stop>
              <button class="icon-btn" @click="openModal(compte)" title="Modifier">✏️</button>
              <button class="icon-btn danger" @click="confirmDelete(compte)" title="Supprimer">🗑️</button>
            </div>
          </div>

          <!-- Info -->
          <div class="compte-nom">{{ compte.nom }}</div>
          <div class="compte-type">{{ getTypeInfo(compte.type).label }}</div>

          <!-- Solde -->
          <div class="compte-solde" :style="{ color: compte.solde >= 0 ? 'var(--accent)' : 'var(--red)' }">
            {{ formatAmount(compte.solde) }}
          </div>

          <!-- Stats -->
          <div class="compte-stats">
            <div class="stat-item">
              <span class="stat-icon" style="color:var(--green)">↑</span>
              <span>{{ formatAmount(compte.revenus) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon" style="color:var(--red)">↓</span>
              <span>{{ formatAmount(compte.depenses) }}</span>
            </div>
          </div>

          <!-- Barre de couleur active -->
          <div class="compte-active-bar"></div>
        </div>

        <!-- Carte totaux consolidés -->
        <div class="compte-card card total-card">
          <div class="compte-header">
            <div class="compte-icon">🔀</div>
          </div>
          <div class="compte-nom">Tous les comptes</div>
          <div class="compte-type">Consolidé</div>
          <div class="compte-solde" :style="{ color: totalSolde >= 0 ? 'var(--accent)' : 'var(--red)' }">
            {{ formatAmount(totalSolde) }}
          </div>
          <div class="compte-stats">
            <div class="stat-item">
              <span class="stat-icon" style="color:var(--green)">↑</span>
              <span>{{ formatAmount(totalRevenus) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon" style="color:var(--red)">↓</span>
              <span>{{ formatAmount(totalDepenses) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions filtrées par compte actif -->
      <div v-if="comptesStore.compteActifId && txFiltrees.length > 0" class="card" style="margin-top:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-family:var(--font-display)">
            Transactions — {{ comptesStore.compteActif?.nom }}
          </h3>
          <div style="display:flex;gap:8px">
            <button class="period-btn" :class="{ active: filtreType === 'all' }" @click="filtreType = 'all'">Toutes</button>
            <button class="period-btn" :class="{ active: filtreType === 'revenu' }" @click="filtreType = 'revenu'">Revenus</button>
            <button class="period-btn" :class="{ active: filtreType === 'depense' }" @click="filtreType = 'depense'">Dépenses</button>
          </div>
        </div>
        <div class="tx-list">
          <div v-for="tx in txFiltrees.slice(0, 30)" :key="tx.id + tx.type" class="tx-row">
            <div class="tx-icon" :style="tx.type === 'revenu' ? 'background:rgba(0,229,160,0.1)' : 'background:rgba(255,107,107,0.1)'">
              {{ tx.emoji }}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ tx.description }}</div>
              <div style="font-size:12px;color:var(--text-muted)">{{ formatDate(tx.createdAt) }}</div>
            </div>
            <div :class="tx.type === 'revenu' ? 'amount-positive' : 'amount-negative'" style="font-weight:700;flex-shrink:0">
              {{ tx.type === 'revenu' ? '+' : '-' }}{{ formatAmount(tx.montant) }}
            </div>
          </div>
        </div>
      </div>

    </PremiumGate>

    <!-- ─── Modal créer/modifier compte ─────────────────────────── -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
          <h3 style="font-family:var(--font-display);margin-bottom:20px">
            {{ editingCompte ? 'Modifier le compte' : 'Nouveau compte' }}
          </h3>

          <div class="form-group">
            <label>Nom du compte</label>
            <input class="input" v-model="form.nom" placeholder="ex: Compte courant BNP" />
          </div>

          <div class="form-group">
            <label>Type</label>
            <div class="type-grid">
              <button v-for="t in COMPTE_TYPES" :key="t.id"
                class="type-chip" :class="{ active: form.type === t.id }"
                @click="form.type = t.id">
                {{ t.emoji }} {{ t.label }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Solde initial (€)</label>
            <input class="input" v-model.number="form.soldeInitial" type="number" placeholder="0" />
          </div>

          <div class="form-group">
            <label>Couleur</label>
            <div class="color-grid">
              <button v-for="c in COMPTE_COLORS" :key="c"
                class="color-chip" :class="{ active: form.couleur === c }"
                :style="{ background: c }"
                @click="form.couleur = c">
              </button>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-ghost" style="flex:1" @click="showModal = false">Annuler</button>
            <button class="btn btn-primary" style="flex:1" :disabled="!form.nom || saving" @click="saveCompte">
              {{ saving ? 'Enregistrement...' : editingCompte ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>

    <!-- ─── Modal confirmation suppression ──────────────────────── -->
    <Teleport to="body">
    <transition name="fade">
      <div v-if="deleteConfirm" class="modal-overlay" @click.self="deleteConfirm = null">
        <div class="modal-box">
          <div style="font-size:40px;text-align:center;margin-bottom:12px">🗑️</div>
          <h3 style="text-align:center;font-family:var(--font-display);margin-bottom:8px">Supprimer ce compte ?</h3>
          <p style="text-align:center;font-size:13px;color:var(--text-muted);margin-bottom:20px">
            Le compte "{{ deleteConfirm?.nom }}" sera supprimé. Les transactions resteront mais ne seront plus liées à ce compte.
          </p>
          <div style="display:flex;gap:10px">
            <button class="btn btn-ghost" style="flex:1" @click="deleteConfirm = null">Annuler</button>
            <button class="btn btn-danger" style="flex:1" @click="doDelete">Supprimer</button>
          </div>
        </div>
      </div>
    </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useComptesStore, COMPTE_TYPES, COMPTE_COLORS } from '@/stores/comptes'
import { useFinanceStore } from '@/stores/finance'
import PremiumGate from '@/components/PremiumGate.vue'

const comptesStore = useComptesStore()
const financeStore = useFinanceStore()

const comptes = computed(() => comptesStore.comptes)

// ─── Stats par compte ──────────────────────────────────────────────
const comptesAvecStats = computed(() => {
  return comptes.value.map(c => {
    const rev = financeStore.revenus.filter(r => r.compteId === c.id)
    const dep = financeStore.depenses.filter(d => d.compteId === c.id)
    const revenus   = rev.reduce((s, r) => s + r.montant, 0)
    const depenses  = dep.reduce((s, d) => s + d.montant, 0)
    return {
      ...c,
      revenus,
      depenses,
      solde: (c.soldeInitial || 0) + revenus - depenses
    }
  })
})

const totalRevenus  = computed(() => comptesAvecStats.value.reduce((s, c) => s + c.revenus, 0))
const totalDepenses = computed(() => comptesAvecStats.value.reduce((s, c) => s + c.depenses, 0))
const totalSolde    = computed(() => comptesAvecStats.value.reduce((s, c) => s + c.solde, 0))

// ─── Transactions filtrées par compte ─────────────────────────────
const filtreType = ref('all')
const txFiltrees = computed(() => {
  const id = comptesStore.compteActifId
  if (!id) return []
  const catEmoji = { 'Nourriture':'🍔','Transport':'🚗','Loyer':'🏠','Loisirs':'🎮','Abonnements':'📦','Santé':'🏥','Vêtements':'👕','Banque / Assurance':'🏦','Autres':'💳' }
  const revs = financeStore.revenus
    .filter(r => r.compteId === id)
    .map(r => ({ ...r, type: 'revenu', emoji: '💰' }))
  const deps = financeStore.depenses
    .filter(d => d.compteId === id)
    .map(d => ({ ...d, type: 'depense', emoji: catEmoji[d.categorie] || '💳' }))
  const all = [...revs, ...deps].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  if (filtreType.value === 'all') return all
  return all.filter(t => t.type === filtreType.value)
})

// ─── Helpers ──────────────────────────────────────────────────────
function getTypeInfo(typeId) { return comptesStore.getTypeInfo(typeId) }
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}
function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Modal ────────────────────────────────────────────────────────
const showModal    = ref(false)
const editingCompte = ref(null)
const saving       = ref(false)
const form = ref({ nom: '', type: 'courant', couleur: '#00e5a0', soldeInitial: 0 })

function openModal(compte = null) {
  editingCompte.value = compte
  form.value = compte
    ? { nom: compte.nom, type: compte.type, couleur: compte.couleur, soldeInitial: compte.soldeInitial || 0 }
    : { nom: '', type: 'courant', couleur: '#00e5a0', soldeInitial: 0 }
  showModal.value = true
}

async function saveCompte() {
  if (!form.value.nom) return
  saving.value = true
  try {
    if (editingCompte.value) {
      await comptesStore.modifierCompte(editingCompte.value.id, form.value)
    } else {
      await comptesStore.ajouterCompte(form.value)
    }
    showModal.value = false
  } finally {
    saving.value = false
  }
}

// ─── Suppression ──────────────────────────────────────────────────
const deleteConfirm = ref(null)
function confirmDelete(compte) { deleteConfirm.value = compte }
async function doDelete() {
  await comptesStore.supprimerCompte(deleteConfirm.value.id)
  deleteConfirm.value = null
}

// ─── Lifecycle ────────────────────────────────────────────────────
let unsub = null
onMounted(() => {
  unsub = comptesStore.ecouter_comptes()
  // Auto-sélectionne le compte courant par défaut (ou le premier compte)
  const stopWatch = watch(
    () => comptesStore.comptes,
    (comptes) => {
      if (comptes.length > 0 && !comptesStore.compteActifId) {
        const courant = comptes.find(c => c.type === 'courant') || comptes[0]
        comptesStore.setCompteActif(courant.id)
        stopWatch()
      }
    },
    { immediate: true }
  )
})
onUnmounted(() => { unsub && unsub() })
</script>

<style scoped>
.comptes-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:24px }

.compte-card {
  position:relative;cursor:pointer;padding:20px;
  border:1px solid var(--border);border-radius:var(--radius-xl);
  transition:all var(--transition);overflow:hidden;
}
.compte-card:hover { border-color:var(--compte-color, var(--border-accent));transform:translateY(-2px) }
.compte-card.active { border-color:var(--compte-color, var(--accent));background:rgba(0,229,160,0.04) }
.compte-active-bar {
  position:absolute;bottom:0;left:0;right:0;height:3px;
  background:var(--compte-color, var(--accent));
  transform:scaleX(0);transform-origin:left;transition:transform 0.3s ease;
}
.compte-card.active .compte-active-bar { transform:scaleX(1) }
.total-card { border-style:dashed;cursor:default }
.total-card:hover { transform:none }

.compte-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px }
.compte-icon   { font-size:28px }
.compte-actions { display:flex;gap:4px;opacity:0;transition:opacity var(--transition) }
.compte-card:hover .compte-actions { opacity:1 }
.icon-btn { background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;font-size:14px;transition:background var(--transition) }
.icon-btn:hover { background:var(--bg-hover) }
.icon-btn.danger:hover { background:rgba(255,107,107,0.15) }

.compte-nom   { font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:2px }
.compte-type  { font-size:12px;color:var(--text-muted);margin-bottom:12px }
.compte-solde { font-family:var(--font-display);font-size:1.6rem;font-weight:800;margin-bottom:12px }
.compte-stats { display:flex;gap:16px }
.stat-item    { display:flex;align-items:center;gap:4px;font-size:13px;font-weight:500 }
.stat-icon    { font-size:14px;font-weight:800 }

/* ── Modal ── */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000 }
.modal-box { background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:28px;max-width:460px;width:90%;max-height:90vh;overflow-y:auto }

.form-group { display:flex;flex-direction:column;gap:8px;margin-bottom:16px }
.form-group label { font-size:13px;font-weight:600;color:var(--text-secondary) }

.type-grid  { display:flex;flex-wrap:wrap;gap:8px }
.type-chip  { padding:6px 12px;border-radius:99px;border:1px solid var(--border);background:none;cursor:pointer;font-size:13px;font-family:var(--font-body);color:var(--text-secondary);transition:all var(--transition) }
.type-chip.active { background:var(--accent-dim);border-color:var(--border-accent);color:var(--accent);font-weight:600 }

.color-grid { display:flex;gap:8px;flex-wrap:wrap }
.color-chip { width:28px;height:28px;border-radius:50%;border:3px solid transparent;cursor:pointer;transition:all var(--transition) }
.color-chip.active { border-color:white;transform:scale(1.2) }

/* ── Transactions ── */
.tx-list { display:flex;flex-direction:column;gap:4px }
.tx-row  { display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:var(--radius);transition:background var(--transition) }
.tx-row:hover { background:var(--bg-elevated) }
.tx-icon { width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0 }

.period-btn { padding:5px 12px;border-radius:99px;border:1px solid var(--border);background:var(--bg-elevated);cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font-body);color:var(--text-secondary);transition:all var(--transition) }
.period-btn.active { background:var(--accent-dim);border-color:var(--border-accent);color:var(--accent) }

.btn-danger { background:rgba(255,107,107,0.12);color:var(--red);border:1px solid rgba(255,107,107,0.3) }
.btn-danger:hover { background:rgba(255,107,107,0.22) }

.empty-state { display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:60px 32px }
.empty-state h3 { font-family:var(--font-display);font-size:1.4rem }

@media (max-width:768px) { .comptes-grid { grid-template-columns:1fr } }
</style>