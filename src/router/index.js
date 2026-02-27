import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase/config'

import Dashboard    from '@/views/Dashboard.vue'
import Revenus      from '@/views/Revenus.vue'
import Depenses     from '@/views/Depenses.vue'
import Budget       from '@/views/Budget.vue'
import Objectifs    from '@/views/Objectifs.vue'
import Statistiques from '@/views/Statistiques.vue'
import Login        from '@/views/Login.vue'
import Pricing      from '@/views/Pricing.vue'
import Themes       from '@/views/Themes.vue'
import ImportCSV    from '@/views/ImportCSV.vue'

const routes = [
  { path: '/login',        name: 'Login',        component: Login,        meta: { public: true } },
  { path: '/pricing',      name: 'Pricing',      component: Pricing,      meta: { requiresAuth: true } },
  { path: '/themes',       name: 'Themes',       component: Themes,       meta: { requiresAuth: true } },
  { path: '/import',       name: 'ImportCSV',    component: ImportCSV,    meta: { requiresAuth: true } },
  { path: '/',             name: 'Dashboard',    component: Dashboard,    meta: { requiresAuth: true } },
  { path: '/revenus',      name: 'Revenus',      component: Revenus,      meta: { requiresAuth: true } },
  { path: '/depenses',     name: 'Depenses',     component: Depenses,     meta: { requiresAuth: true } },
  { path: '/budget',       name: 'Budget',       component: Budget,       meta: { requiresAuth: true } },
  { path: '/objectifs',    name: 'Objectifs',    component: Objectifs,    meta: { requiresAuth: true } },
  { path: '/statistiques', name: 'Statistiques', component: Statistiques, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes })

function waitForAuth() {
  return new Promise(resolve => {
    if (auth.currentUser !== undefined) return resolve(auth.currentUser)
    const unsub = auth.onAuthStateChanged(user => { unsub(); resolve(user) })
  })
}

router.beforeEach(async (to, from, next) => {
  const user = await waitForAuth()
  if (to.meta.requiresAuth && !user) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && user) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
