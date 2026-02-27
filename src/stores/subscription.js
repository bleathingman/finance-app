import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, collection, onSnapshot, Timestamp } from 'firebase/firestore'
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

  // Mapping Price ID → Plan (côté client)
  function getPlanFromPriceId(priceId) {
    const premiumMonthly = import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY
    const premiumYearly  = import.meta.env.VITE_STRIPE_PREMIUM_YEARLY
    const proMonthly     = import.meta.env.VITE_STRIPE_PRO_MONTHLY
    if (priceId === premiumMonthly || priceId === premiumYearly) return 'premium'
    if (priceId === proMonthly) return 'pro'
    return 'premium' // fallback : toute sub active = au moins premium
  }

  // Vérifie si une feature est disponible
  function can(feature) {
    return !!plan.value.limits[feature]
  }

  // Retourne les mois d'historique autorisés
  const historyMonths = computed(() => plan.value.limits.historyMonths)

  // ─── Écoute Firestore — collection 'customers' (Firebase Extension) ──
  // L'extension Stripe crée : customers/{uid}/subscriptions/{subId}
  let unsubSnap = null
  function startListening() {
    const uid = authStore.user?.uid
    if (!uid) return

    // Écoute les subscriptions actives dans customers/{uid}/subscriptions
    const subsRef = collection(db, 'customers', uid, 'subscriptions')
    unsubSnap = onSnapshot(subsRef, snap => {

      // Cherche une subscription active ou trialing
      const activeSub = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .find(s => s.status === 'active' || s.status === 'trialing')

      if (activeSub) {
        // Cas manuel (créateur de l'app) : price = "manual" → Pro direct
        const priceId = activeSub.items?.[0]?.price?.id || activeSub.price?.id || activeSub.price || ''
        if (priceId === 'manual') {
          planId.value = 'pro'
        } else {
          planId.value = getPlanFromPriceId(priceId)
        }
        status.value    = activeSub.status
        periodEnd.value = activeSub.current_period_end || null
      } else {
        planId.value    = 'free'
        status.value    = 'active'
        periodEnd.value = null
      }
      loading.value = false
    }, (err) => {
      // Erreur ou collection vide = plan gratuit
      planId.value  = 'free'
      loading.value = false
    })
  }

  function stopListening() {
    if (unsubSnap) { unsubSnap(); unsubSnap = null }
    planId.value  = 'free'
    loading.value = true
  }

  // ─── Checkout via Firebase Extension ────────────────────────────
  // L'extension crée automatiquement la session Checkout dans Firestore
  // et retourne l'URL de paiement Stripe
  async function checkout(priceId) {
    if (!priceId) {
      alert('Stripe non configuré — ajoute tes Price IDs dans les variables Vercel')
      return
    }
    const uid = authStore.user?.uid
    if (!uid) return

    try {
      const { addDoc, collection: col, onSnapshot: onSnap } = await import('firebase/firestore')
      const sessionsRef = col(db, 'customers', uid, 'checkout_sessions')

      const docRef = await addDoc(sessionsRef, {
        price:                 priceId,
        success_url:           `${window.location.origin}/?checkout=success`,
        cancel_url:            `${window.location.origin}/pricing`,
        allow_promotion_codes: true,
        client_reference_id:   uid
      })

      // Attend que l'extension Firebase remplisse l'URL de session Stripe
      return new Promise((resolve, reject) => {
        const unsub = onSnap(docRef, snap => {
          const data = snap.data()
          if (!data) return
          if (data.error) {
            unsub()
            console.error('Stripe error:', data.error)
            alert('Erreur Stripe : ' + (data.error.message || data.error))
            reject(new Error(data.error.message))
            return
          }
          if (data.url) {
            unsub()
            window.location.assign(data.url)
            resolve()
          }
        })
        setTimeout(() => {
          unsub()
          reject(new Error('Timeout — l\'extension Firebase n\'a pas répondu'))
          alert('Timeout — vérifie que l\'extension Stripe Firebase est bien installée')
        }, 30000)
      })
    } catch (e) {
      console.error('Checkout error:', e)
      alert('Erreur lors du paiement : ' + e.message)
    }
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