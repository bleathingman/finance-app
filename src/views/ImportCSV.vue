<template>
  <div class="animate-fade-in">

    <div class="page-header">
      <div>
        <h1>Import bancaire</h1>
        <p>Importez vos relevés bancaires au format CSV</p>
      </div>
    </div>

    <!-- Gate Premium -->
    <PremiumGate
      feature="exportCsv"
      icon="🏦"
      title="Import bancaire — feature Premium"
      description="Importez vos relevés bancaires CSV directement depuis votre banque. Disponible avec Premium."
    >

    <!-- Étape 1 : Upload -->
    <div v-if="step === 1">
      <div class="banks-info card" style="margin-bottom:24px">
        <h3 style="font-family:var(--font-display);margin-bottom:12px">Banques compatibles</h3>
        <div class="banks-grid">
          <div v-for="b in banks" :key="b.name" class="bank-chip">
            <span>{{ b.emoji }}</span> {{ b.name }}
          </div>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px">
          💡 Si votre banque n'est pas listée, utilisez le mapping manuel — ça fonctionne avec n'importe quel CSV.
        </p>
      </div>

      <!-- Drop zone -->
      <div
        class="drop-zone"
        :class="{ dragging: isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        @click="$refs.fileInput.click()"
      >
        <input ref="fileInput" type="file" accept=".csv,.txt" style="display:none" @change="onFileChange" />
        <div class="drop-icon">📂</div>
        <div class="drop-title">Déposez votre fichier CSV ici</div>
        <div class="drop-sub">ou cliquez pour parcourir</div>
        <div class="drop-formats">CSV, TXT — max 10 MB</div>
      </div>
    </div>

    <!-- Étape 2 : Mapping colonnes -->
    <div v-if="step === 2">
      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="font-family:var(--font-display)">{{ fileName }}</h3>
            <p style="font-size:13px;margin-top:4px">{{ rawRows.length }} lignes détectées — Vérifiez le mapping des colonnes</p>
          </div>
          <button class="btn btn-ghost" @click="step = 1">← Changer de fichier</button>
        </div>

        <!-- Séparateur -->
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">Séparateur</label>
            <div style="display:flex;gap:8px">
              <button v-for="sep in separators" :key="sep.value"
                class="btn btn-ghost" :class="{ 'btn-primary': separator === sep.value }"
                style="padding:6px 12px;font-size:12px"
                @click="separator = sep.value; parseCSV()">
                {{ sep.label }}
              </button>
            </div>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">Encodage</label>
            <select class="input" style="padding:6px 12px;font-size:12px" v-model="encoding" @change="reloadFile">
              <option value="utf-8">UTF-8</option>
              <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
          </div>
        </div>

        <!-- Mapping -->
        <div class="mapping-grid">
          <div class="mapping-item">
            <label>📅 Colonne Date <span style="color:var(--red)">*</span></label>
            <select class="input" v-model="mapping.date" @change="previewRows">
              <option value="">— Sélectionner —</option>
              <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="mapping-item">
            <label>💶 Colonne Montant <span style="color:var(--red)">*</span></label>
            <select class="input" v-model="mapping.montant" @change="previewRows">
              <option value="">— Sélectionner —</option>
              <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="mapping-item">
            <label>📝 Colonne Description <span style="color:var(--red)">*</span></label>
            <select class="input" v-model="mapping.description" @change="previewRows">
              <option value="">— Sélectionner —</option>
              <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>
          <div class="mapping-item">
            <label>🏦 Colonne Débit (optionnel)</label>
            <select class="input" v-model="mapping.debit" @change="previewRows">
              <option value="">— Pas de colonne débit séparée —</option>
              <option v-for="col in headers" :key="col" :value="col">{{ col }}</option>
            </select>
            <span style="font-size:11px;color:var(--text-muted)">Si débit et crédit sont dans des colonnes séparées</span>
          </div>
        </div>

        <button
          class="btn btn-primary" style="margin-top:20px"
          :disabled="!mapping.date || !mapping.montant || !mapping.description"
          @click="step = 3; buildPreview()">
          Continuer → Prévisualiser
        </button>
      </div>

      <!-- Aperçu brut -->
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:16px">Aperçu du fichier</h3>
        <div class="raw-table-wrap">
          <table class="raw-table">
            <thead>
              <tr>
                <th v-for="col in headers" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rawRows.slice(0,5)" :key="i">
                <td v-for="col in headers" :key="col">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Étape 3 : Preview & catégorisation -->
    <div v-if="step === 3">
      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div>
            <h3 style="font-family:var(--font-display)">Prévisualisation</h3>
            <p style="font-size:13px;margin-top:4px">
              <span class="amount-positive">{{ depensesCount }} dépenses</span> ·
              <span class="amount-positive">{{ revenusCount }} revenus</span> ·
              <span v-if="ignoredCount" style="color:var(--text-muted)">{{ ignoredCount }} ignorées</span>
            </p>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost" @click="step = 2">← Modifier le mapping</button>
            <button class="btn btn-primary" :disabled="importing || selectedRows.length === 0" @click="importData">
              <span v-if="importing">Import en cours...</span>
              <span v-else>✓ Importer {{ selectedRows.length }} transactions</span>
            </button>
          </div>
        </div>

        <!-- Filtres -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          <button class="period-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">Toutes ({{ previewRows.length }})</button>
          <button class="period-btn" :class="{ active: filter === 'depense' }" @click="filter = 'depense'">Dépenses ({{ depensesCount }})</button>
          <button class="period-btn" :class="{ active: filter === 'revenu' }" @click="filter = 'revenu'">Revenus ({{ revenusCount }})</button>
        </div>

        <!-- Sélection globale -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:10px 12px;background:var(--bg-elevated);border-radius:var(--radius)">
          <input type="checkbox" :checked="allSelected" @change="toggleAll" style="width:16px;height:16px;accent-color:var(--accent)" />
          <span style="font-size:13px;color:var(--text-secondary)">Tout sélectionner / désélectionner</span>
        </div>

        <!-- Liste transactions -->
        <div class="import-list">
          <div
            v-for="(row, i) in filteredRows" :key="i"
            class="import-row"
            :class="{ selected: row.selected, ignored: row.ignore }"
          >
            <input type="checkbox" v-model="row.selected" :disabled="row.ignore"
              style="width:16px;height:16px;accent-color:var(--accent);flex-shrink:0" />

            <div class="import-date">{{ formatDateDisplay(row.date) }}</div>

            <div class="import-desc">
              <input class="input import-desc-input" v-model="row.description" />
            </div>

            <!-- Type -->
            <div style="display:flex;gap:6px">
              <button class="type-btn" :class="{ active: row.type === 'depense' }" @click="row.type = 'depense'">
                Dépense
              </button>
              <button class="type-btn revenu" :class="{ active: row.type === 'revenu' }" @click="row.type = 'revenu'">
                Revenu
              </button>
            </div>

            <!-- Catégorie -->
            <select class="input import-cat" v-model="row.categorie">
              <option v-for="cat in (row.type === 'depense' ? categoriesDepense : categoriesRevenu)"
                :key="cat.nom" :value="cat.nom">
                {{ cat.emoji }} {{ cat.nom }}
              </option>
            </select>

            <div class="import-amount" :class="row.type === 'depense' ? 'amount-negative' : 'amount-positive'">
              {{ row.type === 'depense' ? '-' : '+' }}{{ Math.abs(row.montant).toFixed(2) }}€
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Étape 4 : Succès -->
    <div v-if="step === 4" class="success-screen">
      <div class="success-icon">🎉</div>
      <h2>Import réussi !</h2>
      <p>{{ importedCount }} transactions importées avec succès</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:24px">
        <router-link to="/depenses" class="btn btn-primary">Voir les dépenses</router-link>
        <button class="btn btn-ghost" @click="reset">Nouvel import</button>
      </div>
    </div>

    </PremiumGate>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import PremiumGate from '@/components/PremiumGate.vue'

