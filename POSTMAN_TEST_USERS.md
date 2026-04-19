# 🧪 Guide de Test Postman - Ndar Express

Ce guide vous aide à tester l'API Ndar Express avec Postman en utilisant des utilisateurs de test pour chaque rôle.

## 📋 Table des matières
1. [Configuration Postman](#configuration-postman)
2. [Utilisateurs de Test](#utilisateurs-de-test)
3. [Requêtes API par Rôle](#requêtes-api-par-rôle)
4. [Exemples de Requêtes](#exemples-de-requêtes)

---

## ⚙️ Configuration Postman

### 1. Créer une Collection
- Nom: `Ndar Express API`
- Base URL variable: `{{baseUrl}}` (définir à `http://localhost:5000/api`)

### 2. Variables d'Environnement
Créez un environnement Postman avec ces variables:
```
baseUrl: http://localhost:5000/api
clientToken: (sera défini après login)
driverToken: (sera défini après login)
technicianToken: (sera défini après login)
adminToken: (sera défini après login)
```

---

## 👥 Utilisateurs de Test

### 1. Client (Passager)
```json
{
  "firstName": "Fatou",
  "lastName": "Diallo",
  "email": "fatou.client@yoonbi.sn",
  "password": "ClientTest123!",
  "phone": "+221771234567",
  "role": "client"
}
```

### 2. Driver (Chauffeur)
```json
{
  "firstName": "Moussa",
  "lastName": "Ba",
  "email": "moussa.driver@yoonbi.sn",
  "password": "DriverTest123!",
  "phone": "+221772345678",
  "role": "driver",
  "providerDetails": {
    "serviceCategory": "Livraison / Coursier",
    "serviceArea": "Centre-ville",
    "availability": "7j/7, 6h-20h",
    "experienceYears": "5",
    "hasProfessionalTools": true,
    "vehicleBrand": "Toyota",
    "vehicleType": "Berline",
    "vehiclePlate": "AB-123-CD",
    "coordinates": {
      "lat": 16.0244,
      "lng": -16.5015
    }
  }
}
```

### 3. Technician (Prestataire de Services)
```json
{
  "firstName": "Aissatou",
  "lastName": "Sow",
  "email": "aissatou.technician@yoonbi.sn",
  "password": "TechTest123!",
  "phone": "+221773456789",
  "role": "provider",
  "providerDetails": {
    "serviceCategory": "Coiffure & Beaute",
    "serviceArea": "Guet-Ndar",
    "availability": "Lun-Sam, 8h-18h",
    "experienceYears": "8",
    "hasProfessionalTools": true,
    "beautySpecialty": "Coiffure, Tresses, Soins",
    "coordinates": {
      "lat": 16.0188,
      "lng": -16.4919
    }
  }
}
```

### 4. Admin
```json
{
  "firstName": "Admin",
  "lastName": "Ndar",
  "email": "admin@yoonbi.sn",
  "password": "AdminTest123!",
  "phone": "+221774567890",
  "role": "client"
}
```
*Note: Après inscription, modifier manuellement le rôle à "admin" dans la base de données MongoDB.*

---

## 🔄 Flux de Test par Rôle

### 🔐 1. Inscription & Connexion

#### Inscription (Tous les rôles)
```http
POST {{baseUrl}}/auth/register
Content-Type: application/json

// Insérez le JSON de l'utilisateur correspondant au rôle
```

**Tests Postman:**
```javascript
pm.test("Status 201 Created", function () {
    pm.response.to.have.status(201);
});

pm.test("Token reçu", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.environment.set("clientToken", jsonData.token);
});
```

#### Connexion
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "fatou.client@yoonbi.sn",
  "password": "ClientTest123!"
}
```

---

### 👤 2. Tests Client (Passager)

#### Créer une course (Ride)
```http
POST {{baseUrl}}/rides
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "pickup": {
    "name": "Gare routière",
    "address": "Saint-Louis",
    "lat": 16.0244,
    "lng": -16.5015
  },
  "destination": {
    "name": "Aéroport",
    "address": "Diass",
    "lat": 14.7447,
    "lng": -17.1617
  },
  "price": 5000,
  "vehicleType": "YOON WI Classic",
  "paymentMethod": "Cash",
  "distanceKm": 25,
  "durationMin": 45
}
```

#### Créer une demande de service
```http
POST {{baseUrl}}/services
Authorization: Bearer {{clientToken}}
Content-Type: application/json

{
  "category": "coiffure-beaute",
  "title": "Coiffure pour mariage",
  "description": "Je cherche une coiffeuse pour un mariage ce samedi",
  "preferredProviderId": null,
  "preferredDistanceKm": 5
}
```

#### Récupérer ses courses
```http
GET {{baseUrl}}/rides
Authorization: Bearer {{clientToken}}
```

#### Récupérer ses services
```http
GET {{baseUrl}}/services
Authorization: Bearer {{clientToken}}
```

---

### 🚗 3. Tests Driver (Chauffeur)

#### Voir les courses disponibles
```http
GET {{baseUrl}}/rides/available
Authorization: Bearer {{driverToken}}
```

#### Accepter une course
```http
PATCH {{baseUrl}}/rides/{{rideId}}/accept
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "vehicleType": "Berline"
}
```

#### Démarrer une course (avec code de sécurité)
```http
PATCH {{baseUrl}}/rides/{{rideId}}/start
Authorization: Bearer {{driverToken}}
Content-Type: application/json

{
  "safetyCode": "1234"
}
```

#### Terminer une course
```http
PATCH {{baseUrl}}/rides/{{rideId}}/complete
Authorization: Bearer {{driverToken}}
```

#### Envoyer sa position (Socket.io)
```javascript
// Via Socket.io client, pas directement dans Postman
// Utilisez l'application frontend pour tester le tracking en temps réel
```

---

### 🔧 4. Tests Technician (Prestataire)

#### Voir les demandes de service disponibles
```http
GET {{baseUrl}}/services/available
Authorization: Bearer {{technicianToken}}
```

#### Faire un devis pour un service
```http
PATCH {{baseUrl}}/services/{{serviceId}}/accept
Authorization: Bearer {{technicianToken}}
Content-Type: application/json

{
  "quotedPrice": 15000,
  "quoteNote": "Je suis disponible samedi après-midi"
}
```

#### Démarrer un service (avec code de sécurité)
```http
PATCH {{baseUrl}}/services/{{serviceId}}/start
Authorization: Bearer {{technicianToken}}
Content-Type: application/json

{
  "safetyCode": "5678"
}
```

#### Confirmer le paiement de la contribution
```http
PATCH {{baseUrl}}/services/{{serviceId}}/confirm-payment
Authorization: Bearer {{technicianToken}}
Content-Type: application/json

{
  "paymentMethod": "Wave",
  "reference": "WAVE123456",
  "amountPaid": 750
}
```

#### Terminer un service
```http
PATCH {{baseUrl}}/services/{{serviceId}}/complete
Authorization: Bearer {{technicianToken}}
```

---

### 👨‍💼 5. Tests Admin

#### Voir les utilisateurs en attente
```http
GET {{baseUrl}}/admin/users/pending
Authorization: Bearer {{adminToken}}
```

#### Vérifier un utilisateur
```http
PATCH {{baseUrl}}/admin/users/{{userId}}/verify
Authorization: Bearer {{adminToken}}
```

#### Voir les contributions de plateforme
```http
GET {{baseUrl}}/admin/services/contributions?status=paid
Authorization: Bearer {{adminToken}}
```

#### Gérer les candidatures
```http
GET {{baseUrl}}/applications
Authorization: Bearer {{adminToken}}
```

---

## 📊 Exemples de Requêtes Complètes

### Requête 1: Inscription Client
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Fatou",
  "lastName": "Diallo",
  "email": "fatou.client@yoonbi.sn",
  "password": "ClientTest123!",
  "phone": "+221771234567",
  "role": "client"
}
```

**Response attendue (201):**
```json
{
  "user": {
    "id": "...",
    "firstName": "Fatou",
    "lastName": "Diallo",
    "email": "fatou.client@yoonbi.sn",
    "role": "client",
    "status": "verified"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Requête 2: Créer une course
```http
POST http://localhost:5000/api/rides
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "pickup": {
    "name": "Université Gaston Berger",
    "address": "Sanar, Saint-Louis",
    "lat": 16.0567,
    "lng": -16.4568
  },
  "destination": {
    "name": "Centre-ville",
    "address": "Place Faidherbe, Saint-Louis",
    "lat": 16.0244,
    "lng": -16.5015
  },
  "price": 2000,
  "vehicleType": "YOON WI Classic",
  "paymentMethod": "Cash",
  "distanceKm": 8,
  "durationMin": 20
}
```

**Response attendue (201):**
```json
{
  "_id": "...",
  "userId": "...",
  "driverId": null,
  "status": "pending",
  "safetyCode": "4567",
  "price": 2000,
  "pickup": {...},
  "destination": {...},
  "createdAt": "2026-04-17T18:00:00.000Z"
}
```

---

## 🧪 Script de Test Automatique

Voici un script Node.js pour tester automatiquement l'API:

```javascript
// test-api.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testUsers = {
  client: {
    email: 'fatou.client@yoonbi.sn',
    password: 'ClientTest123!',
    data: {
      firstName: 'Fatou',
      lastName: 'Diallo',
      email: 'fatou.client@yoonbi.sn',
      password: 'ClientTest123!',
      phone: '+221771234567',
      role: 'client'
    }
  },
  driver: {
    email: 'moussa.driver@yoonbi.sn',
    password: 'DriverTest123!',
    data: {
      firstName: 'Moussa',
      lastName: 'Ba',
      email: 'moussa.driver@yoonbi.sn',
      password: 'DriverTest123!',
      phone: '+221772345678',
      role: 'driver',
      providerDetails: {
        serviceCategory: 'Livraison / Coursier',
        serviceArea: 'Centre-ville',
        availability: '7j/7, 6h-20h',
        experienceYears: '5',
        hasProfessionalTools: true,
        vehicleBrand: 'Toyota',
        vehicleType: 'Berline',
        vehiclePlate: 'AB-123-CD',
        coordinates: { lat: 16.0244, lng: -16.5015 }
      }
    }
  },
  technician: {
    email: 'aissatou.technician@yoonbi.sn',
    password: 'TechTest123!',
    data: {
      firstName: 'Aissatou',
      lastName: 'Sow',
      email: 'aissatou.technician@yoonbi.sn',
      password: 'TechTest123!',
      phone: '+221773456789',
      role: 'provider',
      providerDetails: {
        serviceCategory: 'Coiffure & Beaute',
        serviceArea: 'Guet-Ndar',
        availability: 'Lun-Sam, 8h-18h',
        experienceYears: '8',
        hasProfessionalTools: true,
        beautySpecialty: 'Coiffure, Tresses, Soins',
        coordinates: { lat: 16.0188, lng: -16.4919 }
      }
    }
  }
};

