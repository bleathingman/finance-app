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

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  // Écouter les changements d'auth Firebase
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
    loading.value = false
  })

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
    await signOut(auth)
    user.value = null
  }

  function getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/too-many-requests': 'Trop de tentatives. Réessaie plus tard.'
    }
    return messages[code] || 'Une erreur est survenue.'
  }

  return { user, loading, error, isAuthenticated, login, loginWithGoogle, register, logout }
})