const financeStore = useFinanceStore()
const authStore    = useAuthStore()

// ─── State ────────────────────────────────────────────────────────
const step        = ref(1)
const isDragging  = ref(false)
const fileName    = ref('')
const rawContent  = ref('')
const rawRows     = ref([])
const headers     = ref([])
const separator   = ref(';')
const encoding    = ref('utf-8')
const importing   = ref(false)
const importedCount = ref(0)
const filter      = ref('all')
const fileRef     = ref(null)

const mapping = ref({ date: '', montant: '', description: '', debit: '' })
const previewRows = ref([])

const separators = [
  { label: '; (Français)', value: ';' },
  { label: ', (Anglais)', value: ',' },
  { label: '| (Pipe)',    value: '|' },
  { label: 'Tab',         value: '\t' }
]

const banks = [
  { name: 'BNP Paribas',    emoji: '🏦' },
  { name: 'Crédit Agricole', emoji: '🌿' },
  { name: 'Société Générale', emoji: '🔴' },
  { name: 'La Banque Postale', emoji: '📮' },
  { name: 'Boursorama',     emoji: '💙' },
  { name: 'Revolut',        emoji: '🌍' },
  { name: 'N26',            emoji: '⚫' },
  { name: 'LCL',            emoji: '🔵' },
  { name: 'CIC',            emoji: '🟦' },
  { name: 'Caisse d\'Épargne', emoji: '🐿️' }
]

