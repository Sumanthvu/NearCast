"use client"
import { useState, useEffect } from "react"
import { viewMethod, callMethod, getAccountId } from "../utils/near"
import Post from "./Post"

export default function UserProfile({ userId, showToast, onUserClick }) {
  const [userPosts, setUserPosts] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    getAccountId().then(setCurrentUser)
    loadUserData()
  }, [userId])

  useEffect(() => {
    if (currentUser && userId) {
      checkIfFollowing()
    }
  }, [currentUser, userId])

  const checkIfFollowing = () => {
    if (!currentUser || currentUser === userId) return

    const followingUsers = JSON.parse(localStorage.getItem(`following_${currentUser}`) || "{}")
    setIsFollowing(!!followingUsers[userId])
  }

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

  const handleFollow = async () => {
    if (!currentUser) {
      showToast("Please login to follow users", "error")
      return
    }

    if (currentUser === userId) {
      showToast("Cannot follow yourself", "error")
      return
    }

    if (followLoading) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await callMethod({
          method: "unfollow_user",
          args: { user: userId },
          deposit: "0",
        })

        setIsFollowing(false)
        setFollowers((prev) => prev.filter((follower) => follower !== currentUser))

        const followingUsers = JSON.parse(localStorage.getItem(`following_${currentUser}`) || "{}")
        delete followingUsers[userId]
        localStorage.setItem(`following_${currentUser}`, JSON.stringify(followingUsers))

        showToast(`Unfollowed ${userId}`)
      } else {
        await callMethod({
          method: "follow_user",
          args: { user: userId },
          deposit: "0",
        })

        setIsFollowing(true)
        setFollowers((prev) => [...prev, currentUser])

        const followingUsers = JSON.parse(localStorage.getItem(`following_${currentUser}`) || "{}")
        followingUsers[userId] = true
        localStorage.setItem(`following_${currentUser}`, JSON.stringify(followingUsers))

        showToast(`Now following ${userId}!`)
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error)
      showToast("Failed to update follow status", "error")
    } finally {
      setFollowLoading(false)
    }
  }

  const handleSupport = async () => {
    if (!currentUser) {
      showToast("Please login to support creators", "error")
      return
    }

    if (currentUser === userId) {
      showToast("Cannot support your own profile", "error")
      return
    }

    try {
      await callMethod({
        method: "support_user",
        args: { recipient: userId },
        deposit: "0.001",
      })
      showToast("Support sent successfully! 💝")
    } catch (error) {
      console.error("Error supporting user:", error)
      showToast("Failed to send support", "error")
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
          <div style={{ flex: 1 }}>
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
          {currentUser && currentUser !== userId && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="button"
                style={{
                  background: isFollowing ? "#e0245e" : "#24248f",
                  opacity: followLoading ? 0.6 : 1,
                }}
              >
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
              <button
                onClick={handleSupport}
                className="action-button"
                style={{
                  background: "#f7f9fa",
                  border: "1px solid #e1e8ed",
                  borderRadius: "20px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "#657786",
                }}
              >
                💝 Support (0.001 Ⓝ)
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 style={{ color: "#24248f", marginBottom: "20px" }}>Posts by {userId}</h3>
        {userPosts.length === 0 ? (
          <div style={{ textAlign: "center", color: "#657786", padding: "40px" }}>No posts yet.</div>
        ) : (
          userPosts.map((post) => (
            <Post
              key={post.post_id}
              post={post}
              showToast={showToast}
              onPostUpdate={loadUserData}
              onUserClick={onUserClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
