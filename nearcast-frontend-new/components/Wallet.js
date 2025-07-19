"use client"
import { useState, useEffect } from "react"
import { login, logout, getAccountId } from "../utils/near"
import "@near-wallet-selector/modal-ui/styles.css"

export default function Wallet() {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAccount()
  }, [])

  const loadAccount = async () => {
    try {
      const accountId = await getAccountId()
      setAccount(accountId)
      setError(null)
    } catch (err) {
      console.error("Error loading account:", err)
      setError("Failed to load wallet")
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await login()
    } catch (err) {
      console.error("Login failed:", err)
      setError("Failed to connect NEAR wallet. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (err) {
      console.error("Logout failed:", err)
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wallet-container">
      {account ? (
        <div className="wallet-info">
          <div className="wallet-avatar">{account.charAt(0).toUpperCase()}</div>
          <div className="wallet-username">{account}</div>
          <button onClick={handleLogout} disabled={loading} className="logout-btn">
            {loading ? "..." : "Logout"}
          </button>
        </div>
      ) : (
        <div>
          <button onClick={handleLogin} disabled={loading} className="connect-btn">
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
          {error && <div style={{ fontSize: "12px", color: "#ed4956", marginTop: "4px" }}>{error}</div>}
        </div>
      )}
    </div>
  )
}
