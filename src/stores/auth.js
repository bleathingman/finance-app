import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '@/firebase/config'

const INACTIVITY_DELAY = 10 * 60 * 1000 // 10 minutes en ms

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const loading = ref(true)
  const error   = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  // ─── Gestion de l'inactivité ──────────────────────────────────────
  let inactivityTimer = null

  function resetInactivityTimer() {
    if (!user.value) return
    clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      console.log('⏱️ Déconnexion automatique après 10 min d\'inactivité')
      logout()
    }, INACTIVITY_DELAY)
  }

  function startInactivityWatcher() {
    // Événements qui signalent une activité utilisateur
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))

    // Déconnexion si l'onglet est masqué depuis trop longtemps
    let hiddenAt = null
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        clearTimeout(inactivityTimer)
      } else {
        // Retour sur l'onglet
        if (hiddenAt && Date.now() - hiddenAt >= INACTIVITY_DELAY) {
          console.log('⏱️ Déconnexion automatique — onglet inactif trop longtemps')
          logout()
        } else {
          resetInactivityTimer()
        }
        hiddenAt = null
      }
    })

    resetInactivityTimer()
  }

  function stopInactivityWatcher() {
    clearTimeout(inactivityTimer)
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
  }

  // ─── Écoute Firebase Auth ─────────────────────────────────────────
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value    = firebaseUser
    loading.value = false
    if (firebaseUser) {
      startInactivityWatcher()
    } else {
      stopInactivityWatcher()
    }
  })

  // ─── Actions ──────────────────────────────────────────────────────
  async function login(email, password) {
    error.value = null
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      error.value = getErrorMessage(e.code)
      throw e
    }
  }

  async function loginWithGoogle() {
    error.value = null
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (e) {
      error.value = getErrorMessage(e.code)
      throw e
    }
  }

  async function register(email, password) {
    error.value = null
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (e) {
      error.value = getErrorMessage(e.code)
      throw e
    }
  }

  async function logout() {
    stopInactivityWatcher()
    await signOut(auth)
    user.value = null
  }

  function getErrorMessage(code) {
    const messages = {
      'auth/user-not-found':    'Aucun compte trouvé avec cet email.',
      'auth/wrong-password':    'Mot de passe incorrect.',
      'auth/invalid-credential':'Email ou mot de passe incorrect.',
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/weak-password':     'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/invalid-email':     'Adresse email invalide.',
      'auth/too-many-requests': 'Trop de tentatives. Réessaie plus tard.'
    }
    return messages[code] || 'Une erreur est survenue.'
  }

  return { user, loading, error, isAuthenticated, login, loginWithGoogle, register, logout }
})
