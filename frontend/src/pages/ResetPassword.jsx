import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useToast } from '../context/ToastContext'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      showToast('Tous les champs sont requis', 'error')
      return
    }

    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error')
      return
    }

    if (password.length < 8) {
      showToast('Le mot de passe doit contenir au moins 8 caractères', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      showToast('Mot de passe réinitialisé avec succès!', 'success')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Erreur lors de la réinitialisation', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-6">
          Réinitialiser le mot de passe
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165c96] focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmez le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#165c96] focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#165c96] text-white py-2 px-4 rounded-lg font-semibold hover:bg-[#0d4273] transition disabled:opacity-50"
          >
            {loading ? 'Traitement...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Souvenir de votre mot de passe?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-[#165c96] hover:underline font-semibold"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
