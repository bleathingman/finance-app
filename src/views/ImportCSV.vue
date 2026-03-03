<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <div>
        <h1>Import bancaire</h1>
        <p>Importez vos relevés bancaires au format CSV ou OFX/QFX</p>
      </div>
    </div>

    <PremiumGate feature="exportCsv" icon="🏦" title="Import bancaire — feature Premium"
      description="Importez vos relevés bancaires CSV ou OFX directement depuis votre banque.">

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
            💡 CSV, OFX et QFX supportés — mapping manuel disponible pour les CSV
          </p>
        </div>

        <!-- Formats supportés -->
        <div class="formats-row" style="margin-bottom:24px">
          <div class="format-chip active">
            <span>📄</span>
            <div>
              <div style="font-weight:700;font-size:13px">CSV / TXT</div>
              <div style="font-size:11px;color:var(--text-muted)">Toutes banques</div>
            </div>
          </div>
          <div class="format-chip active">
            <span>🏦</span>
            <div>
              <div style="font-weight:700;font-size:13px">OFX / QFX</div>
              <div style="font-size:11px;color:var(--text-muted)">Import automatique sans mapping</div>
            </div>
          </div>
        </div>

        <!-- Drop zone -->
        <div class="drop-zone" :class="{ dragging: isDragging }"
          @dragover.prevent="isDragging = true" @dragleave="isDragging = false"
          @drop.prevent="onDrop" @click="$refs.fileInput.click()">
          <input ref="fileInput" type="file" accept=".csv,.txt,.ofx,.qfx" style="display:none" @change="onFileChange" />
          <div class="drop-icon">📂</div>
          <div class="drop-title">Déposez votre fichier ici</div>
          <div class="drop-sub">ou cliquez pour parcourir</div>
          <div class="drop-formats">CSV, TXT, OFX, QFX — max 10 MB</div>
        </div>
      </div>

      <!-- ─── Étape 2 : Mapping colonnes (CSV uniquement) ───────────── -->
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
        <!-- Badge format OFX -->
        <div v-if="fileFormat === 'ofx'" class="ofx-badge" style="margin-bottom:16px">
          <span>🏦</span>
          <span>Fichier OFX/QFX détecté — mapping automatique, aucune configuration requise</span>
        </div>

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
              <select v-model="filterMonth" class="input" style="width:auto;padding:6px 10px;font-size:13px">
                <option value="">Tous les mois ({{ filteredRows.length }})</option>
                <option v-for="m in availableMonths" :key="m.value" :value="m.value">
                  {{ m.label }} ({{ m.count }})
                </option>
              </select>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost" @click="step = fileFormat === 'ofx' ? 1 : 2">← Retour</button>
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
            <button v-if="ignoredCount > 0" class="period-btn" :class="{ active: filterType === 'ignored' }" @click="filterType = 'ignored'">
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
const step           = ref(1)
const isDragging     = ref(false)
const fileName       = ref('')
const rawContent     = ref('')
const rawRows        = ref([])
const headers        = ref([])
const separator      = ref(';')
const encoding       = ref('utf-8')
const importing      = ref(false)
const importProgress = ref(0)
const importedCount  = ref(0)
const filterType     = ref('all')
const filterMonth    = ref('')
const fileRef        = ref(null)
const fileFormat     = ref('csv') // 'csv' | 'ofx'

// ─── Règles de catégorisation ─────────────────────────────────────
const savedRules = ref([])
const rulePopup  = ref({ show: false, keyword: '', categorie: '', type: '', matchCount: 0, firestoreCount: 0 })

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
  { name: "Caisse d'Épargne",  emoji: '🐿️' }
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
  if (subStore.isPro) return false
  const now = new Date()
  const limit = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
  return date < limit
}

// ─── Computed ─────────────────────────────────────────────────────
const depensesCount  = computed(() => previewRows.value.filter(r => r.type === 'depense' && !r.outOfRange).length)
const revenusCount   = computed(() => previewRows.value.filter(r => r.type === 'revenu'  && !r.outOfRange).length)
const ignoredCount   = computed(() => previewRows.value.filter(r => r.outOfRange).length)
const selectedRows   = computed(() => previewRows.value.filter(r => r.selected && !r.outOfRange))
const totalDepenses  = computed(() => previewRows.value.filter(r => r.type === 'depense' && !r.outOfRange).reduce((s, r) => s + Math.abs(r.montant), 0))
const totalRevenus   = computed(() => previewRows.value.filter(r => r.type === 'revenu'  && !r.outOfRange).reduce((s, r) => s + r.montant, 0))
const rowsHorsLimite = computed(() => ignoredCount.value)
const allSelected    = computed(() => filteredRows.value.filter(r => !r.outOfRange).every(r => r.selected))

