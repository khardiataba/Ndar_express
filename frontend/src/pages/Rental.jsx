import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import VehicleCard from "../components/VehicleCard"
import Toast from "../components/Toast"
import AppIcon from "../components/AppIcon"

const defaultClientLocation = {
  lat: 16.0244,
  lng: -16.5015,
  name: "Votre position",
  address: "Saint-Louis"
}

const Rental = () => {
  const navigate = useNavigate()
  const [vehicleType, setVehicleType] = useState("all")
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clientLocation, setClientLocation] = useState(defaultClientLocation)
  const [toastMessage, setToastMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setClientLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "Votre position",
          address: "Position détectée"
        })
      },
      () => {
        setClientLocation(defaultClientLocation)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  // Fetch rentals
  useEffect(() => {
    const fetchRentals = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = {
          lat: clientLocation.lat,
          lng: clientLocation.lng
        }

        if (vehicleType !== "all") {
          params.vehicleType = vehicleType
        }

        const response = await api.get("/rentals", { params })

        setRentals(response.data.rentals || [])
      } catch (err) {
        console.error("Error fetching rentals:", err)
        setError("Erreur lors du chargement des locations")
      } finally {
        setLoading(false)
      }
    }

    fetchRentals()
  }, [vehicleType, clientLocation])

  // Filter rentals by search query
  const filteredRentals = rentals.filter(
    (rental) =>
      rental.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rental.provider?.name && rental.provider.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleVehicleSelect = (vehicle) => {
    navigate(`/rental/${vehicle._id}`, { state: { rental: vehicle } })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="mb-4 flex items-center gap-3 text-3xl font-bold">
            <AppIcon name="car" className="h-8 w-8" />
            <span>Locations de Véhicules</span>
          </h1>
          <p className="text-blue-100">Trouvez le véhicule parfait pour votre déplacement</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <AppIcon name="search" className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un véhicule, une marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-3 pl-11 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Vehicle Type Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: "all", label: "Tous les véhicules", icon: "car" },
              { value: "small", label: "Petits véhicules", icon: "moto" },
              { value: "large", label: "Grands véhicules", icon: "van" }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setVehicleType(type.value)
                  setSearchQuery("")
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition ${
                  vehicleType === type.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <AppIcon name={type.icon} className="h-4 w-4" />
                  <span>{type.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Location Info */}
          <div className="text-sm text-gray-600 mt-4 p-2 bg-blue-50 rounded">
            <span className="flex items-center gap-2">
              <AppIcon name="pin" className="h-4 w-4 text-blue-600" />
              <span>{clientLocation.address}</span>
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="bg-gray-200 h-80 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="mb-2 flex items-center justify-center gap-2 text-2xl">
              <AppIcon name="info" className="h-6 w-6 text-blue-600" />
              <span>Aucun véhicule disponible</span>
            </p>
            <p className="text-gray-600">
              {searchQuery ? "Essayez une autre recherche" : "Revenir plus tard pour les nouvelles locations"}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              <strong>{filteredRentals.length}</strong> véhicule(s) trouvé(s)
            </div>

            {/* Vehicles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRentals.map((rental) => (
                <VehicleCard
                  key={rental._id}
                  vehicle={rental}
                  onSelect={() => handleVehicleSelect(rental)}
                  showProviderInfo={true}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

    </div>
  )
}

export default Rental

