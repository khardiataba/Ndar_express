pour  import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext"
import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const Profile = () => {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profilePhotoUrl: "",
    role: "",
    status: "",
    // Champs pour les prestataires (driver/technician)
    serviceCategory: "",
    serviceArea: "",
    availability: "",
    experienceYears: "",
    vehicleBrand: "",
    vehicleType: "",
    vehiclePlate: "",
    beautySpecialty: "",
    otherServiceDetail: "",
    hasProfessionalTools: false,
    coordinates: { lat: 0, lng: 0 }
  })

  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imagePreview, setImagePreview] = useState("")

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        profilePhotoUrl: user.profilePhotoUrl || "",
        role: user.role || "",
        status: user.status || "",
        // Détails prestataire
        serviceCategory: user.providerDetails?.serviceCategory || "",
        serviceArea: user.providerDetails?.serviceArea || "",
        availability: user.providerDetails?.availability || "",
        experienceYears: user.providerDetails?.experienceYears || "",
        vehicleBrand: user.providerDetails?.vehicleBrand || "",
        vehicleType: user.providerDetails?.vehicleType || "",
        vehiclePlate: user.providerDetails?.vehiclePlate || "",
        beautySpecialty: user.providerDetails?.beautySpecialty || "",
        otherServiceDetail: user.providerDetails?.otherServiceDetail || "",
        hasProfessionalTools: user.providerDetails?.hasProfessionalTools || false,
        coordinates: user.providerDetails?.coordinates || { lat: 0, lng: 0 }
      })
      if (user.profilePhotoUrl) {
        setImagePreview(user.profilePhotoUrl.startsWith('http') 
          ? user.profilePhotoUrl 
          : `${API_BASE_URL.replace('/api', '')}${user.profilePhotoUrl}`)
      }
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setProfile(prev => ({
          ...prev,
          profilePhotoUrl: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      // Préparer les données à envoyer
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        profilePhotoUrl: profile.profilePhotoUrl
      }

      // Inclure providerDetails seulement si c'est un driver ou technician
      if (user.role === 'driver' || user.role === 'technician') {
        updateData.providerDetails = {
          serviceCategory: profile.serviceCategory,
          serviceArea: profile.serviceArea,
          availability: profile.availability,
          experienceYears: profile.experienceYears,
          vehicleBrand: profile.vehicleBrand,
          vehicleType: profile.vehicleType,
          vehiclePlate: profile.vehiclePlate,
          beautySpecialty: profile.beautySpecialty,
          otherServiceDetail: profile.otherServiceDetail,
          hasProfessionalTools: profile.hasProfessionalTools,
          coordinates: profile.coordinates
        }
      }

      const response = await axios.put(
        `${API_BASE_URL}/user/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.success) {
        // Mettre à jour le contexte avec les nouvelles données
        if (updateUser) {
          updateUser(response.data.user)
        }
        showToast("Profil mis à jour avec succès", "success")
      }
    } catch (error) {
      console.error("Erreur mise à jour profil:", error)
      showToast(error.response?.data?.message || "Erreur lors de la mise à jour", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.delete(
        `${API_BASE_URL}/user/account`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        showToast("Compte supprimé avec succès", "success")
        logout()
        navigate("/login", { replace: true })
      }
    } catch (error) {
      console.error("Erreur suppression compte:", error)
      showToast(error.response?.data?.message || "Erreur lors de la suppression", "error")
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const isProvider = user?.role === 'driver' || user?.role === 'technician'

  return (
    <div className="min-h-screen pt-24 pb-32 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#fff7ec] mb-2">Mon Profil</h1>
          <p className="text-[#b0bac9]">Gérez vos informations personnelles</p>
        </div>

        {/* Profile Card */}
        <div className="ndar-card rounded-2xl p-6 mb-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profil"
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#d7ae49]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-[#d7ae49]">
                  <span className="text-4xl">👤</span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-[#d7ae49] rounded-full cursor-pointer hover:bg-[#e8c45f] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="text-sm">📷</span>
              </label>
            </div>
            <p className="text-xs text-[#b0bac9]">Cliquez pour changer la photo</p>
          </div>

          {/* Form Fields - Informations de base */}
          <div className="space-y-4">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                  placeholder="Votre prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                disabled
                className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-gray-300 cursor-not-allowed opacity-70"
              />
              <p className="text-xs text-gray-400 mt-1">Non modifiable</p>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                placeholder="Votre numéro"
              />
            </div>

            {/* Rôle et Statut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Rôle</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-gray-300 cursor-not-allowed opacity-70 capitalize"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Statut</label>
                <input
                  type="text"
                  value={profile.status}
                  disabled
                  className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-gray-300 cursor-not-allowed opacity-70 capitalize"
                />
              </div>
            </div>
          </div>

          {/* Section Prestataire (Driver/Technician) */}
          {isProvider && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-[#fff7ec] mb-4">Informations Professionnelles</h3>
              
              <div className="space-y-4">
                {/* Catégorie de service */}
                <div>
                  <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Catégorie</label>
                  <input
                    type="text"
                    name="serviceCategory"
                    value={profile.serviceCategory}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                    placeholder="Votre catégorie de service"
                  />
                </div>

                {/* Zone de service */}
                <div>
                  <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Zone de service</label>
                  <input
                    type="text"
                    name="serviceArea"
                    value={profile.serviceArea}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                    placeholder="Votre zone de service"
                  />
                </div>

                {/* Disponibilité */}
                <div>
                  <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Disponibilité</label>
                  <input
                    type="text"
                    name="availability"
                    value={profile.availability}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                    placeholder="Vos disponibilités"
                  />
                </div>

                {/* Années d'expérience */}
                <div>
                  <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Années d'expérience</label>
                  <input
                    type="text"
                    name="experienceYears"
                    value={profile.experienceYears}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                    placeholder="Votre expérience"
                  />
                </div>

                {/* Pour les drivers - Informations véhicule */}
                {profile.role === 'driver' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Marque du véhicule</label>
                        <input
                          type="text"
                          name="vehicleBrand"
                          value={profile.vehicleBrand}
                          onChange={handleInputChange}
                          className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                          placeholder="Marque"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Type de véhicule</label>
                        <input
                          type="text"
                          name="vehicleType"
                          value={profile.vehicleType}
                          onChange={handleInputChange}
                          className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                          placeholder="Type"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Immatriculation</label>
                      <input
                        type="text"
                        name="vehiclePlate"
                        value={profile.vehiclePlate}
                        onChange={handleInputChange}
                        className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                        placeholder="AB-123-CD"
                      />
                    </div>
                  </>
                )}

                {/* Pour les technicians - Spécialité beauté */}
                {profile.serviceCategory === 'Coiffure & Beaute' && (
                  <div>
                    <label className="block text-sm font-semibold text-[#d7ae49] mb-2">Spécialité beauté</label>
                    <input
                      type="text"
                      name="beautySpecialty"
                      value={profile.beautySpecialty}
                      onChange={handleInputChange}
                      className="w-full bg-[#1a3a5c] border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#d7ae49] focus:outline-none transition-colors"
                      placeholder="Vos spécialités"
                    />
                  </div>
                )}

                {/* Matériel professionnel */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="hasProfessionalTools"
                    checked={profile.hasProfessionalTools}
                    onChange={(e) => setProfile(prev => ({ ...prev, hasProfessionalTools: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/20 bg-[#1a3a5c] text-[#d7ae49] focus:ring-[#d7ae49]"
                  />
                  <label className="text-sm text-white">Je dispose du matériel professionnel nécessaire</label>
                </div>
              </div>
            </div>
          )}

          {/* Update Button */}
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="w-full mt-6 bg-[#d7ae49] hover:bg-[#e8c45f] disabled:opacity-50 text-black font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Mise à jour..." : "Mettre à jour le profil"}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="ndar-card rounded-2xl p-6 border border-red-500/20">
          <h3 className="text-lg font-bold text-red-400 mb-4">Zone de danger</h3>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-lg transition-colors border border-red-500/30"
          >
            Supprimer mon compte
          </button>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-semibold mb-4">
                ⚠️ Cette action est irréversible. Êtes-vous sûr ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {loading ? "Suppression..." : "Confirmer la suppression"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile