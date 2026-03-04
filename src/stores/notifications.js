import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, Timestamp, orderBy, limit, setDoc
} from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'
import { db, messaging } from '@/firebase/config'
import { useAuthStore } from './auth'

export const NOTIF_TYPES = {
  BUDGET_ALERT:   'budget_alert',
  BUDGET_DEPASSE: 'budget_depasse',
  RECURRENTS:     'recurrents',
  INACTIVITE:     'inactivite',
  RESUME_MENSUEL: 'resume_mensuel',
}

export const useNotificationsStore = defineStore('notifications', () => {
  const authStore = useAuthStore()

  const notifs   = ref([])
  const loading  = ref(false)
  const fcmToken = ref(null)

  const nonLues = computed(() => notifs.value.filter(n => !n.lue).length)

  const pushActivees = computed(() =>
    'Notification' in window &&
    Notification.permission === 'granted' &&
    !!fcmToken.value
  )

  // ─── Écouter les notifs Firestore ──────────────────────────────
  function ecouter_notifs() {
    const uid = authStore.user?.uid
    if (!uid) return
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    return onSnapshot(q, snap => {
      notifs.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    })
  }

  // ─── CRUD notifs ───────────────────────────────────────────────
  async function marquerLue(id) {
    await updateDoc(doc(db, 'notifications', id), { lue: true })
  }

  async function marquerToutesLues() {
    await Promise.all(
      notifs.value.filter(n => !n.lue)
        .map(n => updateDoc(doc(db, 'notifications', n.id), { lue: true }))
    )
  }

  async function supprimer(id) {
    await deleteDoc(doc(db, 'notifications', id))
  }

  async function creerNotif({ type, titre, message, lien = null }) {
    const uid = authStore.user?.uid
    if (!uid) return
    await addDoc(collection(db, 'notifications'), {
      uid, type, titre, message, lien,
      lue: false,
      createdAt: Timestamp.now(),
    })
  }

  // ─── FCM : demander permission + enregistrer le token ─────────
  async function demanderPermissionPush() {
    if (!messaging) {
      console.warn('Firebase Messaging non supporté sur ce navigateur')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
      })

      if (!token) return false
      fcmToken.value = token

      // Sauvegarder le token pour Cloud Functions
      const uid = authStore.user?.uid
      if (uid) {
        await setDoc(doc(db, 'fcm_tokens', uid), {
          token, uid,
          updatedAt: Timestamp.now()
        }, { merge: true })
      }

      // Messages reçus quand l'app est au premier plan → notif in-app
      onMessage(messaging, payload => {
        creerNotif({
          type:    payload.data?.type || 'push',
          titre:   payload.notification?.title || 'FinanceFlow',
          message: payload.notification?.body || '',
          lien:    payload.data?.lien || null,
        })
      })

      return true
    } catch (err) {
      console.error('Erreur FCM:', err)
      return false
    }
  }

  return {
    notifs, loading, nonLues, fcmToken, pushActivees,
    ecouter_notifs, marquerLue, marquerToutesLues, supprimer,
    creerNotif, demanderPermissionPush,
  }
})
