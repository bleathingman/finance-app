<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="logo-text">FinanceFlow</span>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-label">Principal</span>
        <router-link
          v-for="item in mainNav"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <span class="nav-label">Analyse</span>
        <router-link
          v-for="item in analysisNav"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
          :title="isCollapsed ? item.label : ''"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-text">{{ item.label }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Bottom section -->
    <div class="sidebar-bottom">
      <!-- Theme toggle -->
      <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Mode clair' : 'Mode sombre'">
        <span class="nav-icon" v-html="isDark ? moonIcon : sunIcon"></span>
        <span class="nav-text">{{ isDark ? 'Mode clair' : 'Mode sombre' }}</span>
      </button>

      <!-- User info -->
      <div class="user-card" v-if="authStore.user">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-email">{{ authStore.user.email }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout" title="Déconnexion">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Collapse button (desktop) -->
    <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        :style="{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </aside>

  <!-- Mobile bottom nav -->
  <nav class="mobile-nav">
    <router-link
      v-for="item in allNav"
      :key="item.name"
      :to="item.path"
      class="mobile-nav-item"
      :class="{ active: $route.path === item.path }"
    >
      <span v-html="item.icon"></span>
      <span>{{ item.shortLabel || item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isCollapsed = ref(false)
const isDark = ref(true)

const userName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return u.displayName || u.email?.split('@')[0] || 'Utilisateur'
})

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

const mainNav = [
  {
    name: 'dashboard', path: '/', label: 'Dashboard', shortLabel: 'Home',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    name: 'revenus', path: '/revenus', label: 'Revenus', shortLabel: 'Revenus',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    name: 'depenses', path: '/depenses', label: 'Dépenses', shortLabel: 'Dépenses',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  },
  {
    name: 'budget', path: '/budget', label: 'Budget', shortLabel: 'Budget',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
]

const analysisNav = [
  {
    name: 'objectifs', path: '/objectifs', label: 'Objectifs', shortLabel: 'Objectifs',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>`
  },
  {
    name: 'statistiques', path: '/statistiques', label: 'Statistiques', shortLabel: 'Stats',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  }
]

const allNav = [...mainNav, ...analysisNav]

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
/* ─── Sidebar ────────────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  transition: width var(--transition-slow);
  z-index: 100;
  overflow: hidden;
}

.sidebar.collapsed { width: var(--sidebar-collapsed); }

/* Logo */
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
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity var(--transition);
}

/* Nav */
.sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }

.nav-section { display: flex; flex-direction: column; gap: 4px; }

.nav-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 12px;
  margin-bottom: 4px;
  white-space: nowrap;
  transition: opacity var(--transition);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition);
  position: relative;
  white-space: nowrap;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--border-accent);
}

.nav-item.active .nav-icon { color: var(--accent); }

.nav-icon {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: inherit;
}

.nav-icon :deep(svg) { width: 18px; height: 18px; }

.nav-text { transition: opacity var(--transition); }

.nav-badge {
  margin-left: auto;
  background: var(--orange);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
}

/* Collapsed state */
.sidebar.collapsed .nav-text,
.sidebar.collapsed .nav-label,
.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-badge,
.sidebar.collapsed .user-info { opacity: 0; pointer-events: none; }

/* Bottom */
.sidebar-bottom {
  padding-top: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all var(--transition);
  font-family: var(--font-body);
  white-space: nowrap;
}

.theme-toggle:hover { background: var(--bg-elevated); color: var(--text-primary); }

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.user-avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--accent), #00b4d8);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #0c0e14;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  transition: opacity var(--transition);
}

.user-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color var(--transition);
}

.logout-btn:hover { color: var(--red); }

/* Collapse button */
.collapse-btn {
  position: absolute;
  right: -12px; top: 50%;
  transform: translateY(-50%);
  width: 24px; height: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition);
  z-index: 10;
}

.collapse-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #0c0e14;
}

.collapse-btn svg {
  transition: transform var(--transition);
}

/* ─── Mobile nav ─────────────────────────────────────────────────── */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  z-index: 200;
  padding: 8px 0 12px;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--transition);
  padding: 4px;
}

.mobile-nav-item :deep(svg) { width: 20px; height: 20px; }

.mobile-nav-item.active { color: var(--accent); }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-nav { display: flex; }
}
</style>
