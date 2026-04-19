import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import MapPicker from "../components/MapPicker"
import api from "../api"
import useSocket from "../hooks/useSocket"

const DriverTracking = () => {
  const { rideId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [ride, setRide] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locationPermission, setLocationPermission] = useState(null)
  const [clientLocation, setClientLocation] = useState(null)
  const [driverLocation, setDriverLocation] = useState(null)
  const [eta, setEta] = useState(null)
  const [distance, setDistance] = useState(null)

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission()
    fetchRideData()
  }, [rideId])

  const requestLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setLocationPermission(false)
        showToast("Géolocalisation non disponible", "error")
        return
      }

      navigator.geolocation.requestPermission().then((permission) => {
        if (permission === "granted") {
          setLocationPermission(true)
          startTrackingLocation()
        } else {
          setLocationPermission(false)
          showToast("Permission de localisation refusée", "warning")
        }
      }).catch(() => {
        // Fallback for non-permission API browsers
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationPermission(true)
            startTrackingLocation()
          },
          () => {
            setLocationPermission(false)
            showToast("Impossible d'accéder à votre position", "error")
          }
        )
      })
    } catch (error) {
      console.error("Erreur permission localisation:", error)
      setLocationPermission(false)
    }
  }

  const startTrackingLocation = () => {
    if (!navigator.geolocation) return

    // Continuous location tracking
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setClientLocation(loc)
      },
      (error) => console.warn("Erreur localisation:", error),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }

  const fetchRideData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/rides/${rideId}`)
      setRide(response.data.ride)

      if (response.data.ride?.driverId) {
        // Fetch driver info
        const driverRes = await api.get(`/users/${response.data.ride.driverId}`)
        setDriver(driverRes.data.user)
      }
    } catch (error) {
      console.error("Erreur récupération course:", error)
      showToast("Impossible de charger la course", "error")
    } finally {
      setLoading(false)
    }
  }

  // Socket listener for driver location updates
  useSocket()

  useEffect(() => {
    if (!ride || !clientLocation) return

    // Calculate ETA based on distance
    const distance = Math.sqrt(
      Math.pow(ride.destination.lat - clientLocation.lat, 2) +
      Math.pow(ride.destination.lng - clientLocation.lng, 2)
    ) * 111 // rough km conversion

    setDistance(distance)
    const etaMinutes = Math.ceil(distance / 1.4) // average speed
    setEta(etaMinutes)
  }, [ride, clientLocation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-32">
        <div className="ndar-card rounded-2xl p-8 text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-[#fff7ec]">Chargement du suivi...</p>
        </div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-32">
        <div className="ndar-card rounded-2xl p-8 text-center">
          <p className="text-[#ff6b6b] mb-4">Course non trouvée</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#d7ae49] hover:bg-[#e8c45f] text-black font-semibold py-2 px-4 rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-32 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#fff7ec]">Suivi du trajet</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-[#d7ae49] hover:text-[#e8c45f]"
          >
            ✕
          </button>
        </div>

        {/* Location Permission Alert */}
        {locationPermission === false && (
          <div className="ndar-card rounded-2xl p-4 border border-red-500/30 bg-red-500/10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-400 mb-2">Localisation requise</p>
                <p className="text-sm text-[#b0bac9] mb-3">
                  Veuillez activer la localisation pour suivre le chauffeur et voir l'ETA
                </p>
                <button
                  onClick={requestLocationPermission}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                >
                  Activer la localisation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Driver Info Card */}
        {driver && (
          <div className="ndar-card rounded-2xl p-5 border border-[#d7ae49]/30">
            <div className="flex items-center gap-4 mb-4">
              {driver.profileImage ? (
                <img
                  src={driver.profileImage}
                  alt={driver.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#d7ae49]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#d7ae49]/20 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#fff7ec]">{driver.fullName}</h2>
                <p className="text-sm text-[#d7ae49]">Chauffeur YOON WI</p>
                <div className="mt-2 flex gap-2">
                  <span className="inline-block px-3 py-1 bg-[#18c56e]/20 text-[#18c56e] text-xs font-semibold rounded-full">
                    ✓ Vérifié
                  </span>
                  {driver.rating && (
                    <span className="inline-block px-3 py-1 bg-[#ffd700]/20 text-[#ffd700] text-xs font-semibold rounded-full">
                      ⭐ {driver.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#d7ae49]/20">
              <button className="flex-1 bg-[#3a7dd6]/20 hover:bg-[#3a7dd6]/40 text-[#6ba3e5] font-semibold py-2 rounded-lg transition-colors">
                📞 Appeler
              </button>
              <button className="flex-1 bg-[#d7ae49]/20 hover:bg-[#d7ae49]/40 text-[#ffd700] font-semibold py-2 rounded-lg transition-colors">
                💬 Message
              </button>
            </div>
          </div>
        )}

        {/* Tracking Status */}
        <div className="ndar-card rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-[#b0bac9] mb-1">Distance</p>
              <p className="text-xl font-bold text-[#fff7ec]">
                {distance ? `${distance.toFixed(1)} km` : "..."}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#b0bac9] mb-1">ETA</p>
              <p className="text-xl font-bold text-[#18c56e]">
                {eta ? `${eta} min` : "Calcul..."}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#b0bac9] mb-1">Statut</p>
              <p className="text-xl font-bold text-[#d7ae49]">
                {ride.status === "accepted" ? "En route" : "En attente"}
              </p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-[#18c56e]">Course acceptée</p>
                <p className="text-sm text-[#b0bac9]">Le chauffeur a accepté votre demande</p>
              </div>
            </div>
            {ride.status === "ongoing" && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-semibold text-[#3a7dd6]">Chauffeur en route</p>
                  <p className="text-sm text-[#b0bac9]">Le chauffeur arrive vers vous</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        {clientLocation && ride && (
          <div className="ndar-card rounded-2xl p-5 overflow-hidden">
            <h3 className="text-lg font-semibold text-[#fff7ec] mb-3">Carte du trajet</h3>
            <div className="h-[300px] rounded-xl overflow-hidden border border-[#d7ae49]/20">
              <MapPicker
                center={clientLocation}
                readOnly
                extraMarkers={[
                  {
                    id: "pickup",
                    lat: ride.pickup.lat,
                    lng: ride.pickup.lng,
                    label: "Départ",
                    emoji: "📍",
                    background: "#3a7dd6"
                  },
                  {
                    id: "destination",
                    lat: ride.destination.lat,
                    lng: ride.destination.lng,
                    label: "Arrivée",
                    emoji: "🎯",
                    background: "#18c56e"
                  },
                  ...(driverLocation ? [{
                    id: "driver",
                    lat: driverLocation.lat,
                    lng: driverLocation.lng,
                    label: "Chauffeur",
                    emoji: "🚗",
                    background: "#d7ae49"
                  }] : [])
                ]}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="ndar-card rounded-2xl p-5 space-y-3">
          <button className="w-full bg-[#3a7dd6]/20 hover:bg-[#3a7dd6]/40 text-[#6ba3e5] font-semibold py-3 rounded-lg transition-colors border border-[#3a7dd6]/30">
            📋 Voir les détails de la course
          </button>
          <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-lg transition-colors border border-red-500/20">
            ❌ Annuler la course
          </button>
        </div>
      </div>
    </div>
  )
}

export default DriverTracking
