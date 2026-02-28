<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <div>
        <h1>Mon profil</h1>
        <p>Gérez vos informations personnelles et votre sécurité</p>
      </div>
    </div>

    <div class="profil-layout">

      <!-- ─── Colonne gauche : avatar + plan ─────────────────────── -->
      <div class="profil-left">

        <!-- Avatar -->
        <div class="card avatar-card">
          <div class="big-avatar">
            <img v-if="user?.photoURL && !avatarError" :src="user.photoURL" alt="avatar" @error="avatarError = true" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div class="avatar-name">{{ displayName || user?.email?.split('@')[0] }}</div>
          <div class="avatar-email">{{ user?.email }}</div>

          <!-- Providers connectés -->
          <div class="providers">
            <div v-if="hasGoogle" class="provider-badge google">
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </div>
            <div v-if="hasPassword" class="provider-badge email">
              ✉️ Email
            </div>
          </div>
        </div>

        <!-- Plan actuel -->
        <div class="card plan-card" style="margin-top:16px">
          <div class="plan-header">
            <span class="plan-emoji">{{ subStore.isPro ? '🚀' : subStore.isPaid ? '💎' : '🌱' }}</span>
            <div>
              <div class="plan-name">Plan {{ subStore.plan.name }}</div>
              <div class="plan-price">{{ subStore.plan.priceLabel || 'Gratuit' }}</div>
            </div>
          </div>
          <router-link v-if="!subStore.isPro" to="/pricing" class="btn btn-primary" style="width:100%;text-align:center;margin-top:12px">
            {{ subStore.isPaid ? '🚀 Passer Pro' : '💎 Passer Premium' }}
          </router-link>
          <button v-else class="btn btn-ghost" style="width:100%;margin-top:12px" @click="openPortal">
            Gérer l'abonnement
          </button>
        </div>

      </div>

      <!-- ─── Colonne droite : formulaires ───────────────────────── -->
      <div class="profil-right">

        <!-- Informations générales -->
        <div class="card" style="margin-bottom:20px">
          <h3 class="section-title">👤 Informations personnelles</h3>

          <div class="form-group">
            <label>Nom d'affichage</label>
            <input class="input" v-model="formName" placeholder="Votre nom" :disabled="savingName" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input class="input" v-model="formEmail" type="email" placeholder="votre@email.com" :disabled="savingEmail || hasGoogle" />
            <span v-if="hasGoogle" class="field-note">⚠️ Email lié à Google — non modifiable ici</span>
          </div>

          <div v-if="msgInfo" class="msg" :class="msgInfoType">{{ msgInfo }}</div>

          <button class="btn btn-primary" :disabled="savingName || savingEmail" @click="saveInfos">
            <span v-if="savingName || savingEmail">Enregistrement...</span>
            <span v-else>Enregistrer</span>
          </button>
        </div>

        <!-- Sécurité / Mot de passe -->
        <div class="card" style="margin-bottom:20px">
          <h3 class="section-title">🔐 Sécurité</h3>

          <!-- Cas 1 : connecté Google SANS mot de passe → ajouter un mot de passe -->
          <div v-if="hasGoogle && !hasPassword">
            <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">
              Votre compte est connecté via Google. Vous pouvez ajouter un mot de passe pour vous connecter aussi par email.
            </p>
            <div class="form-group">
              <label>Nouveau mot de passe</label>
              <div class="input-password">
                <input class="input" v-model="newPassword" :type="showNew ? 'text' : 'password'" placeholder="Au moins 6 caractères" />
                <button class="eye-btn" @click="showNew = !showNew">{{ showNew ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Confirmer le mot de passe</label>
              <div class="input-password">
                <input class="input" v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Répétez le mot de passe" />
                <button class="eye-btn" @click="showConfirm = !showConfirm">{{ showConfirm ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div v-if="msgPassword" class="msg" :class="msgPasswordType">{{ msgPassword }}</div>
            <button class="btn btn-primary" :disabled="savingPassword" @click="addPassword">
              <span v-if="savingPassword">Ajout en cours...</span>
              <span v-else>Ajouter le mot de passe</span>
            </button>
          </div>

          <!-- Cas 2 : a déjà un mot de passe → changer -->
          <div v-else-if="hasPassword">
            <div class="form-group">
              <label>Mot de passe actuel</label>
              <div class="input-password">
                <input class="input" v-model="currentPassword" :type="showCurrent ? 'text' : 'password'" placeholder="Votre mot de passe actuel" />
                <button class="eye-btn" @click="showCurrent = !showCurrent">{{ showCurrent ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Nouveau mot de passe</label>
              <div class="input-password">
                <input class="input" v-model="newPassword" :type="showNew ? 'text' : 'password'" placeholder="Au moins 6 caractères" />
                <button class="eye-btn" @click="showNew = !showNew">{{ showNew ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <div class="input-password">
                <input class="input" v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Répétez le nouveau mot de passe" />
                <button class="eye-btn" @click="showConfirm = !showConfirm">{{ showConfirm ? '🙈' : '👁️' }}</button>
              </div>
            </div>
            <div v-if="msgPassword" class="msg" :class="msgPasswordType">{{ msgPassword }}</div>
            <button class="btn btn-primary" :disabled="savingPassword" @click="changePassword">
              <span v-if="savingPassword">Modification...</span>
              <span v-else>Changer le mot de passe</span>
            </button>
          </div>

          <!-- Lier Google si connecté par email uniquement -->
          <div v-if="!hasGoogle" style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">
            <div style="font-size:14px;font-weight:600;margin-bottom:8px">Lier un compte Google</div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Connectez-vous aussi rapidement avec Google</p>
            <button class="btn btn-ghost" @click="linkGoogle">
              <svg width="16" height="16" viewBox="0 0 24 24" style="margin-right:6px"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Lier mon compte Google
            </button>
            <div v-if="msgGoogle" class="msg" :class="msgGoogleType" style="margin-top:8px">{{ msgGoogle }}</div>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="card danger-zone">
          <h3 class="section-title" style="color:var(--red)">⚠️ Zone de danger</h3>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
            La suppression de votre compte est irréversible. Toutes vos données seront perdues.
          </p>
          <button class="btn btn-danger" @click="showDeleteConfirm = true">
            Supprimer mon compte
          </button>
        </div>

      </div>
    </div>

    <!-- ─── Modal confirmation suppression ───────────────────────── -->
    <transition name="fade">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-box">
          <div style="font-size:48px;text-align:center;margin-bottom:16px">⚠️</div>
          <h3 style="font-family:var(--font-display);text-align:center;margin-bottom:8px">Supprimer le compte ?</h3>
          <p style="font-size:14px;color:var(--text-muted);text-align:center;margin-bottom:20px">
            Cette action est <strong>irréversible</strong>. Toutes vos données financières seront supprimées.
          </p>
          <div v-if="hasPassword" class="form-group" style="margin-bottom:16px">
            <label>Confirmez avec votre mot de passe</label>
            <input class="input" v-model="deletePassword" type="password" placeholder="Votre mot de passe" />
          </div>
          <div v-if="msgDelete" class="msg msg-error">{{ msgDelete }}</div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-ghost" style="flex:1" @click="showDeleteConfirm = false">Annuler</button>
            <button class="btn btn-danger" style="flex:1" :disabled="deletingAccount" @click="deleteAccount">
              {{ deletingAccount ? 'Suppression...' : 'Supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  updateProfile, updateEmail, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
  linkWithCredential, linkWithPopup,
  GoogleAuthProvider, deleteUser
} from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'

const authStore = useAuthStore()
const subStore  = useSubscriptionStore()

const user = computed(() => authStore.user)

// ─── Providers détectés ───────────────────────────────────────────
const hasGoogle   = computed(() => user.value?.providerData?.some(p => p.providerId === 'google.com'))
const hasPassword = computed(() => user.value?.providerData?.some(p => p.providerId === 'password'))

// ─── Avatar ───────────────────────────────────────────────────────
const avatarError = ref(false)
const userInitial = computed(() => {
  const n = user.value?.displayName || user.value?.email || '?'
  return n[0].toUpperCase()
})
const displayName = computed(() => user.value?.displayName || '')

// ─── Form state ───────────────────────────────────────────────────
const formName  = ref(user.value?.displayName || '')
const formEmail = ref(user.value?.email || '')

const currentPassword = ref('')
const newPassword     = ref('')
const confirmPassword = ref('')
const showCurrent = ref(false)
const showNew     = ref(false)
const showConfirm = ref(false)

const savingName     = ref(false)
const savingEmail    = ref(false)
const savingPassword = ref(false)

const msgInfo        = ref('')
const msgInfoType    = ref('msg-success')
const msgPassword    = ref('')
const msgPasswordType= ref('msg-success')
const msgGoogle      = ref('')
const msgGoogleType  = ref('msg-success')

// ─── Delete ───────────────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deletePassword    = ref('')
const deletingAccount   = ref(false)
const msgDelete         = ref('')

// ─── Sauvegarder infos ────────────────────────────────────────────
async function saveInfos() {
  msgInfo.value = ''
  try {
    // Nom
    if (formName.value !== user.value?.displayName) {
      savingName.value = true
      await updateProfile(auth.currentUser, { displayName: formName.value })
      // Force refresh
      await auth.currentUser.reload()
      authStore.user = auth.currentUser
    }
    // Email (seulement si pas Google)
    if (!hasGoogle.value && formEmail.value !== user.value?.email) {
      savingEmail.value = true
      await updateEmail(auth.currentUser, formEmail.value)
    }
    msgInfo.value = '✅ Informations mises à jour !'
    msgInfoType.value = 'msg-success'
  } catch (e) {
    msgInfo.value = getMsg(e.code) || e.message
    msgInfoType.value = 'msg-error'
  } finally {
    savingName.value = false
    savingEmail.value = false
  }
}

// ─── Ajouter mot de passe (Google sans password) ──────────────────
async function addPassword() {
  msgPassword.value = ''
  if (newPassword.value.length < 6) {
    msgPassword.value = 'Le mot de passe doit faire au moins 6 caractères.'
    msgPasswordType.value = 'msg-error'; return
  }
  if (newPassword.value !== confirmPassword.value) {
    msgPassword.value = 'Les mots de passe ne correspondent pas.'
    msgPasswordType.value = 'msg-error'; return
  }
  savingPassword.value = true
  try {
    const credential = EmailAuthProvider.credential(user.value.email, newPassword.value)
    await linkWithCredential(auth.currentUser, credential)
    await auth.currentUser.reload()
    authStore.user = auth.currentUser
    msgPassword.value = '✅ Mot de passe ajouté ! Vous pouvez maintenant vous connecter par email.'
    msgPasswordType.value = 'msg-success'
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    msgPassword.value = getMsg(e.code) || e.message
    msgPasswordType.value = 'msg-error'
  } finally {
    savingPassword.value = false
  }
}

// ─── Changer mot de passe ─────────────────────────────────────────
async function changePassword() {
  msgPassword.value = ''
  if (!currentPassword.value) {
    msgPassword.value = 'Entrez votre mot de passe actuel.'
    msgPasswordType.value = 'msg-error'; return
  }
  if (newPassword.value.length < 6) {
    msgPassword.value = 'Le nouveau mot de passe doit faire au moins 6 caractères.'
    msgPasswordType.value = 'msg-error'; return
  }
  if (newPassword.value !== confirmPassword.value) {
    msgPassword.value = 'Les mots de passe ne correspondent pas.'
    msgPasswordType.value = 'msg-error'; return
  }
  savingPassword.value = true
  try {
    // Ré-authentification requise
    const credential = EmailAuthProvider.credential(user.value.email, currentPassword.value)
    await reauthenticateWithCredential(auth.currentUser, credential)
    await updatePassword(auth.currentUser, newPassword.value)
    msgPassword.value = '✅ Mot de passe modifié avec succès !'
    msgPasswordType.value = 'msg-success'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    msgPassword.value = getMsg(e.code) || e.message
    msgPasswordType.value = 'msg-error'
  } finally {
    savingPassword.value = false
  }
}

// ─── Lier Google ──────────────────────────────────────────────────
async function linkGoogle() {
  msgGoogle.value = ''
  try {
    const provider = new GoogleAuthProvider()
    await linkWithPopup(auth.currentUser, provider)
    await auth.currentUser.reload()
    authStore.user = auth.currentUser
    msgGoogle.value = '✅ Compte Google lié avec succès !'
    msgGoogleType.value = 'msg-success'
  } catch (e) {
    msgGoogle.value = getMsg(e.code) || e.message
    msgGoogleType.value = 'msg-error'
  }
}

// ─── Supprimer le compte ──────────────────────────────────────────
async function deleteAccount() {
  msgDelete.value = ''
  deletingAccount.value = true
  try {
    // Ré-authentification si mot de passe
    if (hasPassword.value) {
      if (!deletePassword.value) {
        msgDelete.value = 'Entrez votre mot de passe pour confirmer.'
        deletingAccount.value = false; return
      }
      const credential = EmailAuthProvider.credential(user.value.email, deletePassword.value)
      await reauthenticateWithCredential(auth.currentUser, credential)
    }
    await deleteUser(auth.currentUser)
    await authStore.logout()
  } catch (e) {
    msgDelete.value = getMsg(e.code) || e.message
    deletingAccount.value = false
  }
}

// ─── Portail Stripe ───────────────────────────────────────────────
async function openPortal() {
  await subStore.openPortal()
}

// ─── Messages d'erreur Firebase ──────────────────────────────────
function getMsg(code) {
  const m = {
    'auth/wrong-password':       '❌ Mot de passe actuel incorrect.',
    'auth/weak-password':        '❌ Mot de passe trop faible (6 caractères minimum).',
    'auth/email-already-in-use': '❌ Cet email est déjà utilisé.',
    'auth/invalid-email':        '❌ Email invalide.',
    'auth/requires-recent-login':'❌ Session expirée — reconnectez-vous et réessayez.',
    'auth/credential-already-in-use': '❌ Ce compte Google est déjà lié à un autre compte.',
    'auth/provider-already-linked': '❌ Ce provider est déjà lié à votre compte.',
    'auth/invalid-credential':   '❌ Mot de passe incorrect.',
  }
  return m[code]
}
</script>

<style scoped>
.profil-layout { display:grid;grid-template-columns:280px 1fr;gap:24px;align-items:start }

/* ── Colonne gauche ── */
.avatar-card { display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:28px 20px }
.big-avatar  { width:88px;height:88px;border-radius:50%;background:var(--accent-dim);border:3px solid var(--border-accent);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:var(--accent);overflow:hidden;flex-shrink:0 }
.big-avatar img { width:100%;height:100%;object-fit:cover }
.avatar-name  { font-family:var(--font-display);font-size:17px;font-weight:700 }
.avatar-email { font-size:12px;color:var(--text-muted);word-break:break-all }

.providers { display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:4px }
.provider-badge { display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid var(--border) }
.provider-badge.google { background:rgba(66,133,244,0.1);border-color:rgba(66,133,244,0.3);color:#4285F4 }
.provider-badge.email  { background:var(--bg-elevated);color:var(--text-secondary) }

.plan-card { padding:20px }
.plan-header { display:flex;align-items:center;gap:12px }
.plan-emoji  { font-size:28px }
.plan-name   { font-weight:700;font-size:15px }
.plan-price  { font-size:13px;color:var(--text-muted) }

/* ── Colonne droite ── */
.section-title { font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:20px }

.form-group { display:flex;flex-direction:column;gap:6px;margin-bottom:16px }
.form-group label { font-size:13px;font-weight:600;color:var(--text-secondary) }
.field-note { font-size:11px;color:var(--orange) }

.input-password { position:relative }
.input-password .input { padding-right:42px;width:100% }
.eye-btn { position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:2px }

.msg { padding:10px 14px;border-radius:var(--radius);font-size:13px;margin-bottom:12px }
.msg-success { background:rgba(0,229,160,0.1);border:1px solid rgba(0,229,160,0.25);color:var(--green) }
.msg-error   { background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.25);color:var(--red) }

.danger-zone { border-color:rgba(255,107,107,0.25) }
.btn-danger  { background:rgba(255,107,107,0.12);color:var(--red);border:1px solid rgba(255,107,107,0.3) }
.btn-danger:hover { background:rgba(255,107,107,0.2) }

/* ── Modal ── */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000 }
.modal-box { background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:32px;max-width:440px;width:90% }

@media (max-width:768px) {
  .profil-layout { grid-template-columns:1fr }
}
</style>