const categoriesDepense = [
  { nom: 'Nourriture',  emoji: '🍔' },
  { nom: 'Transport',   emoji: '🚗' },
  { nom: 'Loyer',       emoji: '🏠' },
  { nom: 'Loisirs',     emoji: '🎮' },
  { nom: 'Abonnements', emoji: '📦' },
  { nom: 'Santé',       emoji: '🏥' },
  { nom: 'Vêtements',   emoji: '👕' },
  { nom: 'Banque / Assurance', emoji: '🏦' },
  { nom: 'Autres',      emoji: '💳' }
]

const categoriesRevenu = [
  { nom: 'Salaire',   emoji: '💼' },
  { nom: 'Freelance', emoji: '💻' },
  { nom: 'Remboursement', emoji: '↩️' },
  { nom: 'Banque / Assurance', emoji: '🏦' },
  { nom: 'Autres',    emoji: '💰' }
]

// ─── Computed ────────────────────────────────────────────────────
const depensesCount = computed(() => previewRows.value.filter(r => r.type === 'depense').length)
const revenusCount  = computed(() => previewRows.value.filter(r => r.type === 'revenu').length)
const ignoredCount  = computed(() => previewRows.value.filter(r => r.ignore).length)
const selectedRows  = computed(() => previewRows.value.filter(r => r.selected))
const allSelected   = computed(() => previewRows.value.every(r => r.selected))
const filteredRows  = computed(() => {
  if (filter.value === 'all') return previewRows.value
  return previewRows.value.filter(r => r.type === filter.value)
})

// ─── File handling ────────────────────────────────────────────────
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
  const reader = new FileReader()
  reader.onload = (e) => {
    rawContent.value = e.target.result
    parseCSV()
    step.value = 2
  }
  reader.readAsText(file, encoding.value)
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

// ─── CSV Parsing ─────────────────────────────────────────────────
function parseCSV() {
  const lines = rawContent.value.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return

  // Auto-détecte le séparateur
  const firstLine = lines[0]
  if (firstLine.includes(';') && separator.value !== ';') separator.value = ';'
  else if (firstLine.includes('\t') && separator.value !== '\t') separator.value = '\t'

  const sep = separator.value
  const cols = splitCSVLine(firstLine, sep)
  headers.value = cols

  // Auto-mapping intelligent
  autoMap(cols)

  rawRows.value = lines.slice(1).map(line => {
    const vals = splitCSVLine(line, sep)
    const row = {}
    cols.forEach((col, i) => { row[col] = vals[i] || '' })
    return row
  }).filter(r => Object.values(r).some(v => v.trim()))
}

