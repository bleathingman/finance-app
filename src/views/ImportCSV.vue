<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <div>
        <h1>Import bancaire</h1>
        <p>Importez vos relevés bancaires au format CSV</p>
      </div>
    </div>

    <PremiumGate feature="exportCsv" icon="🏦" title="Import bancaire — feature Premium"
      description="Importez vos relevés bancaires CSV directement depuis votre banque.">

      <!-- ─── Étape 1 : Upload ──────────────────────────────────────── -->
      <div v-if="step === 1">
        <!-- Limite selon plan -->
        <div class="plan-limit-banner card" style="margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">{{ subStore.isPro ? '🚀' : '💎' }}</span>
            <div>
              <div style="font-weight:700">
                {{ subStore.isPro ? 'Import illimité — Plan Pro' : 'Import jusqu\'à 2 ans — Plan Premium' }}
              </div>
              <div style="font-size:13px;color:var(--text-muted)">
                {{ subStore.isPro ? 'Importez tout l\'historique de votre banque sans limite' : 'Données des 24 derniers mois acceptées' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Banques compatibles -->
        <div class="card" style="margin-bottom:24px">
          <h3 style="font-family:var(--font-display);margin-bottom:12px">Banques compatibles</h3>
          <div class="banks-grid">
            <div v-for="b in banks" :key="b.name" class="bank-chip">
              <span>{{ b.emoji }}</span> {{ b.name }}
            </div>
          </div>
          <p style="font-size:12px;color:var(--text-muted);margin-top:12px">
            💡 Fonctionne avec n'importe quel CSV bancaire — mapping manuel disponible
          </p>
        </div>

        <!-- Drop zone -->
        <div class="drop-zone" :class="{ dragging: isDragging }"
          @dragover.prevent="isDragging = true" @dragleave="isDragging = false"
          @drop.prevent="onDrop" @click="$refs.fileInput.click()">
          <input ref="fileInput" type="file" accept=".csv,.txt" style="display:none" @change="onFileChange" />
          <div class="drop-icon">📂</div>
          <div class="drop-title">Déposez votre fichier CSV ici</div>
          <div class="drop-sub">ou cliquez pour parcourir</div>
          <div class="drop-formats">CSV, TXT — max 10 MB</div>
        </div>
      </div>

      <!-- ─── Étape 2 : Mapping colonnes ───────────────────────────── -->
      <div v-if="step === 2">
        <div class="card" style="margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
            <div>
              <h3 style="font-family:var(--font-display)">{{ fileName }}</h3>
              <p style="font-size:13px;margin-top:4px;color:var(--text-muted)">{{ rawRows.length }} lignes détectées</p>
            </div>
            <button class="btn btn-ghost" @click="step = 1">← Changer de fichier</button>
          </div>

          <!-- Séparateur + Encodage -->
          <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
            <div>
              <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">Séparateur</label>
              <div style="display:flex;gap:6px">
                <button v-for="sep in separators" :key="sep.value" class="btn btn-ghost"
                  :class="{ 'btn-primary': separator === sep.value }"
                  style="padding:6px 10px;font-size:12px"
                  @click="separator = sep.value; parseCSV()">{{ sep.label }}</button>
              </div>
            </div>
            <div>
              <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">Encodage</label>
              <select class="input" style="padding:6px 10px;font-size:12px" v-model="encoding" @change="reloadFile">
                <option value="utf-8">UTF-8</option>
                <option value="iso-8859-1">ISO-8859-1 — Crédit Agricole, CIC, LCL</option>
                <option value="windows-1252">Windows-1252 — BNP, Société Générale</option>
              </select>
            </div>
          </div>

          <!-- Mapping -->
          <div class="mapping-grid">
            <div class="mapping-item">
              <label>📅 Colonne Date <span style="color:var(--red)">*</span></label>
              <select class="input" v-model="mapping.date">
                <option value="">— Sélectionner —</option>
                <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            <div class="mapping-item">
              <label>📝 Colonne Description <span style="color:var(--red)">*</span></label>
              <select class="input" v-model="mapping.description">
                <option value="">— Sélectionner —</option>
                <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
            <div class="mapping-item">
              <label>💶 Colonne Montant <span style="color:var(--red)">*</span></label>
              <select class="input" v-model="mapping.montant">
                <option value="">— Sélectionner —</option>
                <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
              </select>
              <span style="font-size:11px;color:var(--text-muted)">Colonne avec montant unique (+/-)</span>
            </div>
            <div class="mapping-item">
              <label>🔴 Colonne Débit (optionnel)</label>
              <select class="input" v-model="mapping.debit">
                <option value="">— Pas de colonne débit séparée —</option>
                <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
              </select>
              <span style="font-size:11px;color:var(--text-muted)">Si débit et crédit sont dans des colonnes séparées</span>
            </div>
            <div class="mapping-item">
              <label>🟢 Colonne Crédit (optionnel)</label>
              <select class="input" v-model="mapping.credit">
                <option value="">— Pas de colonne crédit séparée —</option>
                <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </div>

          <button class="btn btn-primary" style="margin-top:20px"
            :disabled="!mapping.date || !mapping.description || (!mapping.montant && !mapping.debit)"
            @click="buildPreview(); step = 3">
            Continuer → Prévisualiser ({{ rawRows.length }} lignes)
          </button>
        </div>

        <!-- Aperçu brut -->
        <div class="card">
          <h3 style="font-family:var(--font-display);margin-bottom:16px">Aperçu du fichier (5 premières lignes)</h3>
          <div class="raw-table-wrap">
            <table class="raw-table">
              <thead><tr><th v-for="col in headers" :key="col">{{ col }}</th></tr></thead>
              <tbody>
                <tr v-for="(row, i) in rawRows.slice(0,5)" :key="i">
                  <td v-for="col in headers" :key="col">{{ row[col] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── Étape 3 : Preview & catégorisation ───────────────────── -->
      <div v-if="step === 3">
        <!-- Stats globales -->
        <div class="grid-4" style="margin-bottom:24px">
          <div class="card" style="border-color:var(--border-accent)">
            <div class="kpi-label">Total lignes</div>
            <div class="kpi-value">{{ previewRows.length }}</div>
            <div class="kpi-sub">{{ ignoredCount }} ignorées</div>
          </div>
          <div class="card">
            <div class="kpi-label">Dépenses</div>
            <div class="kpi-value" style="color:var(--red)">{{ depensesCount }}</div>
            <div class="kpi-sub">{{ formatAmount(totalDepenses) }}</div>
          </div>
          <div class="card">
            <div class="kpi-label">Revenus</div>
            <div class="kpi-value" style="color:var(--accent)">{{ revenusCount }}</div>
            <div class="kpi-sub">{{ formatAmount(totalRevenus) }}</div>
          </div>
          <div class="card">
            <div class="kpi-label">Période</div>
            <div class="kpi-value" style="font-size:1.1rem">{{ periodeLabel }}</div>
            <div class="kpi-sub">{{ moisCount }} mois</div>
          </div>
        </div>

        <!-- Avertissement limite plan -->
        <div v-if="rowsHorsLimite > 0" class="history-limit-banner" style="margin-bottom:16px">
          <span>⚠️</span>
          <span>
            <strong>{{ rowsHorsLimite }} transactions</strong> sont hors de ta limite
            ({{ subStore.isPro ? 'illimitée' : '24 mois' }}) et seront ignorées.
            <router-link v-if="!subStore.isPro" to="/pricing" style="color:var(--accent);font-weight:700">Passer Pro</router-link>
            pour importer sans limite.
          </span>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <h3 style="font-family:var(--font-display)">Prévisualisation</h3>
              <!-- Filtre par mois -->
              <select v-model="filterMonth" class="input" style="width:auto;padding:6px 10px;font-size:13px">
                <option value="">Tous les mois ({{ filteredRows.length }})</option>
                <option v-for="m in availableMonths" :key="m.value" :value="m.value">
                  {{ m.label }} ({{ m.count }})
                </option>
              </select>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" @click="step = 2">← Modifier le mapping</button>
              <button class="btn btn-primary" :disabled="importing || selectedRows.length === 0" @click="importData">
                <span v-if="importing">Import en cours... {{ importProgress }}/{{ selectedRows.length }}</span>
                <span v-else>✓ Importer {{ selectedRows.length }} transactions</span>
              </button>
            </div>
          </div>

          <!-- Sélection globale -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 12px;background:var(--bg-elevated);border-radius:var(--radius)">
            <input type="checkbox" :checked="allSelected" @change="toggleAll" style="width:16px;height:16px;accent-color:var(--accent)" />
            <span style="font-size:13px;color:var(--text-secondary)">
              Tout sélectionner / désélectionner
              <span style="color:var(--text-muted)">({{ filteredRows.length }} lignes affichées)</span>
            </span>
          </div>

          <!-- Filtres type -->
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            <button class="period-btn" :class="{ active: filterType === 'all' }" @click="filterType = 'all'">
              Toutes ({{ previewRows.length }})
            </button>
            <button class="period-btn" :class="{ active: filterType === 'depense' }" @click="filterType = 'depense'">
              Dépenses ({{ depensesCount }})
            </button>
            <button class="period-btn" :class="{ active: filterType === 'revenu' }" @click="filterType = 'revenu'">
              Revenus ({{ revenusCount }})
            </button>
            <button class="period-btn" :class="{ active: filterType === 'ignored' }" @click="filterType = 'ignored'" v-if="ignoredCount > 0">
              ⚠️ Hors limite ({{ ignoredCount }})
            </button>
          </div>

          <!-- Liste transactions -->
          <div class="import-list">
            <div v-for="(row, i) in filteredRows" :key="i" class="import-row"
              :class="{ selected: row.selected, 'out-of-range': row.outOfRange }">
              <input type="checkbox" v-model="row.selected" :disabled="row.outOfRange"
                style="width:16px;height:16px;accent-color:var(--accent);flex-shrink:0" />
              <div class="import-date">{{ formatDateDisplay(row.date) }}</div>
              <div class="import-desc">
                <input class="input import-desc-input" v-model="row.description" />
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0">
                <button class="type-btn" :class="{ active: row.type === 'depense' }" @click="row.type = 'depense'; row.selected = !row.outOfRange">Dépense</button>
                <button class="type-btn revenu" :class="{ active: row.type === 'revenu' }" @click="row.type = 'revenu'; row.selected = !row.outOfRange">Revenu</button>
              </div>
              <select class="input import-cat" v-model="row.categorie" @change="onCategorieChange(row, $event)">
                <option v-for="cat in (row.type === 'depense' ? categoriesDepense : categoriesRevenu)"
                  :key="cat.nom" :value="cat.nom">{{ cat.emoji }} {{ cat.nom }}</option>
              </select>
              <div class="import-amount" :class="row.type === 'depense' ? 'amount-negative' : 'amount-positive'">
                {{ row.type === 'depense' ? '-' : '+' }}{{ Math.abs(row.montant).toFixed(2) }}€
              </div>
            </div>
          </div>

          <div v-if="filteredRows.length === 0" style="text-align:center;padding:40px;color:var(--text-muted)">
            Aucune transaction pour ce filtre
          </div>

          <!-- Popup règle de catégorisation -->
          <transition name="slide-down">
            <div v-if="rulePopup.show" class="rule-popup">
              <div style="font-size:18px">🏷️</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px">Appliquer à toutes les transactions similaires ?</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:2px">
                  Tout ce qui contient <strong>"{{ rulePopup.keyword }}"</strong> → <strong>{{ rulePopup.categorie }}</strong>
                  <span style="color:var(--text-muted)"> ({{ rulePopup.matchCount }} transaction(s) dans l'import)</span>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-shrink:0">
                <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" @click="rulePopup.show = false">Ignorer</button>
                <button class="btn btn-primary" style="font-size:12px;padding:6px 12px" @click="applyRule">
                  ✓ Appliquer{{ rulePopup.firestoreCount ? ' + ' + rulePopup.firestoreCount + ' existantes' : '' }}
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- ─── Étape 4 : Succès ──────────────────────────────────────── -->
      <div v-if="step === 4" class="success-screen">
        <div class="success-icon">🎉</div>
        <h2>Import réussi !</h2>
        <p>{{ importedCount }} transactions importées avec succès</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap">
          <router-link to="/depenses" class="btn btn-primary">Voir les dépenses</router-link>
          <router-link to="/revenus" class="btn btn-ghost">Voir les revenus</router-link>
          <button class="btn btn-ghost" @click="reset">Nouvel import</button>
        </div>
      </div>

    </PremiumGate>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { addDoc, collection, Timestamp, getDocs, query, where, writeBatch, doc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import PremiumGate from '@/components/PremiumGate.vue'

const authStore = useAuthStore()
const subStore  = useSubscriptionStore()

// ─── State ────────────────────────────────────────────────────────
const step          = ref(1)
const isDragging    = ref(false)
const fileName      = ref('')
const rawContent    = ref('')
const rawRows       = ref([])
const headers       = ref([])
const separator     = ref(';')
const encoding      = ref('utf-8')
const importing     = ref(false)
const importProgress = ref(0)
const importedCount = ref(0)
const filterType    = ref('all')
const filterMonth   = ref('')
const fileRef       = ref(null)

// ─── Règles de catégorisation ─────────────────────────────────────
const savedRules    = ref([])  // règles mémorisées depuis Firestore
const rulePopup     = ref({ show: false, keyword: '', categorie: '', type: '', matchCount: 0, firestoreCount: 0 })

const mapping = ref({ date: '', description: '', montant: '', debit: '', credit: '' })
const previewRows = ref([])

const separators = [
  { label: '; (FR)', value: ';' },
  { label: ', (EN)', value: ',' },
  { label: '|',      value: '|' },
  { label: 'Tab',    value: '\t' }
]

const banks = [
  { name: 'BNP Paribas',       emoji: '🏦' },
  { name: 'Crédit Agricole',   emoji: '🌿' },
  { name: 'Société Générale',  emoji: '🔴' },
  { name: 'La Banque Postale', emoji: '📮' },
  { name: 'Boursorama',        emoji: '💙' },
  { name: 'Revolut',           emoji: '🌍' },
  { name: 'N26',               emoji: '⚫' },
  { name: 'LCL',               emoji: '🔵' },
  { name: 'CIC',               emoji: '🟦' },
  { name: 'Caisse d\'Épargne', emoji: '🐿️' }
]

const categoriesDepense = [
  { nom: 'Nourriture',         emoji: '🍔' },
  { nom: 'Transport',          emoji: '🚗' },
  { nom: 'Loyer',              emoji: '🏠' },
  { nom: 'Loisirs',            emoji: '🎮' },
  { nom: 'Abonnements',        emoji: '📦' },
  { nom: 'Santé',              emoji: '🏥' },
  { nom: 'Vêtements',          emoji: '👕' },
  { nom: 'Banque / Assurance', emoji: '🏦' },
  { nom: 'Autres',             emoji: '💳' }
]

const categoriesRevenu = [
  { nom: 'Salaire',            emoji: '💼' },
  { nom: 'Freelance',          emoji: '💻' },
  { nom: 'Remboursement',      emoji: '↩️' },
  { nom: 'Banque / Assurance', emoji: '🏦' },
  { nom: 'Autres',             emoji: '💰' }
]

// ─── Limite selon plan ────────────────────────────────────────────
function isOutOfRange(date) {
  if (subStore.isPro) return false // Pro = illimité
  // Premium = 2 ans max
  const now = new Date()
  const limit = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
  return date < limit
}

// ─── Computed ─────────────────────────────────────────────────────
const depensesCount  = computed(() => previewRows.value.filter(r => r.type === 'depense' && !r.outOfRange).length)
const revenusCount   = computed(() => previewRows.value.filter(r => r.type === 'revenu' && !r.outOfRange).length)
const ignoredCount   = computed(() => previewRows.value.filter(r => r.outOfRange).length)
const selectedRows   = computed(() => previewRows.value.filter(r => r.selected && !r.outOfRange))
const totalDepenses  = computed(() => previewRows.value.filter(r => r.type === 'depense' && !r.outOfRange).reduce((s, r) => s + Math.abs(r.montant), 0))
const totalRevenus   = computed(() => previewRows.value.filter(r => r.type === 'revenu' && !r.outOfRange).reduce((s, r) => s + r.montant, 0))
const rowsHorsLimite = computed(() => ignoredCount.value)
const allSelected    = computed(() => filteredRows.value.filter(r => !r.outOfRange).every(r => r.selected))

const availableMonths = computed(() => {
  const map = {}
  previewRows.value.forEach(r => {
    if (r.outOfRange) return
    const d = r.date
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!map[key]) map[key] = { value: key, label: label.charAt(0).toUpperCase() + label.slice(1), count: 0 }
    map[key].count++
  })
  return Object.values(map).sort((a, b) => b.value.localeCompare(a.value))
})

const moisCount = computed(() => availableMonths.value.length)

const periodeLabel = computed(() => {
  const rows = previewRows.value.filter(r => !r.outOfRange)
  if (!rows.length) return '—'
  const dates = rows.map(r => r.date).sort((a, b) => a - b)
  const first = dates[0].toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  const last  = dates[dates.length-1].toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return first === last ? first : `${first} → ${last}`
})

const filteredRows = computed(() => {
  return previewRows.value.filter(r => {
    if (filterType.value === 'ignored') return r.outOfRange
    if (filterType.value !== 'all' && r.type !== filterType.value) return false
    if (r.outOfRange && filterType.value !== 'ignored') return false
    if (filterMonth.value) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth()+1).padStart(2,'0')}`
      if (key !== filterMonth.value) return false
    }
    return true
  })
})

// ─── Helpers ──────────────────────────────────────────────────────
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}
function formatDateDisplay(date) {
  if (!date) return ''
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── File handling ─────────────────────────────────────────────────
function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) loadFile(file)
}
function onFileChange(e) {
  const file = e.target.files[0]
  if (file) loadFile(file)
}
function loadFile(file) {
  fileRef.value = file
  fileName.value = file.name
  // Sniffe l'encodage : si caractères corrompus en UTF-8 → ISO-8859-1 (Crédit Agricole, CIC...)
  const sniff = new FileReader()
  sniff.onload = (e) => {
    const s = e.target.result.slice(0, 600)
    if (/�/.test(s) || /[ÃÂ][©€¨²°àèéêù]/.test(s)) encoding.value = 'iso-8859-1'
    const reader = new FileReader()
    reader.onload = (e2) => { rawContent.value = e2.target.result; parseCSV(); step.value = 2 }
    reader.readAsText(file, encoding.value)
  }
  sniff.readAsText(file, 'utf-8')
}
function reloadFile() {
  if (!fileRef.value) return
  const reader = new FileReader()
  reader.onload = (e) => {
    rawContent.value = e.target.result
    parseCSV()
  }
  reader.readAsText(fileRef.value, encoding.value)
}

// ─── CSV Parsing ───────────────────────────────────────────────────
function parseCSV() {
  const raw = rawContent.value
  if (!raw.trim()) return

  // ── Étape 1 : parse le CSV en gérant les champs multi-lignes ────
  // (ex: Crédit Agricole met les libellés sur 3 lignes dans des guillemets)
  const records = []
  let i = 0, currentFields = [], currentField = '', inQuote = false

  // Auto-détecte séparateur sur les 500 premiers caractères
  const sample = raw.slice(0, 500)
  const sepCounts = {
    ';':  (sample.match(/;/g)  || []).length,
    ',':  (sample.match(/,/g)  || []).length,
    '\t': (sample.match(/\t/g) || []).length,
    '|':  (sample.match(/\|/g) || []).length
  }
  const sep = Object.entries(sepCounts).sort((a,b) => b[1]-a[1])[0][0]
  separator.value = sep

  while (i < raw.length) {
    const ch = raw[i]
    if (ch === '"') {
      if (inQuote && raw[i+1] === '"') { currentField += '"'; i += 2; continue }
      inQuote = !inQuote; i++
    } else if (ch === sep && !inQuote) {
      currentFields.push(currentField.trim()); currentField = ''; i++
    } else if ((ch === '\r' || ch === '\n') && !inQuote) {
      if (ch === '\r' && raw[i+1] === '\n') i++
      currentFields.push(currentField.trim()); currentField = ''
      if (currentFields.some(f => f)) records.push(currentFields)
      currentFields = []; i++
    } else {
      // Remplace les sauts de ligne DANS un champ guillemets par un espace
      if ((ch === '\r' || ch === '\n') && inQuote) { currentField += ' '; i++; continue }
      currentField += ch; i++
    }
  }
  if (currentFields.some(f => f)) records.push([...currentFields, currentField].map(f => f.trim()))

  if (!records.length) return

  // ── Étape 2 : trouve la ligne d'en-tête ─────────────────────────
  // C'est la ligne qui a le plus de colonnes (skip les métadonnées du haut)
  let headerIdx = 0
  let maxCols = 0
  records.forEach((rec, idx) => {
    if (rec.length > maxCols) { maxCols = rec.length; headerIdx = idx }
  })

  const cols = records[headerIdx].map(c => c.replace(/^"+|"+$/g, '').trim())
  headers.value = cols

  // ── Étape 3 : convertit en objets ───────────────────────────────
  rawRows.value = records.slice(headerIdx + 1)
    .filter(rec => rec.length >= Math.max(2, maxCols - 2)) // tolère colonnes vides en fin
    .map(rec => {
      const row = {}
      cols.forEach((col, j) => {
        row[col] = (rec[j] || '').replace(/^"+|"+$/g, '').replace(/\s+/g, ' ').trim()
      })
      return row
    })
    .filter(r => Object.values(r).some(v => v))

  autoMap(cols)
}

function splitLine(line, sep) {
  const result = []
  let current = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === sep && !inQuote) { result.push(current.trim()); current = '' }
    else { current += ch }
  }
  result.push(current.trim())
  return result
}

function autoMap(cols) {
  const lower = cols.map(c => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))

  // Date — première colonne avec des dates dans les valeurs
  const dateValIdx = cols.findIndex(col => {
    const vals = rawRows.value.slice(0, 5).map(r => r[col] || '')
    return vals.some(v => /^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/.test(v.trim()))
  })
  if (dateValIdx >= 0) mapping.value.date = cols[dateValIdx]
  else {
    const idx = lower.findIndex(c => c.includes('date') || c.includes('dat'))
    if (idx >= 0) mapping.value.date = cols[idx]
  }

  // Description — libellé simplifié en priorité
  const descPriority = ['libelle simplifie', 'libelle simplifi', 'libelle', 'description', 'label', 'operation', 'motif']
  for (const keyword of descPriority) {
    const idx = lower.findIndex(c => c.includes(keyword))
    if (idx >= 0) { mapping.value.description = cols[idx]; break }
  }

  // Débit et Crédit séparés
  const debitIdx  = lower.findIndex(c => c === 'debit' || c.includes('debit'))
  const creditIdx = lower.findIndex(c => c === 'credit' || c.includes('credit'))
  if (debitIdx >= 0)  mapping.value.debit  = cols[debitIdx]
  if (creditIdx >= 0) mapping.value.credit = cols[creditIdx]

  // Montant unique — seulement si pas de débit/crédit séparés
  if (!mapping.value.debit && !mapping.value.credit) {
    const montantValIdx = cols.findIndex(col => {
      const vals = rawRows.value.slice(0, 10).map(r => r[col] || '')
      return vals.filter(v => /^[+\-]?\s*\d+[,\.]\d{1,2}$/.test(v.trim())).length >= 2
    })
    if (montantValIdx >= 0) mapping.value.montant = cols[montantValIdx]
    else {
      const idx = lower.findIndex(c => c.includes('montant') || c.includes('amount'))
      if (idx >= 0) mapping.value.montant = cols[idx]
    }
  }
}

// ─── Build Preview ─────────────────────────────────────────────────
function buildPreview() {
  previewRows.value = rawRows.value.map(row => {
    const dateRaw = row[mapping.value.date] || ''
    const descRaw = row[mapping.value.description] || ''

    // Parse montant — gère débit/crédit séparés ou colonne unique
    let montant = 0
    if (mapping.value.debit || mapping.value.credit) {
      const debitRaw  = mapping.value.debit   ? row[mapping.value.debit]   || '' : ''
      const creditRaw = mapping.value.credit  ? row[mapping.value.credit]  || '' : ''
      const debitVal  = parseMontant(debitRaw)
      const creditVal = parseMontant(creditRaw)
      if (debitVal !== 0) montant = -Math.abs(debitVal)
      else if (creditVal !== 0) montant = Math.abs(creditVal)
      else return null
    } else {
      const raw = row[mapping.value.montant] || ''
      montant = parseMontant(raw)
      if (montant === 0 && raw.trim() === '') return null
    }

    if (isNaN(montant)) return null

    const date = parseDate(dateRaw)
    if (!date) return null

    const outOfRange = isOutOfRange(date)
    const type = montant < 0 ? 'depense' : 'revenu'
    const categorie = autoCategorize(descRaw, type)

    return {
      date,
      description: descRaw,
      montant,
      type,
      categorie,
      selected: !outOfRange,
      outOfRange
    }
  }).filter(Boolean)
}

function parseMontant(str) {
  if (!str || !str.trim()) return 0
  let s = str.trim().replace(/[\s\u00a0]/g, '')
  // Format européen : 1.234,56 ou 1 234,56
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    // Format anglais : 1,234.56
    s = s.replace(/,/g, '')
  }
  s = s.replace(/[^0-9.\-\+]/g, '')
  return parseFloat(s) || 0
}

function parseDate(str) {
  if (!str) return null
  str = str.trim()
  let m
  // DD/MM/YYYY ou DD-MM-YYYY
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (m) return new Date(+m[3], +m[2]-1, +m[1])
  // YYYY-MM-DD
  m = str.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (m) return new Date(+m[1], +m[2]-1, +m[3])
  // DD/MM/YY
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (m) return new Date(2000 + +m[3], +m[2]-1, +m[1])
  // MM/DD/YYYY
  m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) {
    const d1 = new Date(+m[3], +m[1]-1, +m[2])
    const d2 = new Date(+m[3], +m[2]-1, +m[1])
    return +m[2] > 12 ? d2 : d1 // si le 2e nombre > 12 c'est un jour
  }
  return null
}

// ─── Système de règles ────────────────────────────────────────────
async function loadSavedRules() {
  const uid = authStore.user?.uid
  if (!uid) return
  try {
    const snap = await getDocs(collection(db, 'categorie_rules', uid, 'rules'))
    savedRules.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch(e) { console.warn('Erreur chargement règles:', e) }
}

function applySavedRules(desc, type) {
  // Cherche une règle mémorisée qui match
  const d = desc.toLowerCase()
  for (const rule of savedRules.value) {
    if (rule.type && rule.type !== type) continue
    if (d.includes(rule.keyword.toLowerCase())) return rule.categorie
  }
  return null
}

function extractKeyword(desc) {
  // Extrait le mot-clé le plus significatif de la description
  // Supprime les mots génériques bancaires
  const cleaned = desc
    .replace(/paiement par carte/gi, '')
    .replace(/virement/gi, '')
    .replace(/x\d{4}/gi, '')
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  // Prend les 2 premiers mots significatifs
  const words = cleaned.split(/\s+/).filter(w => w.length > 2)
  return words.slice(0, 2).join(' ').toUpperCase() || desc.slice(0, 15).toUpperCase()
}

async function onCategorieChange(row, event) {
  const newCat = event.target.value
  const keyword = extractKeyword(row.description)
  if (!keyword) return

  // Compte les lignes similaires dans l'import
  const matchInImport = previewRows.value.filter(r =>
    r !== row &&
    !r.outOfRange &&
    r.description.toLowerCase().includes(keyword.toLowerCase())
  )

  // Compte les transactions existantes dans Firestore
  let firestoreCount = 0
  try {
    const uid = authStore.user?.uid
    if (uid) {
      const collName = row.type === 'depense' ? 'depenses' : 'revenus'
      const snap = await getDocs(query(
        collection(db, collName),
        where('uid', '==', uid),
        where('categorie', '==', 'Autres')
      ))
      firestoreCount = snap.docs.filter(d =>
        (d.data().description || '').toLowerCase().includes(keyword.toLowerCase())
      ).length
    }
  } catch(e) {}

  if (matchInImport.length === 0 && firestoreCount === 0) return

  rulePopup.value = {
    show: true,
    keyword,
    categorie: newCat,
    type: row.type,
    matchCount: matchInImport.length,
    firestoreCount,
    row
  }
}

async function applyRule() {
  const { keyword, categorie, type, row } = rulePopup.value
  const uid = authStore.user?.uid
  rulePopup.value.show = false

  // 1. Applique dans l'import en cours
  previewRows.value.forEach(r => {
    if (r !== row && !r.outOfRange && r.description.toLowerCase().includes(keyword.toLowerCase())) {
      r.categorie = categorie
    }
  })

  // 2. Met à jour Firestore — batch write
  if (uid) {
    try {
      const collName = type === 'depense' ? 'depenses' : 'revenus'
      const snap = await getDocs(query(collection(db, collName), where('uid', '==', uid)))
      const toUpdate = snap.docs.filter(d =>
        (d.data().description || '').toLowerCase().includes(keyword.toLowerCase())
      )
      if (toUpdate.length > 0) {
        const batch = writeBatch(db)
        toUpdate.forEach(d => batch.update(d.ref, { categorie }))
        await batch.commit()
      }
    } catch(e) { console.error('Erreur batch update:', e) }

    // 3. Sauvegarde la règle
    try {
      const ruleRef = doc(collection(db, 'categorie_rules', uid, 'rules'))
      await setDoc(ruleRef, { keyword, categorie, type, createdAt: new Date() })
      savedRules.value.push({ keyword, categorie, type })
    } catch(e) { console.error('Erreur sauvegarde règle:', e) }
  }
}

function autoCategorize(desc, type) {
  // D'abord les règles mémorisées
  const saved = applySavedRules(desc, type)
  if (saved) return saved
  const d = desc.toLowerCase()
  if (type === 'revenu') {
    if (/salaire|paie|virement.*employeur|employeur/i.test(d)) return 'Salaire'
    if (/remboursement|rembours|cpam|secu/i.test(d)) return 'Remboursement'
    if (/caf|allocation|aide/i.test(d)) return 'Remboursement'
    return 'Autres'
  }
  if (/loyer|logement|habitation/i.test(d)) return 'Loyer'
  if (/carrefour|leclerc|lidl|aldi|casino|super|hyper|monop|market|epicerie|resto|restaurant|mcdonald|burger|pizza|sushi|kebab|aquacafe|domino's|ubereat|deliveroo|alimentat/i.test(d)) return 'Nourriture'
  if (/sncf|ratp|train|metro|taxi|uber|blablacar|parking|essence|carburant|station|autoroute|peage|semitan/i.test(d)) return 'Transport'
  if (/netflix|spotify|amazon|disney|prime|apple|google|microsoft|abonne/i.test(d)) return 'Abonnements'
  if (/pharmacie|medecin|docteur|hopital|mutuelle|sante|secu/i.test(d)) return 'Santé'
  if (/zara|h&m|kiabi|decathlon|sport|vetement|habit/i.test(d)) return 'Vêtements'
  if (/cinema|theatre|concert|jeu|loisir|voyage|hotel/i.test(d)) return 'Loisirs'
  if (/banque|assurance|credit|pret|frais|cotisation|commission|agios/i.test(d)) return 'Banque / Assurance'
  return 'Autres'
}

function toggleAll() {
  const newVal = !allSelected.value
  filteredRows.value.forEach(r => { if (!r.outOfRange) r.selected = newVal })
}

// ─── Import ────────────────────────────────────────────────────────
async function importData() {
  importing.value = true
  importProgress.value = 0
  const uid  = authStore.user?.uid
  if (!uid) return

  const rows = selectedRows.value
  let count  = 0

  for (const row of rows) {
    const ts   = Timestamp.fromDate(new Date(row.date.getFullYear(), row.date.getMonth(), row.date.getDate(), 12, 0, 0))
    const data = {
      uid,
      montant:     Math.abs(row.montant),
      description: row.description,
      categorie:   row.categorie,
      createdAt:   ts,
      source:      'import_csv',
      recurrent:   false
    }
    try {
      const collName = row.type === 'depense' ? 'depenses' : 'revenus'
      await addDoc(collection(db, collName), data)
      count++
    } catch (e) {
      console.error('Erreur import ligne:', e)
    }
    importProgress.value = count
  }

  importedCount.value = count
  importing.value = false
  step.value = 4
}

function reset() {
  step.value = 1
  rawContent.value = ''
  rawRows.value = []
  headers.value = []
  previewRows.value = []
  mapping.value = { date: '', description: '', montant: '', debit: '', credit: '' }
  importedCount.value = 0
  filterType.value = 'all'
  filterMonth.value = ''
}

onMounted(() => { loadSavedRules() })
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.plan-limit-banner { padding:16px 20px }

.banks-grid { display:flex;flex-wrap:wrap;gap:8px }
.bank-chip  { display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:99px;font-size:13px }

.drop-zone { border:2px dashed var(--border-accent);border-radius:var(--radius-xl);padding:60px 32px;text-align:center;cursor:pointer;transition:all var(--transition);background:var(--accent-dim) }
.drop-zone:hover, .drop-zone.dragging { background:rgba(0,229,160,0.12);border-color:var(--accent);transform:scale(1.01) }
.drop-icon  { font-size:48px;margin-bottom:12px }
.drop-title { font-size:18px;font-weight:700;margin-bottom:6px }
.drop-sub   { font-size:14px;color:var(--text-muted) }
.drop-formats { font-size:12px;color:var(--text-muted);margin-top:8px }

.mapping-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:16px }
.mapping-item { display:flex;flex-direction:column;gap:6px }
.mapping-item label { font-size:13px;font-weight:600 }

.raw-table-wrap { overflow-x:auto }
.raw-table { width:100%;border-collapse:collapse;font-size:12px }
.raw-table th { padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border);text-align:left;white-space:nowrap }
.raw-table td { padding:6px 12px;border:1px solid var(--border);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }

.import-list { display:flex;flex-direction:column;gap:6px;max-height:600px;overflow-y:auto }
.import-row {
  display:grid;
  grid-template-columns:20px 95px 1fr 155px 170px 90px;
  align-items:center;gap:8px;padding:8px 12px;
  background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);
  transition:all var(--transition);
}
.import-row.selected { border-color:var(--border-accent) }
.import-row.out-of-range { opacity:0.35;background:rgba(255,107,107,0.05);border-color:rgba(255,107,107,0.2) }
.import-date { font-size:11px;color:var(--text-muted);white-space:nowrap }
.import-desc-input { padding:4px 8px;font-size:12px }
.import-cat  { padding:4px 8px;font-size:11px }
.import-amount { font-size:13px;font-weight:700;text-align:right;white-space:nowrap }

.type-btn { padding:3px 8px;border-radius:6px;border:1px solid var(--border);background:none;cursor:pointer;font-size:11px;font-weight:600;font-family:var(--font-body);color:var(--text-muted);transition:all var(--transition) }
.type-btn.active { background:rgba(255,107,107,0.15);border-color:var(--red);color:var(--red) }
.type-btn.revenu.active { background:rgba(0,229,160,0.15);border-color:var(--green);color:var(--green) }

.period-btn { padding:6px 14px;border-radius:99px;border:1px solid var(--border);background:var(--bg-elevated);cursor:pointer;font-size:12px;font-weight:600;font-family:var(--font-body);color:var(--text-secondary);transition:all var(--transition) }
.period-btn:hover { border-color:var(--border-accent) }
.period-btn.active { background:var(--accent-dim);border-color:var(--border-accent);color:var(--accent) }

.success-screen { display:flex;flex-direction:column;align-items:center;text-align:center;padding:80px 32px;gap:12px }
.success-icon { font-size:64px }
.success-screen h2 { font-family:var(--font-display);font-size:2rem }

.rule-popup {
  display:flex;align-items:center;gap:12px;
  padding:14px 16px;margin-top:12px;
  background:var(--bg-elevated);
  border:1px solid var(--border-accent);
  border-radius:var(--radius);
  border-left:3px solid var(--accent);
}

@media (max-width:768px) {
  .mapping-grid { grid-template-columns:1fr }
  .import-row { grid-template-columns:20px 1fr 80px }
  .import-date, .import-cat, .type-btn { display:none }
  .rule-popup { flex-direction:column;align-items:flex-start }
}
</style>