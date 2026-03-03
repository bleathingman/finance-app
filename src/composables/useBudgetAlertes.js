import { computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'

function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

export function useBudgetAlertes() {
  const financeStore = useFinanceStore()

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

  const alertes = computed(() => {
    const list = []
    financeStore.budgets.forEach(b => {
      const depense = depenseParCat.value[b.categorie] || 0
      const taux    = b.montant > 0 ? Math.round((depense / b.montant) * 100) : 0
      const reste   = b.montant - depense
      if (taux >= 100) {
        list.push({
          type: 'danger', emoji: '🚨',
          categorie: b.categorie,
          title: `Budget ${b.categorie} dépassé`,
          text: `${formatAmount(depense)} dépensé sur ${formatAmount(b.montant)} prévu`,
          taux, reste, depense, montant: b.montant
        })
      } else if (taux >= 80) {
        list.push({
          type: 'warn', emoji: '⚠️',
          categorie: b.categorie,
          title: `Budget ${b.categorie} bientôt atteint`,
          text: `${taux}% utilisé — il reste ${formatAmount(reste)}`,
          taux, reste, depense, montant: b.montant
        })
      }
    })
    return list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'danger' ? -1 : 1
      return b.taux - a.taux
    })
  })

  const alertesDanger = computed(() => alertes.value.filter(a => a.type === 'danger'))
  const alertesWarn   = computed(() => alertes.value.filter(a => a.type === 'warn'))
  const nbAlertes     = computed(() => alertes.value.length)
  const hasDanger     = computed(() => alertesDanger.value.length > 0)

  return { alertes, alertesDanger, alertesWarn, nbAlertes, hasDanger }
}