const availableMonths = computed(() => {
  const map = {}
  previewRows.value.forEach(r => {
    if (r.outOfRange) return
    const d = r.date
    const key   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
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
  fileRef.value  = file
  fileName.value = file.name
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'ofx' || ext === 'qfx') {
    // OFX/QFX → pas d'encodage particulier, on lit en UTF-8 puis fallback latin1
    fileFormat.value = 'ofx'
    const reader = new FileReader()
    reader.onload = (e) => {
      rawContent.value = e.target.result
      const rows = parseOFX(rawContent.value)
      if (rows.length > 0) {
        previewRows.value = rows
        step.value = 3
      } else {
        alert('Impossible de lire ce fichier OFX. Vérifiez le format.')
      }
    }
    reader.readAsText(file, 'utf-8')
  } else {
    // CSV → sniffe l'encodage
    fileFormat.value = 'csv'
    const sniff = new FileReader()
    sniff.onload = (e) => {
      const s = e.target.result.slice(0, 600)
      if (/\uFFFD/.test(s) || /[ÃÂ][©€¨²°àèéêù]/.test(s)) encoding.value = 'iso-8859-1'
      const reader = new FileReader()
      reader.onload = (e2) => { rawContent.value = e2.target.result; parseCSV(); step.value = 2 }
      reader.readAsText(file, encoding.value)
    }
    sniff.readAsText(file, 'utf-8')
  }
}

function reloadFile() {
  if (!fileRef.value) return
  const reader = new FileReader()
  reader.onload = (e) => { rawContent.value = e.target.result; parseCSV() }
  reader.readAsText(fileRef.value, encoding.value)
}

// ─── OFX / QFX Parser ─────────────────────────────────────────────
// Supporte les formats SGML (OFX 1.x) et XML (OFX 2.x / QFX)
// Banques : Boursorama, BNP, CIC, LCL, Crédit Agricole, Caisse d'Épargne...
function parseOFX(content) {
  const rows = []

  // Détecte si c'est du XML (OFX 2.x) ou du SGML (OFX 1.x)
  const isXml = /<\?xml|<OFX>/i.test(content)

  if (isXml) {
    // ── OFX 2.x / QFX : vrai XML ────────────────────────────────
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(content, 'text/xml')
      const transactions = xmlDoc.querySelectorAll('STMTTRN')

      transactions.forEach(txn => {
        const trnType = (txn.querySelector('TRNTYPE')?.textContent || '').trim()
        const dtPosted = (txn.querySelector('DTPOSTED')?.textContent || '').trim()
        const trnAmt   = (txn.querySelector('TRNAMT')?.textContent  || '').trim()
        const name     = (txn.querySelector('NAME')?.textContent     || '').trim()
        const memo     = (txn.querySelector('MEMO')?.textContent     || '').trim()

        const date    = parseOFXDate(dtPosted)
        const montant = parseFloat(trnAmt.replace(',', '.')) || 0
        if (!date || montant === 0) return

        const description = memo || name || trnType
        const type = montant < 0 ? 'depense' : 'revenu'
        const outOfRange = isOutOfRange(date)

        rows.push({
          date,
          description,
          montant,
          type,
          categorie: autoCategorize(description, type),
          selected: !outOfRange,
          outOfRange
        })
      })
    } catch (e) {
      console.error('Erreur parsing OFX XML:', e)
    }
  } else {
    // ── OFX 1.x : format SGML (balises sans fermeture) ──────────
    // Ex: <TRNTYPE>DEBIT<DTPOSTED>20240115<TRNAMT>-42.50<NAME>CARREFOUR
    // On extrait les blocs <STMTTRN>...</STMTTRN>

    // Certains fichiers SGML n'ont pas de balise fermante </STMTTRN>
    // On utilise donc une regex sur le contenu brut
    const txnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi
    let match

    while ((match = txnRegex.exec(content)) !== null) {
      const block = match[1]

      const trnType  = extractOFXField(block, 'TRNTYPE')
      const dtPosted = extractOFXField(block, 'DTPOSTED')
      const trnAmt   = extractOFXField(block, 'TRNAMT')
      const name     = extractOFXField(block, 'NAME')
      const memo     = extractOFXField(block, 'MEMO')

      if (!dtPosted || !trnAmt) continue

      const date    = parseOFXDate(dtPosted)
      const montant = parseFloat(trnAmt.replace(',', '.')) || 0
      if (!date || montant === 0) continue

      const description = memo || name || trnType || ''
      const type = montant < 0 ? 'depense' : 'revenu'
      const outOfRange = isOutOfRange(date)

      rows.push({
        date,
        description: cleanOFXString(description),
        montant,
        type,
        categorie: autoCategorize(description, type),
        selected: !outOfRange,
        outOfRange
      })
    }
  }

  // Trie par date décroissante
  return rows.sort((a, b) => b.date - a.date)
}

// Extrait la valeur d'une balise SGML sans fermeture
// Ex: extractOFXField("<TRNAMT>-42.50\n<NAME>Carrefour", "TRNAMT") → "-42.50"
function extractOFXField(block, field) {
  const regex = new RegExp(`<${field}>([^<\\n\\r]*)`, 'i')
  const m = block.match(regex)
  return m ? m[1].trim() : ''
}

// Parse une date OFX : 20240115 ou 20240115120000 ou 20240115120000[-5:EST]
function parseOFXDate(str) {
  if (!str) return null
  const clean = str.replace(/\[.*\]/, '').trim() // retire le timezone
  const y = parseInt(clean.slice(0, 4))
  const m = parseInt(clean.slice(4, 6)) - 1
  const d = parseInt(clean.slice(6, 8))
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  return new Date(y, m, d)
}

// Nettoie les caractères parasites dans les strings OFX
function cleanOFXString(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── CSV Parsing ───────────────────────────────────────────────────
function parseCSV() {
  const raw = rawContent.value
  if (!raw.trim()) return

  const records = []
  let i = 0, currentFields = [], currentField = '', inQuote = false

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
      if ((ch === '\r' || ch === '\n') && inQuote) { currentField += ' '; i++; continue }
      currentField += ch; i++
    }
  }
  if (currentFields.some(f => f)) records.push([...currentFields, currentField].map(f => f.trim()))

  if (!records.length) return

  let headerIdx = 0, maxCols = 0
  records.forEach((rec, idx) => { if (rec.length > maxCols) { maxCols = rec.length; headerIdx = idx } })

  const cols = records[headerIdx].map(c => c.replace(/^"+|"+$/g, '').trim())
  headers.value = cols

  rawRows.value = records.slice(headerIdx + 1)
    .filter(rec => rec.length >= Math.max(2, maxCols - 2))
    .map(rec => {
      const row = {}
      cols.forEach((col, j) => { row[col] = (rec[j] || '').replace(/^"+|"+$/g, '').replace(/\s+/g, ' ').trim() })
      return row
    })
    .filter(r => Object.values(r).some(v => v))

  autoMap(cols)
}

