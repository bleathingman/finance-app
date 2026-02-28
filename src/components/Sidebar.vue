<template>

  <!-- ═══ DESKTOP sidebar ══════════════════════════════════════════ -->
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">

    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="logo-text">FinanceFlow</span>
    </div>

    <nav class="sidebar-nav">
      <!-- Finances -->
      <div class="nav-section">
        <span class="nav-label">Finances</span>
        <router-link
          v-for="item in mainNav" :key="item.name"
          :to="item.path" class="nav-item"
          :class="{ active: $route.path === item.path }"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </div>

      <!-- Analyse -->
      <div class="nav-section">
        <span class="nav-label">Analyse</span>
        <router-link
          v-for="item in analysisNav" :key="item.name"
          :to="item.path" class="nav-item"
          :class="{ active: $route.path === item.path }"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
        </router-link>
      </div>

      <!-- Outils -->
      <div class="nav-section">
        <span class="nav-label">Outils</span>
        <router-link
          v-for="item in toolsNav" :key="item.name"
          :to="item.path" class="nav-item"
          :class="{ active: $route.path === item.path }"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-bottom">
      <!-- Badge plan actuel -->
      <router-link to="/pricing" class="plan-badge-link" :title="isCollapsed ? subStore.plan.name : ''">
        <span class="plan-badge-icon">{{ subStore.isPaid ? (subStore.isPro ? '🚀' : '💎') : '🌱' }}</span>
        <span class="nav-text plan-badge-text">
          <span class="plan-badge-name">{{ subStore.plan.name }}</span>
          <span v-if="!subStore.isPaid" class="plan-badge-cta">Passer Premium →</span>
        </span>
      </router-link>

      <button class="theme-toggle" @click="toggleTheme">
        <span class="nav-icon" v-html="isDark ? moonIcon : sunIcon"></span>
        <span class="nav-text">{{ isDark ? 'Mode clair' : 'Mode sombre' }}</span>
      </button>

      <router-link to="/profil" class="user-card" v-if="authStore.user">
        <div class="user-avatar">
          <img v-if="authStore.user.photoURL" :src="authStore.user.photoURL" alt="avatar" />
          <span v-else>{{ userInitial }}</span>
        </div>
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-email">{{ authStore.user.email }}</span>
        </div>
        <button class="logout-btn" @click.prevent="handleLogout" title="Déconnexion">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </router-link>
    </div>

    <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </aside>

  <!-- ═══ MOBILE top bar ═══════════════════════════════════════════ -->
  <header class="mobile-topbar">
    <div class="mobile-topbar-left">
      <button class="burger-btn" @click="drawerOpen = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <line x1="3" y1="6"  x2="21" y2="6"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="mobile-logo">
        <div class="logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>FinanceFlow</span>
      </div>
    </div>

    <!-- Page courante -->
    <div class="mobile-page-title">
      {{ currentPageLabel }}
    </div>

    <!-- Avatar / theme -->
    <div class="mobile-topbar-right">
      <button class="mobile-icon-btn" @click="toggleTheme" :title="isDark ? 'Mode clair' : 'Mode sombre'">
        <span v-html="isDark ? moonIcon : sunIcon"></span>
      </button>
      <div class="mobile-avatar" v-if="authStore.user">
        <img v-if="authStore.user.photoURL" :src="authStore.user.photoURL" alt="avatar" />
        <span v-else>{{ userInitial }}</span>
      </div>
    </div>
  </header>

  <!-- ═══ MOBILE drawer ════════════════════════════════════════════ -->
  <teleport to="body">
    <transition name="drawer">
      <div v-if="drawerOpen" class="drawer-overlay" @click="drawerOpen = false">
        <nav class="drawer" @click.stop>

          <!-- Header drawer -->
          <div class="drawer-header">
            <div class="mobile-logo">
              <div class="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span>FinanceFlow</span>
            </div>
            <button class="drawer-close" @click="drawerOpen = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Nav items -->
          <div class="drawer-section">
            <span class="drawer-label">Principal</span>
            <router-link
              v-for="item in mainNav" :key="item.name"
              :to="item.path" class="drawer-item"
              :class="{ active: $route.path === item.path }"
              @click="drawerOpen = false"
            >
              <span class="nav-icon" v-html="item.icon"></span>
              <span>{{ item.label }}</span>
            </router-link>
          </div>

          <div class="drawer-section">
            <span class="drawer-label">Analyse</span>
            <router-link
              v-for="item in analysisNav" :key="item.name"
              :to="item.path" class="drawer-item"
              :class="{ active: $route.path === item.path }"
              @click="drawerOpen = false"
            >
              <span class="nav-icon" v-html="item.icon"></span>
              <span>{{ item.label }}</span>
            </router-link>
          </div>

          <div class="drawer-section">
            <span class="drawer-label">Outils</span>
            <router-link
              v-for="item in toolsNav" :key="item.name"
              :to="item.path" class="drawer-item"
              :class="{ active: $route.path === item.path }"
              @click="drawerOpen = false"
            >
              <span class="nav-icon" v-html="item.icon"></span>
              <span>{{ item.label }}</span>
            </router-link>
          </div>

          <!-- Footer drawer -->
          <div class="drawer-footer">
            <router-link to="/profil" class="drawer-user" v-if="authStore.user" @click="drawerOpen = false" style="text-decoration:none;color:inherit">
              <div class="user-avatar" style="width:38px;height:38px;font-size:16px">
                <img v-if="authStore.user.photoURL" :src="authStore.user.photoURL" alt="avatar" />
                <span v-else>{{ userInitial }}</span>
              </div>
              <div class="user-info" style="flex:1;min-width:0">
                <span class="user-name">{{ userName }}</span>
                <span class="user-email">{{ authStore.user.email }}</span>
              </div>
              <span style="font-size:12px;color:var(--text-muted)">→</span>
            </router-link>
            <!-- Badge plan mobile -->
            <router-link to="/pricing" class="drawer-plan-badge" @click="drawerOpen = false">
              <span>{{ subStore.isPaid ? (subStore.isPro ? '🚀' : '💎') : '🌱' }}</span>
              <div>
                <div style="font-weight:700;font-size:13px">{{ subStore.plan.name }}</div>
                <div v-if="!subStore.isPaid" style="font-size:11px;color:var(--accent)">Passer Premium →</div>
                <div v-else style="font-size:11px;color:var(--text-muted)">Abonnement actif</div>
              </div>
            </router-link>

            <button class="drawer-logout" @click="handleLogout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Se déconnecter
            </button>
          </div>

        </nav>
      </div>
    </transition>
  </teleport>

