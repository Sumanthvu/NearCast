"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { viewMethod, getAccountId } from "../utils/near"
import Wallet from "../components/Wallet"
import Post from "../components/Post"
import Toast from "../components/Toast"

export default function Home() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [toast, setToast] = useState({ message: "", type: "success" })
  const [error, setError] = useState(null)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      await loadPosts()
      const user = await getAccountId()
      setCurrentUser(user)
      setError(null)
    } catch (err) {
      console.error("Failed to initialize app:", err)
      setError("Failed to connect to NEAR network. Please refresh the page.")
    }
  }

  const loadPosts = async () => {
    setLoading(true)
    try {
      const allPosts = await viewMethod("get_all_posts")
      setPosts(allPosts.sort((a, b) => b.timestamp - a.timestamp))
      setError(null)
    } catch (error) {
      console.error("Error loading posts:", error)
      showToast("Failed to load posts. Please check your connection.", "error")
      setError("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast({ message: "", type: "success" })
  }

  if (error) {
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
          <div className="welcome-section">
            <h2 className="welcome-title">Connection Error</h2>
            <p className="welcome-subtitle">{error}</p>
            <button onClick={initializeApp} className="connect-btn" style={{ marginTop: "16px" }}>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
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
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="welcome-section">
            <h3 className="welcome-title">No posts yet!</h3>
            <p className="welcome-subtitle">Be the first to share something on NEARCast.</p>
          </div>
        ) : (
          posts.map((post) => <Post key={post.post_id} post={post} showToast={showToast} onPostUpdate={() => {}} />)
        )}

        {!currentUser && (
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome to NEARCast!</h2>
            <p className="welcome-subtitle">
              A decentralized social platform built on NEAR Protocol. Connect your wallet to start posting and
              interacting with the community!
            </p>
            <Wallet />
          </div>
        )}
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
