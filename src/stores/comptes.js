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

  const comptes       = ref([])
  const compteActifId = ref(null)

  // ─── ID du compte par défaut (premier courant, sinon premier tout court) ──
  const compteDefautId = computed(() => {
    const courant = comptes.value.find(c => c.type === 'courant')
    return courant?.id || comptes.value[0]?.id || null
  })

  // ─── Computed ──────────────────────────────────────────────────
  const compteActif = computed(() =>
    comptes.value.find(c => c.id === compteActifId.value) || null
  )

  // Compte virtuel "Tous les comptes" — le solde est injecté par le Dashboard
  // car c'est lui qui a accès aux deux stores sans dépendance circulaire
  const tousLesComptes = computed(() => [
    { id: null, nom: 'Tous les comptes', emoji: '🔀', couleur: '#00e5a0' },
    ...comptes.value
  ])

  function getCompte(id) {
    return comptes.value.find(c => c.id === id) || null
  }

  function getTypeInfo(typeId) {
    return COMPTE_TYPES.find(t => t.id === typeId) || COMPTE_TYPES[0]
  }

  // ─── Initialisation compte par défaut ─────────────────────────
  // Crée un "Compte Courant" si l'user n'en a aucun.
  // Appelé pour TOUS les users (free et pro) au démarrage.
  async function initialiserCompteDefaut() {
    const uid = authStore.user?.uid
    if (!uid) return null

    if (comptes.value.length > 0) return compteDefautId.value

    const q = query(collection(db, 'comptes'), where('uid', '==', uid), limit(1))
    const snap = await getDocs(q)
    if (!snap.empty) return snap.docs[0].id

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
    comptes, compteActifId, compteActif, compteDefautId, tousLesComptes,
    getCompte, getTypeInfo,
    ajouterCompte, modifierCompte, supprimerCompte,
    ecouter_comptes, setCompteActif,
    initialiserCompteDefaut
  }
})