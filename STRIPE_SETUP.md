# Configuration Stripe Webhook — FinanceFlow

## Variables Vercel à ajouter

### Déjà fait ✅
- VITE_STRIPE_PUBLIC_KEY
- VITE_STRIPE_PORTAL_URL
- VITE_STRIPE_PREMIUM_MONTHLY
- VITE_STRIPE_PREMIUM_YEARLY
- VITE_STRIPE_PRO_MONTHLY

### À ajouter maintenant

**1. Clé secrète Stripe**
Stripe Dashboard → Developers → API Keys → Secret key
```
STRIPE_SECRET_KEY = sk_live_xxx
```

**2. Mêmes Price IDs sans le préfixe VITE_**
```
STRIPE_PREMIUM_MONTHLY = price_xxx  (même valeur que VITE_STRIPE_PREMIUM_MONTHLY)
STRIPE_PREMIUM_YEARLY  = price_xxx
STRIPE_PRO_MONTHLY     = price_xxx
```

**3. Firebase Admin — clé de service**
Firebase Console → Paramètres du projet (⚙️) → Comptes de service
→ "Générer une nouvelle clé privée" → télécharge le JSON
→ Ouvre le JSON et copie :
```
FIREBASE_PROJECT_ID    = valeur de "project_id"
FIREBASE_CLIENT_EMAIL  = valeur de "client_email"
FIREBASE_PRIVATE_KEY   = valeur de "private_key" (garde les \n)
```

**4. Secret webhook Stripe** (généré à l'étape suivante)
```
STRIPE_WEBHOOK_SECRET = whsec_xxx
```

---

## Créer le webhook dans Stripe

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL : `https://TON-DOMAINE.vercel.app/api/webhook`
3. Events à écouter :
   - checkout.session.completed
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.deleted
   - customer.subscription.updated
4. Clique Create → copie le "Signing secret" (whsec_xxx)
5. Ajoute-le dans Vercel : STRIPE_WEBHOOK_SECRET = whsec_xxx

---

## Tester le webhook

Stripe Dashboard → Developers → Webhooks → ton endpoint
→ "Send test webhook" → checkout.session.completed
→ Vérifie les logs dans Vercel → Functions
