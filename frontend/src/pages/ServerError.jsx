import React from 'react'
import { useNavigate } from 'react-router-dom'

const ServerError = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-7xl font-bold text-red-500 mb-4">500</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Erreur serveur</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Une erreur est survenue. Nos équipes travaillent pour résoudre le problème. Réessayez dans quelques moments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-[#165c96] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0d4273] transition"
          >
            Accueil
          </button>
          <button
            onClick={() => window.location.reload()}
            className="border-2 border-[#165c96] text-[#165c96] px-8 py-3 rounded-lg font-semibold hover:bg-[#f0f8ff] transition"
          >
            Rafraîchir
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerError
