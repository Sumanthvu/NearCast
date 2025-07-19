"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAccountId } from "../../../utils/near"
import UserProfile from "../../../components/UserProfile"
import Wallet from "../../../components/Wallet"
import Toast from "../../../components/Toast"

export default function UserProfilePage({ params }) {
  const router = useRouter()
  const { userId } = params
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ message: "", type: "success" })

  useEffect(() => {
    const checkUser = async () => {
      const accountId = await getAccountId()
      setCurrentUser(accountId)
      setLoading(false)
      if (!accountId) {
        router.push("/login") // Redirect to login if not authenticated
      }
    }
    checkUser()
  }, [router])

  const showToast = (message, type = "success") => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast({ message: "", type: "success" })
  }

  if (loading) {
    return (
      <div className="app-container">
        <header className="header">
          <nav className="nav">
            <div className="logo">
              <div className="logo-icon">N</div>
              NEARCast
            </div>
            <Wallet />
          </nav>
        </header>
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null // Will be redirected by useEffect
  }

  return (
    <div className="app-container">
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      <header className="header">
        <nav className="nav">
          <div className="logo">
            <div className="logo-icon">N</div>
            NEARCast
          </div>
          <Wallet />
        </nav>
      </header>

      <div className="container">
        <UserProfile userId={userId} showToast={showToast} />
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <button
            className={`nav-btn ${(router.pathname ?? "") === "/" ? "active" : ""}`}
            onClick={() => router.push("/")}
          >
            <div className="nav-icon">🏠</div>
            <span>Home</span>
          </button>

          {currentUser && (
            <>
              <button
                className={`nav-btn ${(router.pathname ?? "") === "/create-post" ? "active" : ""}`}
                onClick={() => router.push("/create-post")}
              >
                <div className="nav-icon">➕</div>
                <span>Create</span>
              </button>

              <button
                className={`nav-btn ${(router.pathname ?? "").startsWith("/profile") ? "active" : ""}`}
                onClick={() => router.push(`/profile/${currentUser}`)}
              >
                <div className="nav-icon">👤</div>
                <span>Profile</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
