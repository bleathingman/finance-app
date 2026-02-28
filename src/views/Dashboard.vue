<template>
  <div class="animate-fade-in">

    <!-- Notification récurrents -->
    <transition name="slide-down">
      <div v-if="notifRecurrents > 0" class="notif-banner">
        <span>🔄</span>
        <span><strong>{{ notifRecurrents }} transaction(s) récurrente(s)</strong> ont été ajoutées automatiquement pour {{ moisCourant }}.</span>
        <button class="notif-close" @click="notifRecurrents = 0">✕</button>
      </div>
    </transition>

    <!-- Header -->
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <h1>Bonjour, {{ userName }} 👋</h1>
        <p>{{ moisCourant }} — voici votre situation financière</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <!-- Sélecteur de compte (Pro) -->
        <div v-if="subStore.can('multiAccounts') && comptesStore.comptes.length > 0" class="compte-selector">
          <button
            v-for="c in comptesStore.tousLesComptes" :key="String(c.id)"
            class="compte-chip"
            :class="{ active: comptesStore.compteActifId === c.id }"
            :style="comptesStore.compteActifId === c.id && c.couleur ? { background: c.couleur + '22', borderColor: c.couleur, color: c.couleur } : {}"
            @click="comptesStore.setCompteActif(c.id)">
            {{ c.emoji || c.nom[0] }} {{ c.nom }}
          </button>
        </div>
        <div class="header-date">{{ dateAujourdhui }}</div>
      </div>
    </div>

    <!-- KPI Cards avec comparaison mois précédent -->
    <div class="grid-4" style="margin-bottom:24px">

      <div class="card card-accent kpi-card">
        <div class="kpi-icon" style="background:rgba(0,229,160,0.15);color:var(--accent)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div class="kpi-label">Solde du compte</div>
        <div class="kpi-value" :style="{ color: soldeReel >= 0 ? 'var(--accent)' : 'var(--red)' }">
          {{ formatAmount(soldeReel) }}
        </div>
        <div class="kpi-compare" :class="soldeCeMois >= 0 ? 'up' : 'down'">
          {{ soldeCeMois >= 0 ? '▲' : '▼' }} {{ formatAmount(Math.abs(soldeCeMois)) }} ce mois
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon" style="background:rgba(0,229,160,0.1);color:var(--green)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 6 23 6 23 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="kpi-label">Revenus</div>
        <div class="kpi-value" style="color:var(--green)">{{ formatAmount(revenusCeMois) }}</div>
        <div class="kpi-compare" :class="deltaRevenus >= 0 ? 'up' : 'down'">
          {{ deltaRevenus >= 0 ? '▲' : '▼' }} {{ pctChange(revenusCeMois, revenusMoisPrec) }}% vs {{ labelMoisPrec }}
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon" style="background:rgba(255,107,107,0.1);color:var(--red)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 18 23 18 23 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="kpi-label">Dépenses</div>
        <div class="kpi-value" style="color:var(--red)">{{ formatAmount(depensesCeMois) }}</div>
        <div class="kpi-compare" :class="deltaDepenses <= 0 ? 'up' : 'down'">
          {{ deltaDepenses >= 0 ? '▲' : '▼' }} {{ pctChange(depensesCeMois, depensesMoisPrec) }}% vs {{ labelMoisPrec }}
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon" style="background:rgba(79,172,254,0.1);color:var(--blue)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
        </div>
        <div class="kpi-label">Taux d'épargne</div>
        <div class="kpi-value" :style="{ color: tauxEpargne >= 20 ? 'var(--green)' : tauxEpargne >= 10 ? 'var(--orange)' : 'var(--red)' }">
          {{ tauxEpargne }}%
        </div>
        <div class="kpi-compare" :class="deltaTaux >= 0 ? 'up' : 'down'">
          {{ deltaTaux >= 0 ? '▲' : '▼' }} {{ Math.abs(deltaTaux) }}pts vs {{ labelMoisPrec }}
        </div>
      </div>
    </div>

    <!-- Comparaison mois par mois détaillée -->
    <div class="card" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px">
        <h3 style="font-family:var(--font-display)">Comparaison mois par mois</h3>
        <div style="display:flex;gap:12px;font-size:12px;color:var(--text-muted)">
          <span style="display:flex;align-items:center;gap:5px"><span class="dot-mois-prec"></span>{{ labelMoisPrec }}</span>
          <span style="display:flex;align-items:center;gap:5px"><span class="dot-mois-curr"></span>{{ moisCourant }}</span>
        </div>
      </div>

      <div class="comparaison-grid">
        <div v-for="item in comparaisonItems" :key="item.label" class="comparaison-item">
          <div class="comp-label">{{ item.emoji }} {{ item.label }}</div>
          <div class="comp-bars">
            <div class="comp-bar-row">
              <span class="comp-bar-month">{{ labelMoisPrec }}</span>
              <div class="comp-bar-track">
                <div class="comp-bar-fill prec" :style="{ width: item.pctPrec + '%' }"></div>
              </div>
              <span class="comp-bar-val">{{ formatAmount(item.valPrec) }}</span>
            </div>
            <div class="comp-bar-row">
              <span class="comp-bar-month">Ce mois</span>
              <div class="comp-bar-track">
                <div class="comp-bar-fill curr" :style="{ width: item.pctCurr + '%', background: item.color }"></div>
              </div>
              <span class="comp-bar-val" :style="{ color: item.color }">{{ formatAmount(item.valCurr) }}</span>
            </div>
          </div>
          <div class="comp-delta" :class="item.deltaPositif ? 'delta-good' : 'delta-bad'">
            {{ item.deltaPositif ? '▲' : '▼' }} {{ Math.abs(item.deltaPct) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Prévision fin de mois (Premium) ──────────────────────────── -->
    <div v-if="subStore.can('forecast')" class="card prevision-card" style="margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="font-family:var(--font-display)">📅 Prévision fin de mois</h3>
          <p style="font-size:13px;color:var(--text-muted);margin-top:2px">
            J{{ prevision.jourDuMois }} / {{ prevision.joursTotal }} — {{ prevision.joursRestants }} jours restants
          </p>
        </div>
        <div class="prevision-badge" :class="prevision.tendance">
          {{ prevision.tendance === 'bonne' ? '✅ Bonne trajectoire' : prevision.tendance === 'neutre' ? '⚠️ À surveiller' : '🔴 Budget dépassé' }}
        </div>
      </div>

      <div class="prevision-grid">
        <div class="prevision-jauge">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:6px">
            <span>Début du mois</span><span>{{ prevision.pctMois }}% écoulé</span><span>Fin du mois</span>
          </div>
          <div class="jauge-track">
            <div class="jauge-fill" :style="{ width: prevision.pctMois + '%' }"></div>
            <div class="jauge-cursor" :style="{ left: prevision.pctMois + '%' }"></div>
          </div>
        </div>

        <div class="prevision-metrics">
          <div class="prevision-metric">
            <div class="prev-metric-icon" style="background:rgba(255,107,107,0.1)">💸</div>
            <div>
              <div class="prev-metric-label">Dépenses projetées</div>
              <div class="prev-metric-value" style="color:var(--red)">{{ formatAmount(prevision.depProjectees) }}</div>
              <div class="prev-metric-sub">Actuelles : {{ formatAmount(prevision.depActuelles) }}</div>
            </div>
          </div>
          <div class="prevision-metric">
            <div class="prev-metric-icon" style="background:rgba(0,229,160,0.1)">💰</div>
            <div>
              <div class="prev-metric-label">Solde prévu</div>
              <div class="prev-metric-value" :style="{ color: prevision.soldePrevu >= 0 ? 'var(--accent)' : 'var(--red)' }">
                {{ formatAmount(prevision.soldePrevu) }}
              </div>
              <div class="prev-metric-sub">Revenus : {{ formatAmount(prevision.revProjectes) }}</div>
            </div>
          </div>
          <div class="prevision-metric">
            <div class="prev-metric-icon" style="background:rgba(79,172,254,0.1)">📆</div>
            <div>
              <div class="prev-metric-label">Budget / jour restant</div>
              <div class="prev-metric-value" style="color:var(--blue)">{{ formatAmount(prevision.budgetPJ) }}</div>
              <div class="prev-metric-sub">Rythme actuel : {{ formatAmount(prevision.rythmePJ) }}/j</div>
            </div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:8px">
            <span>Dépenses projetées vs revenus</span>
            <span :style="{ color: prevision.depProjectees > prevision.revProjectes ? 'var(--red)' : 'var(--accent)' }">
              {{ Math.round((prevision.depProjectees / (prevision.revProjectes || 1)) * 100) }}%
            </span>
          </div>
          <div class="prev-bar-track">
            <div class="prev-bar-fill actual"
              :style="{ width: Math.min((prevision.depActuelles / (prevision.revProjectes || 1)) * 100, 100) + '%' }">
            </div>
            <div class="prev-bar-fill projected"
              :style="{
                left: Math.min((prevision.depActuelles / (prevision.revProjectes || 1)) * 100, 100) + '%',
                width: Math.min(((prevision.depProjectees - prevision.depActuelles) / (prevision.revProjectes || 1)) * 100, 100 - Math.min((prevision.depActuelles / (prevision.revProjectes || 1)) * 100, 100)) + '%'
              }">
            </div>
            <div class="prev-bar-danger-line"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:4px">
            <span>0€</span>
            <span style="color:var(--accent)">Revenus : {{ formatAmount(prevision.revProjectes) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bannière upgrade si pas Premium -->
    <div v-else class="card prevision-locked" style="margin-bottom:24px">
      <span style="font-size:32px">📅</span>
      <div>
        <div style="font-weight:700;font-size:15px">Prévision fin de mois</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:2px">
          Anticipez votre solde de fin de mois et votre budget journalier restant
        </div>
      </div>
      <router-link to="/pricing" class="btn btn-primary" style="flex-shrink:0">💎 Premium</router-link>
    </div>

    <!-- Graphiques -->
    <div class="grid-2" style="margin-bottom:24px">
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
              <div style="font-family:var(--font-display);font-size:13px;font-weight:800">{{ formatAmountShort(depensesCeMois) }}</div>
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

    <!-- Budget + Objectifs -->
    <div class="grid-2" style="margin-bottom:24px">
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
      </div>
      <div v-else>
        <div v-for="tx in recentTransactions" :key="tx.id + tx.type" class="tx-row">
          <div class="tx-icon" :style="{ background: tx.type === 'revenu' ? 'rgba(0,229,160,0.1)' : 'rgba(255,107,107,0.1)' }">
            {{ tx.emoji }}
            <span v-if="tx.autoGenere" class="auto-badge" title="Généré automatiquement">🔄</span>
          </div>
          <div class="tx-main">
            <div class="tx-desc">
              {{ tx.description }}
              <span v-if="tx.autoGenere" style="font-size:11px;color:var(--blue);margin-left:6px">auto</span>
            </div>
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

      <div v-if="recentTransactions.length > 0" class="solde-recap">
        <div class="solde-item">
          <span>Total revenus</span>
          <span class="amount-positive">+{{ formatAmount(revenusCeMois) }}</span>
        </div>
        <div class="solde-item">
          <span>Total dépenses</span>
          <span class="amount-negative">-{{ formatAmount(depensesCeMois) }}</span>
        </div>
        <div class="solde-item solde-final">
          <span>Solde du compte</span>
          <span :class="soldeReel >= 0 ? 'amount-positive' : 'amount-negative'">
            {{ soldeReel >= 0 ? '+' : '' }}{{ formatAmount(soldeReel) }}
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
import { useSubscriptionStore } from '@/stores/subscription'
import { useComptesStore } from '@/stores/comptes'
import { processRecurringTransactions } from '@/stores/recurring'

Chart.register(...registerables)

const authStore    = useAuthStore()
const financeStore = useFinanceStore()
const subStore     = useSubscriptionStore()
const comptesStore = useComptesStore()
const donutRef     = ref(null)
const lineRef      = ref(null)
const notifRecurrents = ref(0)
let donutChart = null
let lineChart  = null

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
function typeEmoji(type) {
  const map = { 'Salaire':'💼','Freelance':'🧑‍💻','Revenus passifs':'📈','Autres':'💡' }
  return map[type] || '💰'
}

// ─── Helpers ──────────────────────────────────────────────────────
const userName = computed(() => {
  const u = authStore.user
  return u?.displayName || u?.email?.split('@')[0] || 'vous'
})

const now = new Date()
const moisCourant = computed(() => now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
const dateAujourdhui = computed(() => now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))

const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
const labelMoisPrec = prevMonth.toLocaleDateString('fr-FR', { month: 'long' })

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
function pctChange(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0
  return Math.abs(Math.round(((curr - prev) / prev) * 100))
}

// ─── Filtrage par mois + compte actif ────────────────────────────
function txDuMois(liste, annee, mois) {
  const compteId = comptesStore.compteActifId
  return liste.filter(tx => {
    if (!tx.createdAt) return false
    const d = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt)
    if (d.getFullYear() !== annee || d.getMonth() !== mois) return false
    if (compteId !== null) return (tx.compteId || null) === compteId
    return true
  })
}

// Mois courant
const revenusCeMois   = computed(() => txDuMois(financeStore.revenus, now.getFullYear(), now.getMonth()).reduce((s,r) => s+r.montant, 0))
const depensesCeMois  = computed(() => txDuMois(financeStore.depenses, now.getFullYear(), now.getMonth()).reduce((s,d) => s+d.montant, 0))
const soldeCeMois     = computed(() => revenusCeMois.value - depensesCeMois.value)
const tauxEpargne     = computed(() => revenusCeMois.value > 0 ? Math.max(0, Math.round((soldeCeMois.value / revenusCeMois.value) * 100)) : 0)

// Mois précédent
const revenusMoisPrec  = computed(() => txDuMois(financeStore.revenus, prevMonth.getFullYear(), prevMonth.getMonth()).reduce((s,r) => s+r.montant, 0))
const depensesMoisPrec = computed(() => txDuMois(financeStore.depenses, prevMonth.getFullYear(), prevMonth.getMonth()).reduce((s,d) => s+d.montant, 0))
const soldeMoisPrec    = computed(() => revenusMoisPrec.value - depensesMoisPrec.value)
const tauxEpargneMoisPrec = computed(() => revenusMoisPrec.value > 0 ? Math.max(0, Math.round((soldeMoisPrec.value / revenusMoisPrec.value) * 100)) : 0)

// Deltas
const deltaRevenus  = computed(() => revenusCeMois.value - revenusMoisPrec.value)
const deltaDepenses = computed(() => depensesCeMois.value - depensesMoisPrec.value)
const deltaTaux     = computed(() => tauxEpargne.value - tauxEpargneMoisPrec.value)

// ─── Solde réel du compte actif ──────────────────────────────────
// Lit le solde calculé dynamiquement dans comptesStore.
// Les transactions sans compteId (users free existants) sont automatiquement
// rattachées au compte par défaut via calculerSolde().
const soldeReel = computed(() => {
  const compte = comptesStore.tousLesComptes?.find(c => c.id === comptesStore.compteActifId)
  return compte?.solde ?? soldeCeMois.value
})

// ─── Comparaison détaillée ────────────────────────────────────────
const comparaisonItems = computed(() => {
  const maxRev = Math.max(revenusCeMois.value, revenusMoisPrec.value) || 1
  const maxDep = Math.max(depensesCeMois.value, depensesMoisPrec.value) || 1
  const maxSol = Math.max(Math.abs(soldeCeMois.value), Math.abs(soldeMoisPrec.value)) || 1

  return [
    {
      label: 'Revenus', emoji: '💰',
      valPrec: revenusMoisPrec.value, valCurr: revenusCeMois.value,
      pctPrec: Math.round((revenusMoisPrec.value / maxRev) * 100),
      pctCurr: Math.round((revenusCeMois.value / maxRev) * 100),
      deltaPct: pctChange(revenusCeMois.value, revenusMoisPrec.value),
      deltaPositif: revenusCeMois.value >= revenusMoisPrec.value,
      color: 'var(--green)'
    },
    {
      label: 'Dépenses', emoji: '💸',
      valPrec: depensesMoisPrec.value, valCurr: depensesCeMois.value,
      pctPrec: Math.round((depensesMoisPrec.value / maxDep) * 100),
      pctCurr: Math.round((depensesCeMois.value / maxDep) * 100),
      deltaPct: pctChange(depensesCeMois.value, depensesMoisPrec.value),
      deltaPositif: depensesCeMois.value <= depensesMoisPrec.value,
      color: 'var(--red)'
    },
    {
      label: 'Épargne', emoji: '🏦',
      valPrec: soldeMoisPrec.value, valCurr: soldeCeMois.value,
      pctPrec: Math.round((Math.abs(soldeMoisPrec.value) / maxSol) * 100),
      pctCurr: Math.round((Math.abs(soldeCeMois.value) / maxSol) * 100),
      deltaPct: pctChange(soldeCeMois.value, soldeMoisPrec.value),
      deltaPositif: soldeCeMois.value >= soldeMoisPrec.value,
      color: 'var(--accent)'
    }
  ]
})

// ─── Autres computed ──────────────────────────────────────────────
const hasData = computed(() => financeStore.revenus.length > 0 || financeStore.depenses.length > 0)

const depensesParCat = computed(() => {
  const deps = txDuMois(financeStore.depenses, now.getFullYear(), now.getMonth())
  const map = {}
  deps.forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
  const total = depensesCeMois.value || 1
  return Object.entries(map)
    .map(([nom, t]) => ({ nom, total: t, pct: Math.round((t / total) * 100), color: catColor(nom), emoji: catEmoji(nom) }))
    .sort((a, b) => b.total - a.total)
})

const donnees30j = computed(() => {
  const jours = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toDateString()
    const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    const revenus  = financeStore.revenus.filter(r => { const rd = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt||0); return rd.toDateString()===ds }).reduce((s,r)=>s+r.montant,0)
    const depenses = financeStore.depenses.filter(r => { const rd = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt||0); return rd.toDateString()===ds }).reduce((s,d)=>s+d.montant,0)
    jours.push({ key, revenus, depenses })
  }
  return jours
})

