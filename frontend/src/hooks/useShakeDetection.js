import { useEffect, useState, useCallback, useRef } from "react"
import { useToast } from "../context/ToastContext"

const SHAKE_THRESHOLD = 18
const MIN_SHAKE_INTERVAL_MS = 450
const SHAKE_WINDOW_MS = 4000
const REQUIRED_SHAKES = 3
const AUTO_SOS_COUNTDOWN = 8

const useShakeDetection = (onShakeConfirmed) => {
  const { showToast } = useToast()
  const callbackRef = useRef(onShakeConfirmed)
  const lastShakeTimeRef = useRef(0)
  const recentShakesRef = useRef([])
  const intervalRef = useRef(null)

  const [shakeDetected, setShakeDetected] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_SOS_COUNTDOWN)

  useEffect(() => {
    callbackRef.current = onShakeConfirmed
  }, [onShakeConfirmed])

  const clearShake = useCallback(() => {
    setShakeDetected(false)
    setCountdown(AUTO_SOS_COUNTDOWN)
    recentShakesRef.current = []
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const confirmShake = useCallback(() => {
    if (typeof callbackRef.current === "function") {
      callbackRef.current()
    }
    clearShake()
  }, [clearShake])

  useEffect(() => {
    if (!shakeDetected) return

    intervalRef.current = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          confirmShake()
          return AUTO_SOS_COUNTDOWN
        }
        return current - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [confirmShake, shakeDetected])

  const handleMotion = useCallback(
    (event) => {
      if (shakeDetected) return

      const { accelerationIncludingGravity } = event || {}
      if (!accelerationIncludingGravity) return

      const { x = 0, y = 0, z = 0 } = accelerationIncludingGravity
      const gForce = Math.sqrt(x * x + y * y + z * z) - 9.8
      const now = Date.now()

      if (Math.abs(gForce) < SHAKE_THRESHOLD) return
      if (now - lastShakeTimeRef.current < MIN_SHAKE_INTERVAL_MS) return

      lastShakeTimeRef.current = now
      recentShakesRef.current = [...recentShakesRef.current, now].filter((timestamp) => now - timestamp <= SHAKE_WINDOW_MS)

      if (recentShakesRef.current.length >= REQUIRED_SHAKES) {
        setShakeDetected(true)
        setCountdown(AUTO_SOS_COUNTDOWN)
        showToast("Mouvement suspect detecte. SOS dans 8s si non annule.", "warning")
      }
    },
    [shakeDetected, showToast]
  )

  useEffect(() => {
    if (typeof window === "undefined") return undefined
    if (typeof DeviceMotionEvent === "undefined") return undefined

    let mounted = true

    const attach = () => window.addEventListener("devicemotion", handleMotion)

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      DeviceMotionEvent.requestPermission()
        .then((permission) => {
          if (mounted && permission === "granted") {
            attach()
          }
        })
        .catch(() => {})
    } else {
      attach()
    }

    return () => {
      mounted = false
      window.removeEventListener("devicemotion", handleMotion)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [handleMotion])

  return { shakeDetected, countdown, clearShake, confirmShake }
}

export default useShakeDetection
export { useShakeDetection }
