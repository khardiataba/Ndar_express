const express = require("express")
const crypto = require("crypto")
const https = require("https")
const Ride = require("../models/Ride")
const Message = require("../models/Message")
const User = require("../models/User")
const socketManager = require("../socket/socketManager")
const { authMiddleware, requireRole, requireVerified } = require("../middleware/auth")
const { computeRideFare, computeStudentBusFare, normalizeStudentBusZone, rideCommission } = require("../utils/pricing")
const { createNotification } = require("../services/notificationService")
const { validateLocation, validateLocationPair } = require("../utils/locationValidation")

const router = express.Router()
const objectIdRegex = /^[0-9a-fA-F]{24}$/

const validateRideId = (req, res, next) => {
  if (!objectIdRegex.test(String(req.params.id || ""))) {
    return res.status(400).json({ message: "Identifiant de course invalide" })
  }
  next()
}

/* =========================
   DISTANCE UTILITIES
========================= */

const haversineDistanceKm = (pickup, destination) => {
  const toRadians = (v) => (v * Math.PI) / 180
  const R = 6371

  const dLat = toRadians(destination.lat - pickup.lat)
  const dLng = toRadians(destination.lng - pickup.lng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pickup.lat)) *
    Math.cos(toRadians(destination.lat)) *
    Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const buildFallbackEstimate = (pickup, destination) => {
  const distance = Math.max(1, Math.round(haversineDistanceKm(pickup, destination) * 1.18 * 10) / 10)
  const duration = Math.max(4, Math.round((distance / 28) * 60))

  return {
    distanceKm: distance,
    durationMin: duration,
    geometry: [
      [pickup.lat, pickup.lng],
      [destination.lat, destination.lng]
    ]
  }
}

/* =========================
   SAFETY
========================= */

const generateSafetyCode = () => crypto.randomInt(1000, 10000).toString()

const canAccessRide = (ride, user) => {
  if (!ride || !user) return false
  if (user.role === "admin") return true

  const uid = String(user._id)
  return String(ride.userId) === uid || String(ride.driverId) === uid
}

/* =========================
   CREATE RIDE
========================= */

router.post("/", authMiddleware, requireVerified, async (req, res) => {
  try {
    const { pickup, destination, price, rideMode, busZone, vehicleType, paymentMethod } = req.body

    if (!pickup || !destination || !price) {
      return res.status(400).json({ message: "pickup, destination et price requis" })
    }

    const validation = validateLocationPair(pickup, destination)
    if (!validation.valid) {
      return res.status(400).json({ message: "Localisation invalide" })
    }

    const isBus = rideMode === "bus_student"
    const finalPrice = isBus
      ? computeStudentBusFare(normalizeStudentBusZone(busZone))
      : computeRideFare(req.body.distanceKm, req.body.durationMin)

    const ride = await Ride.create({
      userId: req.user._id,
      pickup: validation.pickup,
      destination: validation.destination,
      price: finalPrice,
      vehicleType: vehicleType || "YOONWI Classic",
      rideCategory: isBus ? "bus_student" : "standard",
      busZone: isBus ? normalizeStudentBusZone(busZone) : "",
      paymentMethod: paymentMethod || "Cash",
      safetyCode: generateSafetyCode(),
      status: "pending"
    })

    return res.status(201).json(ride)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

/* =========================
   DRIVER ACCEPT RIDE
========================= */

router.patch("/:id/accept", authMiddleware, requireVerified, requireRole("driver"), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvée" })

    if (ride.status !== "pending") {
      return res.status(400).json({ message: "Course non disponible" })
    }

    ride.status = "accepted"
    ride.driverId = req.user._id

    await ride.save()

    await createNotification({
      userId: ride.userId,
      title: "Course acceptée",
      message: "Un chauffeur a accepté votre course",
      category: "success",
      link: `/ride/${ride._id}`
    })

    if (ride.driverId) {
      socketManager.emitToUser(ride.userId, "ride:status-update", {
        rideId: ride._id,
        status: "accepted"
      })

      socketManager.emitToUser(ride.driverId, "ride:status-update", {
        rideId: ride._id,
        status: "accepted"
      })
    }

    return res.json(ride)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

/* =========================
   START RIDE
========================= */

router.patch("/:id/start", authMiddleware, requireVerified, requireRole("driver"), async (req, res) => {
  try {
    const { safetyCode } = req.body

    const ride = await Ride.findById(req.params.id).select("+safetyCode")
    if (!ride) return res.status(404).json({ message: "Course non trouvée" })

    if (String(ride.driverId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Non autorisé" })
    }

    if (ride.safetyCode !== safetyCode) {
      return res.status(403).json({ message: "Code invalide" })
    }

    ride.status = "ongoing"
    await ride.save()

    return res.json(ride)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

module.exports = router