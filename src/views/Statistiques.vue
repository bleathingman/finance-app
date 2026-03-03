<template>
  <div class="animate-fade-in">

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px">
      <div>
        <h1>Statistiques</h1>
        <p>Analyse complète de vos finances</p>
      </div>
      <div style="display:flex;gap:8px">
        <router-link v-if="!subStore.can('exportCsv')" to="/pricing" class="btn btn-ghost" style="border-color:var(--border-accent);color:var(--accent)">
          💎 Export CSV/PDF
        </router-link>
        <template v-else>
          <button class="btn btn-ghost" @click="exportCSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Export CSV
          </button>
          <button class="btn btn-ghost" @click="exportPDF">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Export PDF
          </button>
        </template>
      </div>
    </div>

    <!-- Periode selector -->
    <div class="period-tabs" style="margin-bottom:28px">
      <button v-for="p in periodes" :key="p.val" class="period-btn" :class="{ active: periode === p.val }" @click="periode = p.val">
        {{ p.label }}
      </button>
    </div>

    <!-- KPIs principaux -->
    <div class="grid-4" style="margin-bottom:28px">
      <div class="card card-accent">
        <div class="kpi-label">Épargne moyenne / mois</div>
        <div class="kpi-value text-accent">{{ formatAmount(epargneMoyenne) }}</div>
        <div class="kpi-sub">sur {{ periode }} mois</div>
      </div>
      <div class="card">
        <div class="kpi-label">Mois le plus dépensier</div>
        <div class="kpi-value" style="font-size:1.3rem">{{ moisPlusDepensier?.label || '—' }}</div>
        <div class="kpi-sub">{{ formatAmount(moisPlusDepensier?.depenses) }}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Catégorie dominante</div>
        <div class="kpi-value" style="font-size:1.3rem">
          {{ categorieDominante?.emoji }} {{ categorieDominante?.nom || '—' }}
        </div>
        <div class="kpi-sub">{{ formatAmount(categorieDominante?.total) }}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Taux d'épargne</div>
        <div class="kpi-value" :style="{ color: tauxEpargne >= 20 ? 'var(--green)' : tauxEpargne >= 10 ? 'var(--orange)' : 'var(--red)' }">
          {{ tauxEpargne }}%
        </div>
        <div class="kpi-sub">objectif recommandé : 20%</div>
      </div>
    </div>

    <!-- Graphiques ligne -->
    <div class="grid-2" style="margin-bottom:28px">
      <!-- Évolution revenus vs dépenses -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h3 style="font-family:var(--font-display)">Revenus vs Dépenses</h3>
          <div style="display:flex;gap:12px;font-size:12px">
            <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:var(--green);display:inline-block"></span>Revenus</span>
            <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:var(--red);display:inline-block"></span>Dépenses</span>
          </div>
        </div>
        <div v-if="hasData" style="position:relative;height:220px">
          <canvas ref="lineChartRef"></canvas>
        </div>
        <div v-else class="empty-chart">
          <span style="font-size:2rem">📈</span>
          <p>Pas assez de données</p>
        </div>
      </div>

      <!-- Camembert catégories -->
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Répartition des dépenses</h3>
        <div v-if="depensesParCat.length > 0" style="display:flex;gap:16px;align-items:center">
          <div style="position:relative;width:160px;height:160px;flex-shrink:0">
            <canvas ref="donutChartRef"></canvas>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:8px">
            <div v-for="cat in depensesParCat.slice(0,6)" :key="cat.nom" style="display:flex;align-items:center;gap:8px">
              <span :style="{ width:'8px', height:'8px', borderRadius:'50%', background: cat.color, display:'inline-block', flexShrink:0 }"></span>
              <span style="font-size:13px;flex:1">{{ cat.emoji }} {{ cat.nom }}</span>
              <span style="font-size:12px;color:var(--text-muted);font-weight:600">{{ cat.pct }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-chart">
          <span style="font-size:2rem">🥧</span>
          <p>Aucune dépense enregistrée</p>
        </div>
      </div>
    </div>

    <!-- ═══ Évolution du solde ════════════════════════════════════ -->
    <div class="card" style="margin-bottom:28px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h3 style="font-family:var(--font-display)">Évolution du solde</h3>
          <p style="font-size:13px;color:var(--text-muted);margin-top:2px">Solde cumulé jour après jour</p>
        </div>
        <div style="display:flex;align-items:center;gap:20px">
          <div style="display:flex;flex-direction:column;align-items:flex-end">
            <span style="font-size:12px;color:var(--text-muted)">Solde actuel</span>
            <span
              style="font-family:var(--font-display);font-size:1.1rem;font-weight:700"
              :style="{ color: soldeActuel >= 0 ? 'var(--green)' : 'var(--red)' }"
            >{{ formatAmount(soldeActuel) }}</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end">
            <span style="font-size:12px;color:var(--text-muted)">Sur {{ periode }} mois</span>
            <span
              style="font-size:13px;font-weight:700"
              :style="{ color: variationSolde >= 0 ? 'var(--green)' : 'var(--red)' }"
            >{{ variationSolde >= 0 ? '+' : '' }}{{ formatAmount(variationSolde) }}</span>
          </div>
        </div>
      </div>
      <div v-if="hasData && evolutionSolde.length > 1" style="position:relative;height:240px">
        <canvas ref="soldeChartRef"></canvas>
      </div>
      <div v-else class="empty-chart">
        <span style="font-size:2rem">📉</span>
        <p>Pas assez de données pour afficher l'évolution</p>
      </div>
    </div>

    <!-- Bilan mensuel détaillé -->
    <PremiumGate
      feature="advancedCharts"
      icon="📊"
      title="Bilan mensuel détaillé"
      description="Visualisez votre historique mois par mois sur 12 mois : revenus, dépenses, épargne et taux d'épargne. Disponible avec Premium."
      style="margin-bottom:28px"
    >
    <div class="card" style="margin-bottom:28px">
      <h3 style="font-family:var(--font-display);margin-bottom:20px">Bilan mensuel</h3>
      <div v-if="!hasData" class="empty-chart">
        <span style="font-size:2rem">📊</span>
        <p>Ajoutez des transactions pour voir le bilan</p>
      </div>
      <div v-else class="bilan-table">
        <div class="bilan-header">
          <span>Mois</span>
          <span>Revenus</span>
          <span>Dépenses</span>
          <span>Épargne</span>
          <span>Solde</span>
        </div>
        <div v-for="mois in bilanMensuel" :key="mois.label" class="bilan-row">
          <span class="bilan-mois">{{ mois.label }}</span>
          <span class="amount-positive">+{{ formatAmount(mois.revenus) }}</span>
          <span class="amount-negative">-{{ formatAmount(mois.depenses) }}</span>
          <span :class="mois.epargne >= 0 ? 'amount-positive' : 'amount-negative'">
            {{ mois.epargne >= 0 ? '+' : '' }}{{ formatAmount(mois.epargne) }}
          </span>
          <div class="bilan-progress">
            <div
              class="bilan-bar"
              :style="{
                width: mois.revenus > 0 ? Math.min((mois.epargne / mois.revenus) * 100, 100) + '%' : '0%',
                background: mois.epargne >= 0 ? 'var(--green)' : 'var(--red)'
              }"
            ></div>
            <span class="bilan-pct" :style="{ color: mois.epargne >= 0 ? 'var(--green)' : 'var(--red)' }">
              {{ mois.revenus > 0 ? Math.round((mois.epargne / mois.revenus) * 100) : 0 }}%
            </span>
          </div>
        </div>
      </div>
    </div>
    </PremiumGate>

    <!-- Projections -->
    <PremiumGate
      feature="forecast"
      icon="🔮"
      title="Projections & Insights"
      description="Prévisions d'épargne sur 6 ou 12 mois et conseils personnalisés basés sur vos habitudes financières."
    >
    <div class="grid-2">
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Projection épargne</h3>
        <div style="display:flex;gap:8px;margin-bottom:20px">
          <button class="period-btn" :class="{ active: projectionMois === 6 }" @click="projectionMois = 6">6 mois</button>
          <button class="period-btn" :class="{ active: projectionMois === 12 }" @click="projectionMois = 12">12 mois</button>
        </div>
        <div v-if="epargneMoyenne > 0">
          <div v-for="(p, i) in projections" :key="i" class="projection-row">
            <span class="projection-label">{{ p.label }}</span>
            <div class="projection-bar-wrap">
              <div class="projection-bar-track">
                <div class="projection-bar-fill" :style="{ width: Math.min((p.cumul / projections[projections.length-1].cumul) * 100, 100) + '%' }"></div>
              </div>
            </div>
            <span class="projection-amount">{{ formatAmount(p.cumul) }}</span>
          </div>
          <div class="projection-total">
            <span>Total projeté sur {{ projectionMois }} mois</span>
            <span class="amount-positive" style="font-size:1.2rem;font-weight:700">{{ formatAmount(epargneMoyenne * projectionMois) }}</span>
          </div>
        </div>
        <div v-else class="empty-chart">
          <span style="font-size:2rem">🔮</span>
          <p>Pas encore assez de données</p>
        </div>
      </div>

      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:20px">Insights 💡</h3>
        <div class="insights-list">
          <div v-for="insight in insights" :key="insight.text" class="insight-item" :class="insight.type">
            <span class="insight-icon">{{ insight.emoji }}</span>
            <div>
              <div class="insight-title">{{ insight.title }}</div>
              <div class="insight-text">{{ insight.text }}</div>
            </div>
          </div>
          <div v-if="insights.length === 0" class="empty-chart">
            <p>Ajoutez plus de données pour obtenir des insights</p>
          </div>
        </div>
      </div>
    </div>
    </PremiumGate>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useFinanceStore } from '@/stores/finance'
