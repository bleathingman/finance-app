<template>
  <div class="animate-fade-in">

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <h1>Bonjour, {{ userName }} 👋</h1>
        <p>{{ moisCourant }} — voici votre situation financière</p>
      </div>
      <div class="header-date">{{ dateAujourdhui }}</div>
    </div>

    <!-- KPI Cards -->
    <div class="grid-4" style="margin-bottom:24px">
      <div class="card card-accent kpi-card">
        <div class="kpi-icon" style="background:rgba(0,229,160,0.15);color:var(--accent)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="kpi-label">Solde du mois</div>
        <div class="kpi-value" :style="{ color: financeStore.solde >= 0 ? 'var(--accent)' : 'var(--red)' }">
          {{ formatAmount(financeStore.solde) }}
        </div>
        <div class="kpi-trend" :class="financeStore.solde >= 0 ? 'positive' : 'negative'">
          {{ financeStore.solde >= 0 ? '↑ Positif' : '↓ Négatif' }}
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon" style="background:rgba(0,229,160,0.1);color:var(--green)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 6 23 6 23 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="kpi-label">Revenus</div>
        <div class="kpi-value" style="color:var(--green)">{{ formatAmount(financeStore.totalRevenus) }}</div>
        <div class="kpi-trend">{{ financeStore.revenus.length }} transaction(s)</div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon" style="background:rgba(255,107,107,0.1);color:var(--red)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 18 23 18 23 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="kpi-label">Dépenses</div>
        <div class="kpi-value" style="color:var(--red)">{{ formatAmount(financeStore.totalDepenses) }}</div>
        <div class="kpi-trend negative">{{ financeStore.depenses.length }} transaction(s)</div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon" style="background:rgba(79,172,254,0.1);color:var(--blue)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
        </div>
        <div class="kpi-label">Taux d'épargne</div>
        <div class="kpi-value" :style="{ color: tauxEpargne >= 20 ? 'var(--green)' : tauxEpargne >= 10 ? 'var(--orange)' : 'var(--red)' }">
          {{ tauxEpargne }}%
        </div>
        <div class="kpi-trend">objectif : 20%</div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="grid-2" style="margin-bottom:24px">

      <!-- Camembert dépenses -->
      <div class="card">
        <h3 style="font-family:var(--font-display);margin-bottom:18px">Dépenses par catégorie</h3>
        <div v-if="depensesParCat.length === 0" class="chart-empty">
          <span>🥧</span><p>Aucune dépense ce mois</p>
          <router-link to="/depenses" class="btn btn-ghost" style="font-size:13px;margin-top:8px">+ Ajouter</router-link>
        </div>
        <div v-else style="display:flex;gap:20px;align-items:center">
          <div style="position:relative;width:150px;height:150px;flex-shrink:0">
            <canvas ref="donutRef"></canvas>
            <div class="donut-center">
              <div style="font-family:var(--font-display);font-size:13px;font-weight:800;color:var(--text-primary)">{{ formatAmountShort(financeStore.totalDepenses) }}</div>
              <div style="font-size:10px;color:var(--text-muted)">total</div>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:7px;min-width:0">
            <div v-for="cat in depensesParCat.slice(0,6)" :key="cat.nom" class="legend-row">
              <span class="legend-dot" :style="{ background: cat.color }"></span>
              <span class="legend-label">{{ cat.emoji }} {{ cat.nom }}</span>
              <span class="legend-pct">{{ cat.pct }}%</span>
              <span class="legend-amount">{{ formatAmountShort(cat.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Courbe 30 jours -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
          <h3 style="font-family:var(--font-display)">Évolution sur 30 jours</h3>
          <div style="display:flex;gap:10px;font-size:12px;color:var(--text-muted)">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block"></span>Revenus</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:var(--red);display:inline-block"></span>Dépenses</span>
          </div>
        </div>
        <div v-if="!hasData" class="chart-empty">
          <span>📈</span><p>Pas encore de données</p>
        </div>
        <div v-else style="position:relative;height:180px">
          <canvas ref="lineRef"></canvas>
        </div>
      </div>
    </div>

    <!-- Budget + Objectifs + Transactions -->
    <div class="grid-2" style="margin-bottom:24px">

      <!-- Budgets -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-family:var(--font-display)">Budgets du mois</h3>
          <router-link to="/budget" class="btn btn-ghost" style="font-size:12px;padding:6px 12px">Voir tout</router-link>
        </div>
        <div v-if="financeStore.budgets.length === 0" class="chart-empty" style="min-height:100px">
          <span>📊</span>
          <router-link to="/budget" class="btn btn-ghost" style="font-size:13px;margin-top:4px">Définir des budgets</router-link>
        </div>
        <div v-else class="budget-list">
          <div v-for="b in budgetsAvecStats.slice(0,5)" :key="b.categorie" class="budget-row">
            <div class="budget-row-info">
              <span>{{ b.emoji }} {{ b.categorie }}</span>
              <span style="font-size:12px;color:var(--text-muted)">{{ formatAmount(b.depense) }} / {{ formatAmount(b.montant) }}</span>
            </div>
            <div class="budget-bar-track">
              <div class="budget-bar-fill" :style="{ width: Math.min(b.taux,100)+'%', background: b.taux>=100?'var(--red)':b.taux>=75?'var(--orange)':'var(--green)' }"></div>
            </div>
            <span class="budget-pct" :style="{ color: b.taux>=100?'var(--red)':b.taux>=75?'var(--orange)':'var(--text-muted)' }">{{ b.taux }}%</span>
          </div>
        </div>
      </div>

      <!-- Objectifs -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-family:var(--font-display)">Objectifs d'épargne</h3>
          <router-link to="/objectifs" class="btn btn-ghost" style="font-size:12px;padding:6px 12px">Voir tout</router-link>
        </div>
        <div v-if="financeStore.objectifs.length === 0" class="chart-empty" style="min-height:100px">
          <span>🎯</span>
          <router-link to="/objectifs" class="btn btn-ghost" style="font-size:13px;margin-top:4px">Créer un objectif</router-link>
        </div>
        <div v-else class="objectifs-list">
          <div v-for="obj in objectifsAvecStats.slice(0,4)" :key="obj.id" class="objectif-row">
            <div class="objectif-row-emoji" :style="{ background: (obj.couleur||'#00e5a0') + '20' }">{{ obj.emoji || '🎯' }}</div>
            <div class="objectif-row-info">
              <div style="font-size:14px;font-weight:600">{{ obj.nom }}</div>
              <div class="obj-bar-track" style="margin-top:5px">
                <div class="obj-bar-fill" :style="{ width: Math.min(obj.pct,100)+'%', background: obj.couleur||'var(--accent)' }"></div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:13px;font-weight:700" :style="{ color: obj.couleur||'var(--accent)' }">{{ obj.pct }}%</div>
              <div style="font-size:11px;color:var(--text-muted)">{{ formatAmountShort(obj.montantActuel) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions récentes -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <h3 style="font-family:var(--font-display)">Transactions récentes</h3>
        <div style="display:flex;gap:8px">
          <router-link to="/revenus" class="btn btn-ghost" style="font-size:12px;padding:6px 12px">+ Revenu</router-link>
          <router-link to="/depenses" class="btn btn-primary" style="font-size:12px;padding:6px 12px">+ Dépense</router-link>
        </div>
      </div>

      <div v-if="recentTransactions.length === 0" class="chart-empty" style="padding:32px">
        <span style="font-size:2.5rem">📋</span>
        <p>Aucune transaction pour l'instant</p>
        <div style="display:flex;gap:8px;margin-top:12px">
          <router-link to="/revenus" class="btn btn-ghost" style="font-size:13px">+ Revenu</router-link>
          <router-link to="/depenses" class="btn btn-primary" style="font-size:13px">+ Dépense</router-link>
        </div>
      </div>

      <div v-else>
        <div v-for="tx in recentTransactions" :key="tx.id + tx.type" class="tx-row">
          <div class="tx-icon" :style="{ background: tx.type === 'revenu' ? 'rgba(0,229,160,0.1)' : 'rgba(255,107,107,0.1)' }">
            {{ tx.emoji }}
          </div>
          <div class="tx-main">
            <div class="tx-desc">{{ tx.description }}</div>
            <div class="tx-meta">
              <span class="badge" :style="tx.type==='revenu'?'background:rgba(0,229,160,0.12);color:var(--green)':'background:rgba(255,107,107,0.12);color:var(--red)'">
                {{ tx.type === 'revenu' ? tx.type_ || 'Revenu' : tx.categorie }}
              </span>
              <span style="font-size:12px;color:var(--text-muted)">{{ formatDate(tx.createdAt) }}</span>
            </div>
          </div>
          <div :class="tx.type === 'revenu' ? 'amount-positive' : 'amount-negative'" style="font-size:15px;font-weight:700;flex-shrink:0">
            {{ tx.type === 'revenu' ? '+' : '-' }}{{ formatAmount(tx.montant) }}
          </div>
        </div>
      </div>

      <!-- Solde récap -->
      <div v-if="recentTransactions.length > 0" class="solde-recap">
        <div class="solde-item">
          <span>Total revenus</span>
          <span class="amount-positive">+{{ formatAmount(financeStore.totalRevenus) }}</span>
        </div>
        <div class="solde-item">
          <span>Total dépenses</span>
          <span class="amount-negative">-{{ formatAmount(financeStore.totalDepenses) }}</span>
        </div>
        <div class="solde-item solde-final">
          <span>Solde net</span>
          <span :class="financeStore.solde >= 0 ? 'amount-positive' : 'amount-negative'">
            {{ financeStore.solde >= 0 ? '+' : '' }}{{ formatAmount(financeStore.solde) }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useAuthStore } from '@/stores/auth'
import { useFinanceStore } from '@/stores/finance'

Chart.register(...registerables)

const authStore    = useAuthStore()
const financeStore = useFinanceStore()
const donutRef     = ref(null)
const lineRef      = ref(null)
let donutChart = null
let lineChart  = null

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
function catColor(nom) { return categories.find(c => c.nom === nom)?.color || '#94a3b8' }
function catEmoji(nom) { return categories.find(c => c.nom === nom)?.emoji || '💳' }
function typeEmoji(type) {
  const map = { 'Salaire':'💼','Freelance':'🧑‍💻','Revenus passifs':'📈','Autres':'💡' }
  return map[type] || '💰'
}

// ─── Helpers ──────────────────────────────────────────────────────
const userName = computed(() => {
  const u = authStore.user
  return u?.displayName || u?.email?.split('@')[0] || 'vous'
})

const moisCourant = computed(() =>
  new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

const dateAujourdhui = computed(() =>
  new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
)

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}
function formatAmountShort(n) {
  if (!n) return '0€'
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k€'
  return Math.round(n) + '€'
}
function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ─── Computed données ─────────────────────────────────────────────
const hasData = computed(() =>
  financeStore.revenus.length > 0 || financeStore.depenses.length > 0
)

const tauxEpargne = computed(() => {
  if (!financeStore.totalRevenus) return 0
  return Math.max(0, Math.round((financeStore.solde / financeStore.totalRevenus) * 100))
})

const depensesParCat = computed(() => {
  const map = {}
  financeStore.depenses.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
  const total = financeStore.totalDepenses || 1
  return Object.entries(map)
    .map(([nom, t]) => ({ nom, total: t, pct: Math.round((t / total) * 100), color: catColor(nom), emoji: catEmoji(nom) }))
    .sort((a, b) => b.total - a.total)
})

// Données 30 derniers jours
const donnees30j = computed(() => {
  const jours = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    const ds = d.toDateString()
    const revenus  = financeStore.revenus.filter(r => {
      const rd = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0)
      return rd.toDateString() === ds
    }).reduce((s, r) => s + r.montant, 0)
    const depenses = financeStore.depenses.filter(dep => {
      const dd = dep.createdAt?.toDate ? dep.createdAt.toDate() : new Date(dep.createdAt || 0)
      return dd.toDateString() === ds
    }).reduce((s, d) => s + d.montant, 0)
    jours.push({ key, revenus, depenses })
  }
  return jours
})

// Budgets avec stats
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
    const depense = depenseParCat.value[b.categorie] || 0
    const taux    = b.montant > 0 ? Math.round((depense / b.montant) * 100) : 0
    return { ...b, depense, taux, emoji: catEmoji(b.categorie) }
  }).sort((a, b) => b.taux - a.taux)
)

