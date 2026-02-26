// api/webhook.js — Vercel Serverless Function
// Écoute les événements Stripe et met à jour Firestore

import Stripe from 'stripe'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ─── Init Stripe ──────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ─── Init Firebase Admin (côté serveur) ──────────────────────────
function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Les \n doivent être des vrais sauts de ligne
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    })
  }
  return getFirestore()
}

// ─── Mapping Price ID → Plan ──────────────────────────────────────
function getPlanFromPriceId(priceId) {
  const map = {
    [process.env.STRIPE_PREMIUM_MONTHLY]: 'premium',
    [process.env.STRIPE_PREMIUM_YEARLY]:  'premium',
    [process.env.STRIPE_PRO_MONTHLY]:     'pro'
  }
  return map[priceId] || 'premium'
}

// ─── Handler principal ────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vérification signature Stripe (sécurité critique)
  const sig     = req.headers['stripe-signature']
  const secret  = process.env.STRIPE_WEBHOOK_SECRET
  let event

  try {
    // Vercel parse automatiquement le body — on a besoin du raw body
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('❌ Webhook signature invalide:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  const db = getDb()
  console.log('📨 Stripe event:', event.type)

  try {
    switch (event.type) {

      // ── Paiement réussi / abonnement créé ───────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const uid     = session.client_reference_id // on passe l'uid dans l'URL Stripe
        const subId   = session.subscription

        if (!uid) { console.warn('⚠️ Pas de uid dans client_reference_id'); break }

        // Récupère les détails de la subscription
        const sub     = await stripe.subscriptions.retrieve(subId)
        const priceId = sub.items.data[0]?.price?.id
        const planId  = getPlanFromPriceId(priceId)

        await db.collection('subscriptions').doc(uid).set({
          planId,
          status:           sub.status,
          stripeCustomerId: session.customer,
          stripeSubId:      subId,
          priceId,
          periodEnd:        Timestamp.fromMillis(sub.current_period_end * 1000),
          updatedAt:        Timestamp.now()
        }, { merge: true })

        console.log(`✅ User ${uid} → plan ${planId}`)
        break
      }

      // ── Renouvellement mensuel/annuel réussi ────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        if (!invoice.subscription) break

        const sub  = await stripe.subscriptions.retrieve(invoice.subscription)
        const uid  = await getUidFromCustomer(db, sub.customer)
        if (!uid) break

        const priceId = sub.items.data[0]?.price?.id
        const planId  = getPlanFromPriceId(priceId)

        await db.collection('subscriptions').doc(uid).set({
          planId,
          status:    sub.status,
          priceId,
          periodEnd: Timestamp.fromMillis(sub.current_period_end * 1000),
          updatedAt: Timestamp.now()
        }, { merge: true })

        console.log(`🔄 Renouvellement user ${uid} → ${planId}`)
        break
      }

      // ── Paiement échoué ─────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (!invoice.subscription) break

        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const uid = await getUidFromCustomer(db, sub.customer)
        if (!uid) break

        await db.collection('subscriptions').doc(uid).set({
          status:    'past_due',
          updatedAt: Timestamp.now()
        }, { merge: true })

        console.log(`⚠️ Paiement échoué pour user ${uid}`)
        break
      }

      // ── Abonnement annulé / expiré ──────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const uid = await getUidFromCustomer(db, sub.customer)
        if (!uid) break

        await db.collection('subscriptions').doc(uid).set({
          planId:    'free',
          status:    'canceled',
          periodEnd: Timestamp.fromMillis(sub.current_period_end * 1000),
          updatedAt: Timestamp.now()
        }, { merge: true })

        console.log(`❌ Abonnement annulé pour user ${uid} → free`)
        break
      }

      // ── Abonnement modifié (upgrade / downgrade) ────────────────
      case 'customer.subscription.updated': {
        const sub     = event.data.object
        const uid     = await getUidFromCustomer(db, sub.customer)
        if (!uid) break

        const priceId = sub.items.data[0]?.price?.id
        const planId  = sub.status === 'active' ? getPlanFromPriceId(priceId) : 'free'

        await db.collection('subscriptions').doc(uid).set({
          planId,
          status:    sub.status,
          priceId,
          periodEnd: Timestamp.fromMillis(sub.current_period_end * 1000),
          updatedAt: Timestamp.now()
        }, { merge: true })

        console.log(`🔄 Abonnement mis à jour user ${uid} → ${planId} (${sub.status})`)
        break
      }

      default:
        console.log(`ℹ️ Event ignoré: ${event.type}`)
    }

    res.status(200).json({ received: true })

  } catch (err) {
    console.error('❌ Erreur webhook:', err)
    res.status(500).json({ error: err.message })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

// Récupère l'UID Firebase depuis le stripeCustomerId stocké en Firestore
async function getUidFromCustomer(db, customerId) {
  if (!customerId) return null
  const snap = await db.collection('subscriptions')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get()
  if (snap.empty) return null
  return snap.docs[0].id // le doc ID = uid Firebase
}

// Vercel parse le body en JSON automatiquement, on doit le re-sérialiser
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => resolve(Buffer.from(data)))
    req.on('error', reject)
  })
}

// Config Vercel pour ne PAS parser le body (Stripe a besoin du raw)
export const config = {
  api: { bodyParser: false }
}
