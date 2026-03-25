# Kanban App 🗂

> **App Kanban full-stack** con autenticazione, drag & drop e sincronizzazione in tempo reale, costruita con React e Firebase.

🔗 **[Live Demo](https://vanessasg.github.io/kanban-app/)**

---

## 📸 Overview

Kanban App è uno strumento di gestione task personale, progettato per organizzare il lavoro in board, colonne e card. Il progetto nasce come showcase di React in un contesto full-stack realistico, con autenticazione completa, persistenza dati su Firestore e interazioni drag & drop fluide.

---

## ✨ Features

- **Autenticazione** — Registrazione con email/password + verifica email obbligatoria, login con Google OAuth, modifica profilo (nome, email, password), eliminazione account con riautenticazione
- **Board** — Creazione, rinomina ed eliminazione board, drag & drop per riordinare, ricerca in tempo reale
- **Colonne** — Aggiunta, rinomina e eliminazione colonne, riordino via drag & drop
- **Task** — Creazione rapida inline, modal dettaglio con titolo, descrizione, scadenza, tag colorati e assegnatario, spostamento tra colonne e riordino via drag & drop, indicatore visivo scadenza (normale / in scadenza / scaduta)
- **Header contestuale** — Ricerca board nella pagina boards, ricerca task nella board singola
- **Design responsive** — Layout ottimizzato per desktop e mobile

---

## 🛠 Tech Stack

| Tecnologia | Utilizzo |
|---|---|
| **React 18** | UI library, componenti funzionali |
| **Vite 6** | Build tool e dev server |
| **React Router v6** | Routing SPA con HashRouter |
| **Firebase Auth** | Autenticazione email/password e Google OAuth |
| **Firestore** | Database cloud NoSQL, sincronizzazione realtime |
| **@dnd-kit** | Drag & drop accessibile e performante |
| **Tailwind CSS v4** | Utility-first styling |

---

## 📁 Struttura del progetto
```
src/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx    # Redirect se non autenticato
│   ├── board/
│   │   └── Column.jsx            # Colonna con drop zone e task list
│   ├── task/
│   │   ├── TaskCard.jsx          # Card draggable con tag e scadenza
│   │   └── TaskModal.jsx         # Modal dettaglio e modifica task
│   └── ui/
│       ├── ConfirmModal.jsx      # Modal conferma azioni distruttive
│       ├── Header.jsx            # Header riutilizzabile con slot centrale
│       └── ProfileModal.jsx      # Gestione profilo utente
├── context/
│   └── AuthContext.jsx           # Auth state + Firebase helpers
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Boards.jsx
│   └── Board.jsx
└── services/
    ├── firebase.js               # Inizializzazione Firebase
    └── boardService.js           # CRUD Firestore per board, colonne e task
```

---

## 🚀 Setup locale

### Prerequisiti
- Node.js 22+
- Account Firebase

### Installazione
```bash
# Clona la repo
git clone https://github.com/vanessasg/kanban-app.git
cd kanban-app

# Installa dipendenze
npm install
```

### Configurazione Firebase

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com)
2. Abilita **Authentication** → Email/Password + Google
3. Crea un **Firestore Database** in modalità produzione
4. Crea un file `.env` nella root del progetto:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Imposta le Firestore Security Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boards/{boardId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;

      match /columns/{columnId} {
        allow read, write: if request.auth != null &&
          request.auth.uid == get(/databases/$(database)/documents/boards/$(boardId)).data.uid;

        match /tasks/{taskId} {
          allow read, write: if request.auth != null &&
            request.auth.uid == get(/databases/$(database)/documents/boards/$(boardId)).data.uid;
        }
      }
    }
  }
}
```

### Avvio
```bash
npm run dev
```

---

## 📦 Deploy

Il progetto è deployato su **GitHub Pages** tramite `gh-pages`:
```bash
npm run deploy
```

---

## 🔑 Note

- Il file `.env` non è incluso nella repo per motivi di sicurezza. Ogni sviluppatore deve configurare il proprio progetto Firebase.
- La verifica email è obbligatoria per il login con email/password. Gli utenti Google bypassano questo step in quanto l'email è già verificata da Google.
- Prima del deploy, sostituire `updateEmail` con `verifyBeforeUpdateEmail` in `ProfileModal.jsx` per maggiore sicurezza.

---

## Author

**vanessasg** — [vanessasg.com](https://www.vanessasg.com) · [GitHub](https://github.com/vanessasg)