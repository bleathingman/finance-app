import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, onSnapshot, Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'
import { useSubscriptionStore } from './subscription'

export const useFinanceStore = defineStore('finance', () => {
  const authStore = useAuthStore()

  function getSubStore() {
    try { return useSubscriptionStore() } catch { return null }
  }

  // Lazy-load pour éviter les dépendances circulaires
  function getComptesStore() {
    try {
      const { useComptesStore } = require('./comptes')
      return useComptesStore()
    } catch { return null }
  }

  const revenus   = ref([])
  const depenses  = ref([])
  const budgets   = ref([])
  const objectifs = ref([])
  const loading   = ref(false)

  // ─── Helpers ──────────────────────────────────────────────────────
  function dateToTimestamp(dateStr) {
    if (!dateStr) return Timestamp.now()
    const [y, m, d] = dateStr.split('-').map(Number)
    return Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0))
  }

  // Retourne le compteId à utiliser : celui fourni, ou le compte par défaut
  function resolveCompteId(compteIdFourni) {
    if (compteIdFourni) return compteIdFourni
    const comptes = getComptesStore()
    return comptes?.compteDefautId ?? null
  }

  // ─── Filtre mois courant ──────────────────────────────────────────
  function estCeMois(tx) {
    if (!tx.createdAt) return false
    const d = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }

  function estDansLimite(tx) {
    if (!tx.createdAt) return false
    const sub = getSubStore()
    const months = sub?.historyMonths ?? 1
    if (months === Infinity) return true
    const d   = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt)
    const now = new Date()
    const limitDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    return d >= limitDate
  }

  const revenusDuMois      = computed(() => revenus.value.filter(estCeMois))
  const depensesDuMois     = computed(() => depenses.value.filter(estCeMois))
  const revenusHistorique  = computed(() => revenus.value.filter(estDansLimite))
  const depensesHistorique = computed(() => depenses.value.filter(estDansLimite))

  // ─── Totaux mois courant ───────────────────────────────────────────
  const totalRevenus = computed(() =>
    revenusDuMois.value.reduce((sum, r) => sum + r.montant, 0)
  )
  const totalDepenses = computed(() =>
    depensesDuMois.value.reduce((sum, d) => sum + d.montant, 0)
  )
  const solde = computed(() => totalRevenus.value - totalDepenses.value)

  const depensesParCategorie = computed(() => {
    const map = {}
    depensesDuMois.value.forEach(d => {
      map[d.categorie] = (map[d.categorie] || 0) + d.montant
    })
    return map
  })

  // ─── Revenus ──────────────────────────────────────────────────────
  async function ajouterRevenu(data) {
    const uid = authStore.user?.uid
    if (!uid) { console.error('Non connecté'); return }
    try {
      await addDoc(collection(db, 'revenus'), {
        type:        data.type,
        description: data.description,
        montant:     data.montant,
        recurrent:   data.recurrent || false,
        date:        data.date,
        uid,
        // Toujours stocker un compteId : celui fourni ou le compte par défaut
        compteId:    resolveCompteId(data.compteId),
        createdAt:   dateToTimestamp(data.date)
      })
    } catch (e) { console.error('Erreur ajout revenu:', e); throw e }
  }

  async function modifierRevenu(id, data) {
    try {
      await updateDoc(doc(db, 'revenus', id), {
        type:        data.type,
        description: data.description,
        montant:     data.montant,
        recurrent:   data.recurrent || false,
        date:        data.date,
        compteId:    resolveCompteId(data.compteId),
        createdAt:   dateToTimestamp(data.date)
      })
    } catch (e) { console.error('Erreur modification revenu:', e); throw e }
  }

  async function supprimerRevenu(id) {
    try { await deleteDoc(doc(db, 'revenus', id)) }
    catch (e) { console.error('Erreur suppression revenu:', e); throw e }
  }

  function ecouter_revenus() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(collection(db, 'revenus'), where('uid', '==', uid))
    return onSnapshot(q, snap => {
      revenus.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    }, err => console.error('Erreur écoute revenus:', err))
  }

  // ─── Dépenses ─────────────────────────────────────────────────────
  async function ajouterDepense(data) {
    const uid = authStore.user?.uid
    if (!uid) { console.error('Non connecté'); return }
    try {
      await addDoc(collection(db, 'depenses'), {
        categorie:   data.categorie,
        description: data.description,
        montant:     data.montant,
        recurrent:   data.recurrent || false,
        date:        data.date,
        uid,
        // Toujours stocker un compteId : celui fourni ou le compte par défaut
        compteId:    resolveCompteId(data.compteId),
        createdAt:   dateToTimestamp(data.date)
      })
    } catch (e) { console.error('Erreur ajout dépense:', e); throw e }
  }

  async function modifierDepense(id, data) {
    try {
      await updateDoc(doc(db, 'depenses', id), {
        categorie:   data.categorie,
        description: data.description,
        montant:     data.montant,
        recurrent:   data.recurrent || false,
        date:        data.date,
        compteId:    resolveCompteId(data.compteId),
        createdAt:   dateToTimestamp(data.date)
      })
    } catch (e) { console.error('Erreur modification dépense:', e); throw e }
  }

  async function supprimerDepense(id) {
    try { await deleteDoc(doc(db, 'depenses', id)) }
    catch (e) { console.error('Erreur suppression dépense:', e); throw e }
  }

  function ecouter_depenses() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(collection(db, 'depenses'), where('uid', '==', uid))
    return onSnapshot(q, snap => {
      depenses.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    }, err => console.error('Erreur écoute dépenses:', err))
  }

  // ─── Budgets ──────────────────────────────────────────────────────
  async function definirBudget(categorie, montant) {
    const uid = authStore.user?.uid
    if (!uid) return
    try {
      const existing = budgets.value.find(b => b.categorie === categorie)
      if (existing) { await updateDoc(doc(db, 'budgets', existing.id), { montant }) }
      else           { await addDoc(collection(db, 'budgets'), { uid, categorie, montant }) }
    } catch (e) { console.error('Erreur budget:', e); throw e }
  }

  function ecouter_budgets() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(collection(db, 'budgets'), where('uid', '==', uid))
    return onSnapshot(q, snap => {
      budgets.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, err => console.error('Erreur écoute budgets:', err))
  }

  // ─── Objectifs ────────────────────────────────────────────────────
  async function ajouterObjectif(data) {
    const uid = authStore.user?.uid
    if (!uid) return
    try {
      await addDoc(collection(db, 'objectifs'), { ...data, uid, createdAt: Timestamp.now() })
    } catch (e) { console.error('Erreur ajout objectif:', e); throw e }
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
    return onSnapshot(q, snap => {
      objectifs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, err => console.error('Erreur écoute objectifs:', err))
  }

  return {
    revenus, depenses, budgets, objectifs, loading,
    totalRevenus, totalDepenses, solde, depensesParCategorie,
    revenusDuMois, depensesDuMois, revenusHistorique, depensesHistorique,
    ajouterRevenu, modifierRevenu, supprimerRevenu, ecouter_revenus,
    ajouterDepense, modifierDepense, supprimerDepense, ecouter_depenses,
    definirBudget, ecouter_budgets,
    ajouterObjectif, mettreAJourObjectif, supprimerObjectif, ecouter_objectifs
  }
})