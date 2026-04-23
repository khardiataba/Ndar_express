# TODO - Vérification App Ubbi Ndar

## 1. ✅ Emojis remplacés par icônes (DriverTracking.jsx)
- [x] Remplacement effectué

## 2. 🚀 Démarrer serveurs
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

## 3. 🧪 Données test
```bash
cd backend
node seed-users.js
```
- Client: fatoudiallo1@gmail.com / fatoudiallo1
- Chauffeur: moussaba1@gmail.com / moussaba1 (pending)
- Prestataire: aissatousow1@gmail.com / aissatousow1 (technician pending)

## 4. 🧑‍💻 Test Flux Complet
1. Login client → /ride → créer course (pending)
2. Login chauffeur → /driver-dashboard → voir available → accepter (notification/socket)
3. Chauffeur → entrer PIN → démarrer → tracking
4. Login prestataire → vérifier documents uploadés/vérifiés
5. Vérifier notifications, wallet, gallery services

## 5. 🔍 Vérifications Spécifiques
- [ ] Chauffeur reçoit commande
- [ ] Suivi temps réel marche
- [ ] Documents vérifiés (OCR)
- [ ] Pas d'erreurs console
- [ ] Prestataire gallery/services OK

## 6. 📱 Run Frontend