const objectifsAvecStats = computed(() =>
  financeStore.objectifs.map(o => ({
    ...o,
    pct: o.montantCible > 0 ? Math.round((o.montantActuel / o.montantCible) * 100) : 0
  }))
)

// Transactions récentes (mix revenus + dépenses)
const recentTransactions = computed(() => {
  const revs = financeStore.revenus.map(r => ({ ...r, type: 'revenu', emoji: typeEmoji(r.type), type_: r.type }))
  const deps = financeStore.depenses.map(d => ({ ...d, type: 'depense', emoji: catEmoji(d.categorie) }))
  return [...revs, ...deps]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 8)
})

// ─── Charts ───────────────────────────────────────────────────────
function buildDonut() {
  if (!donutRef.value || !depensesParCat.value.length) return
  if (donutChart) { donutChart.destroy(); donutChart = null }
  donutChart = new Chart(donutRef.value, {
    type: 'doughnut',
    data: {
      labels: depensesParCat.value.map(c => c.nom),
      datasets: [{
        data: depensesParCat.value.map(c => c.total),
        backgroundColor: depensesParCat.value.map(c => c.color),
        borderColor: '#12151f',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1e2e', borderColor: '#ffffff10', borderWidth: 1, padding: 10,
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(2)}€` }
        }
      }
    }
  })
}

function buildLine() {
  if (!lineRef.value) return
  if (lineChart) { lineChart.destroy(); lineChart = null }
  // Afficher seulement 1 jour sur 3 pour lisibilité
  const labels  = donnees30j.value.map((d, i) => i % 5 === 0 ? d.key : '')
  const revenus  = donnees30j.value.map(d => d.revenus)
  const depenses = donnees30j.value.map(d => d.depenses)
  lineChart = new Chart(lineRef.value, {
    type: 'bar',
    data: {
      labels: donnees30j.value.map(d => d.key),
      datasets: [
        {
          label: 'Revenus',
          data: revenus,
          backgroundColor: 'rgba(0,229,160,0.7)',
          borderRadius: 4,
          borderSkipped: false
        },
        {
          label: 'Dépenses',
          data: depenses,
          backgroundColor: 'rgba(255,107,107,0.7)',
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1e2e', borderColor: '#ffffff10', borderWidth: 1, padding: 10,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}€` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#8892a4', font: { size: 10 },
            maxTicksLimit: 8,
            callback: (val, i) => i % 5 === 0 ? donnees30j.value[i]?.key : ''
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8892a4', font: { size: 10 }, callback: v => v + '€' }
        }
      }
    }
  })
}

