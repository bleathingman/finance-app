import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, onSnapshot, Timestamp, getDocs, limit
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'

export const COMPTE_TYPES = [
  { id: 'courant',  label: 'Compte courant',  emoji: '🏦' },
  { id: 'epargne',  label: 'Compte épargne',  emoji: '💰' },
  { id: 'joint',    label: 'Compte joint',    emoji: '👥' },
  { id: 'crypto',   label: 'Crypto',          emoji: '₿'  },
  { id: 'cash',     label: 'Espèces',         emoji: '💵' },
  { id: 'autre',    label: 'Autre',           emoji: '💳' }
]

export const COMPTE_COLORS = [
  '#00e5a0', '#4facfe', '#c084fc', '#fb7185',
  '#ff9f43', '#34d399', '#f472b6', '#60a5fa'
]

export const useComptesStore = defineStore('comptes', () => {
  const authStore = useAuthStore()

  // Lazy-load pour éviter les dépendances circulaires
  function getFinanceStore() {
    try {
      const { useFinanceStore } = require('./finance')
      return useFinanceStore()
    } catch { return null }
  }

  const comptes       = ref([])
  const compteActifId = ref(null)

  // ─── ID du compte par défaut (le premier courant créé) ────────
  const compteDefautId = computed(() => {
    const courant = comptes.value.find(c => c.type === 'courant')
    return courant?.id || comptes.value[0]?.id || null
  })

  // ─── Calcul du solde réel d'un compte ─────────────────────────
  // Les transactions sans compteId sont rattachées au compte par défaut.
  // Cela assure la compatibilité avec les données des users free
  // qui n'avaient pas de compteId sur leurs transactions.
  function calculerSolde(compteId) {
    const finance = getFinanceStore()
    if (!finance) return 0

    const estCeCompte = (tx) => {
      if (tx.compteId) return tx.compteId === compteId
      // Pas de compteId → rattaché au compte par défaut
      return compteId === compteDefautId.value
    }

    const revenus  = finance.revenus.filter(estCeCompte)
    const depenses = finance.depenses.filter(estCeCompte)

    const totalRevenus  = revenus.reduce((s, r) => s + (r.montant || 0), 0)
    const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)

    const compte = comptes.value.find(c => c.id === compteId)
    const soldeInitial = compte?.soldeInitial || 0

    return soldeInitial + totalRevenus - totalDepenses
  }

  // ─── Computed ──────────────────────────────────────────────────
  const compteActif = computed(() =>
    comptes.value.find(c => c.id === compteActifId.value) || null
  )

  const comptesAvecSolde = computed(() =>
    comptes.value.map(c => ({
      ...c,
      solde: calculerSolde(c.id)
    }))
  )

  const tousLesComptes = computed(() => {
    const soldeGlobal = comptesAvecSolde.value.reduce((s, c) => s + c.solde, 0)
    return [
      { id: null, nom: 'Tous les comptes', emoji: '🔀', couleur: '#00e5a0', solde: soldeGlobal },
      ...comptesAvecSolde.value
    ]
  })

  const soldeActif = computed(() => {
    const compte = tousLesComptes.value.find(c => c.id === compteActifId.value)
    return compte?.solde ?? 0
  })

  function getCompte(id) {
    return comptesAvecSolde.value.find(c => c.id === id) || null
  }

  function getTypeInfo(typeId) {
    return COMPTE_TYPES.find(t => t.id === typeId) || COMPTE_TYPES[0]
  }

  // ─── Initialisation compte par défaut ─────────────────────────
  // Appelé au démarrage pour TOUS les users (free et pro).
  // Si l'user n'a aucun compte → crée un "Compte Courant" automatiquement.
  // Résultat : quand un user free passe Pro, ses transactions existantes
  // (sans compteId) sont déjà rattachées à ce compte via calculerSolde().
  async function initialiserCompteDefaut() {
    const uid = authStore.user?.uid
    if (!uid) return null

    // Si des comptes sont déjà chargés en mémoire, rien à faire
    if (comptes.value.length > 0) return compteDefautId.value

    // Vérifie aussi en base (cas du premier render avant que onSnapshot réponde)
    const q = query(collection(db, 'comptes'), where('uid', '==', uid), limit(1))
    const snap = await getDocs(q)
    if (!snap.empty) return snap.docs[0].id

    // Aucun compte → crée le compte courant par défaut
    const docRef = await addDoc(collection(db, 'comptes'), {
      uid,
      nom:          'Compte Courant',
      type:         'courant',
      couleur:      '#00e5a0',
      soldeInitial: 0,
      estDefaut:    true,
      createdAt:    Timestamp.now()
    })

    return docRef.id
  }

  // ─── CRUD ──────────────────────────────────────────────────────
  async function ajouterCompte(data) {
    const uid = authStore.user?.uid
    if (!uid) return
    const docRef = await addDoc(collection(db, 'comptes'), {
      uid,
      nom:          data.nom,
      type:         data.type || 'courant',
      couleur:      data.couleur || '#00e5a0',
      soldeInitial: data.soldeInitial || 0,
      createdAt:    Timestamp.now()
    })
    return docRef.id
  }

  async function modifierCompte(id, data) {
    await updateDoc(doc(db, 'comptes', id), {
      nom:          data.nom,
      type:         data.type,
      couleur:      data.couleur,
      soldeInitial: data.soldeInitial || 0
    })
  }

  async function supprimerCompte(id) {
    await deleteDoc(doc(db, 'comptes', id))
    if (compteActifId.value === id) compteActifId.value = null
  }

  function ecouter_comptes() {
    const uid = authStore.user?.uid
    if (!uid) return () => {}
    const q = query(collection(db, 'comptes'), where('uid', '==', uid))
    return onSnapshot(q, snap => {
      comptes.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
    })
  }

  function setCompteActif(id) {
    compteActifId.value = id
  }

  return {
    comptes, compteActifId, compteActif, compteDefautId,
    comptesAvecSolde, tousLesComptes, soldeActif,
    getCompte, getTypeInfo,
    ajouterCompte, modifierCompte, supprimerCompte,
    ecouter_comptes, setCompteActif,
    calculerSolde, initialiserCompteDefaut
  }
})