"use client"
import { useState, useEffect } from "react"
import { viewMethod, callMethod, getAccountId } from "../utils/near"
import Post from "./Post"

export default function UserProfile({ userId, showToast }) {
  // Removed onUserClick prop
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
  }, [userId]) // Depend on userId to reload data when navigating to different profiles

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
      showToast("Support sent successfully!")
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
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">{userId.charAt(0).toUpperCase()}</div>

          <div className="profile-info">
            <div className="profile-username">{userId}</div>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{userPosts.length}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat">
                <span className="stat-number">{followers.length}</span>
                <span className="stat-label">followers</span>
              </div>
              <div className="stat">
                <span className="stat-number">{following.length}</span>
                <span className="stat-label">following</span>
              </div>
            </div>
          </div>

          {currentUser && currentUser !== userId && (
            <div className="profile-actions">
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`follow-btn ${isFollowing ? "following" : ""}`}
              >
                {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
              </button>
              <button onClick={handleSupport} className="action-btn">
                💝 Support
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        {userPosts.length === 0 ? (
          <div className="welcome-section">
            <h3 className="welcome-title">No posts yet</h3>
            <p className="welcome-subtitle">When {userId} shares posts, they'll appear here.</p>
          </div>
        ) : (
          userPosts.map((post) => (
            <Post
              key={post.post_id}
              post={post}
              showToast={showToast}
              onPostUpdate={loadUserData}
              // onUserClick prop removed, Post component now handles navigation directly
            />
          ))
        )}
      </div>
    </div>
  )
}