import { useSubscriptionStore } from '@/stores/subscription'
import { useComptesStore } from '@/stores/comptes'
import PremiumGate from '@/components/PremiumGate.vue'

Chart.register(...registerables)

const financeStore = useFinanceStore()
const subStore     = useSubscriptionStore()
const comptesStore = useComptesStore()

// ─── State ────────────────────────────────────────────────────────
const periode        = ref(6)
const projectionMois = ref(6)
const lineChartRef   = ref(null)
const donutChartRef  = ref(null)
const soldeChartRef  = ref(null)
let lineChart  = null
let donutChart = null
let soldeChart = null

const periodes = [
  { val: 3,  label: '3 mois' },
  { val: 6,  label: '6 mois' },
  { val: 12, label: '12 mois' }
]

// ─── Catégories ───────────────────────────────────────────────────
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
function catColor(nom) { return categories.find(c => c.nom === nom)?.color || '#94a3b8' }
function catEmoji(nom) { return categories.find(c => c.nom === nom)?.emoji || '💳' }

// ─── Helpers ──────────────────────────────────────────────────────
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

function getMoisLabel(offsetFromNow) {
  const d = new Date()
  d.setMonth(d.getMonth() - offsetFromNow)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

function getMoisKey(offsetFromNow) {
  const d = new Date()
  d.setMonth(d.getMonth() - offsetFromNow)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function txMoisKey(tx) {
  if (!tx.createdAt) return ''
  const d = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function txDate(tx) {
  if (!tx.createdAt) return null
  return tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt)
}

// ─── Computed ─────────────────────────────────────────────────────
const hasData = computed(() =>
  financeStore.revenus.length > 0 || financeStore.depenses.length > 0
)

const bilanMensuel = computed(() => {
  const mois = []
  for (let i = periode.value - 1; i >= 0; i--) {
    const key   = getMoisKey(i)
    const label = getMoisLabel(i)
    const revenus  = financeStore.revenus.filter(r => txMoisKey(r) === key).reduce((s, r) => s + r.montant, 0)
    const depenses = financeStore.depenses.filter(d => txMoisKey(d) === key).reduce((s, d) => s + d.montant, 0)
    mois.push({ key, label, revenus, depenses, epargne: revenus - depenses })
  }
  return mois
})

const epargneMoyenne = computed(() => {
  const moisActifs = bilanMensuel.value.filter(m => m.revenus > 0)
  if (!moisActifs.length) return 0
  return moisActifs.reduce((s, m) => s + m.epargne, 0) / moisActifs.length
})

const tauxEpargne = computed(() => {
  const totalRev = bilanMensuel.value.reduce((s, m) => s + m.revenus, 0)
  const totalEp  = bilanMensuel.value.reduce((s, m) => s + m.epargne, 0)
  if (!totalRev) return 0
  return Math.round((totalEp / totalRev) * 100)
})

const moisPlusDepensier = computed(() => {
  if (!bilanMensuel.value.length) return null
  return [...bilanMensuel.value].sort((a, b) => b.depenses - a.depenses)[0]
})

const depensesParCat = computed(() => {
  const map = {}
  financeStore.depenses.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
  return Object.entries(map)
    .map(([nom, t]) => ({ nom, total: t, pct: Math.round((t / total) * 100), color: catColor(nom), emoji: catEmoji(nom) }))
    .sort((a, b) => b.total - a.total)
})

const categorieDominante = computed(() => depensesParCat.value[0] || null)

const projections = computed(() => {
  const result = []
  for (let i = 1; i <= projectionMois.value; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    result.push({
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      cumul: epargneMoyenne.value * i
    })
  }
  return result
})

// ─── Évolution du solde ───────────────────────────────────────────
const evolutionSolde = computed(() => {
  const soldeInitial = comptesStore.compteDefautId
    ? (comptesStore.tousLesComptes.find(c => c.id === comptesStore.compteDefautId)?.soldeInitial || 0)
    : 0

  const debut = new Date()
  debut.setMonth(debut.getMonth() - periode.value)
  debut.setHours(0, 0, 0, 0)

  const txs = [
    ...financeStore.revenus.map(t => ({ date: txDate(t), delta: t.montant })),
    ...financeStore.depenses.map(t => ({ date: txDate(t), delta: -t.montant }))
  ].filter(t => t.date && t.date >= debut).sort((a, b) => a.date - b.date)

  if (!txs.length) return []

  let cumul = soldeInitial
  const points = [{
    label: debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    solde: cumul
  }]

  // Regrouper par jour
  const parJour = {}
  txs.forEach(t => {
    const key = t.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })
    parJour[key] = (parJour[key] || 0) + t.delta
  })

  Object.entries(parJour).forEach(([label, delta]) => {
    cumul += delta
    points.push({ label, solde: cumul })
  })

  return points
})

