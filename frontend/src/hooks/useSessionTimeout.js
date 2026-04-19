/**
 * Session Timeout Hook
 * Logs out user after 30 minutes of inactivity
 */

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const WARNING_TIME = 25 * 60 * 1000 // Show warning at 25 minutes

export const useSessionTimeout = () => {
  const { logout, user } = useAuth()

  useEffect(() => {
    if (!user) return

    let timeoutId
    let warningTimeoutId
    let activityListener

    const resetTimeout = () => {
      // Clear existing timeouts
      if (timeoutId) clearTimeout(timeoutId)
      if (warningTimeoutId) clearTimeout(warningTimeoutId)

      // Set warning timeout (at 25 minutes)
      warningTimeoutId = setTimeout(() => {
        console.warn('Session expiring soon')
        // Could trigger a toast notification here
      }, WARNING_TIME)

      // Set logout timeout (at 30 minutes)
      timeoutId = setTimeout(() => {
        console.log('Session expired due to inactivity')
        logout()
      }, SESSION_TIMEOUT)
    }

    // Activity events to monitor
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    // Add event listeners
    const handleActivity = () => {
      resetTimeout()
    }

    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Initialize timeout
    resetTimeout()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutId) clearTimeout(timeoutId)
      if (warningTimeoutId) clearTimeout(warningTimeoutId)
    }
  }, [user, logout])
}

export default useSessionTimeout
