import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, onSnapshot, Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'

export const useFinanceStore = defineStore('finance', () => {
  const authStore = useAuthStore()
  const revenus   = ref([])
  const depenses  = ref([])
  const budgets   = ref([])
  const objectifs = ref([])
  const loading   = ref(false)

  // ─── Totaux calculés ─────────────────────────────────────────────
  const totalRevenus = computed(() =>
    revenus.value.reduce((sum, r) => sum + r.montant, 0)
  )
  const totalDepenses = computed(() =>
    depenses.value.reduce((sum, d) => sum + d.montant, 0)
  )
  const solde = computed(() => totalRevenus.value - totalDepenses.value)

  const depensesParCategorie = computed(() => {
    const map = {}
    depenses.value.forEach(d => {
      map[d.categorie] = (map[d.categorie] || 0) + d.montant
    })
    return map
  })

  // ─── Revenus ──────────────────────────────────────────────────────
  async function ajouterRevenu(data) {
    const uid = authStore.user?.uid
    if (!uid) { console.error('Utilisateur non connecté'); return }
    try {
      await addDoc(collection(db, 'revenus'), {
        ...data,
        uid,
        createdAt: Timestamp.now()
      })
    } catch (e) {
      console.error('Erreur ajout revenu:', e)
      throw e
    }
  }

  async function supprimerRevenu(id) {
    try {
      await deleteDoc(doc(db, 'revenus', id))
    } catch (e) {
      console.error('Erreur suppression revenu:', e)
      throw e
    }
  }

  function ecouter_revenus() {
    const uid = authStore.user?.uid
    if (!uid) return
    // Pas de orderBy → pas besoin d'index composite, on trie côté client
    const q = query(
      collection(db, 'revenus'),
      where('uid', '==', uid)
    )
    return onSnapshot(q, (snap) => {
      revenus.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    }, (err) => {
      console.error('Erreur écoute revenus:', err)
    })
  }

  // ─── Dépenses ─────────────────────────────────────────────────────
  async function ajouterDepense(data) {
    const uid = authStore.user?.uid
    if (!uid) { console.error('Utilisateur non connecté'); return }
    try {
      await addDoc(collection(db, 'depenses'), {
        ...data,
        uid,
        createdAt: Timestamp.now()
      })
    } catch (e) {
      console.error('Erreur ajout dépense:', e)
      throw e
    }
  }

  async function supprimerDepense(id) {
    try {
      await deleteDoc(doc(db, 'depenses', id))
    } catch (e) {
      console.error('Erreur suppression dépense:', e)
      throw e
    }
  }

  function ecouter_depenses() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(
      collection(db, 'depenses'),
      where('uid', '==', uid)
    )
    return onSnapshot(q, (snap) => {
      depenses.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    }, (err) => {
      console.error('Erreur écoute dépenses:', err)
    })
  }

  // ─── Budgets ──────────────────────────────────────────────────────
  async function definirBudget(categorie, montant) {
    const uid = authStore.user?.uid
    if (!uid) return
    try {
      const existing = budgets.value.find(b => b.categorie === categorie)
      if (existing) {
        await updateDoc(doc(db, 'budgets', existing.id), { montant })
      } else {
        await addDoc(collection(db, 'budgets'), { uid, categorie, montant })
      }
    } catch (e) {
      console.error('Erreur budget:', e)
      throw e
    }
  }

  function ecouter_budgets() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(collection(db, 'budgets'), where('uid', '==', uid))
    return onSnapshot(q, (snap) => {
      budgets.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, (err) => {
      console.error('Erreur écoute budgets:', err)
    })
  }

  // ─── Objectifs ────────────────────────────────────────────────────
  async function ajouterObjectif(data) {
    const uid = authStore.user?.uid
    if (!uid) return
    try {
      await addDoc(collection(db, 'objectifs'), {
        ...data,
        uid,
        createdAt: Timestamp.now()
      })
    } catch (e) {
      console.error('Erreur ajout objectif:', e)
      throw e
    }
  }

  async function mettreAJourObjectif(id, data) {
    await updateDoc(doc(db, 'objectifs', id), data)
  }

  async function supprimerObjectif(id) {
    await deleteDoc(doc(db, 'objectifs', id))
  }

  function ecouter_objectifs() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(collection(db, 'objectifs'), where('uid', '==', uid))
    return onSnapshot(q, (snap) => {
      objectifs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, (err) => {
      console.error('Erreur écoute objectifs:', err)
    })
  }

  return {
    revenus, depenses, budgets, objectifs, loading,
    totalRevenus, totalDepenses, solde, depensesParCategorie,
    ajouterRevenu, supprimerRevenu, ecouter_revenus,
    ajouterDepense, supprimerDepense, ecouter_depenses,
    definirBudget, ecouter_budgets,
    ajouterObjectif, mettreAJourObjectif, supprimerObjectif, ecouter_objectifs
  }
})
