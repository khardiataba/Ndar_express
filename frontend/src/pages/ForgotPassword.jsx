import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useToast } from '../context/ToastContext'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      showToast('Email est requis', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
      showToast('Si l\'email existe dans nos registres, vous recevrez un lien de réinitialisation', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || 'Une erreur s\'est produite', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <div className="text-4xl mb-4">OK</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vérifiez votre email</h1>
          <p className="text-gray-600 mb-6">
            Si le compte existe, vous recevrez un lien de réinitialisation du mot de passe à <strong>{email}</strong>
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#165c96] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d4273] transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-6">
          Réinitialiser votre mot de passe
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165c96] focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#165c96] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d4273] transition disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-gray-600">
            Souvenir de votre mot de passe?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#165c96] hover:underline font-semibold"
            >
              Se connecter
            </button>
          </p>
          <p className="text-center text-sm text-gray-600">
            Pas de compte?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-[#165c96] hover:underline font-semibold"
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

