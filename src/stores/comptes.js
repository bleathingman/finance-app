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
  const comptes   = ref([])
  // ID du compte actif — null = tous les comptes
  const compteActifId = ref(null)

  // ─── Computed ──────────────────────────────────────────────────
  const compteActif = computed(() =>
    comptes.value.find(c => c.id === compteActifId.value) || null
  )

  // Compte "Tous les comptes" virtuel
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

  // ─── CRUD ──────────────────────────────────────────────────────
  async function ajouterCompte(data) {
    const uid = authStore.user?.uid
    if (!uid) return
    const ref = await addDoc(collection(db, 'comptes'), {
      uid,
      nom:          data.nom,
      type:         data.type || 'courant',
      couleur:      data.couleur || '#00e5a0',
      soldeInitial: data.soldeInitial || 0,
      createdAt:    Timestamp.now()
    })
    return ref.id
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
    comptes, compteActifId, compteActif, tousLesComptes,
    getCompte, getTypeInfo,
    ajouterCompte, modifierCompte, supprimerCompte,
    ecouter_comptes, setCompteActif
  }
})