</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import { useThemeStore } from '@/stores/theme'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const isCollapsed = ref(false)
const isDark      = ref(true)
const drawerOpen  = ref(false)
const subStore    = useSubscriptionStore()
const themeStore  = useThemeStore()
themeStore.init()

// Ferme le drawer automatiquement au changement de route
watch(() => route.path, () => { drawerOpen.value = false })

const userName    = computed(() => {
  const u = authStore.user
  return u?.displayName || u?.email?.split('@')[0] || 'Utilisateur'
})
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const currentPageLabel = computed(() => {
  const all = [...mainNav, ...analysisNav, ...toolsNav]
  return all.find(n => n.path === route.path)?.label || 'FinanceFlow'
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

async function handleLogout() {
  drawerOpen.value = false
  await authStore.logout()
  router.push('/login')
}

const mainNav = [
  {
    name: 'dashboard', path: '/', label: 'Dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    name: 'revenus', path: '/revenus', label: 'Revenus',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    name: 'depenses', path: '/depenses', label: 'Dépenses',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  {
    name: 'budget', path: '/budget', label: 'Budget',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  {
    name: 'objectifs', path: '/objectifs', label: 'Objectifs',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>`
  }
]

const analysisNav = [
  {
    name: 'statistiques', path: '/statistiques', label: 'Statistiques',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="20" x2="12" y2="4"  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="6"  y1="20" x2="6"  y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  }
]

const toolsNav = [
  {
    name: 'comptes', path: '/comptes', label: 'Mes comptes',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      <path d="M2 10h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    pro: true
  },
  {
    name: 'import', path: '/import', label: 'Import bancaire',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  {
    name: 'themes', path: '/themes', label: 'Thèmes',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3"/>
    </svg>`
  },
  {
    name: 'pricing', path: '/pricing', label: 'Abonnement',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
]

const moonIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`

const sunIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
    stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`
</script>

<style scoped>
/* ═══ DESKTOP SIDEBAR ════════════════════════════════════ */
.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  z-index: 100;
  transition: width var(--transition-slow);
  overflow: hidden;
}
.sidebar.collapsed { width: var(--sidebar-collapsed); }

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 24px;
  overflow: hidden;
}
.logo-icon {
  width: 36px; height: 36px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
.logo-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity var(--transition);
}
.collapsed .logo-text { opacity: 0; pointer-events: none; }

.sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; overflow-x: hidden; }

.nav-section  { display: flex; flex-direction: column; gap: 2px; margin-bottom: 16px; }
.nav-label    { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); padding: 0 12px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; transition: opacity var(--transition); }
.collapsed .nav-label { opacity: 0; }

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 14px; font-weight: 500;
  text-decoration: none;
  transition: all var(--transition);
  white-space: nowrap; overflow: hidden;
}
.nav-item:hover  { background: var(--bg-elevated); color: var(--text-primary); }
.nav-item.active { background: var(--accent-dim); color: var(--accent); border: 1px solid var(--border-accent); }

.nav-icon { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.nav-text { transition: opacity var(--transition); }
.collapsed .nav-text { opacity: 0; pointer-events: none; }

.nav-badge { margin-left: auto; background: var(--accent-dim); color: var(--accent); border: 1px solid var(--border-accent); border-radius: 99px; font-size: 11px; font-weight: 700; padding: 1px 7px; flex-shrink: 0; }
.collapsed .nav-badge { display: none; }

.sidebar-bottom { display: flex; flex-direction: column; gap: 8px; padding-top: 12px; border-top: 1px solid var(--border); }

.theme-toggle { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius); background: none; border: none; cursor: pointer; color: var(--text-muted); font-family: var(--font-body); font-size: 14px; font-weight: 500; width: 100%; white-space: nowrap; overflow: hidden; transition: all var(--transition); }
.theme-toggle:hover { background: var(--bg-elevated); color: var(--text-primary); }

