import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useSubscriptionStore } from './subscription'
import { useAuthStore } from './auth'

export const THEMES = [
  { id: 'dark',   name: 'Emeraude',          description: 'Le theme original - sombre & vert', accent: '#00e5a0', bg: '#0c0e14', free: true,  emoji: '🌿' },
  { id: 'light',  name: 'Arctique',           description: 'Clair et epure - bleu glacier',     accent: '#0ea5e9', bg: '#f5f8fc', free: false, emoji: '❄️' },
  { id: 'ocean',  name: 'Ocean',              description: 'Bleu profond et cyan',              accent: '#4facfe', bg: '#070d1a', free: false, emoji: '🌊' },
  { id: 'sunset', name: 'Coucher de soleil',  description: 'Violet mystique et rose',           accent: '#c084fc', bg: '#0f0a18', free: false, emoji: '🌸' },
  { id: 'flame',  name: 'Flamme',             description: 'Sombre et orange chaleureux',       accent: '#ff9f43', bg: '#120a05', free: false, emoji: '🔥' }
]

export const useThemeStore = defineStore('theme', () => {
  const subStore  = useSubscriptionStore()
  const authStore = useAuthStore()

  const saved        = localStorage.getItem('ff-theme') || 'dark'
  const currentId    = ref(saved)
  const customThemes = ref([])

  const allThemes = computed(() => [...THEMES, ...customThemes.value])
  const current   = computed(() => allThemes.value.find(t => t.id === currentId.value) || THEMES[0])

  function isLightColor(hex) {
    if (!hex || hex.length < 7) return false
    const r = parseInt(hex.slice(1,3), 16)
    const g = parseInt(hex.slice(3,5), 16)
    const b = parseInt(hex.slice(5,7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  }

  function adjustBrightness(hex, amount) {
    if (!hex || hex.length < 7) return hex
    let r = parseInt(hex.slice(1,3), 16)
    let g = parseInt(hex.slice(3,5), 16)
    let b = parseInt(hex.slice(5,7), 16)
    if (isLightColor(hex)) { r = Math.max(0, r - amount*2); g = Math.max(0, g - amount*2); b = Math.max(0, b - amount*2) }
    else { r = Math.min(255, r + amount); g = Math.min(255, g + amount); b = Math.min(255, b + amount) }
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
  }

  function applyThemeCss(theme) {
    const root = document.documentElement
    const cssVars = ['--accent','--bg-primary','--bg-surface','--bg-elevated','--bg-hover',
                     '--accent-dim','--border-accent','--accent-glow','--text-primary','--text-secondary','--text-muted','--border']
    if (theme.custom) {
      cssVars.forEach(v => root.style.removeProperty(v))
      root.removeAttribute('data-theme')
      root.style.setProperty('--accent',        theme.accent)
      root.style.setProperty('--bg-primary',    theme.bg)
      root.style.setProperty('--bg-surface',    adjustBrightness(theme.bg, 8))
      root.style.setProperty('--bg-elevated',   adjustBrightness(theme.bg, 14))
      root.style.setProperty('--bg-hover',      adjustBrightness(theme.bg, 20))
      root.style.setProperty('--accent-dim',    theme.accent + '18')
      root.style.setProperty('--border-accent', theme.accent + '40')
      root.style.setProperty('--accent-glow',   theme.accent + '30')
      const light = isLightColor(theme.bg)
      root.style.setProperty('--text-primary',   light ? '#0c0e14' : '#e8eaf0')
      root.style.setProperty('--text-secondary', light ? '#374151' : '#a0aec0')
      root.style.setProperty('--text-muted',     light ? '#6b7280' : '#64748b')
      root.style.setProperty('--border',         light ? '#e2e8f0' : '#ffffff12')
    } else {
      cssVars.forEach(v => root.style.removeProperty(v))
      if (theme.id === 'dark') root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', theme.id)
    }
  }

  function applyTheme(id) {
    const theme = allThemes.value.find(t => t.id === id)
    if (!theme) return
    if (theme.custom && !subStore.can('multiAccounts')) return
    if (!theme.free && !theme.custom && !subStore.can('customThemes')) return
    currentId.value = id
    localStorage.setItem('ff-theme', id)
    applyThemeCss(theme)
  }

  function init() {
    const theme = allThemes.value.find(t => t.id === currentId.value)
    if (!theme) return
    if (!theme.free && !theme.custom && !subStore.can('customThemes')) applyTheme('dark')
    else applyTheme(currentId.value)
  }

  function canUse(themeId) {
    const theme = allThemes.value.find(t => t.id === themeId)
    if (!theme) return false
    if (theme.custom) return subStore.can('multiAccounts')
    return theme.free || subStore.can('customThemes')
  }

  async function loadCustomThemes() {
    const uid = authStore.user?.uid
    if (!uid) return
    try {
      const q = query(collection(db, 'custom_themes'), where('uid', '==', uid))
      const snap = await getDocs(q)
      customThemes.value = snap.docs.map(d => ({ ...d.data(), id: d.id, custom: true }))
      const active = customThemes.value.find(t => t.id === currentId.value)
      if (active) applyThemeCss(active)
    } catch (e) { console.error('loadCustomThemes:', e) }
  }

  async function saveCustomTheme(data) {
    const uid = authStore.user?.uid
    if (!uid) return null
    const id = data.id || ('ct_' + Date.now())
    await setDoc(doc(db, 'custom_themes', id), {
      uid, id, name: data.name, accent: data.accent,
      bg: data.bg, emoji: data.emoji || '🎨',
      custom: true, createdAt: new Date().toISOString()
    })
    await loadCustomThemes()
    return id
  }

  async function deleteCustomTheme(id) {
    await deleteDoc(doc(db, 'custom_themes', id))
    if (currentId.value === id) applyTheme('dark')
    customThemes.value = customThemes.value.filter(t => t.id !== id)
  }

  return {
    currentId, current, customThemes, allThemes,
    applyTheme, init, canUse, isLightColor,
    loadCustomThemes, saveCustomTheme, deleteCustomTheme
  }
})