function autoMap(cols) {
  const lower = cols.map(c => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))

  const dateValIdx = cols.findIndex(col => {
    const vals = rawRows.value.slice(0, 5).map(r => r[col] || '')
    return vals.some(v => /^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/.test(v.trim()))
  })
  if (dateValIdx >= 0) mapping.value.date = cols[dateValIdx]
  else {
    const idx = lower.findIndex(c => c.includes('date') || c.includes('dat'))
    if (idx >= 0) mapping.value.date = cols[idx]
  }

  const descPriority = ['libelle simplifie', 'libelle simplifi', 'libelle', 'description', 'label', 'operation', 'motif']
  for (const keyword of descPriority) {
    const idx = lower.findIndex(c => c.includes(keyword))
    if (idx >= 0) { mapping.value.description = cols[idx]; break }
  }

  const debitIdx  = lower.findIndex(c => c === 'debit'  || c.includes('debit'))
  const creditIdx = lower.findIndex(c => c === 'credit' || c.includes('credit'))
  if (debitIdx  >= 0) mapping.value.debit  = cols[debitIdx]
  if (creditIdx >= 0) mapping.value.credit = cols[creditIdx]

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

// ─── Build Preview (CSV) ───────────────────────────────────────────
function buildPreview() {
  previewRows.value = rawRows.value.map(row => {
    const dateRaw = row[mapping.value.date]        || ''
    const descRaw = row[mapping.value.description] || ''

    let montant = 0
    if (mapping.value.debit || mapping.value.credit) {
      const debitRaw  = mapping.value.debit  ? row[mapping.value.debit]  || '' : ''
      const creditRaw = mapping.value.credit ? row[mapping.value.credit] || '' : ''
      const debitVal  = parseMontant(debitRaw)
      const creditVal = parseMontant(creditRaw)
      if      (debitVal  !== 0) montant = -Math.abs(debitVal)
      else if (creditVal !== 0) montant =  Math.abs(creditVal)
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

    return {
      date,
      description: descRaw,
      montant,
      type,
      categorie: autoCategorize(descRaw, type),
      selected: !outOfRange,
      outOfRange
    }
  }).filter(Boolean)
}

function parseMontant(str) {
  if (!str || !str.trim()) return 0
  let s = str.trim().replace(/[\s\u00a0]/g, '')
  if (/,\d{1,2}$/.test(s)) { s = s.replace(/\./g, '').replace(',', '.') }
  else { s = s.replace(/,/g, '') }
  s = s.replace(/[^0-9.\-\+]/g, '')
  return parseFloat(s) || 0
}

function parseDate(str) {
  if (!str) return null
  str = str.trim()
  let m
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (m) return new Date(+m[3], +m[2]-1, +m[1])
  m = str.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (m) return new Date(+m[1], +m[2]-1, +m[3])
  m = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (m) return new Date(2000 + +m[3], +m[2]-1, +m[1])
  return null
}

// ─── Catégorisation auto ──────────────────────────────────────────
async function loadSavedRules() {
  const uid = authStore.user?.uid
  if (!uid) return
  try {
    const snap = await getDocs(collection(db, 'categorie_rules', uid, 'rules'))
    savedRules.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch(e) { console.warn('Erreur chargement règles:', e) }
}

function applySavedRules(desc, type) {
  const d = desc.toLowerCase()
  for (const rule of savedRules.value) {
    if (rule.type && rule.type !== type) continue
    if (d.includes(rule.keyword.toLowerCase())) return rule.categorie
  }
  return null
}

function extractKeyword(desc) {
  const cleaned = desc
    .replace(/paiement par carte/gi, '')
    .replace(/virement/gi, '')
    .replace(/x\d{4}/gi, '')
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const words = cleaned.split(/\s+/).filter(w => w.length > 2)
  return words.slice(0, 2).join(' ').toUpperCase() || desc.slice(0, 15).toUpperCase()
}

async function onCategorieChange(row, event) {
  const newCat  = event.target.value
  const keyword = extractKeyword(row.description)
  if (!keyword) return

  const matchInImport = previewRows.value.filter(r =>
    r !== row && !r.outOfRange && r.description.toLowerCase().includes(keyword.toLowerCase())
  )

  let firestoreCount = 0
  try {
    const uid = authStore.user?.uid
    if (uid) {
      const collName = row.type === 'depense' ? 'depenses' : 'revenus'
      const snap = await getDocs(query(collection(db, collName), where('uid', '==', uid), where('categorie', '==', 'Autres')))
      firestoreCount = snap.docs.filter(d => (d.data().description || '').toLowerCase().includes(keyword.toLowerCase())).length
    }
  } catch(e) {}

  if (matchInImport.length === 0 && firestoreCount === 0) return

  rulePopup.value = { show: true, keyword, categorie: newCat, type: row.type, matchCount: matchInImport.length, firestoreCount, row }
}

async function applyRule() {
  const { keyword, categorie, type, row } = rulePopup.value
  const uid = authStore.user?.uid
  rulePopup.value.show = false

  previewRows.value.forEach(r => {
    if (r !== row && !r.outOfRange && r.description.toLowerCase().includes(keyword.toLowerCase())) r.categorie = categorie
  })

  if (uid) {
    try {
      const collName = type === 'depense' ? 'depenses' : 'revenus'
      const snap = await getDocs(query(collection(db, collName), where('uid', '==', uid)))
      const toUpdate = snap.docs.filter(d => (d.data().description || '').toLowerCase().includes(keyword.toLowerCase()))
      if (toUpdate.length > 0) {
        const batch = writeBatch(db)
        toUpdate.forEach(d => batch.update(d.ref, { categorie }))
        await batch.commit()
      }
    } catch(e) { console.error('Erreur batch update:', e) }

    try {
      const ruleRef = doc(collection(db, 'categorie_rules', uid, 'rules'))
      await setDoc(ruleRef, { keyword, categorie, type, createdAt: new Date() })
      savedRules.value.push({ keyword, categorie, type })
    } catch(e) { console.error('Erreur sauvegarde règle:', e) }
  }
}

function autoCategorize(desc, type) {
  const saved = applySavedRules(desc, type)
  if (saved) return saved
  const d = desc.toLowerCase()
  if (type === 'revenu') {
    if (/salaire|paie|virement.*employeur/i.test(d)) return 'Salaire'
    if (/remboursement|rembours|cpam|secu|caf|allocation/i.test(d)) return 'Remboursement'
    return 'Autres'
  }
  if (/loyer|logement|habitation/i.test(d)) return 'Loyer'
  if (/carrefour|leclerc|lidl|aldi|casino|super|hyper|monop|market|epicerie|resto|restaurant|mcdonald|burger|pizza|sushi|kebab|ubereat|deliveroo|alimentat/i.test(d)) return 'Nourriture'
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
  importing.value   = true
  importProgress.value = 0
  const uid = authStore.user?.uid
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
      source:      'import_' + fileFormat.value,
      recurrent:   false
    }
    try {
      await addDoc(collection(db, row.type === 'depense' ? 'depenses' : 'revenus'), data)
      count++
    } catch (e) { console.error('Erreur import ligne:', e) }
    importProgress.value = count
  }

  importedCount.value = count
  importing.value     = false
  step.value          = 4
}