.user-card { text-decoration:none; color:inherit; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius); background: var(--bg-elevated); overflow: hidden; }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-dim); border: 1px solid var(--border-accent); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: var(--accent); flex-shrink: 0; overflow: hidden; }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-info  { flex: 1; min-width: 0; transition: opacity var(--transition); }
.user-name  { display: block; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { display: block; font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.collapsed .user-info { opacity: 0; pointer-events: none; }

.logout-btn { background: none; border: none; cursor: pointer; padding: 4px; color: var(--text-muted); border-radius: 6px; transition: all var(--transition); flex-shrink: 0; }
.logout-btn:hover { color: var(--red); background: rgba(255,107,107,0.1); }
.collapsed .logout-btn { display: none; }

.collapse-btn { position: absolute; top: 50%; right: -12px; transform: translateY(-50%); width: 24px; height: 24px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all var(--transition); z-index: 10; }
.collapse-btn:hover { border-color: var(--border-accent); color: var(--accent); }
.collapsed .collapse-btn svg { transform: rotate(180deg); }

@media (max-width: 768px) { .sidebar { display: none; } }

.plan-badge-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all var(--transition);
  overflow: hidden;
}
.plan-badge-link:hover { background: rgba(0,229,160,0.2); }
.plan-badge-icon { font-size: 18px; flex-shrink: 0; }
.plan-badge-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.plan-badge-name { font-size: 13px; font-weight: 700; color: var(--accent); }
.plan-badge-cta  { font-size: 11px; color: var(--text-muted); }

.drawer-plan-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text-primary);
  font-size: 20px;
  transition: all var(--transition);
}
.drawer-plan-badge:hover { background: rgba(0,229,160,0.2); }

.pricing-link {
  background: var(--accent-dim) !important;
  border: 1px solid var(--border-accent) !important;
  color: var(--accent) !important;
  margin-top: 8px;
  font-weight: 600;
}
.pricing-link:hover {
  background: rgba(0,229,160,0.2) !important;
  box-shadow: 0 0 16px var(--accent-glow);
}

/* ═══ MOBILE TOP BAR ═════════════════════════════════════ */
.mobile-topbar {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0;
  /* Hauteur fixe + safe area pour l'encoche / Dynamic Island */
  height: calc(60px + env(safe-area-inset-top));
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  z-index: 200;
  /* Padding horizontal + padding-top pour pousser le contenu sous l'encoche */
  padding: env(safe-area-inset-top) 16px 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 768px) { .mobile-topbar { display: flex; } }

.mobile-topbar-left { display: flex; align-items: center; gap: 10px; }
.mobile-topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.burger-btn {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition);
  flex-shrink: 0;
}
.burger-btn:hover { border-color: var(--border-accent); color: var(--accent); }

.mobile-logo {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
}
.mobile-logo .logo-icon { width: 28px; height: 28px; border-radius: 8px; font-size: 13px; }

.mobile-page-title {
  flex: 1;
  text-align: center;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-icon-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--text-muted); border-radius: 8px;
  transition: all var(--transition);
}
.mobile-icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

.mobile-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: var(--accent);
  overflow: hidden;
}
.mobile-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* ═══ MOBILE DRAWER ══════════════════════════════════════ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
}

.drawer {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 280px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 0;
  box-shadow: 8px 0 32px rgba(0,0,0,0.3);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--border);
}

.drawer-close {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition);
}
.drawer-close:hover { border-color: var(--border-accent); color: var(--text-primary); }

.drawer-section { padding: 16px 12px 4px; }
.drawer-label   { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); padding: 0 8px; margin-bottom: 6px; }

.drawer-item {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 12px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 15px; font-weight: 500;
  text-decoration: none;
  transition: all var(--transition);
  margin-bottom: 2px;
}
.drawer-item:hover  { background: var(--bg-elevated); color: var(--text-primary); }
.drawer-item.active { background: var(--accent-dim); color: var(--accent); border: 1px solid var(--border-accent); }

.drawer-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-user { display: flex; align-items: center; gap: 10px; }

.drawer-logout {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px;
  background: rgba(255,107,107,0.07);
  border: 1px solid rgba(255,107,107,0.15);
  border-radius: var(--radius);
  color: var(--red);
  font-size: 14px; font-weight: 500;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all var(--transition);
  width: 100%;
}
.drawer-logout:hover { background: rgba(255,107,107,0.14); }

/* ═══ ANIMATIONS DRAWER ══════════════════════════════════ */
.drawer-enter-active { transition: opacity 0.25s ease; }
.drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }

.drawer-enter-active .drawer,
.drawer-leave-active .drawer { transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); }
.drawer-enter-from .drawer    { transform: translateX(-100%); }
.drawer-leave-to .drawer      { transform: translateX(-100%); }
</style>