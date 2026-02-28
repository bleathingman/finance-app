import {
  collection, query, where, getDocs, writeBatch, doc
} from 'firebase/firestore'
import { db } from '@/firebase/config'

/**
 * Migration one-shot : rattache toutes les transactions sans compteId
 * au compte par défaut de l'user (premier compte courant trouvé).
 *
 * - Idempotente : ne retouche pas les transactions qui ont déjà un compteId
 * - Utilise un writeBatch pour limiter les appels Firestore (max 500 par batch)
 * - Stocke un flag dans localStorage pour ne jamais tourner deux fois
 */
export async function migrerTransactionsSansCompte(uid, compteDefautId) {
  if (!uid || !compteDefautId) return

  // Flag localStorage → on ne migre qu'une seule fois par user
  const flagKey = `migration_compteId_done_${uid}`
  if (localStorage.getItem(flagKey)) return

  try {
    const collections = ['revenus', 'depenses']

    for (const col of collections) {
      // Récupère toutes les transactions de l'user SANS compteId
      const q = query(
        collection(db, col),
        where('uid', '==', uid)
      )
      const snap = await getDocs(q)

      // Filtre côté client les docs sans compteId
      // (Firestore ne supporte pas "where field does not exist" directement)
      const orphelines = snap.docs.filter(d => !d.data().compteId)

      if (orphelines.length === 0) continue

      // Batch write par tranches de 500 (limite Firestore)
      const chunks = []
      for (let i = 0; i < orphelines.length; i += 500) {
        chunks.push(orphelines.slice(i, i + 500))
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db)
        chunk.forEach(d => {
          batch.update(doc(db, col, d.id), { compteId: compteDefautId })
        })
        await batch.commit()
      }

      console.log(`[migration] ${orphelines.length} ${col} rattachées au compte ${compteDefautId}`)
    }

    // Marque la migration comme faite pour cet user
    localStorage.setItem(flagKey, '1')

  } catch (e) {
    // Ne bloque pas l'app si la migration échoue, elle retournera au prochain chargement
    console.error('[migration] Erreur migration compteId:', e)
  }
}