function splitCSVLine(line, sep) {
  // Gère les guillemets
  const result = []
  let current = ''
  let inQuote = false
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
  const lower = cols.map(c => c.toLowerCase())

  // Date — première colonne qui ressemble à une date dans les valeurs
  const dateIdx = lower.findIndex(c => c.includes('date') || c.includes('dat'))
  if (dateIdx >= 0) mapping.value.date = cols[dateIdx]
  else {
    // Détecte par les valeurs : cherche une colonne avec des dates DD/MM/YYYY
    const dateValIdx = cols.findIndex((col, i) => {
      const vals = rawRows.value.slice(0, 5).map(r => r[col] || '')
      return vals.some(v => /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(v.trim()))
    })
    if (dateValIdx >= 0) mapping.value.date = cols[dateValIdx]
  }

  // Montant — détecte par les valeurs : cherche une colonne avec +/- et virgule/point décimal
  const montantValIdx = cols.findIndex(col => {
    const vals = rawRows.value.slice(0, 10).map(r => r[col] || '')
    // Doit contenir des nombres avec virgule ou point, et potentiellement + ou -
    const numericCount = vals.filter(v => /^[+-]?\s*\d+[,\.]\d+$/.test(v.trim())).length
    return numericCount >= 2
  })
  if (montantValIdx >= 0) {
    mapping.value.montant = cols[montantValIdx]
  } else {
    // Fallback sur le nom de colonne
    const montantIdx = lower.findIndex(c =>
      c.includes('montant') || c.includes('amount') || c.includes('valeur')
    )
    if (montantIdx >= 0) mapping.value.montant = cols[montantIdx]
  }

  // Description — préfère "libellé" puis détecte les longues chaînes texte
  const descIdx = lower.findIndex(c =>
    c.includes('libellé') || c.includes('libelle') || c.includes('description') ||
    c.includes('label') || c.includes('opération') || c.includes('operation') || c.includes('motif')
  )
  if (descIdx >= 0) {
    mapping.value.description = cols[descIdx]
  } else {
    // Détecte la colonne avec les textes les plus longs
    const descValIdx = cols.findIndex(col => {
      const vals = rawRows.value.slice(0, 5).map(r => r[col] || '')
      const avgLen = vals.reduce((s, v) => s + v.length, 0) / (vals.length || 1)
      return avgLen > 10 && !cols.indexOf(col) === mapping.value.date
    })
    if (descValIdx >= 0) mapping.value.description = cols[descValIdx]
  }

  // Débit séparé
  const debitIdx = lower.findIndex(c => c.includes('débit') || c.includes('debit'))
  if (debitIdx >= 0) mapping.value.debit = cols[debitIdx]
}

// ─── Preview ────────────────────────────────────────────────────
function buildPreview() {
  previewRows.value = rawRows.value.map(row => {
    const dateRaw  = row[mapping.value.date] || ''
    const descRaw  = row[mapping.value.description] || ''
    const montantRaw = row[mapping.value.montant] || ''
    const debitRaw = mapping.value.debit ? row[mapping.value.debit] || '' : ''

    // Parse montant — gère +296,24 / -1 234,56 / 1.234,56
    let montantStr = (debitRaw || montantRaw).trim()
    // Retire espaces insécables et normaux
    montantStr = montantStr.replace(/[\s\u00a0]/g, '')
    // Détermine si c'est format européen (1.234,56) ou anglais (1,234.56)
    const hasCommaDecimal = /,\d{1,2}$/.test(montantStr)
    if (hasCommaDecimal) {
      // Format européen : supprime les points de milliers, remplace virgule par point
      montantStr = montantStr.replace(/\./g, '').replace(',', '.')
    } else {
      // Format anglais : supprime les virgules de milliers
      montantStr = montantStr.replace(/,/g, '')
    }
    // Garde signe + ou -
    montantStr = montantStr.replace(/[^0-9.\-\+]/g, '')
    let montant = parseFloat(montantStr)
    if (isNaN(montant)) return null

    // Parse date
    const date = parseDate(dateRaw)
    if (!date) return null

    const type = montant < 0 ? 'depense' : 'revenu'
    const categorie = autoCategorize(descRaw, type)

    return {
      date,
      description: descRaw,
      montant,
      type,
      categorie,
      selected: true,
      ignore: false
    }
  }).filter(Boolean)
}

function parseDate(str) {
  if (!str) return null
  // DD/MM/YYYY
  let m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return new Date(m[3], m[2]-1, m[1])
  // DD-MM-YYYY
  m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (m) return new Date(m[3], m[2]-1, m[1])
  // YYYY-MM-DD
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(m[1], m[2]-1, m[3])
  // DD/MM/YY
  m = str.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (m) return new Date(2000 + parseInt(m[3]), m[2]-1, m[1])
  return null
}

function autoCategorize(desc, type) {
  if (type === 'revenu') {
    if (/salaire|paie|virement|employeur/i.test(desc)) return 'Salaire'
    if (/remboursement|rembours/i.test(desc)) return 'Remboursement'
    return 'Autres'
  }
  const d = desc.toLowerCase()
  if (/loyer|logement|habitation/i.test(d)) return 'Loyer'
  if (/carrefour|leclerc|lidl|aldi|casino|super|hyper|monop|market|epicerie|resto|restaurant|mcdonald|burger|pizza|sushi|kebab|food|fnac.*restau/i.test(d)) return 'Nourriture'
  if (/sncf|ratp|train|metro|taxi|uber|blablacar|parking|essence|carburant|station|autoroute|peage/i.test(d)) return 'Transport'
  if (/netflix|spotify|amazon|disney|prime|apple|google|microsoft|abonne/i.test(d)) return 'Abonnements'
  if (/pharmacie|medecin|docteur|hopital|mutuelle|sante/i.test(d)) return 'Santé'
  if (/zara|h&m|kiabi|decathlon|sport|vetement|habit/i.test(d)) return 'Vêtements'
  if (/cinema|theatre|concert|jeu|sport|loisir|voyage|hotel/i.test(d)) return 'Loisirs'
  if (/banque|assurance|credit|pret|frais|cotisation|commission/i.test(d)) return 'Banque / Assurance'
  return 'Autres'
}

