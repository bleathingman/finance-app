<template>
  <div class="login-page">
    <!-- Décorations fond -->
    <div class="bg-glow"></div>
    <div class="bg-grid"></div>

    <div class="login-wrapper">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>FinanceFlow</span>
      </div>

      <!-- Card -->
      <div class="login-card">
        <!-- Tabs -->
        <div class="auth-tabs">
          <button class="auth-tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">Connexion</button>
          <button class="auth-tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">Inscription</button>
        </div>

        <!-- Erreur -->
        <div v-if="authStore.error" class="auth-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ authStore.error }}
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" class="input" placeholder="vous@exemple.com" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <div style="position:relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                placeholder="••••••••"
                required
                style="padding-right:44px"
              />
              <button type="button" class="pw-toggle" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" :disabled="authStore.loading">
            <div v-if="authStore.loading" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
            <span v-else>{{ mode === 'login' ? 'Se connecter' : 'Créer mon compte' }}</span>
          </button>
        </form>

        <!-- Séparateur -->
        <div class="divider"><span>ou</span></div>

        <!-- Google -->
        <button class="btn-google" @click="handleGoogle" :disabled="authStore.loading">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <!-- Pills features -->
        <div class="feature-pills">
          <span class="pill">📊 Dashboard</span>
          <span class="pill">💰 Budget intelligent</span>
          <span class="pill">🎯 Objectifs d'épargne</span>
          <span class="pill">📈 Statistiques</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore    = useAuthStore()
const router       = useRouter()
const mode         = ref('login')
const email        = ref('')
const password     = ref('')
const showPassword = ref(false)

async function handleSubmit() {
  if (mode.value === 'login') {
    await authStore.login(email.value, password.value)
  } else {
    await authStore.register(email.value, password.value)
  }
  if (!authStore.error) router.push('/')
}

async function handleGoogle() {
  await authStore.loginWithGoogle()
  if (!authStore.error) router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  top: -200px; left: 50%;
  transform: translateX(-50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.login-wrapper {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  margin-bottom: 28px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 22px;
}

.logo-icon {
  width: 44px; height: 44px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
}

.login-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
}

/* Tabs */
.auth-tabs { display: flex; gap: 4px; background: var(--bg-elevated); border-radius: var(--radius); padding: 4px; margin-bottom: 24px; }
.auth-tab  { flex: 1; padding: 9px; border: none; border-radius: 9px; background: none; font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--text-muted); cursor: pointer; transition: all var(--transition); }
.auth-tab.active { background: var(--bg-surface); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

/* Erreur */
.auth-error {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  background: rgba(255,107,107,0.08);
  border: 1px solid rgba(255,107,107,0.2);
  border-radius: var(--radius);
  color: var(--red);
  font-size: 13px;
  margin-bottom: 16px;
}

/* Password toggle */
.pw-toggle {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--text-muted);
  padding: 4px; transition: color var(--transition);
}
.pw-toggle:hover { color: var(--text-primary); }

/* Divider */
.divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: var(--text-muted); font-size: 13px; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* Google */
.btn-google {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 11px; border-radius: var(--radius);
  background: var(--bg-elevated); border: 1px solid var(--border);
  font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--text-primary);
  cursor: pointer; transition: all var(--transition);
}
.btn-google:hover { border-color: var(--border-accent); background: var(--bg-hover); }
.btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

/* Pills */
.feature-pills { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 20px; }
.pill { padding: 4px 12px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 99px; font-size: 12px; color: var(--text-muted); }
</style>
