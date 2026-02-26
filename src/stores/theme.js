import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSubscriptionStore } from './subscription'

export const THEMES = [
  {
    id: 'dark',
    name: 'Émeraude',
    description: 'Le thème original — sombre & vert',
    accent: '#00e5a0',
    bg: '#0c0e14',
    free: true,
    emoji: '🌿'
  },
  {
    id: 'light',
    name: 'Arctique',
    description: 'Clair et épuré — bleu glacier',
    accent: '#0ea5e9',
    bg: '#f5f8fc',
    free: false,
    emoji: '❄️'
  },
  {
    id: 'ocean',
    name: 'Océan',
    description: 'Bleu profond & cyan',
    accent: '#4facfe',
    bg: '#070d1a',
    free: false,
    emoji: '🌊'
  },
  {
    id: 'sunset',
    name: 'Coucher de soleil',
    description: 'Violet mystique & rose',
    accent: '#c084fc',
    bg: '#0f0a18',
    free: false,
    emoji: '🌸'
  },
  {
    id: 'flame',
    name: 'Flamme',
    description: 'Sombre & orange chaleureux',
    accent: '#ff9f43',
    bg: '#120a05',
    free: false,
    emoji: '🔥'
  }
]

export const useThemeStore = defineStore('theme', () => {
  const subStore  = useSubscriptionStore()

  // Charge le thème sauvegardé (ou émeraude par défaut)
  const saved     = localStorage.getItem('ff-theme') || 'dark'
  const currentId = ref(saved)

  const current   = computed(() => THEMES.find(t => t.id === currentId.value) || THEMES[0])

  function applyTheme(id) {
    const theme = THEMES.find(t => t.id === id)
    if (!theme) return

    // Vérifie l'accès premium
    if (!theme.free && !subStore.can('customThemes')) return

    currentId.value = id
    localStorage.setItem('ff-theme', id)

    // Applique sur le document
    if (id === 'dark') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', id)
    }
  }

  // Applique le thème sauvegardé au démarrage
  function init() {
    // Si thème premium mais user repassé en free → reset
    const theme = THEMES.find(t => t.id === currentId.value)
    if (theme && !theme.free && !subStore.can('customThemes')) {
      applyTheme('dark')
    } else {
      applyTheme(currentId.value)
    }
  }

  function canUse(themeId) {
    const theme = THEMES.find(t => t.id === themeId)
    if (!theme) return false
    return theme.free || subStore.can('customThemes')
  }

  return { currentId, current, THEMES, applyTheme, init, canUse }
})
