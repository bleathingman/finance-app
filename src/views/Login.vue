<template>
  <div class="login-page">
    <!-- Background décoration -->
    <div class="bg-glow"></div>
    <div class="bg-grid"></div>

    <div class="login-container">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#00e5a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>FinanceFlow</span>
      </div>

      <!-- Card -->
      <div class="login-card">
        <div class="login-header">
          <h1>{{ isLogin ? 'Bon retour 👋' : 'Créer un compte' }}</h1>
          <p>{{ isLogin ? 'Connectez-vous pour accéder à votre tableau de bord' : 'Commencez à gérer vos finances intelligemment' }}</p>
        </div>

        <!-- Error message -->
        <div v-if="authStore.error" class="error-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          {{ authStore.error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Adresse email</label>
            <input v-model="email" type="email" class="input" placeholder="vous@exemple.com" required />
          </div>

          <div class="form-group">
            <label>Mot de passe</label>
            <div class="input-with-toggle">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                placeholder="••••••••"
                required
                minlength="6"
              />
              <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
            <div v-if="loading" class="spinner" style="width:18px;height:18px;border-width:2px"></div>
            <span v-else>{{ isLogin ? 'Se connecter' : 'Créer mon compte' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span>ou</span>
        </div>

        <!-- Google -->
        <button class="btn-google" @click="handleGoogle" :disabled="loading">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>

        <!-- Toggle mode -->
        <p class="toggle-mode">
          {{ isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?' }}
          <button type="button" @click="isLogin = !isLogin; authStore.error = null">
            {{ isLogin ? 'Créer un compte' : 'Se connecter' }}
          </button>
        </p>
      </div>

      <!-- Features teaser -->
      <div class="features-teaser">
        <div v-for="f in features" :key="f.text" class="feature-pill">
          <span>{{ f.emoji }}</span>
          <span>{{ f.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const features = [
  { emoji: '📊', text: 'Tableau de bord' },
  { emoji: '💰', text: 'Budget intelligent' },
  { emoji: '🎯', text: 'Objectifs d\'épargne' },
  { emoji: '📈', text: 'Statistiques avancées' }
]

async function handleSubmit() {
  loading.value = true
  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value)
    }
    router.push('/')
  } catch (e) {
    // Error is set in store
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  loading.value = true
  try {
    await authStore.loginWithGoogle()
    router.push('/')
  } catch (e) {
    // Error is set in store
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-base);
}

.bg-glow {
  position: absolute;
  top: -200px; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 60%);
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.5s ease;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 22px;
  color: var(--text-primary);
}

.logo-icon {
  width: 46px; height: 46px;
  background: var(--accent-dim);
  border: 1px solid var(--border-accent);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.login-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
}

.login-header {
  margin-bottom: 28px;
  text-align: center;
}

.login-header h1 {
  font-size: 1.5rem;
  margin-bottom: 6px;
}

.login-header p {
  font-size: 14px;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: var(--radius);
  color: var(--red);
  font-size: 14px;
  margin-bottom: 20px;
}

.input-with-toggle { position: relative; }
.input-with-toggle .input { padding-right: 44px; }

.toggle-pw {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px;
  transition: color var(--transition);
}
.toggle-pw:hover { color: var(--text-primary); }

.submit-btn {
  width: 100%;
  justify-content: center;
  padding: 13px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%; left: 0; right: 0;
  height: 1px;
  background: var(--border);
}

.divider span {
  position: relative;
  background: var(--bg-surface);
  padding: 0 12px;
  font-size: 13px;
  color: var(--text-muted);
}

.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-google:hover {
  background: var(--bg-hover);
  border-color: rgba(255,255,255,0.12);
}

.btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

.toggle-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.toggle-mode button {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-body);
  padding: 0;
  margin-left: 4px;
}

.toggle-mode button:hover { text-decoration: underline; }

.features-teaser {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.feature-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
