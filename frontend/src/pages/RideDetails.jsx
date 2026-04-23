import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"

export default function RideDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadRide = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await api.get(`/rides/${id}`)
        if (!cancelled) setRide(response.data)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.message || "Impossible de charger la course.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (id) loadRide()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (error) return <div className="min-h-screen p-4 flex items-center justify-center text-red-500">{error}</div>
  if (!ride) return <div className="min-h-screen p-4">Course non trouvee.</div>

  const rideStatusLabel =
    ride.status === "accepted"
      ? "Acceptee"
      : ride.status === "ongoing"
        ? "En cours"
        : ride.status === "completed"
          ? "Terminee"
          : "En attente"

  return (
    <div className="min-h-screen bg-[#f7f1e6] pb-24">
      <div className="bg-[linear-gradient(135deg,#1260a1_0%,#0a3760_100%)] text-white p-4 rounded-b-[30px] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-2xl bg-white/20 text-white font-semibold">
            Retour
          </button>
          <h1 className="text-xl font-bold">Details course</h1>
          <div className="w-10"></div>
        </div>
        <h2 className="text-2xl font-bold">{ride.vehicleType || "Course"}</h2>
        <div className="flex gap-3 mt-2 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">{rideStatusLabel}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{Number(ride.price || 0).toLocaleString()} FCFA</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-[28px] p-5 shadow-lg">
          <h3 className="text-lg font-bold text-[#16324f] mb-3">Trajet</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-[#16324f]">Depart</div>
              <div className="text-[#70839a]">{ride.pickup?.address || ride.pickup?.name || "-"}</div>
            </div>
            <div>
              <div className="font-semibold text-[#16324f]">Destination</div>
              <div className="text-[#70839a]">{ride.destination?.address || ride.destination?.name || "-"}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-[#f8fbff] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[#5a8fd1]">Distance</div>
                <div className="mt-1 font-semibold text-[#16324f]">{ride.distanceKm ? `${ride.distanceKm} km` : "--"}</div>
              </div>
              <div className="rounded-2xl bg-[#f8fbff] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[#5a8fd1]">Duree</div>
                <div className="mt-1 font-semibold text-[#16324f]">{ride.durationMin ? `${ride.durationMin} min` : "--"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-5 shadow-lg">
          <h3 className="text-lg font-bold text-[#16324f] mb-3">Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => navigate(`/tracking/${ride._id}`)}
              className="rounded-2xl bg-[linear-gradient(135deg,#1260a1_0%,#0a3760_100%)] px-4 py-3 text-sm font-bold text-white"
            >
              Ouvrir suivi course
            </button>
            <button
              onClick={() => navigate("/driver")}
              className="rounded-2xl bg-white border border-[#dce7f0] px-4 py-3 text-sm font-bold text-[#1260a1]"
            >
              Retour dashboard chauffeur
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
