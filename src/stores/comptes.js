import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, onSnapshot, Timestamp
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

  // Lazy-load pour éviter les dépendances circulaires (finance importe comptes)
  function getFinanceStore() {
    try {
      const { useFinanceStore } = require('./finance')
      return useFinanceStore()
    } catch { return null }
  }

  const comptes       = ref([])
  const compteActifId = ref(null)

  // ─── Calcul du solde réel d'un compte ─────────────────────────
  // solde = soldeInitial + total revenus du compte - total dépenses du compte
  // (toutes périodes confondues, pas seulement le mois courant)
  function calculerSolde(compteId) {
    const finance = getFinanceStore()
    if (!finance) return 0

    const revenus  = finance.revenus.filter(r => (r.compteId || null) === compteId)
    const depenses = finance.depenses.filter(d => (d.compteId || null) === compteId)

    const totalRevenus  = revenus.reduce((s, r) => s + (r.montant || 0), 0)
    const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)

    // On cherche le soldeInitial du compte concerné
    const compte = comptes.value.find(c => c.id === compteId)
    const soldeInitial = compte?.soldeInitial || 0

    return soldeInitial + totalRevenus - totalDepenses
  }

  // ─── Computed ──────────────────────────────────────────────────
  const compteActif = computed(() =>
    comptes.value.find(c => c.id === compteActifId.value) || null
  )

  // Enrichit chaque compte avec son solde calculé dynamiquement
  const comptesAvecSolde = computed(() =>
    comptes.value.map(c => ({
      ...c,
      solde: calculerSolde(c.id)
    }))
  )

  // Compte virtuel "Tous les comptes" avec solde global consolidé
  const tousLesComptes = computed(() => {
    const soldeGlobal = comptesAvecSolde.value.reduce((s, c) => s + c.solde, 0)
    return [
      { id: null, nom: 'Tous les comptes', emoji: '🔀', couleur: '#00e5a0', solde: soldeGlobal },
      ...comptesAvecSolde.value
    ]
  })

  // Solde du compte actif (ou consolidé si tous)
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
    comptes, compteActifId, compteActif,
    comptesAvecSolde, tousLesComptes, soldeActif,
    getCompte, getTypeInfo,
    ajouterCompte, modifierCompte, supprimerCompte,
    ecouter_comptes, setCompteActif,
    calculerSolde
  }
})