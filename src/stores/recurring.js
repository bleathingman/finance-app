// Composable qui gère l'auto-création des transactions récurrentes chaque mois
import { doc, getDoc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'
import { useFinanceStore } from './finance'

export async function processRecurringTransactions() {
  const authStore    = useAuthStore()
  const financeStore = useFinanceStore()
  const uid = authStore.user?.uid
  if (!uid) return

  const now      = new Date()
  const moisKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Vérifie si on a déjà traité ce mois pour cet utilisateur
  const refTrack = doc(db, 'recurring_processed', `${uid}_${moisKey}`)
  const snap     = await getDoc(refTrack)
  if (snap.exists()) return // Déjà fait ce mois-ci

  console.log(`⚙️ Traitement des récurrents pour ${moisKey}...`)

  let nbCrees = 0

  // ─── Revenus récurrents ────────────────────────────────────────
  const revenusRecurrents = financeStore.revenus.filter(r => r.recurrent)
  for (const revenu of revenusRecurrents) {
    // Vérifie que ce n'est pas une transaction créée CE mois-ci (évite doublons)
    const dateCreation = revenu.createdAt?.toDate ? revenu.createdAt.toDate() : new Date(revenu.createdAt || 0)
    const estCeMois = dateCreation.getMonth() === now.getMonth() && dateCreation.getFullYear() === now.getFullYear()
    if (estCeMois) continue // Ce revenu récurrent a déjà été créé ce mois

    await addDoc(collection(db, 'revenus'), {
      type:        revenu.type,
      description: revenu.description,
      montant:     revenu.montant,
      date:        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`,
      recurrent:   true,
      autoGenere:  true, // flag pour savoir que c'est auto
      uid,
      createdAt:   Timestamp.now()
    })
    nbCrees++
  }

  // ─── Dépenses récurrentes ──────────────────────────────────────
  const depensesRecurrentes = financeStore.depenses.filter(d => d.recurrent)
  for (const depense of depensesRecurrentes) {
    const dateCreation = depense.createdAt?.toDate ? depense.createdAt.toDate() : new Date(depense.createdAt || 0)
    const estCeMois = dateCreation.getMonth() === now.getMonth() && dateCreation.getFullYear() === now.getFullYear()
    if (estCeMois) continue

    await addDoc(collection(db, 'depenses'), {
      categorie:   depense.categorie,
      description: depense.description,
      montant:     depense.montant,
      date:        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`,
      recurrent:   true,
      autoGenere:  true,
      uid,
      createdAt:   Timestamp.now()
    })
    nbCrees++
  }

  // Marque ce mois comme traité
  await setDoc(refTrack, {
    uid,
    moisKey,
    processedAt: Timestamp.now(),
    nbCrees
  })

  if (nbCrees > 0) {
    console.log(`✅ ${nbCrees} transaction(s) récurrente(s) créée(s) automatiquement`)
  }

  return nbCrees
}
