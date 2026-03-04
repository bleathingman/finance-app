// functions/index.js
// ─────────────────────────────────────────────────────────────────
// Firebase Cloud Functions — Notifications FinanceFlow
//
// Setup :
//   npm install -g firebase-tools
//   firebase init functions   (choisir Node.js 18, JavaScript)
//   cd functions && npm install
//   firebase deploy --only functions
// ─────────────────────────────────────────────────────────────────

const { onSchedule }         = require('firebase-functions/v2/scheduler')
const { initializeApp }      = require('firebase-admin/app')
const { getFirestore }        = require('firebase-admin/firestore')
const { getMessaging }        = require('firebase-admin/messaging')

initializeApp()
const db        = getFirestore()
const messaging = getMessaging()

// ─── Helper : envoyer un push + créer une notif Firestore ─────────
async function sendNotif(uid, token, { type, titre, message, lien = null }) {
  // 1. Créer la notif in-app dans Firestore
  await db.collection('notifications').add({
    uid, type, titre, message, lien,
    lue: false,
    createdAt: new Date(),
  })

  // 2. Envoyer le push FCM si token disponible
  if (!token) return
  try {
    await messaging.send({
      token,
      notification: { title: titre, body: message },
      data: { type, lien: lien || '/', titre, message },
      webpush: {
        notification: {
          icon:  '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          requireInteraction: false,
        },
        fcmOptions: { link: lien || '/' },
      },
    })
  } catch (err) {
    // Token expiré → le supprimer
    if (err.code === 'messaging/registration-token-not-registered') {
      await db.collection('fcm_tokens').doc(uid).delete()
    }
    console.error(`FCM error for ${uid}:`, err.message)
  }
}

// ─── Helper : récupérer tous les users avec un token FCM ──────────
async function getAllUsersWithToken() {
  const snap = await db.collection('fcm_tokens').get()
  return snap.docs.map(d => ({ uid: d.id, token: d.data().token }))
}

// ─────────────────────────────────────────────────────────────────
// CRON 1 : Alertes budget — tous les jours à 9h
// ─────────────────────────────────────────────────────────────────
exports.checkBudgetAlerts = onSchedule('0 9 * * *', async () => {
  const users = await getAllUsersWithToken()
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()

  for (const { uid, token } of users) {
    try {
      // Récupérer les budgets
      const budgetsSnap = await db.collection('budgets')
        .where('uid', '==', uid).get()
      if (budgetsSnap.empty) continue

      // Récupérer les dépenses du mois courant
      const startOfMonth = new Date(year, month, 1)
      const depensesSnap = await db.collection('depenses')
        .where('uid', '==', uid)
        .where('createdAt', '>=', startOfMonth)
        .get()

      // Calculer total par catégorie
      const totalParCat = {}
      depensesSnap.forEach(d => {
        const dep = d.data()
        totalParCat[dep.categorie] = (totalParCat[dep.categorie] || 0) + dep.montant
      })

      // Vérifier chaque budget
      for (const b of budgetsSnap.docs) {
        const { categorie, montant: limite } = b.data()
        const depense = totalParCat[categorie] || 0
        const pct     = Math.round((depense / limite) * 100)

        if (pct >= 100) {
          // Vérifier qu'on n'a pas déjà envoyé cette notif aujourd'hui
          const existing = await db.collection('notifications')
            .where('uid', '==', uid)
            .where('type', '==', 'budget_depasse')
            .where('data.categorie', '==', categorie)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get()

          const lastNotif = existing.docs[0]?.data()
          const lastDate  = lastNotif?.createdAt?.toDate?.()
          const alreadySentToday = lastDate &&
            lastDate.getMonth() === month && lastDate.getFullYear() === year

          if (!alreadySentToday) {
            await sendNotif(uid, token, {
              type:    'budget_depasse',
              titre:   `🚨 Budget ${categorie} dépassé`,
              message: `Vous avez dépensé ${Math.round(depense)}€ pour un budget de ${limite}€ (${pct}%).`,
              lien:    '/budget',
            })
          }
        } else if (pct >= 80) {
          const existing = await db.collection('notifications')
            .where('uid', '==', uid)
            .where('type', '==', 'budget_alert')
            .where('data.categorie', '==', categorie)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get()

          const lastNotif = existing.docs[0]?.data()
          const lastDate  = lastNotif?.createdAt?.toDate?.()
          const alreadySentThisMonth = lastDate &&
            lastDate.getMonth() === month && lastDate.getFullYear() === year

          if (!alreadySentThisMonth) {
            await sendNotif(uid, token, {
              type:    'budget_alert',
              titre:   `⚠️ Budget ${categorie} à ${pct}%`,
              message: `Il vous reste ${Math.round(limite - depense)}€ dans votre budget ${categorie}.`,
              lien:    '/budget',
            })
          }
        }
      }
    } catch (err) {
      console.error(`Budget check error for ${uid}:`, err)
    }
  }
})

