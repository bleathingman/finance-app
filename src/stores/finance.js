import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc,
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
        tags:        data.tags || [],
        date:        data.date,
        uid,
        compteId:    data.compteId || null,
        autoGenere:  data.autoGenere || false,
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
        tags:        data.tags || [],
        date:        data.date,
        compteId:    data.compteId || null,
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
        tags:        data.tags || [],
        date:        data.date,
        uid,
        compteId:    data.compteId || null,
        autoGenere:  data.autoGenere || false,
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
        tags:        data.tags || [],
        date:        data.date,
        compteId:    data.compteId || null,
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


  // ─── Récurrentes auto-génération ──────────────────────────────────
  // Appelé au chargement : copie les récurrentes du mois précédent
  // dans le mois courant si elles n'existent pas encore.
  async function genererRecurrents() {
    const uid = authStore.user?.uid
    if (!uid) return { depenses: 0, revenus: 0 }

    const now        = new Date()
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const logRef     = doc(db, 'users', uid, 'recurrents_log', moisActuel)

    // ── Log des clés déjà traitées ce mois (même si la tx a été supprimée) ──
    const logSnap  = await getDoc(logRef)
    const logData  = logSnap.exists() ? logSnap.data() : {}
    const dejaDep  = new Set(logData.depenses || [])
    const dejaRev  = new Set(logData.revenus  || [])

    function cleDepense(d) { return `${d.description}|${d.montant}|${d.categorie}` }
    function cleRevenu(r)  { return `${r.description}|${r.montant}|${r.type}` }

    function moisKey(tx) {
      if (!tx.createdAt) return ''
      const d = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    // Récurrentes des mois précédents → templates
    const recDepenses = depenses.value.filter(d => d.recurrent && moisKey(d) !== moisActuel)
    const recRevenus  = revenus.value.filter(r => r.recurrent && moisKey(r) !== moisActuel)

    // Garder la version la plus récente de chaque récurrente
    const latestDep = {}
    recDepenses.forEach(d => {
      const cle = cleDepense(d)
      if (!latestDep[cle] || (d.createdAt?.seconds || 0) > (latestDep[cle].createdAt?.seconds || 0)) {
        latestDep[cle] = d
      }
    })
    const latestRev = {}
    recRevenus.forEach(r => {
      const cle = cleRevenu(r)
      if (!latestRev[cle] || (r.createdAt?.seconds || 0) > (latestRev[cle].createdAt?.seconds || 0)) {
        latestRev[cle] = r
      }
    })

    const dateStr   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const nouvellesDep = []
    const nouvellesRev = []
    let nbDep = 0
    let nbRev = 0

    for (const [cle, d] of Object.entries(latestDep)) {
      if (dejaDep.has(cle)) continue  // déjà traitée ce mois (même si supprimée)
      await addDoc(collection(db, 'depenses'), {
        categorie:   d.categorie,
        description: d.description,
        montant:     d.montant,
        recurrent:   true,
        tags:        d.tags || [],
        date:        dateStr,
        uid,
        compteId:    d.compteId || null,
        autoGenere:  true,
        createdAt:   dateToTimestamp(dateStr)
      })
      nouvellesDep.push(cle)
      nbDep++
    }

    for (const [cle, r] of Object.entries(latestRev)) {
      if (dejaRev.has(cle)) continue
      await addDoc(collection(db, 'revenus'), {
        type:        r.type,
        description: r.description,
        montant:     r.montant,
        recurrent:   true,
        tags:        r.tags || [],
        date:        dateStr,
        uid,
        compteId:    r.compteId || null,
        autoGenere:  true,
        createdAt:   dateToTimestamp(dateStr)
      })
      nouvellesRev.push(cle)
      nbRev++
    }

    // Persister le log mis à jour
    if (nouvellesDep.length || nouvellesRev.length) {
      await setDoc(logRef, {
        depenses: [...dejaDep, ...nouvellesDep],
        revenus:  [...dejaRev, ...nouvellesRev],
        updatedAt: Timestamp.now()
      }, { merge: true })
    }

    return { depenses: nbDep, revenus: nbRev }
  }

  return {
    revenus, depenses, budgets, objectifs, loading,
    totalRevenus, totalDepenses, solde, depensesParCategorie,
    revenusDuMois, depensesDuMois, revenusHistorique, depensesHistorique,
    ajouterRevenu, modifierRevenu, supprimerRevenu, ecouter_revenus,
    ajouterDepense, modifierDepense, supprimerDepense, ecouter_depenses,
    definirBudget, ecouter_budgets,
    ajouterObjectif, mettreAJourObjectif, supprimerObjectif, ecouter_objectifs,
    genererRecurrents
  }
})