const depenseParCat = computed(() => {
  const map = {}
  txDuMois(financeStore.depenses, now.getFullYear(), now.getMonth()).forEach(d => { map[d.categorie] = (map[d.categorie] || 0) + d.montant })
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
  financeStore.objectifs.map(o => ({ ...o, pct: o.montantCible > 0 ? Math.round((o.montantActuel / o.montantCible) * 100) : 0 }))
)

// ─── Prévision fin de mois ───────────────────────────────────────
const prevision = computed(() => {
  const today = new Date()
  const jourDuMois   = today.getDate()
  const joursTotal   = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const joursRestants = joursTotal - jourDuMois
  const depActuelles = depensesCeMois.value
  const rythmePJ = jourDuMois > 0 ? depActuelles / jourDuMois : 0
  const recurrentsPasEncore = financeStore.depenses
    .filter(d => {
      if (!d.recurrent || !d.createdAt) return false
      const dd = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)
      return dd.getMonth() !== today.getMonth() || dd.getFullYear() !== today.getFullYear()
    })
    .reduce((s, d) => s + d.montant, 0)
  const depProjectees = depActuelles + (rythmePJ * joursRestants) + recurrentsPasEncore
  const revProjectes  = revenusCeMois.value
  const soldePrevu    = revProjectes - depProjectees
  const pctMois       = Math.round((jourDuMois / joursTotal) * 100)
  const budgetRestant = Math.max(0, revProjectes - depActuelles)
  const budgetPJ      = joursRestants > 0 ? budgetRestant / joursRestants : 0
  const objectifEpargne = revProjectes * 0.20
  const tendance = soldePrevu >= objectifEpargne ? 'bonne' : soldePrevu >= 0 ? 'neutre' : 'mauvaise'
  return { jourDuMois, joursTotal, joursRestants, pctMois, depActuelles, depProjectees, rythmePJ, revProjectes, soldePrevu, budgetPJ, tendance }
})

