const express = require("express")
const crypto = require("crypto")
const Ride = require("../models/Ride")
const Message = require("../models/Message")
const User = require("../models/User")
const socketManager = require("../socket/socketManager")
const { authMiddleware, requireRole, requireVerified } = require("../middleware/auth")
const { computeRideFare, computeStudentBusFare, normalizeStudentBusZone, rideCommission } = require("../utils/pricing")
const { createNotification } = require("../services/notificationService")
const googleMapsService = require("../services/googleMapsService")
const { validateLocation, validateLocationPair } = require("../utils/locationValidation")

const router = express.Router()
const objectIdRegex = /^[0-9a-fA-F]{24}$/
const commissionCreditMessage =
  "Credit commission insuffisant. Rechargez par Wave ou Orange Money au 781488070, puis attendez la validation admin."

const validateRideId = (req, res, next) => {
  if (!objectIdRegex.test(String(req.params.id || ""))) {
    return res.status(400).json({ message: "Identifiant de course invalide" })
  }
  next()
}

const haversineDistanceKm = (pickup, destination) => {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(destination.lat - pickup.lat)
  const dLng = toRadians(destination.lng - pickup.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pickup.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

const buildRouteEstimate = async (pickup, destination) => {
  const route = await googleMapsService.calculateRoute(pickup, destination, { mode: "driving" })
  if (!route.success) return buildFallbackEstimate(pickup, destination)

  const distanceKm = Math.max(0.1, Math.round((Number(route.distance?.value || 0) / 1000) * 10) / 10)
  const durationMin = Math.max(1, Math.round(Number(route.duration?.value || 0) / 60))
  const fallback = buildFallbackEstimate(pickup, destination)

  return {
    distanceKm,
    durationMin,
    geometry: Array.isArray(route.geometry) && route.geometry.length > 1 ? route.geometry : fallback.geometry
  }
}

const enrichLocationAddress = async (location, fallbackName) => {
  const genericAddress = /position|gps|actuelle|confirm/i.test(String(location?.address || location?.name || ""))
  if (!genericAddress) return location

  const result = await googleMapsService.reverseGeocode(location.lat, location.lng)
  if (!result.success) return location

  return {
    ...location,
    name: result.name || fallbackName || location.name,
    address: result.address || location.address
  }
}

const generateSafetyCode = () => crypto.randomInt(1000, 10000).toString()

const canAccessRide = (ride, user) => {
  if (!ride || !user) return false
  if (user.role === "admin") return true

  const userId = String(user._id)
  return String(ride.userId?._id || ride.userId || "") === userId || String(ride.driverId?._id || ride.driverId || "") === userId
}

const ensurePositiveCommissionCredit = (user) => {
  const balance = Math.round(Number(user?.commissionCreditBalance || 0))
  if (balance <= 0) {
    return {
      ok: false,
      balance,
      message: commissionCreditMessage
    }
  }
  return { ok: true, balance }
}

const normalizePaymentMethod = (value) => {
  const method = String(value || "Cash").trim()
  return ["Cash", "Wave", "OM", "Card"].includes(method) ? method : "Cash"
}

const serializeRide = (ride, user) => {
  const plain = typeof ride?.toObject === "function" ? ride.toObject() : { ...ride }
  const viewerId = String(user?._id || "")
  const isClient = String(plain.userId?._id || plain.userId || "") === viewerId

  if (!isClient && user?.role !== "admin") {
    delete plain.safetyCode
  }

  plain.driver = plain.driverId && typeof plain.driverId === "object" ? plain.driverId : null
  plain.client = plain.userId && typeof plain.userId === "object" ? plain.userId : null

  return plain
}

const findRideForViewer = async (rideId, user, includeSafetyCode = false) => {
  const query = Ride.findById(rideId)
    .populate("userId", "name firstName lastName phone profilePhotoUrl")
    .populate("driverId", "name firstName lastName phone profilePhotoUrl rating providerDetails currentLocation")

  if (includeSafetyCode) query.select("+safetyCode")

  const ride = await query
  if (!ride) return null
  if (!canAccessRide(ride, user)) return false
  return ride
}

router.post("/estimate", authMiddleware, requireVerified, async (req, res) => {
  try {
    const { pickup, destination, rideMode, busZone } = req.body || {}
    const validation = validateLocationPair(pickup, destination)
    if (!validation.valid) {
      return res.status(400).json({ message: "Localisation invalide" })
    }

    const estimate = await buildRouteEstimate(validation.pickup, validation.destination)
    const isBus = rideMode === "bus_student"
    const suggestedPrice = isBus
      ? computeStudentBusFare(normalizeStudentBusZone(busZone))
      : computeRideFare(estimate.distanceKm, estimate.durationMin)
    const commission = rideCommission(suggestedPrice)

    return res.json({
      ...estimate,
      suggestedPrice,
      ...commission
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.post("/", authMiddleware, requireVerified, async (req, res) => {
  try {
    const { pickup, destination, rideMode, busZone, vehicleType, paymentMethod } = req.body || {}

    const validation = validateLocationPair(pickup, destination)
    if (!validation.valid) {
      return res.status(400).json({ message: "Localisation invalide" })
    }

    const isBus = rideMode === "bus_student"
    const estimate = await buildRouteEstimate(validation.pickup, validation.destination)
    const finalPrice = isBus
      ? computeStudentBusFare(normalizeStudentBusZone(busZone))
      : computeRideFare(estimate.distanceKm, estimate.durationMin)

    if (!Number.isFinite(Number(finalPrice)) || Number(finalPrice) <= 0) {
      return res.status(400).json({ message: "Tarif de course invalide" })
    }

    const commission = rideCommission(finalPrice)
    const ride = await Ride.create({
      userId: req.user._id,
      pickup: validation.pickup,
      destination: validation.destination,
      price: finalPrice,
      ...commission,
      vehicleType: vehicleType || "YOONWI Classic",
      rideCategory: isBus ? "bus_student" : "standard",
      busZone: isBus ? normalizeStudentBusZone(busZone) : "",
      paymentMethod: normalizePaymentMethod(paymentMethod),
      distanceKm: estimate.distanceKm,
      durationMin: estimate.durationMin,
      routeGeometry: Array.isArray(req.body?.routeGeometry) && req.body.routeGeometry.length ? req.body.routeGeometry : estimate.geometry,
      safetyCode: generateSafetyCode(),
      status: "pending"
    })

    if (typeof socketManager.emitNewRideRequest === "function") {
      socketManager.emitNewRideRequest(
        ride,
        { latitude: ride.pickup.lat, longitude: ride.pickup.lng },
        ride.vehicleType
      )
    }

    return res.status(201).json(serializeRide(ride, req.user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.get("/available", authMiddleware, requireVerified, requireRole("driver"), async (req, res) => {
  try {
    const rides = await Ride.find({ status: "pending" }).sort({ createdAt: -1 })
    return res.json(rides.map((ride) => serializeRide(ride, req.user)))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.get("/", authMiddleware, requireVerified, async (req, res) => {
  try {
    const filter =
      req.user.role === "driver"
        ? { driverId: req.user._id }
        : req.user.role === "admin"
          ? {}
          : { userId: req.user._id }

    const rides = await Ride.find(filter).sort({ createdAt: -1 })
    return res.json(rides.map((ride) => serializeRide(ride, req.user)))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.get("/:id", authMiddleware, requireVerified, validateRideId, async (req, res) => {
  try {
    const ride = await findRideForViewer(req.params.id, req.user, true)
    if (ride === false) return res.status(403).json({ message: "Acces non autorise" })
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })

    return res.json(serializeRide(ride, req.user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.patch("/:id/accept", authMiddleware, requireVerified, requireRole("driver"), validateRideId, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })

    if (ride.status !== "pending") {
      return res.status(400).json({ message: "Course non disponible" })
    }

    const creditStatus = ensurePositiveCommissionCredit(req.user)
    if (!creditStatus.ok) {
      return res.status(402).json(creditStatus)
    }

    if (!Number.isFinite(Number(ride.appCommissionAmount)) || Number(ride.appCommissionAmount) <= 0) {
      const commission = rideCommission(ride.price)
      ride.appCommissionPercent = commission.appCommissionPercent
      ride.appCommissionAmount = commission.appCommissionAmount
      ride.providerNetAmount = commission.providerNetAmount
    }

    ride.status = "accepted"
    ride.driverAvailabilityStatus = "driver_assigned"
    ride.driverId = req.user._id
    await ride.save()

    await createNotification({
      userId: ride.userId,
      title: "Course acceptee",
      message: "Un chauffeur a accepte votre course",
      category: "success",
      link: `/ride/${ride._id}`
    })

    socketManager.emitToUser(ride.userId, "ride:status-update", {
      rideId: ride._id,
      status: "accepted",
      driverId: req.user._id
    })

    socketManager.emitToUser(ride.driverId, "ride:status-update", {
      rideId: ride._id,
      status: "accepted"
    })

    return res.json(serializeRide(ride, req.user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.patch("/:id/start", authMiddleware, requireVerified, requireRole("driver"), validateRideId, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).select("+safetyCode")
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })

    if (String(ride.driverId || "") !== String(req.user._id || "")) {
      return res.status(403).json({ message: "Non autorise" })
    }

    if (ride.status !== "accepted") {
      return res.status(400).json({ message: "La course doit d'abord etre acceptee" })
    }

    if (String(ride.safetyCode || "") !== String(req.body?.safetyCode || "").trim()) {
      return res.status(403).json({ message: "Code invalide" })
    }

    ride.status = "ongoing"
    ride.safetyCodeVerifiedAt = new Date()
    await ride.save()

    socketManager.emitToUser(ride.userId, "ride:status-update", {
      rideId: ride._id,
      status: "ongoing"
    })

    return res.json(serializeRide(ride, req.user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.patch("/:id/driver-location", authMiddleware, requireVerified, requireRole("driver"), validateRideId, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })

    if (String(ride.driverId || "") !== String(req.user._id || "")) {
      return res.status(403).json({ message: "Cette course ne vous est pas attribuee" })
    }

    const validation = validateLocation(req.body?.location)
    if (!validation.valid) {
      return res.status(400).json({ message: "Localisation chauffeur invalide" })
    }

    ride.currentDriverLocation = await enrichLocationAddress(validation.location, "Position chauffeur")
    await ride.save()

    socketManager.emitToUser(ride.userId, "driver:location-update", {
      rideId: ride._id,
      driverId: req.user._id,
      location: ride.currentDriverLocation
    })

    return res.json({
      success: true,
      currentDriverLocation: ride.currentDriverLocation
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.patch("/:id/complete", authMiddleware, requireVerified, requireRole("driver"), validateRideId, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })

    if (String(ride.driverId || "") !== String(req.user._id || "")) {
      return res.status(403).json({ message: "Cette course ne vous est pas attribuee" })
    }

    if (ride.status !== "ongoing") {
      return res.status(400).json({ message: "La course doit etre en cours avant cloture" })
    }

    if (ride.paymentStatus !== "paid") {
      return res.status(400).json({ message: "Le client doit regler la course avant la cloture" })
    }

    if (!ride.appCommissionDebitedAt) {
      const commissionAmount = Math.max(0, Math.round(Number(ride.appCommissionAmount || 0)))
      const driver = await User.findById(ride.driverId)
      if (driver) {
        driver.commissionCreditBalance = Math.round(Number(driver.commissionCreditBalance || 0)) - commissionAmount
        driver.commissionCreditUpdatedAt = new Date()
        await driver.save()
      }
      ride.appCommissionDebitedAt = new Date()
    }

    ride.status = "completed"
    await ride.save()

    socketManager.emitToUser(ride.userId, "ride:status-update", {
      rideId: ride._id,
      status: "completed"
    })

    return res.json(serializeRide(ride, req.user))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.post("/:id/safety-report", authMiddleware, requireVerified, validateRideId, async (req, res) => {
  try {
    const { type = "incident", message = "", location = {} } = req.body || {}
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })

    if (!canAccessRide(ride, req.user)) {
      return res.status(403).json({ message: "Acces non autorise" })
    }

    ride.safetyReports.push({
      type,
      message: String(message).slice(0, 500),
      createdByRole: req.user.role,
      location: {
        name: location.name || "Position inconnue",
        address: location.address || location.name || "",
        lat: location.lat ?? null,
        lng: location.lng ?? null
      }
    })

    await ride.save()

    const targetUserId = String(ride.userId || "") === String(req.user._id || "") ? ride.driverId : ride.userId
    const targetUser = targetUserId ? await User.findById(targetUserId) : null
    if (targetUser) {
      targetUser.safetyReportsCount = (targetUser.safetyReportsCount || 0) + 1
      targetUser.safetyLastReportAt = new Date()
      if (targetUser.safetyReportsCount >= 3) {
        const reportReason = "Suspension automatique apres plusieurs signalements de securite."
        targetUser.status = "suspended"
        targetUser.safetySuspendedAt = new Date()
        targetUser.safetySuspensionReason = reportReason
        targetUser.reviewNote = reportReason
      }
      await targetUser.save()
    }

    if (targetUserId) {
      socketManager.emitToUser(targetUserId, "emergency:alert", {
        rideId: ride._id,
        type,
        message: String(message).slice(0, 500)
      })
    }

    return res.json({
      message: "Signalement envoye",
      reportsCount: ride.safetyReports.length,
      targetStatus: targetUser?.status || null,
      targetReportsCount: targetUser?.safetyReportsCount || null,
      suspended: targetUser?.status === "suspended" || false
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.get("/:id/messages", authMiddleware, requireVerified, validateRideId, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })
    if (!canAccessRide(ride, req.user)) {
      return res.status(403).json({ message: "Acces non autorise" })
    }

    const messages = await Message.find({ rideId: req.params.id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name firstName lastName profilePhotoUrl")

    return res.json(messages)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

router.post("/:id/messages", authMiddleware, requireVerified, validateRideId, async (req, res) => {
  try {
    const content = String(req.body?.content || "").trim()
    if (!content) {
      return res.status(400).json({ message: "Le message ne peut pas etre vide" })
    }

    const ride = await Ride.findById(req.params.id)
    if (!ride) return res.status(404).json({ message: "Course non trouvee" })
    if (!canAccessRide(ride, req.user)) {
      return res.status(403).json({ message: "Acces non autorise" })
    }

    if (!["accepted", "ongoing", "completed"].includes(String(ride.status || ""))) {
      return res.status(400).json({ message: "Conversation non disponible pour ce statut" })
    }

    const message = await Message.create({
      rideId: ride._id,
      senderId: req.user._id,
      senderRole: req.user.role,
      content: content.slice(0, 1000)
    })

    const populated = await message.populate("senderId", "name firstName lastName profilePhotoUrl")
    return res.status(201).json(populated)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: "Erreur serveur" })
  }
})

module.exports = router
