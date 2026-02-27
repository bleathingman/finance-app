<template>
  <div class="animate-fade-in">

    <div class="page-header" style="text-align:center;margin-bottom:40px">
      <h1>Choisissez votre plan</h1>
      <p style="font-size:16px;margin-top:8px">Commencez gratuitement, évoluez quand vous en avez besoin</p>

      <!-- Toggle mensuel / annuel -->
      <div class="billing-toggle">
        <span :style="{ color: !yearly ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: !yearly ? 700 : 400 }">Mensuel</span>
        <button class="toggle-btn" :class="{ active: yearly }" @click="yearly = !yearly">
          <span class="toggle-knob"></span>
        </button>
        <span :style="{ color: yearly ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: yearly ? 700 : 400 }">
          Annuel <span class="save-badge">-35%</span>
        </span>
      </div>
    </div>

    <!-- Plans -->
    <div class="plans-grid">

      <!-- Gratuit -->
      <div class="plan-card">
        <div class="plan-header">
          <div class="plan-icon">🌱</div>
          <h3>{{ PLANS.free.name }}</h3>
          <div class="plan-price">
            <span class="price-amount">Gratuit</span>
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin-top:4px">Pour toujours</p>
        </div>
        <ul class="plan-features">
          <li v-for="f in PLANS.free.features" :key="f" class="feature-item">
            <span class="feature-check ok">✓</span> {{ f }}
          </li>
          <li class="feature-item muted"><span class="feature-check no">✗</span> Historique limité</li>
          <li class="feature-item muted"><span class="feature-check no">✗</span> Export CSV/PDF</li>
          <li class="feature-item muted"><span class="feature-check no">✗</span> Graphiques avancés</li>
          <li class="feature-item muted"><span class="feature-check no">✗</span> Thèmes customs</li>
        </ul>
        <div class="plan-action">
          <div v-if="subStore.planId === 'free'" class="btn btn-ghost" style="width:100%;justify-content:center;cursor:default">
            ✓ Plan actuel
          </div>
          <router-link v-else to="/" class="btn btn-ghost" style="width:100%;justify-content:center">
            Rester gratuit
          </router-link>
        </div>
      </div>

      <!-- Premium -->
      <div class="plan-card featured">
        <div class="popular-badge">⭐ Le plus populaire</div>
        <div class="plan-header">
          <div class="plan-icon">💎</div>
          <h3>{{ PLANS.premium.name }}</h3>
          <div class="plan-price">
            <span class="price-amount">{{ yearly ? '3,25€' : '3,99€' }}</span>
            <span class="price-period">/mois</span>
          </div>
          <p v-if="yearly" style="font-size:13px;color:var(--accent);margin-top:4px;font-weight:600">Facturé 39€/an — économisez 21€</p>
          <p v-else style="font-size:13px;color:var(--text-muted);margin-top:4px">ou 39€/an (économisez 21€)</p>
        </div>
        <ul class="plan-features">
          <li v-for="f in PLANS.premium.features" :key="f" class="feature-item">
            <span class="feature-check ok accent">✓</span> {{ f }}
          </li>
        </ul>
        <div class="plan-action">
          <div v-if="subStore.planId === 'premium'" class="btn btn-primary" style="width:100%;justify-content:center;cursor:default;opacity:0.7">
            ✓ Plan actuel
          </div>
          <button v-else class="btn btn-primary" style="width:100%;justify-content:center" @click="handleCheckout('premium', yearly)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Commencer — {{ yearly ? '49€/an' : '4,99€/mois' }}
          </button>
        </div>
      </div>

      <!-- Pro -->
      <div class="plan-card">
        <div class="plan-header">
          <div class="plan-icon">🚀</div>
          <h3>{{ PLANS.pro.name }}</h3>
          <div class="plan-price">
            <span class="price-amount">39€</span>
            <span class="price-period">/mois</span>
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin-top:4px">Pour les professionnels</p>
        </div>
        <ul class="plan-features">
          <li v-for="f in PLANS.pro.features" :key="f" class="feature-item">
            <span class="feature-check ok">✓</span> {{ f }}
          </li>
        </ul>
        <div class="plan-action">
          <div v-if="subStore.planId === 'pro'" class="btn btn-ghost" style="width:100%;justify-content:center;cursor:default">
            ✓ Plan actuel
          </div>
          <button v-else class="btn btn-ghost" style="width:100%;justify-content:center" @click="handleCheckout('pro', false)">
            Contacter / Souscrire
          </button>
        </div>
      </div>

    </div>

    <!-- Gérer l'abonnement si déjà payant -->
    <div v-if="subStore.isPaid" class="manage-section">
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;max-width:600px;margin:0 auto">
        <div>
          <div style="font-weight:700;font-size:15px">Gérer mon abonnement</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
            Modifier, annuler ou télécharger vos factures via le portail Stripe
          </div>
        </div>
        <button class="btn btn-ghost" @click="subStore.openPortal()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Portail de facturation
        </button>
      </div>
    </div>

    <!-- FAQ -->
    <div class="faq-section">
      <h2 style="text-align:center;font-family:var(--font-display);margin-bottom:28px">Questions fréquentes</h2>
      <div class="faq-grid">
        <div v-for="q in faq" :key="q.q" class="faq-item card">
          <div class="faq-q">{{ q.q }}</div>
          <div class="faq-a">{{ q.a }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSubscriptionStore, PLANS } from '@/stores/subscription'

