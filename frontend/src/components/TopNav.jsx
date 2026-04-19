import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import LanguageSelector from "./LanguageSelector"

const TopNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Fonction pour aller en arrière
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate("/")
    }
  }

  // Déterminer si afficher le bouton retour (pas sur la page d'accueil)
  const showBackButton = location.pathname !== "/" && location.pathname !== "/login"

  if (!user) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-[9998] px-3 sm:px-4 pt-3 sm:pt-4">
      <div className="ndar-shell">
        <div className="ndar-panel flex items-center justify-between rounded-b-[20px] border border-[#d7ae49]/30 px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-xl bg-gradient-to-b from-[#1a1f2e] to-[#0f1419]">
          {/* Left: Back Button + Logo + App Name */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={goBack}
                className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-[#2a3f5f]/40 hover:bg-[#3a5f7f]/60 transition-colors border border-[#d7ae49]/20"
                title="Retour"
              >
                <span className="text-lg sm:text-xl">←</span>
              </button>
            )}

            {/* Logo + App Name */}
            <div 
              onClick={() => navigate("/")}
              className="cursor-pointer flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-2xl sm:text-3xl">🚗</div>
              <div className="font-['Sora'] text-base sm:text-xl font-extrabold text-[#d7ae49] hover:text-[#e8c45f] transition-colors whitespace-nowrap">
                YOON WI
              </div>
            </div>
          </div>

          {/* Right: Language Selector + User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* User Profile Button */}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 sm:gap-3 rounded-full bg-[#2a3f5f]/40 hover:bg-[#3a5f7f]/60 px-2 sm:px-4 py-2 transition-colors border border-[#d7ae49]/20 flex-shrink-0"
            >
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt={user.fullName}
                  className="w-7 sm:w-8 h-7 sm:h-8 rounded-full object-cover border border-[#d7ae49]"
                />
              )}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-[#fff7ec]">{user.fullName?.split(' ')[0]}</span>
                <span className="text-xs text-[#d7ae49]">{user.role === 'client' ? 'Client' : user.role === 'driver' ? 'Chauffeur' : user.role === 'technician' ? 'Technicien' : 'Administrateur'}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default TopNav
