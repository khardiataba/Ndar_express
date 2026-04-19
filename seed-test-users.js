/**
 * Script pour insérer des utilisateurs de test dans la base de données
 * Exécution: node seed-test-users.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: 'backend/.env' });

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  });

// Schéma User simplifié pour le script
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  status: String,
  providerDetails: mongoose.Schema.Types.Mixed,
  profilePhotoUrl: String,
  idCardFrontUrl: String,
  idCardBackUrl: String,
  licenseUrl: String,
  registrationCardUrl: String,
  documentChecks: mongoose.Schema.Types.Mixed,
  reviewNote: String,
  safetyReportsCount: Number,
  safetySuspendedAt: Date,
  safetySuspensionReason: String,
  safetyLastReportAt: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Utilisateurs de test
const testUsers = [
  {
    // CLIENT / PASSAGER
    firstName: "Fatou",
    lastName: "Diallo",
    name: "Fatou Diallo",
    email: "fatou.client@yoonbi.sn",
    password: "ClientTest123!",
    phone: "+221771234567",
    role: "client",
    status: "verified",
    providerDetails: {}
  },
  {
    // CLIENT 2
    firstName: "Mamadou",
    lastName: "Ndiaye",
    name: "Mamadou Ndiaye",
    email: "mamadou.client@yoonbi.sn",
    password: "ClientTest123!",
    phone: "+221771111222",
    role: "client",
    status: "verified",
    providerDetails: {}
  },
  {
    // DRIVER / CHAUFFEUR
    firstName: "Moussa",
    lastName: "Ba",
    name: "Moussa Ba",
    email: "moussa.driver@yoonbi.sn",
    password: "DriverTest123!",
    phone: "+221772345678",
    role: "driver",
    status: "pending", // Doit être vérifié par admin
    providerDetails: {
      serviceCategory: "Livraison / Coursier",
      serviceArea: "Centre-ville",
      availability: "7j/7, 6h-20h",
      experienceYears: "5",
      hasProfessionalTools: true,
      vehicleBrand: "Toyota",
      vehicleType: "Berline",
      vehiclePlate: "AB-123-CD",
      coordinates: {
        lat: 16.0244,
        lng: -16.5015
      }
    }
  },
  {
    // DRIVER 2
    firstName: "Cheikh",
    lastName: "Fall",
    name: "Cheikh Fall",
    email: "cheikh.driver@yoonbi.sn",
    password: "DriverTest123!",
    phone: "+221772222333",
    role: "driver",
    status: "pending",
    providerDetails: {
      serviceCategory: "Coursier",
      serviceArea: "Guet-Ndar",
      availability: "Lun-Sam, 7h-19h",
      experienceYears: "3",
      hasProfessionalTools: true,
      vehicleBrand: "Yamaha",
      vehicleType: "Moto",
      vehiclePlate: "CD-456-EF",
      coordinates: {
        lat: 16.0188,
        lng: -16.4919
      }
    }
  },
  {
    // TECHNICIAN / PRESTATAIRE - COIFFEUSE
    firstName: "Aissatou",
    lastName: "Sow",
    name: "Aissatou Sow",
    email: "aissatou.technician@yoonbi.sn",
    password: "TechTest123!",
    phone: "+221773456789",
    role: "technician",
    status: "pending", // Doit être vérifié par admin
    providerDetails: {
      serviceCategory: "Coiffure & Beaute",
      serviceArea: "Guet-Ndar",
      availability: "Lun-Sam, 8h-18h",
      experienceYears: "8",
      hasProfessionalTools: true,
      beautySpecialty: "Coiffure, Tresses, Soins",
      coordinates: {
        lat: 16.0188,
        lng: -16.4919
      }
    }
  },
  {
    // TECHNICIAN 2 / PRESTATAIRE - PLOMBIER
    firstName: "Ibrahima",
    lastName: "Diop",
    name: "Ibrahima Diop",
    email: "ibrahima.technician@yoonbi.sn",
    password: "TechTest123!",
    phone: "+221773333444",
    role: "technician",
    status: "pending",
    providerDetails: {
      serviceCategory: "Plomberie",
      serviceArea: "Sor",
      availability: "7j/7, 8h-17h",
      experienceYears: "10",
      hasProfessionalTools: true,
      coordinates: {
        lat: 16.0068,
        lng: -16.5205
      }
    }
  },
  {
    // TECHNICIAN 3 / PRESTATAIRE - ÉLECTRICIEN
    firstName: "Oumar",
    lastName: "Kane",
    name: "Oumar Kane",
    email: "oumar.technician@yoonbi.sn",
    password: "TechTest123!",
    phone: "+221773444555",
    role: "technician",
    status: "pending",
    providerDetails: {
      serviceCategory: "Electricite",
      serviceArea: "Balacoss",
      availability: "Lun-Dim, 7h-20h",
      experienceYears: "12",
      hasProfessionalTools: true,
      coordinates: {
        lat: 16.0149,
        lng: -16.5072
      }
    }
  },
  {
    // ADMIN
    firstName: "Admin",
    lastName: "Ndar",
    name: "Admin Ndar",
    email: "admin@yoonbi.sn",
    password: "AdminTest123!",
    phone: "+221774567890",
    role: "admin",
    status: "verified",
    providerDetails: {}
  },
  {
    // ADMIN 2
    firstName: "Super",
    lastName: "Admin",
    name: "Super Admin",
    email: "superadmin@yoonbi.sn",
    password: "AdminTest123!",
    phone: "+221774111222",
    role: "admin",
    status: "verified",
    providerDetails: {}
  }
];

async function seedUsers() {
  try {
    console.log('🧹 Nettoyage des anciens utilisateurs de test...');
    
    // Supprimer les utilisateurs de test existants
    const testEmails = testUsers.map(u => u.email);
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('✅ Anciens utilisateurs supprimés');
    
    console.log('🔐 Hachage des mots de passe...');
    const hashedUsers = await Promise.all(
      testUsers.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return {
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      })
    );
    
    console.log('👥 Insertion des nouveaux utilisateurs...');
    const insertedUsers = await User.insertMany(hashedUsers);
    
    console.log('\n✅ Utilisateurs de test insérés avec succès!\n');
    console.log('📊 Résumé:');
    insertedUsers.forEach(user => {
      console.log(`  • ${user.role.toUpperCase()}: ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    console.log('\n🔑 Mots de passe:');
    console.log('  • Clients: ClientTest123!');
    console.log('  • Drivers: DriverTest123!');
    console.log('  • Technicians: TechTest123!');
    console.log('  • Admins: AdminTest123!');
    
    console.log('\n⚠️  IMPORTANT:');
    console.log('  • Les drivers et technicians sont en statut "pending"');
    console.log('  • Connectez-vous avec un compte admin pour les vérifier');
    console.log('  • Ou modifiez leur statut directement dans MongoDB');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Lancer le script
seedUsers();