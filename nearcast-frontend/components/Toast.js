"use client"
import { useEffect } from "react"

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message, onClose])

  if (!message) return null

  return <div className={`toast ${type === "error" ? "error" : ""}`}>{message}</div>
}
