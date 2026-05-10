import { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"
import { useAuth } from "../context/AuthContext"
import useShakeDetection from "../hooks/useShakeDetection"
import MapPicker from "../components/MapPicker"
import RatingModal from "../components/RatingModal"
import { ratingAPI } from "../api"

const hasExactLocation = (location) =>
  Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng))

export default function ServiceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [service, setService] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [sendingMsg, setSendingMsg] = useState(false)
  const [sendingSOS, setSendingSOS] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)

  const loadService = useCallback(async () => {
    const serviceRes = await api.get(`/services/${id}`)
    setService(serviceRes.data)
  }, [id])

  const loadMessages = useCallback(async () => {
    const msgRes = await api.get(`/services/${id}/messages`)
    setMessages(Array.isArray(msgRes.data) ? msgRes.data : [])
  }, [id])

  const sendEmergencyAlert = useCallback(async () => {
    if (!service?._id) return

    try {
      setSendingSOS(true)
      setStatusMessage("")
      await api.post(`/services/${service._id}/safety-report`, {
        type: "sos",
        message: "Alerte SOS envoyee depuis le suivi de mission",
        location: {
          name: service.title || service.category || "Mission active",
          address: "Support securite"
        }
      })
      setStatusMessage("Alerte de securite envoyee.")
    } catch (sosError) {
      setError(sosError.response?.data?.message || "Impossible d'envoyer l'alerte SOS.")
    } finally {
      setSendingSOS(false)
    }
  }, [service])

  const { shakeDetected, clearShake, countdown, confirmShake } = useShakeDetection(sendEmergencyAlert)

  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      try {
        setLoading(true)
        setError("")
        await Promise.all([loadService(), loadMessages()])
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.response?.data?.message || "Erreur de chargement.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [loadMessages, loadService])

  useEffect(() => {
    const timer = setInterval(() => {
      loadMessages()
      loadService()
    }, 12000)
    return () => clearInterval(timer)
  }, [loadMessages, loadService])

  useEffect(() => {
    if (!service?._id || !navigator.geolocation) return
    if (!["accepted", "in_progress"].includes(String(service.status || ""))) return

    const clientId = typeof service.clientId === "object" ? service.clientId?._id : service.clientId
    const technicianId = typeof service.technicianId === "object" ? service.technicianId?._id : service.technicianId
    const isClientViewer = String(clientId || "") === String(user?._id || "")
    const isProviderViewer = String(technicianId || "") === String(user?._id || "")
    if (!isClientViewer && !isProviderViewer) return

    let lastShared = null
    const endpoint = isProviderViewer ? `/services/${service._id}/provider-location` : `/services/${service._id}/client-location`

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
          name: isProviderViewer ? "Position livreur" : "Position client",
          address: "Position GPS verifiee"
        }
        if (
          lastShared &&
          Math.abs(lastShared.lat - location.lat) < 0.00005 &&
          Math.abs(lastShared.lng - location.lng) < 0.00005
        ) {
          return
        }
        lastShared = location
        try {
          const response = await api.patch(endpoint, { location })
          setService(response.data)
        } catch (locationError) {
          console.warn("Partage position service indisponible:", locationError)
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [service?._id, service?.status, user?._id])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSendingMsg(true)
      setError("")
      await api.post(`/services/${id}/messages`, { content: newMessage.trim() })
      setNewMessage("")
      await loadMessages()
    } catch (sendError) {
      setError(sendError.response?.data?.message || "Impossible d'envoyer le message.")
    } finally {
      setSendingMsg(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  if (error && !service) return <div className="min-h-screen p-4 flex items-center justify-center text-red-500">{error}</div>
  if (!service) return <div className="min-h-screen p-4">Service non trouve</div>

  const clientId = typeof service.clientId === "object" ? service.clientId?._id : service.clientId
  const technicianId = typeof service.technicianId === "object" ? service.technicianId?._id : service.technicianId
  const isClient = String(clientId || "") === String(user?._id || "")
  const messagingOpen =
    ["accepted", "in_progress", "quoted"].includes(String(service.status || "")) ||
    (String(service.status || "") === "pending" && Boolean(technicianId))
  const canUseSOS = ["accepted", "in_progress"].includes(String(service.status || ""))
  const canRateProvider = isClient && service.status === "completed" && technicianId
  const providerName = service.technician?.name || service.assignedProvider?.name || "Prestataire"
  const providerLocation = service.currentProviderLocation || service.technician?.coordinates || service.assignedProvider?.coordinates
  const clientLocation = service.clientLocation
  const canShowTracking = ["accepted", "in_progress"].includes(String(service.status || "")) && (hasExactLocation(clientLocation) || hasExactLocation(providerLocation))

  return (
    <div className="min-h-screen bg-[#f7f1e6] pb-24">
      <div className="bg-[linear-gradient(135deg,#1260a1_0%,#0a3760_100%)] text-white p-4 rounded-b-[30px] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-2xl bg-white/20 text-white font-semibold">
            Retour
          </button>
          <h1 className="text-xl font-bold">Suivi de service</h1>
          <div className="w-10"></div>
        </div>
        <h2 className="text-2xl font-bold">{service.title || service.category}</h2>
        <p className="text-sm text-white/80 mt-1">{service.description}</p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {error && <div className="rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm text-[#a54b55]">{error}</div>}
        {statusMessage && <div className="rounded-2xl bg-[#f7fbff] px-4 py-3 text-sm text-[#165c96]">{statusMessage}</div>}

        {canUseSOS && (
          <div className="bg-white rounded-[30px] p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-3 text-[#16324f]">Securite SOS</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={sendEmergencyAlert}
                disabled={sendingSOS}
                className="rounded-2xl bg-[#fff1f1] px-4 py-3 text-sm font-bold text-[#a54b55] disabled:opacity-70"
              >
                {sendingSOS ? "Envoi..." : "Envoyer SOS immediat"}
              </button>
              <button
                onClick={() => navigate("/security-support")}
                className="rounded-2xl bg-white border border-[#dce7f0] px-4 py-3 text-sm font-bold text-[#1260a1]"
              >
                Ouvrir support securite
              </button>
            </div>
            <p className="text-xs text-[#70839a] mt-3">
              Detection secousse avancee: 3 secousses fortes en moins de 4 secondes declenchent un compte a rebours SOS avec annulation possible.
            </p>
          </div>
        )}

        {canShowTracking && (
          <div className="bg-white rounded-[30px] p-4 shadow-lg">
            <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-bold text-[#16324f]">
                  {service.serviceFamily === "delivery" ? "Suivi de livraison" : "Suivi de mission"}
                </h3>
                <p className="mt-1 break-words text-sm text-[#70839a]">
                  {clientLocation?.address || "Adresse client en attente"}{providerLocation?.address ? ` • ${providerLocation.address}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#edf5fb] px-3 py-2 text-xs font-bold text-[#1260a1]">
                Live
              </span>
            </div>
            <div className="h-[320px] overflow-hidden rounded-[24px]">
              <MapPicker
                center={providerLocation || clientLocation}
                initialPickup={clientLocation}
                initialDestination={providerLocation}
                driverPosition={providerLocation}
                readOnly
              />
            </div>
          </div>
        )}

        {shakeDetected && (
          <div className="fixed bottom-24 left-4 right-4 z-50">
            <div className="bg-[#a54b55] text-white p-4 rounded-2xl text-center shadow-2xl">
              <div className="font-bold text-lg mb-2">Alerte secousse detectee</div>
              <div className="text-sm mb-3">SOS automatique dans {countdown}s</div>
              <div className="flex justify-center gap-3">
                <button onClick={confirmShake} className="bg-white text-[#a54b55] px-4 py-2 rounded-xl font-bold">
                  Envoyer maintenant
                </button>
                <button onClick={clearShake} className="bg-white/20 px-4 py-2 rounded-xl font-semibold">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {messagingOpen ? (
          <div className="bg-white rounded-[30px] p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-[#16324f]">Communication client/prestataire</h3>
            <div className="mb-4 rounded-[18px] border border-[#dce7f0] bg-[#f8fbff] px-4 py-3 text-sm text-[#5f7184]">
              Echange obligatoire avant cloture: les deux parties doivent participer a la conversation.
            </div>
            <div className="bg-[#f7f1e6] rounded-[20px] p-4 h-64 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-[#70839a] text-center py-20">Aucun message pour le moment.</p>
              ) : (
                messages.map((msg) => {
                  const senderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId
                  const mine = String(senderId || "") === String(user?._id || "")
                  const senderName =
                    (typeof msg.senderId === "object"
                      ? (msg.senderId?.name || `${msg.senderId?.firstName || ""} ${msg.senderId?.lastName || ""}`.trim())
                      : "") || (mine ? "Vous" : "Interlocuteur")
                  return (
                    <div key={msg._id || `${msg.createdAt}-${senderId}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-[20px] ${mine ? "bg-[#1260a1] text-white rounded-br-none" : "bg-white text-[#16324f] rounded-bl-none border border-[#e6dccf]"}`}>
                        <p className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${mine ? "text-white/80" : "text-[#5a8fd1]"}`}>
                          {senderName}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${mine ? "text-white/70" : "text-[#70839a]"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSendMessage()}
                placeholder="Votre message..."
                className="flex-1 rounded-[20px] border border-[#e6dccf] px-4 py-3 text-sm outline-none focus:border-[#1260a1]"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMsg || !newMessage.trim()}
                className="bg-[#1260a1] text-white font-bold px-6 py-3 rounded-[20px] hover:opacity-90 disabled:opacity-50"
              >
                {sendingMsg ? "..." : "Envoyer"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[30px] p-6 shadow-lg text-sm text-[#70839a]">
            Communication active des qu'un prestataire est lie a la demande.
          </div>
        )}

        {canRateProvider && (
          <div className="bg-white rounded-[30px] p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-3 text-[#16324f]">Avis client</h3>
            <button
              onClick={() => setRatingOpen(true)}
              className="rounded-2xl bg-[#fff7eb] px-4 py-3 text-sm font-bold text-[#9a7a24]"
            >
              Donner des étoiles au prestataire
            </button>
          </div>
        )}
      </div>

      <RatingModal
        isOpen={ratingOpen}
        onClose={() => setRatingOpen(false)}
        title="Noter le prestataire"
        subtitle="Votre avis aide les prochains clients."
        type="service"
        targetName={providerName}
        onSubmit={({ rating, comment }) => ratingAPI.addServiceRating(service._id, technicianId, rating, comment, "client-to-provider")}
      />
    </div>
  )
}
