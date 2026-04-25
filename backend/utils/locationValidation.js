/**
 * Location Validation & Sanitization
 */

const isValidCoordinate = (value) => {
  const num = Number(value)
  return Number.isFinite(num) && !Number.isNaN(num)
}

const isValidLatitude = (lat) => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90
}

const isValidLongitude = (lng) => {
  return isValidCoordinate(lng) && lng >= -180 && lng <= 180
}

/**
 * Saint-Louis, Senegal bounds
 * Approximate service area
 */
const SERVICE_AREA_BOUNDS = {
  minLat: 16.0,  // North
  maxLat: 16.1,  // South
  minLng: -16.6, // West
  maxLng: -16.4  // East
}

const isInServiceArea = (lat, lng) => {
  return (
    lat >= SERVICE_AREA_BOUNDS.minLat &&
    lat <= SERVICE_AREA_BOUNDS.maxLat &&
    lng >= SERVICE_AREA_BOUNDS.minLng &&
    lng <= SERVICE_AREA_BOUNDS.maxLng
  )
}

const validateLocation = (location, options = {}) => {
  const { checkServiceArea = false } = options
  const errors = []

  if (!location) {
    errors.push("Location is required")
    return { valid: false, errors }
  }

  if (location.lat == null || location.lng == null) {
    errors.push("Latitude and longitude are required")
    return { valid: false, errors }
  }

  if (!isValidLatitude(location.lat)) {
    errors.push("Invalid latitude (must be between -90 and 90)")
  }

  if (!isValidLongitude(location.lng)) {
    errors.push("Invalid longitude (must be between -180 and 180)")
  }

  if (checkServiceArea && !isInServiceArea(location.lat, location.lng)) {
    errors.push("Location is outside service area")
  }

  return {
    valid: errors.length === 0,
    errors,
    location: errors.length === 0 ? {
      name: String(location.name || location.address || "Location").trim().slice(0, 200),
      address: String(location.address || location.name || "").trim().slice(0, 200),
      lat: Number(location.lat),
      lng: Number(location.lng)
    } : null
  }
}

const validateLocationPair = (pickup, destination) => {
  const pickupValidation = validateLocation(pickup, { checkServiceArea: true })
  const destinationValidation = validateLocation(destination, { checkServiceArea: true })

  const allErrors = [
    ...pickupValidation.errors.map(e => `Pickup: ${e}`),
    ...destinationValidation.errors.map(e => `Destination: ${e}`)
  ]

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors }
  }

  // Check distance is reasonable (max 50km)
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const distance = haversine(
    pickupValidation.location.lat,
    pickupValidation.location.lng,
    destinationValidation.location.lat,
    destinationValidation.location.lng
  )

  if (distance < 0.1) {
    return { valid: false, errors: ["Pickup and destination are too close (min 100m)"] }
  }

  if (distance > 50) {
    return { valid: false, errors: ["Distance exceeds service area (max 50km)"] }
  }

  return {
    valid: true,
    errors: [],
    pickup: pickupValidation.location,
    destination: destinationValidation.location,
    distanceKm: distance
  }
}

module.exports = {
  isValidLatitude,
  isValidLongitude,
  isInServiceArea,
  validateLocation,
  validateLocationPair,
  SERVICE_AREA_BOUNDS
}