const soldeActuel    = computed(() => evolutionSolde.value.at(-1)?.solde ?? 0)
const variationSolde = computed(() => {
  if (evolutionSolde.value.length < 2) return 0
  return evolutionSolde.value.at(-1).solde - evolutionSolde.value[0].solde
})

// ─── Insights ─────────────────────────────────────────────────────
const insights = computed(() => {
  const list = []
  if (!hasData.value) return list

  if (tauxEpargne.value >= 20) {
    list.push({ type: 'good', emoji: '🌟', title: "Excellent taux d'épargne", text: `Vous épargnez ${tauxEpargne.value}% de vos revenus. Continuez comme ça !` })
  } else if (tauxEpargne.value >= 10) {
    list.push({ type: 'warn', emoji: '💪', title: "Bon taux d'épargne", text: `Vous épargnez ${tauxEpargne.value}%. Essayez d'atteindre 20% pour être dans la zone idéale.` })
  } else if (tauxEpargne.value >= 0) {
    list.push({ type: 'bad', emoji: '⚠️', title: "Taux d'épargne faible", text: `Seulement ${tauxEpargne.value}% d'épargne. Identifiez les postes à réduire.` })
  } else {
    list.push({ type: 'bad', emoji: '🚨', title: 'Dépenses supérieures aux revenus', text: 'Vous dépensez plus que vous ne gagnez ce mois-ci. Attention !' })
  }

  if (categorieDominante.value && categorieDominante.value.pct > 40) {
    list.push({ type: 'warn', emoji: '📊', title: 'Concentration élevée', text: `${categorieDominante.value.emoji} ${categorieDominante.value.nom} représente ${categorieDominante.value.pct}% de vos dépenses.` })
  }

  if (epargneMoyenne.value > 0) {
    list.push({ type: 'info', emoji: '🔮', title: 'Projection 12 mois', text: `À ce rythme, vous économiserez ${formatAmount(epargneMoyenne.value * 12)} en un an.` })
  }

  const totalRec = financeStore.depenses.filter(d => d.recurrent).reduce((s, d) => s + d.montant, 0)
  const totalDep = financeStore.depenses.reduce((s, d) => s + d.montant, 0)
  if (totalDep > 0 && (totalRec / totalDep) > 0.5) {
    list.push({ type: 'warn', emoji: '🔄', title: 'Beaucoup de récurrents', text: `${Math.round((totalRec / totalDep) * 100)}% de vos dépenses sont des abonnements fixes.` })
  }

  return list
})