const recentTransactions = computed(() => {
  const revs = financeStore.revenus.map(r => ({ ...r, type: 'revenu', emoji: typeEmoji(r.type), type_: r.type }))
  const deps = financeStore.depenses.map(d => ({ ...d, type: 'depense', emoji: catEmoji(d.categorie) }))
  return [...revs, ...deps].sort((a, b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).slice(0, 8)
})

// ─── Charts ───────────────────────────────────────────────────────
function buildDonut() {
  if (!donutRef.value || !depensesParCat.value.length) return
  if (donutChart) { donutChart.destroy(); donutChart = null }
  donutChart = new Chart(donutRef.value, {
    type: 'doughnut',
    data: {
      labels: depensesParCat.value.map(c => c.nom),
      datasets: [{ data: depensesParCat.value.map(c => c.total), backgroundColor: depensesParCat.value.map(c => c.color), borderColor: '#12151f', borderWidth: 2, hoverOffset: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1e2e', borderColor: '#ffffff10', borderWidth: 1, padding: 10, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(2)}€` } } } }
  })
}

function buildLine() {
  if (!lineRef.value) return
  if (lineChart) { lineChart.destroy(); lineChart = null }
  lineChart = new Chart(lineRef.value, {
    type: 'bar',
    data: {
      labels: donnees30j.value.map(d => d.key),
      datasets: [
        { label: 'Revenus',  data: donnees30j.value.map(d => d.revenus),  backgroundColor: 'rgba(0,229,160,0.7)',  borderRadius: 4 },
        { label: 'Dépenses', data: donnees30j.value.map(d => d.depenses), backgroundColor: 'rgba(255,107,107,0.7)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1e2e', borderColor: '#ffffff10', borderWidth: 1, padding: 10 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8892a4', font: { size: 10 }, maxTicksLimit: 8, callback: (val, i) => i % 5 === 0 ? donnees30j.value[i]?.key : '' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8892a4', font: { size: 10 }, callback: v => v + '€' } }
      }
    }
  })
}

watch([depensesParCat, donnees30j], async () => {
  await nextTick()
  buildDonut()
  if (hasData.value) buildLine()
}, { deep: true })

// ─── Lifecycle ────────────────────────────────────────────────────
let unsubs = []
onMounted(async () => {
  unsubs.push(financeStore.ecouter_revenus())
  unsubs.push(financeStore.ecouter_depenses())
  unsubs.push(financeStore.ecouter_budgets())
  unsubs.push(financeStore.ecouter_objectifs())
  unsubs.push(comptesStore.ecouter_comptes())

  // Crée un compte courant par défaut si l'user n'en a aucun.
  // S'exécute pour TOUS les users (free et pro).
  // Garantit que les transactions futures ont toujours un compteId,
  // et que les anciennes (sans compteId) sont rattachées à ce compte via calculerSolde().
  await comptesStore.initialiserCompteDefaut()

  const stopWatch = watch(
    () => comptesStore.comptes,
    (comptes) => {
      if (comptes.length > 0 && comptesStore.compteActifId === null) {
        const courant = comptes.find(c => c.type === 'courant') || comptes[0]
        comptesStore.setCompteActif(courant.id)
        stopWatch()
      }
    },
    { immediate: true }
  )

  setTimeout(async () => {
    const nb = await processRecurringTransactions()
    if (nb > 0) notifRecurrents.value = nb
  }, 2000)

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
.header-date { font-size:13px;color:var(--text-muted);background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:8px 14px;text-transform:capitalize }

.compte-selector { display:flex;gap:6px;flex-wrap:wrap }
.compte-chip {
  padding:6px 14px;border-radius:99px;border:1px solid var(--border);
  background:var(--bg-elevated);cursor:pointer;font-size:12px;font-weight:600;
  font-family:var(--font-body);color:var(--text-secondary);
  transition:all var(--transition);white-space:nowrap;
}
.compte-chip:hover { border-color:var(--border-accent);color:var(--text-primary) }
.compte-chip.active { font-weight:700 }

.notif-banner { display:flex;align-items:center;gap:10px;padding:12px 18px;margin-bottom:20px;background:rgba(79,172,254,0.1);border:1px solid rgba(79,172,254,0.25);border-radius:var(--radius);font-size:14px }
.notif-close  { margin-left:auto;background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px }

.kpi-card    { display:flex;flex-direction:column;gap:4px }
.kpi-icon    { width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:8px }
.kpi-label   { font-size:12px;color:var(--text-secondary);font-weight:500;text-transform:uppercase;letter-spacing:0.05em }
.kpi-value   { font-family:var(--font-display);font-size:1.7rem;font-weight:800;line-height:1.1 }
.kpi-compare { font-size:12px;margin-top:3px;color:var(--text-muted) }
.kpi-compare.up   { color:var(--green) }
.kpi-compare.down { color:var(--red) }

.comparaison-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:20px }
.comparaison-item { display:flex;flex-direction:column;gap:10px }
.comp-label { font-size:13px;font-weight:600 }
.comp-bar-row { display:grid;grid-template-columns:52px 1fr 70px;align-items:center;gap:8px }
.comp-bar-month { font-size:11px;color:var(--text-muted);white-space:nowrap }
.comp-bar-track { height:7px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.comp-bar-fill  { height:100%;border-radius:99px;transition:width 0.8s ease }
.comp-bar-fill.prec { background:var(--bg-hover) }
.comp-bar-val   { font-size:12px;font-weight:600;text-align:right }
.comp-delta { font-size:12px;font-weight:700;padding:3px 8px;border-radius:99px;width:fit-content }
.delta-good { background:rgba(0,229,160,0.1);color:var(--green) }
.delta-bad  { background:rgba(255,107,107,0.1);color:var(--red) }
.dot-mois-prec { display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--bg-hover) }
.dot-mois-curr { display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent) }

.donut-center { position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none }
.legend-row    { display:flex;align-items:center;gap:6px;font-size:12px }
.legend-dot    { width:8px;height:8px;border-radius:50%;flex-shrink:0 }
.legend-label  { flex:1;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.legend-pct    { color:var(--text-muted);min-width:28px;text-align:right }
.legend-amount { font-weight:600;min-width:40px;text-align:right }

.chart-empty { display:flex;flex-direction:column;align-items:center;gap:6px;padding:24px;color:var(--text-muted);font-size:14px;text-align:center }
.chart-empty span { font-size:2rem }

.budget-list { display:flex;flex-direction:column;gap:10px }
.budget-row  { display:grid;grid-template-columns:1fr auto 36px;align-items:center;gap:8px }
.budget-row-info  { display:flex;justify-content:space-between;font-size:13px;font-weight:500;grid-column:1/-1 }
.budget-bar-track { height:5px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.budget-bar-fill  { height:100%;border-radius:99px;transition:width 0.8s ease }
.budget-pct       { font-size:11px;font-weight:700;text-align:right }

.objectifs-list     { display:flex;flex-direction:column;gap:12px }
.objectif-row       { display:flex;align-items:center;gap:12px }
.objectif-row-emoji { width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0 }
.objectif-row-info  { flex:1;min-width:0 }
.obj-bar-track { height:5px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.obj-bar-fill  { height:100%;border-radius:99px;transition:width 0.8s ease }

.tx-row  { display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border) }
.tx-row:last-of-type { border-bottom:none }
.tx-icon { width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative }
.auto-badge { position:absolute;bottom:-4px;right:-4px;font-size:10px }
.tx-main { flex:1;min-width:0 }
.tx-desc { font-size:14px;font-weight:500;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.tx-meta { display:flex;align-items:center;gap:6px }

.solde-recap  { margin-top:16px;padding:16px;background:var(--bg-elevated);border-radius:var(--radius);display:flex;flex-direction:column;gap:8px }
.solde-item   { display:flex;justify-content:space-between;align-items:center;font-size:14px;color:var(--text-secondary) }
.solde-item.solde-final { padding-top:8px;border-top:1px solid var(--border);font-weight:700;color:var(--text-primary);font-size:15px }

@media (max-width:768px) { .comparaison-grid { grid-template-columns:1fr } }

.prevision-card { }
.prevision-badge { padding:6px 14px;border-radius:99px;font-size:12px;font-weight:700 }
.prevision-badge.bonne   { background:rgba(0,229,160,0.12);color:var(--green) }
.prevision-badge.neutre  { background:rgba(255,159,67,0.12);color:var(--orange) }
.prevision-badge.mauvaise{ background:rgba(255,107,107,0.12);color:var(--red) }

.prevision-grid { display:flex;flex-direction:column;gap:20px }

.jauge-track { position:relative;height:10px;background:var(--bg-elevated);border-radius:99px;overflow:visible }
.jauge-fill  { height:100%;background:linear-gradient(90deg,var(--accent),var(--blue));border-radius:99px;transition:width 1s ease }
.jauge-cursor { position:absolute;top:-4px;width:18px;height:18px;background:white;border:3px solid var(--accent);border-radius:50%;transform:translateX(-50%);transition:left 1s ease;box-shadow:0 2px 8px rgba(0,229,160,0.4) }

.prevision-metrics { display:grid;grid-template-columns:repeat(3,1fr);gap:16px }
.prevision-metric  { display:flex;align-items:flex-start;gap:12px;padding:14px;background:var(--bg-elevated);border-radius:var(--radius) }
.prev-metric-icon  { width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0 }
.prev-metric-label { font-size:11px;color:var(--text-muted);font-weight:500;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px }
.prev-metric-value { font-family:var(--font-display);font-size:1.3rem;font-weight:800;line-height:1 }
.prev-metric-sub   { font-size:11px;color:var(--text-muted);margin-top:3px }

.prev-bar-track { position:relative;height:12px;background:var(--bg-elevated);border-radius:99px;overflow:hidden }
.prev-bar-fill.actual    { position:absolute;top:0;left:0;height:100%;background:var(--red);border-radius:99px;transition:width 0.8s ease }
.prev-bar-fill.projected { position:absolute;top:0;height:100%;background:repeating-linear-gradient(90deg,rgba(255,107,107,0.4) 0,rgba(255,107,107,0.4) 6px,transparent 6px,transparent 12px);border-radius:0 99px 99px 0;transition:all 0.8s ease }
.prev-bar-danger-line    { position:absolute;right:0;top:-2px;bottom:-2px;width:2px;background:var(--red);opacity:0.4 }

.prevision-locked { display:flex;align-items:center;gap:16px;padding:20px;flex-wrap:wrap }

@media (max-width:768px) {
  .prevision-metrics { grid-template-columns:1fr }
  .prevision-locked  { flex-direction:column;text-align:center }
}
</style>