/**
 * Script pour insérer les utilisateurs de test dans MongoDB
 * Exécution: node seed-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const testUsers = [
  {
    firstName: "Fatou",
    lastName: "Diallo",
    email: "fatoudiallo1@gmail.com",
    password: "fatoudiallo1",
    phone: "+221771234567",
    role: "client"
  },
  {
    firstName: "Moussa",
    lastName: "Ba",
    email: "moussaba1@gmail.com",
    password: "moussaba1",
    phone: "+221772345678",
    role: "driver",
    providerDetails: {
      serviceCategory: "Livraison / Coursier",
      serviceArea: "Centre-ville",
      availability: "7j/7, 6h-20h",
      experienceYears: "5",
      hasProfessionalTools: true,
      vehicleBrand: "Toyota",
      vehicleType: "Berline",
      vehiclePlate: "AB-123-CD",
      coordinates: { lat: 16.0244, lng: -16.5015 }
    }
  },
  {
    firstName: "Aissatou",
    lastName: "Sow",
    email: "aissatousow1@gmail.com",
    password: "aissatousow1",
    phone: "+221773456789",
    role: "technician",
    providerDetails: {
      serviceCategory: "Coiffure & Beaute",
      serviceArea: "Guet-Ndar",
      availability: "Lun-Sam, 8h-18h",
      experienceYears: "8",
      hasProfessionalTools: true,
      beautySpecialty: "Coiffure, Tresses, Soins",
      coordinates: { lat: 16.0188, lng: -16.4919 }
    }
  },
  {
    firstName: "Khardiata",
    lastName: "Ba",
    email: "khardiataba1.com",
    password: "khardiataba1",
    phone: "+221774567890",
    role: "client"
  }
];

async function seedUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('OK Connecté à MongoDB');

    // Supprimer les utilisateurs existants avec ces emails (optionnel)
    const emails = testUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: emails } });
    console.log('DELETE  Anciens utilisateurs supprimés');

    // Hasher les mots de passe et créer les utilisateurs
    const usersToCreate = await Promise.all(testUsers.map(async (userData) => {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Calculer le nom complet
      const name = `${userData.firstName} ${userData.lastName}`.trim();
      
      return {
        ...userData,
        password: hashedPassword,
        name: name,
        // Pour les nouveaux utilisateurs, on définit le statut par défaut
        status: userData.role === 'driver' || userData.role === 'technician' ? 'pending' : 'verified',
        // Initialiser les autres champs requis
        rating: 5.0,
        totalRatings: 0,
        ratingSum: 0,
        completedRides: 0,
        cancelledRides: 0,
        onTimeRate: 1.0,
        totalEarnings: 0,
        todayEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        isOnline: false,
        lastSeen: new Date(),
        safetyReportsCount: 0,
        safetySuspendedAt: null,
        safetySuspensionReason: "",
        safetyLastReportAt: null
      };
    }));

    // Insérer les utilisateurs
    const createdUsers = await User.insertMany(usersToCreate);
    
    console.log('\n🎉 Utilisateurs insérés avec succès !\n');
    
    createdUsers.forEach((user, index) => {
      console.log(`USER ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Statut: ${user.status}`);
      if (user.providerDetails && user.providerDetails.serviceCategory) {
        console.log(`   Catégorie: ${user.providerDetails.serviceCategory}`);
      }
      console.log('');
    });

    console.log('NOTE Pour tester, utilisez ces identifiants:');
    console.log('   - Email: l\'email de l\'utilisateur');
    console.log('   - Mot de passe: le mot de passe en clair (ex: fatoudiallo1)');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nSOCKET Déconnecté de MongoDB');
  }
}

// Exécuter le script
seedUsers();
