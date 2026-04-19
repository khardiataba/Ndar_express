# 🎯 GUIDE D'UTILISATION - NOUVELLES FONCTIONNALITÉS

## 📋 CE QUI A ÉTÉ FAIT

### ✅ 1. Bouton "Accepter" maintenant redirige
- **Quand:** Chauffeur/Prestataire clique "Accepter" sur une demande
- **Avant:** Restait sur la même page
- **Maintenant:** Redirige vers une **page de suivi dédiée** avec tous les détails du client

### ✅ 2. Affichage complet du prestataire/passager
**Vous pouvez maintenant voir:**
- 📷 **Photo de profil** du prestataire/passager
- 👤 **Nom & Informations**
- ⭐ **Rating + Avis** (ex: 4.8 ⭐ 12 avis)
- 📱 **Téléphone** (cliquez pour appeler)
- 📧 **Email** (cliquez pour envoyer message)
- 🏠 **Adresse complète**

### ✅ 3. Chat intégré dans l'application
**Nouvelle section "Communication":**
- Dialoguer directement sans quitter l'app
- Historique des messages
- Marquage "à lire" automatique
- Messages persistants

### ✅ 4. Vérification de la contribution (frais plateforme)
**Nouvelle section "Contribution":**
- Affiche si le paiement est **En attente** ou **Payé**
- Bouton pour vérifier le paiement
- Service peut commencer qu'après paiement de contribution

---

## 🚀 COMMENT UTILISER

### Scénario 1: Chauffeur Accepte Course
```
1. Aller à "Dashboard Chauffeur"
2. Voir liste courses disponibles
3. Cliquer bouton "Accepter" sur une course
4. ➡️ NOUVEAU: Redirection à page "/ride/:id" 
5. Voir détails passager:
   - Photo passager
   - Localisation (carte)
   - Contact (phone, email)
6. Utiliser chat pour kommuniquer
```

### Scénario 2: Client Accepte Service (Prestataire)
```
1. Client demande un service
2. Prestataire accepte
3. ➡️ NOUVEAU: Client redirigé à page "/service/:id"
4. Voir détails prestataire:
   - Photo + rating
   - Contact complet
   - Progression (6 étapes)
5. Chat pour rester en contact
6. Vérifier paiement contribution
```

---

## 🔍 PAGES NOUVELLES

### Page: `/service/:id`
**Accessible par:** Client & Prestataire  
**Affiche:**
- 👤 Card Prestataire (photo, name, rating, contact)
- 💬 Chat Communication
- 💳 Vérification Contribution
- 📊 Timeline Progression
- 📍 Détails Service

**URL Exemple:** `http://localhost:3000/service/507f1f77bcf86cd799439011`

### Page: `/ride/:id`
**Accessible par:** Passager & Chauffeur  
**Affiche:**
- 👤 Card Passager (photo, name, contact)
- 🗺️ Carte Pickup→Destination
- 💬 Chat Communication
- 🔘 Boutons Action (Démarrer, Terminer)

**URL Exemple:** `http://localhost:3000/ride/507f1f77bcf86cd799439012`

---

## 📱 INTERFACE UTILISATEUR

### Component: Card Prestataire
```
┌─────────────────────────────┐
│  👤 PRESTATAIRE             │
├─────────────────────────────┤
│ [Photo]  Jean-Pierre (4.8⭐) │
│          12 avis            │
│                             │
│ 📱 +221 77 123 45 67        │
│ 📧 jean@example.com         │
│ 🏠 Medina St 51, Dakar      │
│                             │
│ [Afficher sur Carte]        │
└─────────────────────────────┘
```

### Component: Chat
```
┌─────────────────────────────┐
│  💬 COMMUNICATION            │
├─────────────────────────────┤
│ [Passager: "Je suis prêt?"]│
│                             │
│ [Vous: "On arrive dans 5min"]
│                             │
│ [Input: "Écrivez message..."] │
│             [Envoyer ➤]     │
└─────────────────────────────┘
```

### Component: Contribution
```
┌─────────────────────────────┐
│  💳 CONTRIBUTION             │
├─────────────────────────────┤
│ Montant: 1,500 FCFA         │
│                             │
│ ✅ PAYÉE                    │
│                             │
│ ou                          │
│                             │
│ ⚠️ EN ATTENTE               │
│ [Vérifier Paiement →]       │
└─────────────────────────────┘
```

---