watch([depensesParCat, donnees30j], async () => {
  await nextTick()
  buildDonut()
  if (hasData.value) buildLine()
}, { deep: true })

let unsubs = []
onMounted(async () => {
  unsubs.push(financeStore.ecouter_revenus())
  unsubs.push(financeStore.ecouter_depenses())
  unsubs.push(financeStore.ecouter_budgets())
  unsubs.push(financeStore.ecouter_objectifs())
  await nextTick()
  buildDonut()
  if (hasData.value) buildLine()
})
onUnmounted(() => {
  unsubs.forEach(fn => fn && fn())
  if (donutChart) donutChart.destroy()
  if (lineChart)  lineChart.destroy()
})
</script>

<style scoped>
/* Header */
.header-date {
  font-size:13px;color:var(--text-muted);
  background:var(--bg-surface);border:1px solid var(--border);
  border-radius:var(--radius);padding:8px 14px;
  text-transform:capitalize;
}

/* KPI */
.kpi-card  { display:flex;flex-direction:column;gap:4px;position:relative;overflow:hidden }
.kpi-icon  { width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:8px }
.kpi-label { font-size:12px;color:var(--text-secondary);font-weight:500;text-transform:uppercase;letter-spacing:0.05em }
.kpi-value { font-family:var(--font-display);font-size:1.7rem;font-weight:800;line-height:1.1 }
.kpi-trend { font-size:12px;color:var(--text-muted);margin-top:2px }
.kpi-trend.positive { color:var(--green) }
.kpi-trend.negative { color:var(--red) }

