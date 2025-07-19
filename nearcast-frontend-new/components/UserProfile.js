"use client"
import { useState, useEffect } from "react"
import { viewMethod } from "../utils/near"
import Post from "./Post"

export default function UserProfile({ userId, showToast }) {
  const [userPosts, setUserPosts] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const [posts, followersData, followingData] = await Promise.all([
        viewMethod("get_user_posts", { user: userId }),
        viewMethod("get_followers", { user: userId }),
        viewMethod("get_following", { user: userId }),
      ])

      setUserPosts(posts.sort((a, b) => b.timestamp - a.timestamp))
      setFollowers(followersData)
      setFollowing(followingData)
    } catch (error) {
      console.error("Error loading user data:", error)
      showToast("Failed to load user profile", "error")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="user-profile">
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="avatar" style={{ width: "60px", height: "60px", fontSize: "24px" }}>
            {userId.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, color: "#24248f" }}>{userId}</h2>
            <div className="stats">
              <div className="stat">
                <div className="stat-number">{userPosts.length}</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat">
                <div className="stat-number">{followers.length}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat">
                <div className="stat-number">{following.length}</div>
                <div className="stat-label">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: "#24248f", marginBottom: "20px" }}>Posts by {userId}</h3>
        {userPosts.length === 0 ? (
          <div style={{ textAlign: "center", color: "#657786", padding: "40px" }}>No posts yet.</div>
        ) : (
          userPosts.map((post) => (
            <Post key={post.post_id} post={post} showToast={showToast} onPostUpdate={loadUserData} />
          ))
        )}
      </div>
    </div>
  )
}