async function runTests() {
  console.log('🧪 Début des tests API Ndar Express\n');
  
  // Test 1: Inscription Client
  console.log('1. Inscription Client...');
  try {
    const clientRes = await axios.post(`${API_URL}/auth/register`, testUsers.client.data);
    console.log('✅ Client inscrit:', clientRes.data.user.email);
    const clientToken = clientRes.data.token;
    
    // Test 2: Création course
    console.log('2. Création course...');
    const rideRes = await axios.post(
      `${API_URL}/rides`,
      {
        pickup: { name: 'UGB', address: 'Sanar', lat: 16.0567, lng: -16.4568 },
        destination: { name: 'Centre', address: 'Place Faidherbe', lat: 16.0244, lng: -16.5015 },
        price: 2000,
        vehicleType: 'YOON WI Classic',
        paymentMethod: 'Cash',
        distanceKm: 8,
        durationMin: 20
      },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );
    console.log('✅ Course créée:', rideRes.data._id);
    
    // Test 3: Inscription Driver
    console.log('3. Inscription Driver...');
    const driverRes = await axios.post(`${API_URL}/auth/register`, testUsers.driver.data);
    console.log('✅ Driver inscrit:', driverRes.data.user.email);
    const driverToken = driverRes.data.token;
    
    // Test 4: Driver voit les courses disponibles
    console.log('4. Courses disponibles pour driver...');
    const availableRides = await axios.get(`${API_URL}/rides/available`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    console.log('✅ Courses disponibles:', availableRides.data.length);
    
    console.log('\n🎉 Tests réussis!');
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

runTests();
```

**Exécution:**
```bash
npm install axios
node test-api.js
```

---

## 🔍 Conseils de Test

1. **Base de données propre**: Supprimez les anciennes données avant les tests
2. **Tokens**: Conservez les tokens dans les variables Postman
3. **IDs**: Récupérez les IDs des ressources créées pour les tests suivants
4. **Codes de sécurité**: Notez les safety codes retournés par l'API
5. **Socket.io**: Testez le temps réel via l'application frontend

---

## 📝 Notes Importantes

- Les mots de passe doivent respecter: 8+ caractères, 1 lettre, 1 chiffre
- Les numéros de téléphone doivent être au format sénégalais (+2217XXXXXXXX)
- Les coordinates (lat/lng) doivent être des nombres valides
- Après inscription, les drivers/technicians ont le statut "pending" jusqu'à vérification admin
- Les safety codes sont générés aléatoirement (4 chiffres)

---

## 🚀 Démarrage Rapide

1. **Démarrer le backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Démarrer le frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Importer dans Postman:**
   - Créez une nouvelle collection
   - Ajoutez les variables d'environnement
   - Copiez les requêtes ci-dessus

4. **Exécuter les tests:**
   - Inscrivez chaque type d'utilisateur
   - Testez les fonctionnalités selon le rôle

Bons tests! 🎉