function reset() {
  step.value         = 1
  rawContent.value   = ''
  rawRows.value      = []
  headers.value      = []
  previewRows.value  = []
  fileFormat.value   = 'csv'
  mapping.value      = { date: '', description: '', montant: '', debit: '', credit: '' }
  importedCount.value = 0
  filterType.value   = 'all'
  filterMonth.value  = ''
}

onMounted(() => { loadSavedRules() })
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.plan-limit-banner { padding:16px 20px }

.formats-row { display:flex;gap:12px;flex-wrap:wrap }
.format-chip { display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);font-size:13px;flex:1;min-width:160px }
.format-chip.active { border-color:var(--border-accent);background:var(--accent-dim) }
.format-chip span { font-size:24px }

.ofx-badge { display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(0,229,160,0.08);border:1px solid var(--border-accent);border-radius:var(--radius);font-size:13px;font-weight:600;color:var(--accent) }

.banks-grid { display:flex;flex-wrap:wrap;gap:8px }
.bank-chip  { display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:99px;font-size:13px }

.drop-zone { border:2px dashed var(--border-accent);border-radius:var(--radius-xl);padding:60px 32px;text-align:center;cursor:pointer;transition:all var(--transition);background:var(--accent-dim) }
.drop-zone:hover, .drop-zone.dragging { background:rgba(0,229,160,0.12);border-color:var(--accent);transform:scale(1.01) }
.drop-icon    { font-size:48px;margin-bottom:12px }
.drop-title   { font-size:18px;font-weight:700;margin-bottom:6px }
.drop-sub     { font-size:14px;color:var(--text-muted) }
.drop-formats { font-size:12px;color:var(--text-muted);margin-top:8px }

.mapping-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:16px }
.mapping-item { display:flex;flex-direction:column;gap:6px }
.mapping-item label { font-size:13px;font-weight:600 }

.raw-table-wrap { overflow-x:auto }
.raw-table { width:100%;border-collapse:collapse;font-size:12px }
.raw-table th { padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border);text-align:left;white-space:nowrap }
.raw-table td { padding:6px 12px;border:1px solid var(--border);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }

.import-list { display:flex;flex-direction:column;gap:6px;max-height:600px;overflow-y:auto }
.import-row { display:grid;grid-template-columns:20px 95px 1fr 155px 170px 90px;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius);transition:all var(--transition) }
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

.rule-popup { display:flex;align-items:center;gap:12px;padding:14px 16px;margin-top:12px;background:var(--bg-elevated);border:1px solid var(--border-accent);border-radius:var(--radius);border-left:3px solid var(--accent) }

@media (max-width:768px) {
  .mapping-grid { grid-template-columns:1fr }
  .import-row { grid-template-columns:20px 1fr 80px }
  .import-date, .import-cat, .type-btn { display:none }
  .rule-popup { flex-direction:column;align-items:flex-start }
  .formats-row { flex-direction:column }
}
</style>