function formatDateDisplay(date) {
  if (!date) return ''
  return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
}

function toggleAll() {
  const newVal = !allSelected.value
  previewRows.value.forEach(r => { if (!r.ignore) r.selected = newVal })
}

// ─── Import ─────────────────────────────────────────────────────
async function importData() {
  importing.value = true
  const uid = authStore.user?.uid
  if (!uid) return

  let count = 0
  const rows = selectedRows.value

  for (const row of rows) {
    const ts = Timestamp.fromDate(new Date(row.date.getFullYear(), row.date.getMonth(), row.date.getDate(), 12, 0, 0))
    const data = {
      uid,
      montant:   Math.abs(row.montant),
      description: row.description,
      categorie: row.categorie,
      createdAt: ts,
      source:    'import_csv'
    }
    try {
      if (row.type === 'depense') {
        await addDoc(collection(db, 'depenses'), data)
      } else {
        await addDoc(collection(db, 'revenus'), data)
      }
      count++
    } catch (e) {
      console.error('Erreur import ligne:', e)
    }
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
  mapping.value = { date: '', montant: '', description: '', debit: '' }
  importedCount.value = 0
  filter.value = 'all'
}
</script>

<style scoped>
.banks-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.bank-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 13px;
}

.drop-zone {
  border: 2px dashed var(--border-accent);
  border-radius: var(--radius-xl);
  padding: 60px 32px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition);
  background: var(--accent-dim);
}
.drop-zone:hover, .drop-zone.dragging {
  background: rgba(0,229,160,0.12);
  border-color: var(--accent);
  transform: scale(1.01);
}
.drop-icon  { font-size: 48px; margin-bottom: 12px; }
.drop-title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.drop-sub   { font-size: 14px; color: var(--text-muted); }
.drop-formats { font-size: 12px; color: var(--text-muted); margin-top: 8px; }

.mapping-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
}
.mapping-item { display: flex; flex-direction: column; gap: 6px; }
.mapping-item label { font-size: 13px; font-weight: 600; }

.raw-table-wrap { overflow-x: auto; }
.raw-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.raw-table th { padding: 8px 12px; background: var(--bg-elevated); border: 1px solid var(--border); text-align: left; white-space: nowrap; }
.raw-table td { padding: 6px 12px; border: 1px solid var(--border); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.import-list { display: flex; flex-direction: column; gap: 8px; max-height: 600px; overflow-y: auto; }
.import-row {
  display: grid;
  grid-template-columns: 20px 90px 1fr 160px 160px 90px;
  align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all var(--transition);
}
.import-row.selected { border-color: var(--border-accent); }
.import-row.ignored  { opacity: 0.4; }

.import-date { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.import-desc-input { padding: 4px 8px; font-size: 13px; }
.import-cat  { padding: 4px 8px; font-size: 12px; }
.import-amount { font-size: 14px; font-weight: 700; text-align: right; white-space: nowrap; }

.type-btn {
  padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border);
  background: none; cursor: pointer; font-size: 11px; font-weight: 600;
  font-family: var(--font-body); color: var(--text-muted); transition: all var(--transition);
}
.type-btn.active { background: rgba(255,107,107,0.15); border-color: var(--red); color: var(--red); }
.type-btn.revenu.active { background: rgba(0,229,160,0.15); border-color: var(--green); color: var(--green); }

.success-screen {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 80px 32px;
  gap: 12px;
}
.success-icon { font-size: 64px; }
.success-screen h2 { font-family: var(--font-display); font-size: 2rem; }

@media (max-width: 768px) {
  .mapping-grid { grid-template-columns: 1fr; }
  .import-row { grid-template-columns: 20px 1fr 80px; }
  .import-date, .import-cat { display: none; }
}
</style>