## ⚙️ CONFIGURATION TECHNIQUE

### Variables d'Environnement Requises
```
# Backend .env
DB_URI=mongodb://...
JWT_SECRET=...
STRIPE_KEY=...

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

### Modèles Requis
```javascript
// Message Model
messageSchema: {
  serviceId, senderId, senderRole, 
  content, read, readAt, attachments,
  timestamps
}

// ServiceRequest Model
serviceRequestSchema: {
  ...existing fields...,
  assignedTechnicianId,          // ← REQUIS
  platformContributionStatus,     // ← REQUIS ('pending'|'paid')
  appCommissionAmount             // ← REQUIS
}

// Ride Model  
rideSchema: {
  ...existing fields...,
  driverId,                       // ← REQUIS
}
```

---

## 🐛 TROUBLESHOOTING

### Problème: "Page blanche après acceptation"
**Solution:** Vérifier que les paramètres `assignedTechnicianId` et `driverId` sont définis dans BD

### Problème: "Chat ne affiche pas messages"
**Solution:** 
- Vérifier que backend tourne sur port 5000
- Vérifier que MongoDB connection est OK

### Problème: "Boutton Accepter ne redirige pas"
**Solution:** 
- Vérifier que React Router version 6+ (using `useNavigate`)
- Vérifier que backend retourne `_id` du ride/service après acceptation

### Problème: "Photos ne s'affichent pas"
**Solution:**
- Vérifier que `profilePhoto` existe dans User model
- Photos uploadées dans `/backend/uploads/` ?
- Vérifier `getAssetUrl()` function résout correctement l'URL

---

## 📞 ENDPOINTS API DISPONIBLES

### Services
```bash
# Récupérer service + détails prestataire
GET /api/services/:id
Header: Authorization: Bearer <token>

# Récupérer tous les messages d'un service
GET /api/services/:id/messages
Header: Authorization: Bearer <token>

# Envoyer message
POST /api/services/:id/messages
Header: Authorization: Bearer <token>
Body: { content: "Hello!" }

# Vérifier & Marquer contribution comme payée
POST /api/services/:id/verify-contribution
Header: Authorization: Bearer <token>
```

### Rides
```bash
# Récupérer ride + détails passager  
GET /api/rides/:id
Header: Authorization: Bearer <token>
```

---

## ✅ CHECKLIST VALIDATION

Avant de déployer en production, vérifier:

- [ ] Backend démarre sans erreur: `node server.js`
- [ ] Frontend compile: `npm start`
- [ ] Pouvez accepter course → redirige
- [ ] Détails passager affichés correctement
- [ ] Chat envoie et reçoit messages
- [ ] Contribution vérifie paiement
- [ ] Photos s'affichent (ou fallback initials)
- [ ] Pas d'erreurs console navigateur (F12)
- [ ] Pas d'erreurs console backend
- [ ] Token JWT ne expire pas durant test
- [ ] MongoDB connection stable

---

## 🎓 CONCEPTS CLÉS

### Flux Acceptation
```
Client crée demande
    ↓
Prestataire voit en Dashboard
    ↓
Clique "Accepter"
    ↓
POST /accepter (backend marque assignedTechnicianId)
    ↓
Frontend reçoit response
    ↓
navigate("/service/:id") avec state
    ↓
ServiceDetails page charge
    ↓
Affiche détails prestataire
```

### Flux Messages
```
User écrit message input
    ↓
POST /services/:id/messages
    ↓
Backend crée Message document
    ↓
Retourne message avec senderId populated
    ↓
Frontend affiche message dans chat
    ↓
User peut voir historique GET /messages
```

### Flux Contribution  
```
Service accepté
    ↓
ServiceDetails affiche contribution "en attente"
    ↓
Client clique "Vérifier paiement"
    ↓
POST /verify-contribution
    ↓
Backend appelle Stripe API
    ↓
Si payé → contribution="paid"
    ↓
Frontend affiche "✅ Payée"
```

---

## 🚀 DÉMARRAGE RAPIDE

```bash
# Terminal 1: Backend
cd backend
node server.js
# Attend: "🚀 Serveur lancé sur port 5000"

# Terminal 2: Frontend
cd frontend
npm start
# Attend: http://localhost:3000 ouvre

# Puis naviguer et tester!
```

---

**🎉 Tout est prêt! Vérifiez http://localhost:3000 et testez les nouvelles fonctionnalités.**
