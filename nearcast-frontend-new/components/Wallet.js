"use client"
import { useState, useEffect } from "react"
import { login, logout, getAccountId } from "../utils/near"
import "@near-wallet-selector/modal-ui/styles.css"

export default function Wallet() {
  const [account, setAccount] = useState(null)

  useEffect(() => {
    getAccountId().then(setAccount)
  }, [])

  return (
    <div>
      {account ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="avatar">{account.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{account}</strong>
            <button
              onClick={logout}
              style={{
                marginLeft: 10,
                background: "#24248f",
                color: "#fff",
                padding: "6px 14px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={login}
          style={{
            background: "#24248f",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            fontSize: "1em",
            cursor: "pointer",
          }}
        >
          Login with NEAR
        </button>
      )}
    </div>
  )
}