const subStore = useSubscriptionStore()
const yearly   = ref(false)

async function handleCheckout(planName, isYearly) {
  const plan = PLANS[planName]
  const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly
  await subStore.checkout(priceId)
}

const faq = [
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui. Vous pouvez annuler depuis le portail de facturation à n\'importe quel moment. Vous conservez l\'accès jusqu\'à la fin de la période payée.'
  },
  {
    q: 'Que se passe-t-il avec mes données si je reviens au plan gratuit ?',
    a: 'Vos données sont conservées. Vous perdez simplement l\'accès aux features premium, mais tout est récupérable si vous revenez sur un plan payant.'
  },
  {
    q: 'Le plan annuel est-il remboursable ?',
    a: 'Si vous n\'êtes pas satisfait dans les 14 jours, nous remboursons intégralement. Contactez-nous par email.'
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui. Tout est stocké dans Firebase avec chiffrement. Vos données bancaires ne transitent jamais par nos serveurs — les paiements sont gérés directement par Stripe.'
  },
  {
    q: 'Le plan Pro est-il adapté aux indépendants ?',
    a: 'Oui ! Le plan Pro est pensé pour les freelances et petites entreprises : multi-comptes, rapports mensuels automatiques et support prioritaire.'
  },
  {
    q: 'Comment fonctionne l\'abonnement annuel ?',
    a: 'Vous êtes facturé une fois par an. C\'est 35% moins cher qu\'un abonnement mensuel, soit 39€ au lieu de 59,88€.'
  }
]
</script>

<style scoped>
.billing-toggle {
  display: flex; align-items: center; gap: 12px;
  justify-content: center; margin-top: 20px;
  font-size: 14px; font-weight: 500;
}
.save-badge {
  display: inline-block; padding: 2px 7px;
  background: rgba(0,229,160,0.15); color: var(--accent);
  border-radius: 99px; font-size: 11px; font-weight: 700;
  margin-left: 4px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto 48px;
}

.plan-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  display: flex; flex-direction: column; gap: 24px;
  position: relative;
  transition: all var(--transition);
}
.plan-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.2); }
.plan-card.featured {
  border-color: var(--border-accent);
  background: linear-gradient(145deg, var(--bg-surface), rgba(0,229,160,0.03));
  box-shadow: 0 0 40px rgba(0,229,160,0.06);
}

.popular-badge {
  position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
  background: var(--accent); color: #0c0e14;
  padding: 4px 16px; border-radius: 99px;
  font-size: 12px; font-weight: 700; white-space: nowrap;
}

.plan-header { text-align: center; }
.plan-icon   { font-size: 32px; margin-bottom: 8px; }
.plan-header h3 { font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 12px; }

.plan-price { display: flex; align-items: baseline; justify-content: center; gap: 3px; }
.price-amount { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; }
.price-period { font-size: 14px; color: var(--text-muted); }

.plan-features { flex: 1; display: flex; flex-direction: column; gap: 10px; list-style: none; }
.feature-item { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; }
.feature-item.muted { color: var(--text-muted); }
.feature-check { font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.feature-check.ok     { color: var(--green); }
.feature-check.ok.accent { color: var(--accent); }
.feature-check.no     { color: var(--text-muted); }

.plan-action { margin-top: auto; }

.manage-section { margin-bottom: 48px; }

.faq-section { max-width: 900px; margin: 0 auto; }
.faq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.faq-item { padding: 20px; }
.faq-q { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.faq-a { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

@media (max-width: 900px) { .plans-grid { grid-template-columns: 1fr; max-width: 420px; } }
@media (max-width: 640px) { .faq-grid { grid-template-columns: 1fr; } }
</style>
