import { NavLink, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { notificationAPI } from "../api"

const mainItems = [
  { to: "/", label: "Accueil", iconSymbol: "🏠" },
  { to: "/service", label: "Services", iconSymbol: "🧰" },
  { to: "/ride", label: "Courses", iconSymbol: "🚗" }
]

const menuItems = [
  { to: "/rental", label: "Locations", iconSymbol: "🚗" },
  { to: "/notifications", label: "Notifications", iconSymbol: "🔔" },
  { to: "/support", label: "Support", iconSymbol: "💬" },
  { to: "/mybookings", label: "Mes réservations", iconSymbol: "📋" },
  { to: "/profile", label: "Mon profil", iconSymbol: "👤" }
]

const BottomNav = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount()
      setUnreadCount(response.data.unreadCount || 0)
    } catch (err) {
      console.warn('Impossible de recuperer le compteur de notifications:', err)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchUnreadCount()
    const handleNotificationEvent = () => fetchUnreadCount()
    window.addEventListener('notification:new', handleNotificationEvent)
    return () => window.removeEventListener('notification:new', handleNotificationEvent)
  }, [user])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] px-3 sm:px-4 pb-3 sm:pb-4">
      <div className="ndar-shell">
        <div className="ndar-panel flex items-center justify-around rounded-[30px] border border-[#d7ae49]/40 px-1 sm:px-2 py-2 sm:py-3 backdrop-blur-xl bg-gradient-to-b from-[#1a1f2e] to-[#0f1419]">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setShowMenu(false)}
              className={({ isActive }) =>
                `flex min-w-[60px] sm:min-w-[72px] flex-col items-center gap-1 rounded-2xl px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] font-semibold transition-all ${
                  isActive ? "bg-[#d7ae49]/30 text-[#ffd700] shadow-[inset_0_1px_0_rgba(215,174,73,0.3)]" : "text-[#e8f0ff] hover:bg-[#3a5f7f]/60 hover:text-[#ffd700]"
                }`
              }
            >
              <span className="text-base sm:text-lg leading-none">{item.iconSymbol}</span>
              <span className="line-clamp-1">{item.label}</span>
            </NavLink>
          ))}

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex min-w-[60px] sm:min-w-[72px] flex-col items-center gap-1 rounded-2xl px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] font-semibold transition-all ${
                showMenu ? "bg-[#d7ae49]/30 text-[#ffd700] shadow-[inset_0_1px_0_rgba(215,174,73,0.3)]" : "text-[#e8f0ff] hover:bg-[#3a5f7f]/60 hover:text-[#ffd700]"
              }`}
            >
              <span className="text-base sm:text-lg leading-none">📱</span>
              <span className="line-clamp-1">Menu</span>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute bottom-full right-0 mb-2 rounded-2xl border border-[#d7ae49]/40 bg-gradient-to-b from-[#1a1f2e] to-[#0f1419] backdrop-blur-xl shadow-lg overflow-hidden w-44 sm:w-48">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all ${
                        isActive ? "bg-[#d7ae49]/25 text-[#ffd700]" : "text-[#e8f0ff] hover:bg-[#3a5f7f]/50 hover:text-[#ffd700]"
                      }`
                    }
                  >
                    <span className="text-sm sm:text-lg flex-shrink-0">{item.iconSymbol}</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.to === "/notifications" && unreadCount > 0 && (
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#f87171] px-1.5 text-[10px] font-black text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </NavLink>
                ))}
                
                {/* Logout */}
                <button
                  onClick={() => {
                    logout()
                    navigate("/login", { replace: true })
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#ff6b6b] hover:bg-red-500/15 transition-colors border-t border-[#d7ae49]/20"
                >
                  <span className="text-lg">🚪</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default BottomNav