// ─────────────────────────────────────────────────────────────────
// CRON 2 : Résumé mensuel — le 1er de chaque mois à 8h
// ─────────────────────────────────────────────────────────────────
exports.resumeMensuel = onSchedule('0 8 1 * *', async () => {
  const users   = await getAllUsersWithToken()
  const now     = new Date()
  // Mois précédent
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0) // dernier jour
  const moisLabel = prevMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  for (const { uid, token } of users) {
    try {
      const revSnap = await db.collection('revenus')
        .where('uid', '==', uid)
        .where('createdAt', '>=', prevMonth)
        .where('createdAt', '<=', lastMonth)
        .get()

      const depSnap = await db.collection('depenses')
        .where('uid', '==', uid)
        .where('createdAt', '>=', prevMonth)
        .where('createdAt', '<=', lastMonth)
        .get()

      const totalRev = revSnap.docs.reduce((s, d) => s + d.data().montant, 0)
      const totalDep = depSnap.docs.reduce((s, d) => s + d.data().montant, 0)
      const epargne  = totalRev - totalDep
      const taux     = totalRev > 0 ? Math.round((epargne / totalRev) * 100) : 0

      if (revSnap.empty && depSnap.empty) continue

      const epargneStr = epargne >= 0
        ? `Épargne : +${Math.round(epargne)}€ (${taux}%)`
        : `Déficit : ${Math.round(epargne)}€`

      await sendNotif(uid, token, {
        type:    'resume_mensuel',
        titre:   `📊 Bilan ${moisLabel}`,
        message: `Revenus ${Math.round(totalRev)}€ · Dépenses ${Math.round(totalDep)}€ · ${epargneStr}`,
        lien:    '/statistiques',
      })
    } catch (err) {
      console.error(`Resume mensuel error for ${uid}:`, err)
    }
  }
})

// ─────────────────────────────────────────────────────────────────
// CRON 3 : Rappel inactivité — tous les jours à 10h
// Envoie un rappel si aucune saisie depuis 7 jours
// ─────────────────────────────────────────────────────────────────
exports.rappelInactivite = onSchedule('0 10 * * *', async () => {
  const users   = await getAllUsersWithToken()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  for (const { uid, token } of users) {
    try {
      // Vérifier dernière dépense
      const lastDepSnap = await db.collection('depenses')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()

      const lastRevSnap = await db.collection('revenus')
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()

      const lastDep = lastDepSnap.docs[0]?.data()?.createdAt?.toDate?.()
      const lastRev = lastRevSnap.docs[0]?.data()?.createdAt?.toDate?.()
      const lastActivity = [lastDep, lastRev]
        .filter(Boolean)
        .sort((a, b) => b - a)[0]

      if (!lastActivity || lastActivity > sevenDaysAgo) continue

      // Vérifier qu'on n'a pas déjà envoyé un rappel cette semaine
      const lastNotifSnap = await db.collection('notifications')
        .where('uid', '==', uid)
        .where('type', '==', 'inactivite')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()

      const lastNotif = lastNotifSnap.docs[0]?.data()?.createdAt?.toDate?.()
      if (lastNotif && lastNotif > sevenDaysAgo) continue

      const jours = Math.round((Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000))

      await sendNotif(uid, token, {
        type:    'inactivite',
        titre:   '💡 Tout va bien ?',
        message: `Vous n'avez pas saisi de transaction depuis ${jours} jours. Pensez à mettre à jour votre budget !`,
        lien:    '/depenses',
      })
    } catch (err) {
      console.error(`Inactivite error for ${uid}:`, err)
    }
  }
})

// ─────────────────────────────────────────────────────────────────
// CRON 4 : Notification récurrentes générées — le 1er du mois à 7h
// (complément du système côté client, pour les users qui n'ouvrent pas l'app)
// ─────────────────────────────────────────────────────────────────
exports.notifRecurrentsGeneres = onSchedule('0 7 1 * *', async () => {
  const users = await getAllUsersWithToken()
  const now   = new Date()
  const moisLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  for (const { uid, token } of users) {
    try {
      // Compter les récurrentes créées ce mois
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const recSnap = await db.collection('depenses')
        .where('uid', '==', uid)
        .where('recurrent', '==', true)
        .where('autoGenere', '==', true)
        .where('createdAt', '>=', startOfMonth)
        .get()

      if (recSnap.empty) continue

      await sendNotif(uid, token, {
        type:    'recurrents',
        titre:   `🔄 ${recSnap.size} récurrente(s) ajoutée(s)`,
        message: `Vos dépenses fixes ont été renouvelées pour ${moisLabel}.`,
        lien:    '/depenses',
      })
    } catch (err) {
      console.error(`Recurrents notif error for ${uid}:`, err)
    }
  }
})
