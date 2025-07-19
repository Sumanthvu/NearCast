"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAccountId, login } from "../../utils/near"

export default function LoginPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const accountId = await getAccountId()
        setCurrentUser(accountId)
        if (accountId) {
          router.push("/") // Redirect to home if already logged in
        }
      } catch (error) {
        console.error("Error checking user session:", error)
        // Do not set error here, as it might be expected if not logged in
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  const handleNearLogin = async () => {
    setLoginError(null)
    try {
      await login()
      // The page will reload and useEffect will handle redirection
    } catch (error) {
      console.error("NEAR login failed:", error)
      setLoginError("Failed to connect NEAR wallet. Please ensure your wallet is ready.")
    }
  }

  if (loading) {
    return (
      <div className="login-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-content">
          <h1 className="login-title">🌌 Join NEARCast</h1>
          <p className="login-subtitle">
            Step into the decentralized social universe. Connect your NEAR wallet to explore, create, and connect!
          </p>

          <div className="login-button-group">
            <button onClick={handleNearLogin} className="login-button">
              🔗 Connect NEAR Wallet
            </button>
            {loginError && (
              <p style={{ color: "#ff6b6b", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>{loginError}</p>
            )}
            <div
              style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", marginTop: "20px" }}
            >
              Don't have a NEAR wallet?{" "}
              <a
                href="https://wallet.testnet.near.org/create"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#00f5ff", textDecoration: "underline" }}
              >
                Create one here!
              </a>
            </div>
          </div>
        </div>

        <div className="login-image-section">
          <img src="/placeholder.svg?height=400&width=400" alt="Futuristic NEAR logo" className="login-image" />
        </div>
      </div>
    </div>
  )
}