// ─── Charts ───────────────────────────────────────────────────────
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1a1e2e', borderColor: '#ffffff10', borderWidth: 1, padding: 10 }
  }
}

function buildLineChart() {
  if (!lineChartRef.value) return
  if (lineChart) { lineChart.destroy(); lineChart = null }
  const labels   = bilanMensuel.value.map(m => m.label)
  const revenus  = bilanMensuel.value.map(m => m.revenus)
  const depenses = bilanMensuel.value.map(m => m.depenses)
  lineChart = new Chart(lineChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Revenus',  data: revenus,  borderColor: '#00e5a0', backgroundColor: 'rgba(0,229,160,0.08)',   fill: true, tension: 0.4, pointBackgroundColor: '#00e5a0', pointRadius: 4, pointHoverRadius: 6 },
        { label: 'Dépenses', data: depenses, borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#ff6b6b', pointRadius: 4, pointHoverRadius: 6 }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { size: 11 }, callback: v => v + '€' } }
      }
    }
  })
}

function buildDonutChart() {
  if (!donutChartRef.value || !depensesParCat.value.length) return
  if (donutChart) { donutChart.destroy(); donutChart = null }
  donutChart = new Chart(donutChartRef.value, {
    type: 'doughnut',
    data: {
      labels: depensesParCat.value.map(c => c.nom),
      datasets: [{
        data: depensesParCat.value.map(c => c.total),
        backgroundColor: depensesParCat.value.map(c => c.color),
        borderColor: '#12151f', borderWidth: 2, hoverOffset: 6
      }]
    },
    options: {
      ...chartDefaults,
      cutout: '68%',
      plugins: {
        ...chartDefaults.plugins,
        tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(2)}€` } }
      }
    }
  })
}

function buildSoldeChart() {
  if (!soldeChartRef.value || evolutionSolde.value.length < 2) return
  if (soldeChart) { soldeChart.destroy(); soldeChart = null }

  const labels = evolutionSolde.value.map(p => p.label)
  const data   = evolutionSolde.value.map(p => p.solde)
  const color  = soldeActuel.value >= 0 ? '#00e5a0' : '#ff6b6b'
  const bg     = soldeActuel.value >= 0 ? 'rgba(0,229,160,0.08)' : 'rgba(255,107,107,0.08)'

  soldeChart = new Chart(soldeChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Solde',
        data,
        borderColor: color,
        backgroundColor: bg,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: data.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8892a4', font: { size: 11 }, maxTicksLimit: 8, maxRotation: 0 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8892a4', font: { size: 11 }, callback: v => v + '€' }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        tooltip: {
          ...chartDefaults.plugins.tooltip,
          callbacks: {
            label: ctx => ` Solde : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ctx.parsed.y)}`
          }
        }
      }
    },
    plugins: [{
      id: 'zeroLine',
      afterDraw(chart) {
        const { ctx, scales: { y }, chartArea: { left, right } } = chart
        if (!y) return
        ctx.save()
        ctx.beginPath()
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.moveTo(left, y.getPixelForValue(0))
        ctx.lineTo(right, y.getPixelForValue(0))
        ctx.stroke()
        ctx.restore()
      }
    }]
  })
}

// ─── Export ───────────────────────────────────────────────────────
function exportCSV() {
  const rows = [
    ['Mois', 'Revenus', 'Dépenses', 'Épargne'],
    ...bilanMensuel.value.map(m => [m.label, m.revenus.toFixed(2), m.depenses.toFixed(2), m.epargne.toFixed(2)])
  ]
  const csv = rows.map(r => r.join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `financeflow-stats-${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function exportPDF() { window.print() }

// ─── Lifecycle ────────────────────────────────────────────────────
let unsubs = []

watch([bilanMensuel, depensesParCat, evolutionSolde], async () => {
  await nextTick()
  if (hasData.value) {
    buildLineChart()
    buildDonutChart()
    buildSoldeChart()
  }
}, { deep: true })

onMounted(() => {
  unsubs.push(financeStore.ecouter_revenus())
  unsubs.push(financeStore.ecouter_depenses())
  nextTick(() => {
    if (hasData.value) {
      buildLineChart()
      buildDonutChart()
      buildSoldeChart()
    }
  })
})

onUnmounted(() => {
  unsubs.forEach(fn => fn && fn())
  if (lineChart)  lineChart.destroy()
  if (donutChart) donutChart.destroy()
  if (soldeChart) soldeChart.destroy()
})
</script>

<style scoped>
.kpi-label { font-size:13px;color:var(--text-secondary);font-weight:500;margin-bottom:8px }
.kpi-value { font-family:var(--font-display);font-size:1.9rem;font-weight:700;margin-bottom:4px }
.kpi-sub   { font-size:13px;color:var(--text-muted) }

.period-tabs { display:flex;gap:6px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:4px;width:fit-content }
.period-btn  { padding:7px 18px;border-radius:8px;border:none;background:none;color:var(--text-secondary);font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font-body);transition:all var(--transition) }
.period-btn.active { background:var(--accent-dim);color:var(--accent);border:1px solid var(--border-accent) }
.period-btn:hover:not(.active) { color:var(--text-primary) }

.empty-chart { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:32px;color:var(--text-muted);font-size:14px;min-height:160px }

.bilan-table  { display:flex;flex-direction:column }
.bilan-header { display:grid;grid-template-columns:120px 1fr 1fr 1fr 200px;gap:12px;padding:10px 12px;font-size:12px;font-weight:600;color:var(--text-muted);letter-spacing:0.05em;text-transform:uppercase;border-bottom:1px solid var(--border) }
.bilan-row    { display:grid;grid-template-columns:120px 1fr 1fr 1fr 200px;gap:12px;padding:12px;font-size:14px;align-items:center;border-bottom:1px solid var(--border);transition:background var(--transition) }
.bilan-row:last-child { border-bottom:none }
.bilan-row:hover { background:var(--bg-elevated);border-radius:var(--radius) }
.bilan-mois     { font-weight:600 }
.bilan-progress { display:flex;align-items:center;gap:8px }
.bilan-bar      { height:6px;border-radius:99px;transition:width 0.6s ease }
.bilan-pct      { font-size:12px;font-weight:700;min-width:36px;text-align:right }

.projection-row    { display:flex;align-items:center;gap:10px;margin-bottom:12px }
.projection-label  { font-size:13px;color:var(--text-secondary);width:60px;flex-shrink:0 }
.projection-bar-wrap  { flex:1 }
.projection-bar-track { height:8px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.projection-bar-fill  { height:100%;background:linear-gradient(90deg,var(--accent),#00b4d8);border-radius:99px;transition:width 0.6s ease }
.projection-amount { font-size:13px;font-weight:600;color:var(--accent);min-width:90px;text-align:right;flex-shrink:0 }
.projection-total  { display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--accent-dim);border:1px solid var(--border-accent);border-radius:var(--radius);margin-top:16px;font-size:14px }

.insights-list { display:flex;flex-direction:column;gap:10px }
.insight-item  { display:flex;gap:12px;padding:14px;border-radius:var(--radius);border:1px solid }
.insight-item.good { background:rgba(0,229,160,0.06);border-color:rgba(0,229,160,0.2) }
.insight-item.warn { background:rgba(255,159,67,0.06);border-color:rgba(255,159,67,0.2) }
.insight-item.bad  { background:rgba(255,107,107,0.06);border-color:rgba(255,107,107,0.2) }
.insight-item.info { background:rgba(79,172,254,0.06);border-color:rgba(79,172,254,0.2) }
.insight-icon  { font-size:18px;flex-shrink:0;margin-top:1px }
.insight-title { font-size:13px;font-weight:700;margin-bottom:2px }
.insight-text  { font-size:13px;color:var(--text-secondary);line-height:1.4 }

@media (max-width:768px) {
  .bilan-header { display:none }
  .bilan-row { grid-template-columns:1fr 1fr;gap:8px }
  .bilan-mois { grid-column:1/-1;font-size:15px }
  .bilan-progress { grid-column:1/-1 }
}
@media print { .btn { display:none } }
</style>