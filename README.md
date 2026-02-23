# 💸 FinanceFlow — Application de gestion financière

> Vue.js 3 + Firebase + Vite — Déployable sur Vercel / Netlify

---

## 🚀 Installation

### 1. Cloner & installer
```bash
npm install
```

### 2. Configurer Firebase

1. Va sur [Firebase Console](https://console.firebase.google.com)
2. Crée un projet
3. Active **Authentication** → Email/Password + Google
4. Active **Firestore Database** (mode production)
5. Va dans **Paramètres du projet → Vos applications → Web**
6. Copie ta config

```bash
cp .env.example .env
```

Remplis `.env` avec tes valeurs Firebase.

### 3. Règles Firestore

Dans Firebase Console → Firestore → Règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{collection}/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

### 4. Lancer en local
```bash
npm run dev
```

### 5. Build production
```bash
npm run build
```

---

## 📁 Structure du projet

```
src/
├── assets/         # CSS global + design system
├── components/
│   └── Sidebar.vue # Navigation principale
├── firebase/
│   └── config.js   # Connexion Firebase
├── router/
│   └── index.js    # Routes + guard d'authentification
├── stores/
│   ├── auth.js     # Store Pinia — authentification
│   └── finance.js  # Store Pinia — données financières
└── views/
    ├── Login.vue         # Connexion / Inscription
    ├── Dashboard.vue     # Tableau de bord
    ├── Revenus.vue       # Gestion revenus
    ├── Depenses.vue      # Gestion dépenses
    ├── Budget.vue        # Budget mensuel
    ├── Objectifs.vue     # Objectifs d'épargne
    └── Statistiques.vue  # Statistiques avancées
```

---

## 🌐 Déploiement

### Vercel
```bash
npm i -g vercel
vercel
```
→ Ajoute les variables d'environnement dans le dashboard Vercel

### Netlify
Connecte ton repo GitHub, Netlify détecte automatiquement Vite.
→ Ajoute les variables d'environnement dans **Site settings → Environment variables**

---

## 🗺️ Roadmap

- [x] ✅ Structure de base + navigation
- [ ] 2️⃣ Gestion des revenus
- [ ] 3️⃣ Gestion des dépenses
- [ ] 4️⃣ Budget mensuel intelligent
- [ ] 5️⃣ Objectifs d'épargne
- [ ] 6️⃣ Statistiques avancées
