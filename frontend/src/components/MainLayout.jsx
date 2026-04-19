import { useAuth } from "../context/AuthContext"
import BottomNav from "./BottomNav"
import TopNav from "./TopNav"

const MainLayout = ({ children }) => {
  const { user } = useAuth()

  if (!user) {
    return children
  }

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

export default MainLayout
