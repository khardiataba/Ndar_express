/**
 * Enhanced Socket.io handlers for YOON WI
 * Complete real-time features: location tracking, ride matching, chat
 */

const Ride = require('../models/Ride')
const User = require('../models/User')

class SocketHandlers {
  constructor(socketManager) {
    this.socketManager = socketManager
  }

  /**
   * Emit to specific user
   */
  emitToUser(userId, event, data) {
    const socketId = this.socketManager.connectedUsers.get(userId.toString())
    if (socketId) {
      this.socketManager.io.to(socketId).emit(event, data)
    }
  }

  /**
   * Broadcast to all connected drivers
   */
  broadcastToDrivers(event, data) {
    this.socketManager.activeDrivers.forEach((driver) => {
      this.socketManager.io.to(driver.socketId).emit(event, data)
    })
  }

  /**
   * Complete ride setup with proper status tracking
   */
  async setupRideConnection(rideId, passengerId, driverId) {
    try {
      const ride = await Ride.findById(rideId)
      if (!ride) return

      const rideRoom = `ride:${rideId}`
      const passengerSocket = this.socketManager.connectedUsers.get(passengerId.toString())
      const driverSocket = this.socketManager.connectedUsers.get(driverId.toString())

      if (passengerSocket) {
        this.socketManager.io.sockets.sockets.get(passengerSocket)?.join(rideRoom)
      }
      if (driverSocket) {
        this.socketManager.io.sockets.sockets.get(driverSocket)?.join(rideRoom)
      }

      this.socketManager.activeRides.set(rideId.toString(), {
        passengerSocket,
        driverSocket,
        status: 'active',
        startTime: Date.now()
      })
    } catch (error) {
      console.error('Setup ride connection error:', error)
    }
  }

  /**
   * Handle ride matching - find nearby drivers
   */
  async findNearbyDrivers(pickupLocation, maxDistance = 5) {
    try {
      const drivers = Array.from(this.socketManager.activeDrivers.values()).filter((driver) => {
        if (!driver.location) return false
        const distance = this.calculateDistance(pickupLocation, driver.location)
        return distance <= maxDistance
      })

      return drivers.sort((a, b) => {
        const distA = this.calculateDistance(pickupLocation, a.location)
        const distB = this.calculateDistance(pickupLocation, b.location)
        return distA - distB
      })
    } catch (error) {
      console.error('Find nearby drivers error:', error)
      return []
    }
  }

  /**
   * Haversine distance calculation
   */
  calculateDistance(loc1, loc2) {
    const toRad = (x) => (x * Math.PI) / 180
    const R = 6371 // km
    const dLat = toRad(loc2.latitude - loc1.latitude)
    const dLng = toRad(loc2.longitude - loc1.longitude)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) * Math.cos(toRad(loc2.latitude)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  /**
   * Notify ride participants of status change
   */
  notifyRideParticipants(rideId, event, data) {
    const rideRoom = `ride:${rideId}`
    this.socketManager.io.to(rideRoom).emit(event, {
      rideId,
      timestamp: new Date(),
      ...data
    })
  }

  /**
   * Handle driver location update with broadcast
   */
  async broadcastDriverLocation(driverId, location) {
    try {
      // Find all active rides with this driver
      for (const [rideId, rideData] of this.socketManager.activeRides.entries()) {
        const ride = await Ride.findById(rideId)
        if (ride && ride.driverId?.toString() === driverId.toString()) {
          this.notifyRideParticipants(rideId, 'driver:location-update', {
            driverId,
            location,
            updatedAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Broadcast driver location error:', error)
    }
  }

  /**
   * Handle chat messages between participants
   */
  async handleChat(rideId, senderId, message) {
    try {
      const ride = await Ride.findById(rideId)
      if (!ride) return

      // Validate sender is participant
      if (
        senderId.toString() !== ride.userId?.toString() &&
        senderId.toString() !== ride.driverId?.toString()
      ) {
        return false
      }

      this.notifyRideParticipants(rideId, 'chat:message', {
        rideId,
        senderId,
        message: String(message).slice(0, 500),
        timestamp: new Date()
      })

      return true
    } catch (error) {
      console.error('Handle chat error:', error)
      return false
    }
  }

  /**
   * Clean up after ride completion
   */
  cleanupRide(rideId) {
    const rideRoom = `ride:${rideId}`
    this.socketManager.io.to(rideRoom).emit('ride:completed', {
      rideId,
      message: 'Ride has been completed',
      timestamp: new Date()
    })

    this.socketManager.activeRides.delete(rideId.toString())
  }

  /**
   * Update driver online status in database
   */
  async updateDriverStatus(driverId, isOnline, location = null) {
    try {
      const user = await User.findById(driverId)
      if (!user) return

      user.isOnline = isOnline
      user.lastSeen = new Date()
      if (location) {
        user.currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          updatedAt: new Date()
        }
      }

      await user.save()
    } catch (error) {
      console.error('Update driver status error:', error)
    }
  }

  /**
   * Emergency SOS alert
   */
  async handleEmergency(rideId, userId, message) {
    try {
      const ride = await Ride.findById(rideId)
      if (!ride) return

      const otherPartyId =
        userId.toString() === ride.userId?.toString() ? ride.driverId : ride.userId

      // Notify the other party
      this.emitToUser(otherPartyId, 'emergency:alert', {
        rideId,
        alertedBy: userId,
        message,
        location: ride.destination,
        timestamp: new Date()
      })

      // Log emergency
      console.error(`🚨 EMERGENCY on ride ${rideId}: ${message}`)

      return true
    } catch (error) {
      console.error('Handle emergency error:', error)
      return false
    }
  }
}

module.exports = SocketHandlers
