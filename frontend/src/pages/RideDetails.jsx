/**
 * Ride Details & Tracking Page (for driver)
 * Shows passenger details and ride progress
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import MapPicker from '../components/MapPicker'

const getInitials = (name) => {
  return String(name || '').split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || 'ND'
}

const getAssetUrl = (path) => {
  if (!path) return ''
  const base = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return `${base}${path}`
}

export default function RideDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [ride, setRide] = useState(null)
  const [passenger, setPassenger] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [tracking, setTracking] = useState(null)

  // Load ride details
  useEffect(() => {
    const loadRide = async () => {
      try {
        setLoading(true)
        const rideRes = await api.get(`/rides/${id}`)
        setRide(rideRes.data)

        // Load passenger if ride is accepted
        if (rideRes.data && rideRes.data.userId) {
          try {
            const passengerRes = await api.get(`/user/${rideRes.data.userId}`)
            setPassenger(passengerRes.data)
          } catch (e) {
            console.error('Error loading passenger:', e)
          }
        }

        // Initialize real-time tracking
        if (rideRes.data.status === 'accepted' || rideRes.data.status === 'ongoing') {
          setTracking({
            stage: rideRes.data.status === 'ongoing' ? 2 : 1,
            driverLocation: null,
            passengerLocation: null
          })
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (id) loadRide()
  }, [id])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSendingMsg(true)
      // For now, just log - backend endpoint would need to be created for ride messages
      console.log('Message envoyé:', newMessage)
      setNewMessage('')
      setMessages([...messages, {
        _id: Math.random(),
        content: newMessage,
        senderId: user._id,
        senderRole: user.role,
        createdAt: new Date()
      }])
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'envoi')
    } finally {
      setSendingMsg(false)
    }
  }

  // Mark ride as started
  const startRide = async () => {
    try {
      await api.patch(`/rides/${id}/start`)
      setRide(prev => ({ ...prev, status: 'ongoing' }))
      if (tracking) {
        setTracking(prev => ({ ...prev, stage: 2 }))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du démarrage')
    }
  }

  // Mark ride as completed
  const completeRide = async () => {
    try {
      await api.patch(`/rides/${id}/complete`)
      setRide(prev => ({ ...prev, status: 'completed' }))
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la finalisation')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>

  if (error) return <div className="min-h-screen p-4 flex items-center justify-center text-red-500">{error}</div>

  if (!ride) return <div className="min-h-screen p-4">Course non trouvée</div>

  const isDriver = user.role === 'driver' && ride.driverId === user._id

  if (!isDriver) {
    return <div className="min-h-screen p-4">Accès non autorisé</div>
  }

  return (
    <div className="min-h-screen bg-[#f7f1e6] pb-24">
      {/* Header */}
      <div className="bg-[linear-gradient(135deg,#1260a1_0%,#0a3760_100%)] text-white p-4 rounded-b-[30px] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-2xl bg-white/20 text-white font-semibold"
          >
            ← Retour
          </button>
          <h1 className="text-xl font-bold">Détails Course</h1>
          <div className="w-10"></div>
        </div>

        {/* Ride Info */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{ride.vehicleType || 'Course'}</h2>
          <div className="flex gap-3 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {ride.status === 'accepted' ? '🟡 Route' : ride.status === 'ongoing' ? '🟢 En cours' : ride.status === 'completed' ? '✅ Terminée': '⏳ Pending'}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">{ride.price?.toLocaleString() || '?'} FCFA</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Passenger Card */}
        {passenger && (
          <div className="bg-white rounded-[30px] p-6 shadow-lg border-2 border-[#d7ae49]">
            <h3 className="text-lg font-bold mb-4 text-[#16324f]">Passager</h3>
            <div className="flex gap-4 items-start">
              {/* Passenger Photo */}
              <div className="flex-shrink-0">
                {passenger.profilePhoto ? (
                  <img
                    src={getAssetUrl(passenger.profilePhoto)}
                    alt={passenger.name}
                    className="w-24 h-24 rounded-[20px] object-cover shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-[20px] bg-[#1260a1] text-white flex items-center justify-center text-3xl font-bold">
                    {getInitials(passenger.name)}
                  </div>
                )}
              </div>

              {/* Passenger Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="text-xl font-bold text-[#16324f]">{passenger.name}</h4>
                  <p className="text-sm text-[#70839a]">Passager</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 pt-2 border-t border-[#e6dccf]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <a href={`tel:${passenger.phone}`} className="text-[#1260a1] font-semibold hover:underline">
                      {passenger.phone}
                    </a>
                  </div>
                  {passenger.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✉️</span>
                      <a href={`mailto:${passenger.email}`} className="text-[#1260a1] font-semibold hover:underline">
                        {passenger.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        {ride.pickup && ride.destination && (
          <div className="bg-white rounded-[30px] shadow-lg overflow-hidden h-[400px]">
            <MapPicker
              center={ride.pickup}
              initialPickup={ride.pickup}
              initialDestination={ride.destination}
              routeGeometry={ride.geometry || []}
              selectionMode={null}
              onSelectPickup={() => {}}
              onSelectDestination={() => {}}
            />
          </div>
        )}

        {/* Chat Section */}
        {ride.status === 'accepted' || ride.status === 'ongoing' ? (
          <div className="bg-white rounded-[30px] p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-[#16324f]">💬 Communication</h3>

            {/* Messages */}
            <div className="bg-[#f7f1e6] rounded-[20px] p-4 h-64 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-[#70839a] text-center py-20">Aucun message. Commencez la conversation!</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-[20px] ${
                        msg.senderId === user._id
                          ? 'bg-[#1260a1] text-white rounded-br-none'
                          : 'bg-white text-[#16324f] rounded-bl-none border border-[#e6dccf]'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user._id ? 'text-white/60' : 'text-[#70839a]'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Votre message..."
                className="flex-1 rounded-[20px] border border-[#e6dccf] px-4 py-3 text-sm outline-none focus:border-[#1260a1]"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMsg || !newMessage.trim()}
                className="bg-[#1260a1] text-white font-bold px-6 py-3 rounded-[20px] hover:opacity-90 disabled:opacity-50"
              >
                {sendingMsg ? '...' : 'Envoyer'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Ride Actions */}
        <div className="bg-white rounded-[30px] p-6 shadow-lg space-y-4">
          <h3 className="text-lg font-bold text-[#16324f]">Actions</h3>
          
          {ride.status === 'accepted' && (
            <button
              onClick={startRide}
              className="w-full bg-[#18c56e] text-white font-bold py-3 rounded-[20px] hover:opacity-90"
            >
              ✓ Démarrer la course
            </button>
          )}
          
          {ride.status === 'ongoing' && (
            <button
              onClick={completeRide}
              className="w-full bg-[#1260a1] text-white font-bold py-3 rounded-[20px] hover:opacity-90"
            >
              ✓ Terminer la course
            </button>
          )}

          {ride.status === 'completed' && (
            <div className="bg-[#eefaf2] border-2 border-[#18c56e] rounded-[20px] p-4 text-center">
              <p className="text-[#178b55] font-bold">✅ Course terminée</p>
              <p className="text-sm text-[#70839a] mt-2">Merci d'avoir utilisé Ndar Express!</p>
            </div>
          )}
        </div>

        {/* Ride Details */}
        <div className="bg-white rounded-[30px] p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-[#16324f]">📍 Trajets</h3>
          <div className="space-y-4">
            {ride.pickup && (
              <div className="flex gap-3">
                <span className="text-2xl">🔴</span>
                <div>
                  <p className="font-semibold text-[#16324f]">Départ</p>
                  <p className="text-sm text-[#70839a]">{ride.pickup.address || ride.pickup.name}</p>
                </div>
              </div>
            )}
            
            {ride.destination && (
              <div className="flex gap-3">
                <span className="text-2xl">🟢</span>
                <div>
                  <p className="font-semibold text-[#16324f]">Destination</p>
                  <p className="text-sm text-[#70839a]">{ride.destination.address || ride.destination.name}</p>
                </div>
              </div>
            )}

            {ride.distanceKm && (
              <div className="pt-3 border-t border-[#e6dccf]">
                <div className="flex justify-between">
                  <span className="text-[#70839a]">Distance</span>
                  <span className="font-semibold">{ride.distanceKm} km</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[#70839a]">Durée estimée</span>
                  <span className="font-semibold">{ride.durationMin || '~'} min</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
