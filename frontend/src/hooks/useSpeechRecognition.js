import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Hook personnalisé pour la reconnaissance vocale
 * Supportée par: Chrome, Edge, Safari, Firefox
 * Utilise l'API Web Speech
 */
export default function useSpeechRecognition() {
  const { i18n } = useTranslation()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const isMountedRef = useRef(false)

  // Vérifier le support au montage
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
    
    return () => {
      isMountedRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Reconnaissance vocale non supportée sur ce navigateur')
      return
    }

    try {
      // Arrêter toute reconnaissance en cours
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      // Configurer selon la langue
      const langCode =
        i18n.language === 'wo'
          ? 'wo-SN' // Wolof Sénégal
          : i18n.language === 'en'
          ? 'en-US'
          : 'fr-FR' // Français défaut

      recognition.lang = langCode
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      let interimTranscript = ''

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setIsListening(true)
          setError(null)
          setTranscript('')
        }
      }

      recognition.onresult = (event) => {
        if (!isMountedRef.current) return
        
        interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + transcript + ' ')
          } else {
            interimTranscript += transcript
          }
        }

        // Afficher résultat intermédiaire
        if (interimTranscript) {
          setTranscript((prev) => {
            const lastFinal = prev
            return lastFinal + interimTranscript
          })
        }
      }

      recognition.onerror = (event) => {
        if (!isMountedRef.current) return
        
        const errorMessages = {
          'network-error': 'Erreur reseau. Verifiez votre connexion.',
          'no-speech': 'Pas de son detecte. Essayez encore.',
          'audio-capture': 'Pas d\'acces au microphone.',
          'not-allowed': 'Permission micro refusee.',
          'service-not-allowed': 'Service non autorise.',
          'no-permission': 'Permissions insuffisantes.',
          'aborted': 'Enregistrement annule.'
        }

        setError(errorMessages[event.error] || `Erreur: ${event.error}`)
        if (isMountedRef.current) {
          setIsListening(false)
        }
      }

      recognition.onend = () => {
        if (isMountedRef.current) {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('SpeechRecognition error:', err)
      if (isMountedRef.current) {
        setError('Erreur initialisation: ' + err.message)
        setIsListening(false)
      }
    }
  }, [i18n.language, isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      if (isMountedRef.current) {
        setIsListening(false)
      }
    }
  }, [])

  const resetTranscript = useCallback(() => {
    if (isMountedRef.current) {
      setTranscript('')
      setError(null)
    }
  }, [])

  return {
    startListening,
    stopListening,
    resetTranscript,
    transcript,
    isListening,
    error,
    isSupported,
    setTranscript // Pour permettre des modifications manuelles
  }
}
