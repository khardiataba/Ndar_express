# 🧪 GUIDE DE TEST - TROIS NOUVELLES FONCTIONNALITÉS

## 1️⃣ TEST: NAVBAR AVEC BOUTON RETOUR

### Étapes:
```
1. Ouvrir http://localhost:3000
2. Login comme client ou prestataire
3. Naviguer une service ou ride
4. EN HAUT À GAUCHE: Vérifier le bouton ← "Retour" (NEW!)
5. Vérifier que le logo 🚗 YOON WI s'affiche toujours
6. Cliquer ← pour retourner à page précédente
7. Sur homepage: le bouton retour devrait disparaître
```

### Expected Result:
```
✅ Bouton retour s'affiche sauf sur /
✅ Logo YOON WI toujours visible
✅ Navigation vers -1 (back) fonctionne
✅ Profile button toujours accessible
```

---

## 2️⃣ TEST: AFFICHAGE LOCALISATION (GPS)

### Étapes:
```
1. Naviguer vers une SERVICE DETAILS (après technician accepte)
2. Chercher section "Prestataire"
3. Vérifier affichage:
   - 📱 Téléphone (clickable)
   - ✉️ Email (clickable)
   - 📍 Adresse
   - 🗺️ LOCALISATION GPS (NEW!)
      ├─ Lat: X.XXXX
      ├─ Lng: X.XXXX
      └─ 📌 Ouvrir dans Google Maps
   - 📌 Zone: [Service Area]
4. Cliquer "📌 Ouvrir dans Google Maps"
   ├─ Devrait ouvrir nouvelle fenêtre GoogleMaps
   ├─ Centré sur GPS coordinates du prestataire
   └─ Montrer exact location
```

### Expected Result:
```
✅ GPS coordinates visible
✅ Google Maps link works
✅ Zone service affichée
✅ All contact info clickable
```

---

## 3️⃣ TEST: LOCALISATION OBLIGATOIRE (BACKEND)

### Étapes:

#### A. SANS Localisation (Devrait échouer):
```
1. Login comme prestataire (technician)
2. Aller Profile/Settings
3. Mettre à jour providerDetails SANS coordonnées GPS
4. Envoyer profile update
5. Attendre réponse
```

### Expected Error:
```
HTTP 400 Bad Request
{
  "message": "❌ Les restaurateurs et prestataires DOIVENT partager leur localisation pour que les clients puissent les trouver",
  "field": "providerDetails.coordinates",
  "hint": "Veuillez ajouter votre localisation GPS ou sélectionner une zone de service"
}
```

#### B. AVEC Localisation (Devrait réussir):
```
1. Mêmes étapes mais AJOUTER:
   "providerDetails": {
     "coordinates": {
       "lat": 14.6907,
       "lng": -17.2318
     },
     "serviceArea": "Centre-Ville"
   }
2. Envoyer profile update
3. Attendre réponse
```

### Expected Success:
```
HTTP 200 OK
{
  "success": true,
  "user": { ...updated user... },
  "message": "Profil mis à jour avec succès",
  "localizationUpdated": "✅ Localisation enregistrée"
}
```

---

## 4️⃣ TEST: CONTRIBUTION 1% CALCULATION

### Étapes:
```
1. Service créé avec prix: 10,000 FCFA
2. Vérifier dans API response: appCommissionAmount
3. Calculer: 10,000 × 1% = 100 FCFA
4. Provider devrait recevoir: 10,000 - 100 = 9,900 FCFA
```

### Test Cases:
```
Price:  5,000 FCFA → Commission: 50 FCFA   (1%) ✅
Price: 10,000 FCFA → Commission: 100 FCFA  (1%) ✅
Price: 50,000 FCFA → Commission: 500 FCFA  (1%) ✅

Minimum: If < 100 FCFA, round to 100 FCFA ✅
```

### Expected API Response (serviceCommission):
```javascript
{
  appCommissionPercent: 1,
  appCommissionAmount: 100,  // 1% of 10,000
  providerNetAmount: 9900    // 10,000 - 100
}
```

---

## 📱 TEST SUR MOBILE

### Points clés:
```
✅ TopNav responsive sur petit écran
✅ Back button accessible on mobile
✅ Logo texte ne wrap pas
✅ GPS link works on mobile maps app
✅ Coordinates readable small screen
✅ Google Maps intent works (maps:// protocol)
```

---

## 🔗 TEST LINKS

### Endpoints à Tester:

#### 1. Récupérer Service (avec localisation prestataire):
```bash
curl -X GET http://localhost:5000/api/services/{id} \
  -H "Authorization: Bearer <token>"

# Response devrait avoir:
# - assignedTechnicianId populated
# - coordinates du technician
# - serviceArea
```

#### 2. Mettre à jour Profile avec Localisation:
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providerDetails": {
      "coordinates": {
        "lat": 14.6907,
        "lng": -17.2318
      },
      "serviceArea": "Centre-Ville"
    }
  }'
```

#### 3. Test sans Localisation (Error Expected):
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providerDetails": {
      "serviceCategory": "Electrician"
      // NOTE: No coordinates! Should fail
    }
  }'

# Expected: HTTP 400 - Location required error
```

---

## ✅ COMPLETE CHECKLIST

- [ ] TopNav shows back button (not on home)
- [ ] Logo YOON WI always visible
- [ ] Back button navigates correctly
- [ ] Service Details shows GPS coordinates
- [ ] Google Maps link opens correctly
- [ ] Service Area zone displayed
- [ ] Provider can't update if no location
- [ ] Provider can update with coordinates
- [ ] Commission calculated at 1%
- [ ] Mobile navbar responsive
- [ ] All links clickable (phone, email, maps)
- [ ] No console errors
- [ ] No backend errors on new endpoints

---

## 🎬 QUICK START FLOWS

### Test 1 - Quick Back Button Check (2 min):
```
1. npm start frontend
2. Login → Navigate to /service/{id}
3. Look for ← button top left
4. Click → should go back
5. You're done ✅
```

### Test 2 - Quick GPS Display Check (3 min):
```
1. Go to /service/{id}
2. Find "Prestataire" card
3. Scroll down for "🗺️ LOCALISATION GPS"
4. See coordinates + Google Maps link
5. Click link → Maps opens ✅
```

### Test 3 - Full Validation Test (5 min):
```
1. Go to profile edit
2. Try update WITHOUT coordinates → ERROR ✅
3. Try update WITH coordinates → SUCCESS ✅
4. Go back to service details
5. See new coordinates displayed ✅
```

---

## 📊 TEST REPORT TEMPLATE

When done testing, fill in:

```
TEST DATE: ___________
TESTER: ___________

✅ = Pass
❌ = Fail
⚠️ = Issue

[-] TopNav Back Button
[-] TopNav Logo Visible
[-] Service GPS Display
[-] Google Maps Link
[-] Provider Location Validation
[-] Commission 1% Calculation
[-] Mobile Responsive
[-] No Console Errors

NOTES:
_____________________
_____________________
_____________________
```

---

**Ready to Test! 🚀**

Start with your test case preferences above and report any issues found.
