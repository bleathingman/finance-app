# Configuration Stripe — FinanceFlow

## 1. Créer un compte Stripe
https://dashboard.stripe.com/register

## 2. Créer tes produits dans Stripe Dashboard
- Dashboard → Products → Add Product
- Crée "FinanceFlow Premium"
  - Ajoute un prix récurrent mensuel → note le Price ID (price_xxx)
  - Ajoute un prix récurrent annuel  → note le Price ID (price_xxx)
- Crée "FinanceFlow Pro"
  - Ajoute un prix récurrent mensuel → note le Price ID

## 3. Récupérer ta clé publique
Dashboard → Developers → API Keys → Publishable key (pk_test_... ou pk_live_...)

## 4. Configurer le portail client
Dashboard → Settings → Billing → Customer portal → Activer → copier le lien

## 5. Ajouter les variables dans Vercel
Vercel → Settings → Environment Variables → Ajouter :
- VITE_STRIPE_PUBLIC_KEY
- VITE_STRIPE_PREMIUM_MONTHLY
- VITE_STRIPE_PREMIUM_YEARLY
- VITE_STRIPE_PRO_MONTHLY
- VITE_STRIPE_PORTAL_URL

## 6. Mettre à jour les abonnements dans Firebase
Quand un utilisateur paye, tu dois mettre à jour son document Firestore :
Collection: subscriptions / Document: {uid}
{
  planId: "premium",        // "free" | "premium" | "pro"
  status: "active",         // "active" | "canceled" | "past_due"
  periodEnd: Timestamp,     // date de fin de l'abonnement
  stripeCustomerId: "cus_xxx"
}

## 7. Webhook Stripe (pour automatiser)
Pour automatiser la mise à jour Firestore quand quelqu'un souscrit/annule,
tu peux utiliser :
- Firebase Extensions : "Run Payments with Stripe" (le plus simple)
- Ou une Vercel Serverless Function qui écoute les webhooks Stripe

## Mode test
Utilisez pk_test_... et des cartes de test Stripe :
- Succès : 4242 4242 4242 4242
- Refus  : 4000 0000 0000 0002