/* Donut */
.donut-center {
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  text-align:center;pointer-events:none;
}

/* Légende */
.legend-row    { display:flex;align-items:center;gap:6px;font-size:12px }
.legend-dot    { width:8px;height:8px;border-radius:50%;flex-shrink:0 }
.legend-label  { flex:1;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.legend-pct    { color:var(--text-muted);min-width:28px;text-align:right }
.legend-amount { font-weight:600;min-width:40px;text-align:right }

/* Chart empty */
.chart-empty { display:flex;flex-direction:column;align-items:center;gap:6px;padding:24px;color:var(--text-muted);font-size:14px;text-align:center }
.chart-empty span { font-size:2rem }

/* Budget list */
.budget-list { display:flex;flex-direction:column;gap:10px }
.budget-row  { display:grid;grid-template-columns:1fr auto 36px;align-items:center;gap:8px }
.budget-row-info { display:flex;justify-content:space-between;font-size:13px;font-weight:500;grid-column:1/-1 }
.budget-bar-track { height:5px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.budget-bar-fill  { height:100%;border-radius:99px;transition:width 0.8s ease }
.budget-pct { font-size:11px;font-weight:700;text-align:right }

/* Objectifs list */
.objectifs-list { display:flex;flex-direction:column;gap:12px }
.objectif-row   { display:flex;align-items:center;gap:12px }
.objectif-row-emoji { width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0 }
.objectif-row-info  { flex:1;min-width:0 }
.obj-bar-track { height:5px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.obj-bar-fill  { height:100%;border-radius:99px;transition:width 0.8s ease }

/* Transactions */
.tx-row   { display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border) }
.tx-row:last-of-type { border-bottom:none }
.tx-icon  { width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0 }
.tx-main  { flex:1;min-width:0 }
.tx-desc  { font-size:14px;font-weight:500;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.tx-meta  { display:flex;align-items:center;gap:6px }

/* Solde récap */
.solde-recap { margin-top:16px;padding:16px;background:var(--bg-elevated);border-radius:var(--radius);display:flex;flex-direction:column;gap:8px }
.solde-item  { display:flex;justify-content:space-between;align-items:center;font-size:14px;color:var(--text-secondary) }
.solde-item.solde-final { padding-top:8px;border-top:1px solid var(--border);font-weight:700;color:var(--text-primary);font-size:15px }
</style>
