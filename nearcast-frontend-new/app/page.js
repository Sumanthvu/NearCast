"use client"
import { useState, useEffect } from "react"
import { viewMethod, getAccountId } from "../utils/near"
import Wallet from "../components/Wallet"
import PostForm from "../components/PostForm"
import Post from "../components/Post"
import UserProfile from "../components/UserProfile"
import Toast from "../components/Toast"

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState("feed")
  const [selectedUser, setSelectedUser] = useState(null)
  const [toast, setToast] = useState({ message: "", type: "success" })

  useEffect(() => {
    loadPosts()
    getAccountId().then(setCurrentUser)
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const allPosts = await viewMethod("get_all_posts")
      setPosts(allPosts.sort((a, b) => b.timestamp - a.timestamp))
    } catch (error) {
      console.error("Error loading posts:", error)
      showToast("Failed to load posts", "error")
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

  const handleUserClick = (userId) => {
    setSelectedUser(userId)
    setActiveTab("profile")
  }

  const refreshPosts = async () => {
    try {
      const allPosts = await viewMethod("get_all_posts")
      setPosts(allPosts.sort((a, b) => b.timestamp - a.timestamp))
    } catch (error) {
      console.error("Error refreshing posts:", error)
    }
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />

      <header className="header">
        <nav className="nav">
          <div className="logo">NEARCast</div>
          <Wallet />
        </nav>
      </header>

      <div className="container">
        <div className="tabs">
          <div className={`tab ${activeTab === "feed" ? "active" : ""}`} onClick={() => setActiveTab("feed")}>
            Home Feed
          </div>
          {currentUser && (
            <div
              className={`tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => {
                setSelectedUser(currentUser)
                setActiveTab("profile")
              }}
            >
              My Profile
            </div>
          )}
        </div>

        {activeTab === "feed" && (
          <>
            {currentUser && <PostForm onPostCreated={refreshPosts} showToast={showToast} />}

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", color: "#657786", padding: "40px" }}>
                <h3>No posts yet!</h3>
                <p>Be the first to share something on NEARCast.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.post_id}>
                  <Post post={post} showToast={showToast} onPostUpdate={() => {}} onUserClick={handleUserClick} />
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "profile" && selectedUser && (
          <UserProfile userId={selectedUser} showToast={showToast} onUserClick={handleUserClick} />
        )}

        {!currentUser && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              background: "white",
              borderRadius: "12px",
              marginTop: "20px",
            }}
          >
            <h2 style={{ color: "#24248f" }}>Welcome to NEARCast!</h2>
            <p style={{ color: "#657786", marginBottom: "20px" }}>
              A decentralized social platform built on NEAR Protocol. Connect your wallet to start posting, commenting,
              and supporting creators!
            </p>
            <Wallet />
          </div>
        )}
      </div>
    </div>
  )
}
