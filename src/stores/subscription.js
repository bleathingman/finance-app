import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { loadStripe } from '@stripe/stripe-js'
import { useAuthStore } from './auth'

// ─── Clés Stripe (à remplacer par tes vraies clés) ────────────────
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_VOTRE_CLE_PUBLIQUE'

// ─── IDs des prix Stripe (à créer dans ton dashboard Stripe) ──────
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    priceLabel: 'Gratuit',
    historyMonths: 1,
    features: [
      'Mois courant uniquement',
      'Graphiques de base',
      'Dashboard, budget, objectifs',
      '1 thème (sombre)'
    ],
    limits: {
      historyMonths: 1,
      exportCsv: false,
      exportPdf: false,
      advancedCharts: false,
      customThemes: false,
      forecast: false
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 3.99,
    priceLabel: '3,99€/mois',
    priceYearly: 39,
    priceYearlyLabel: '39€/an',
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY || '',
    stripePriceIdYearly:  import.meta.env.VITE_STRIPE_PREMIUM_YEARLY  || '',
    historyMonths: 12,
    features: [
      'Historique 12 mois',
      'Graphiques détaillés',
      'Export CSV & PDF',
      'Prévision fin de mois',
      '5 thèmes de couleurs'
    ],
    limits: {
      historyMonths: 12,
      exportCsv: true,
      exportPdf: true,
      advancedCharts: true,
      customThemes: true,
      forecast: true
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceLabel: '39€/mois',
    stripePriceIdMonthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY || '',
    historyMonths: Infinity,
    features: [
      'Historique illimité',
      'Tout Premium inclus',
      'Multi-comptes',
      'Rapport email mensuel auto',
      'Tous les thèmes + custom',
      'Support prioritaire'
    ],
    limits: {
      historyMonths: Infinity,
      exportCsv: true,
      exportPdf: true,
      advancedCharts: true,
      customThemes: true,
      forecast: true,
      multiAccounts: true,
      emailReports: true
    }
  }
}

export const useSubscriptionStore = defineStore('subscription', () => {
  const authStore    = useAuthStore()
  const planId       = ref('free')   // 'free' | 'premium' | 'pro'
  const status       = ref('active') // 'active' | 'canceled' | 'past_due'
  const periodEnd    = ref(null)
  const loading      = ref(true)

  const plan    = computed(() => PLANS[planId.value] || PLANS.free)
  const isPaid  = computed(() => planId.value !== 'free')
  const isPro   = computed(() => planId.value === 'pro')

  // Vérifie si une feature est disponible
  function can(feature) {
    return !!plan.value.limits[feature]
  }

  // Retourne les mois d'historique autorisés
  const historyMonths = computed(() => plan.value.limits.historyMonths)

  // ─── Écoute Firestore pour le statut ────────────────────────────
  let unsubSnap = null
  function startListening() {
    const uid = authStore.user?.uid
    if (!uid) return
    const ref_ = doc(db, 'subscriptions', uid)
    unsubSnap = onSnapshot(ref_, snap => {
      if (snap.exists()) {
        const data = snap.data()
        planId.value    = data.planId    || 'free'
        status.value    = data.status    || 'active'
        periodEnd.value = data.periodEnd || null
      } else {
        planId.value = 'free'
      }
      loading.value = false
    })
  }

  function stopListening() {
    if (unsubSnap) { unsubSnap(); unsubSnap = null }
    planId.value  = 'free'
    loading.value = true
  }

  // ─── Checkout Stripe ─────────────────────────────────────────────
  async function checkout(priceId) {
    if (!priceId) {
      alert('Stripe non configuré — ajoute tes clés dans .env')
      return
    }
    const stripe = await loadStripe(STRIPE_PUBLIC_KEY)
    if (!stripe) return

    // Firestore : on crée une session checkout via extension Stripe Firebase
    // ou on redirige vers ton backend Stripe
    // Pour une implémentation simple sans backend :
    // Utilise Stripe Payment Links générés depuis le dashboard
    window.open(`https://buy.stripe.com/${priceId}?client_reference_id=${authStore.user?.uid}`, '_blank')
  }

  // ─── Portail client Stripe (gérer / annuler l'abo) ───────────────
  async function openPortal() {
    // Remplace par ton lien de portail client Stripe
    const portalUrl = import.meta.env.VITE_STRIPE_PORTAL_URL || 'https://billing.stripe.com/p/login/test_XXXX'
    window.open(portalUrl, '_blank')
  }

  return {
    planId, status, periodEnd, loading,
    plan, isPaid, isPro, can, historyMonths,
    startListening, stopListening, checkout, openPortal
  }
})
