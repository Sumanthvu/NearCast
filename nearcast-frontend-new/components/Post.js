"use client"
import { useState, useEffect } from "react"
import { callMethod, viewMethod, getAccountId } from "../utils/near"
import Comments from "./Comments"

export default function Post({ post, showToast, onPostUpdate, onUserClick }) {
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    getAccountId().then(setCurrentUser)
  }, [])

  useEffect(() => {
    if (currentUser) {
      checkIfLiked()
      checkIfFollowing()
    }
  }, [currentUser, post.post_id])

  const checkIfLiked = () => {
    if (!currentUser) return

    const likedPosts = JSON.parse(localStorage.getItem(`likedPosts_${currentUser}`) || "{}")
    setIsLiked(!!likedPosts[post.post_id])
  }

  const checkIfFollowing = () => {
    if (!currentUser) return

    const followingUsers = JSON.parse(localStorage.getItem(`following_${currentUser}`) || "{}")
    setIsFollowing(!!followingUsers[post.owner])
  }

  const loadComments = async () => {
    try {
      const commentsData = await viewMethod("get_comments", { post_id: post.post_id })
      setComments(commentsData)
    } catch (error) {
      console.error("Error loading comments:", error)
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      showToast("Please login to like posts", "error")
      return
    }

    if (likeLoading) return

    if (isLiked) {
      showToast("You have already liked this post!", "error")
      return
    }

    setLikeLoading(true)

    try {
      await callMethod({
        method: "like_post",
        args: { post_id: post.post_id },
        deposit: "0",
      })

      setLikeCount((prev) => prev + 1)
      setIsLiked(true)

      const likedPosts = JSON.parse(localStorage.getItem(`likedPosts_${currentUser}`) || "{}")
      likedPosts[post.post_id] = true
      localStorage.setItem(`likedPosts_${currentUser}`, JSON.stringify(likedPosts))

      showToast("Post liked! ❤️")
    } catch (error) {
      console.error("Error liking post:", error)

      if (error.message.includes("Already liked")) {
        setIsLiked(true)
        const likedPosts = JSON.parse(localStorage.getItem(`likedPosts_${currentUser}`) || "{}")
        likedPosts[post.post_id] = true
        localStorage.setItem(`likedPosts_${currentUser}`, JSON.stringify(likedPosts))
        showToast("You have already liked this post!", "error")
      } else {
        showToast("Failed to like post", "error")
      }
    } finally {
      setLikeLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!currentUser) {
      showToast("Please login to comment", "error")
      return
    }

    if (!newComment.trim()) return

    setLoading(true)
    try {
      await callMethod({
        method: "comment_post",
        args: {
          post_id: post.post_id,
          content: newComment.trim(),
        },
        deposit: "0",
      })
      setNewComment("")
      showToast("Comment added!")
      loadComments()
    } catch (error) {
      console.error("Error commenting:", error)
      showToast("Failed to add comment", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSupport = async () => {
    if (!currentUser) {
      showToast("Please login to support creators", "error")
      return
    }

    if (currentUser === post.owner) {
      showToast("Cannot support your own post", "error")
      return
    }

    try {
      await callMethod({
        method: "support_user",
        args: { recipient: post.owner },
        deposit: "0.001",
      })
      showToast("Support sent successfully! 💝")
    } catch (error) {
      console.error("Error supporting user:", error)
      showToast("Failed to send support", "error")
    }
  }

  const handleFollow = async () => {
    if (!currentUser) {
      showToast("Please login to follow users", "error")
      return
    }

    if (currentUser === post.owner) {
      showToast("Cannot follow yourself", "error")
      return
    }

    if (followLoading) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await callMethod({
          method: "unfollow_user",
          args: { user: post.owner },
          deposit: "0",
        })

        setIsFollowing(false)

        const followingUsers = JSON.parse(localStorage.getItem(`following_${currentUser}`) || "{}")
        delete followingUsers[post.owner]
        localStorage.setItem(`following_${currentUser}`, JSON.stringify(followingUsers))

        showToast(`Unfollowed ${post.owner}`)
      } else {
        await callMethod({
          method: "follow_user",
          args: { user: post.owner },
          deposit: "0",
        })

        setIsFollowing(true)

        const followingUsers = JSON.parse(localStorage.getItem(`following_${currentUser}`) || "{}")
        followingUsers[post.owner] = true
        localStorage.setItem(`following_${currentUser}`, JSON.stringify(followingUsers))

        showToast(`Now following ${post.owner}!`)
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error)
      showToast("Failed to update follow status", "error")
    } finally {
      setFollowLoading(false)
    }
  }

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick(post.owner)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString()
  }

  const getMediaUrl = (ipfsHash) => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
  }

  return (
    <div className="post-card">
      <div className="user-info">
        <div className="avatar">{post.owner.charAt(0).toUpperCase()}</div>
        <div>
          <button
            onClick={handleUserClick}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <strong
              style={{
                color: "#24248f",
                fontSize: "16px",
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              {post.owner}
            </strong>
          </button>
          <div className="timestamp">{formatTimestamp(post.timestamp)}</div>
        </div>
        {currentUser && currentUser !== post.owner && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="button"
            style={{
              marginLeft: "auto",
              fontSize: "12px",
              padding: "4px 8px",
              background: isFollowing ? "#e0245e" : "#24248f",
              opacity: followLoading ? 0.6 : 1,
            }}
          >
            {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div style={{ marginBottom: "15px" }}>
        <p style={{ margin: 0, lineHeight: "1.4" }}>{post.caption}</p>
      </div>

      {post.ipfs_hash && (
        <div className="media-container">
          {post.media_type === "image" ? (
            <img
              src={getMediaUrl(post.ipfs_hash) || "/placeholder.svg"}
              alt="Post media"
              style={{ maxWidth: "100%", height: "auto" }}
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/400x300?text=Image+Not+Available`
              }}
            />
          ) : post.media_type === "video" ? (
            <video
              src={getMediaUrl(post.ipfs_hash)}
              controls
              style={{ maxWidth: "100%", height: "auto" }}
              onError={(e) => {
                console.error("Video failed to load:", e)
              }}
            />
          ) : null}
        </div>
      )}

      <div className="post-actions">
        <button
          className={`action-button ${isLiked ? "liked" : ""}`}
          onClick={handleLike}
          disabled={likeLoading}
          style={{
            color: isLiked ? "#657786" : "#657786",
            opacity: likeLoading ? 0.6 : 1,
            cursor: isLiked ? "not-allowed" : "pointer",
          }}
        >
          {likeLoading ? "..." : "🤍"} {likeCount}
        </button>

        <button
          className="action-button"
          onClick={() => {
            setShowComments(!showComments)
            if (!showComments) loadComments()
          }}
        >
          💬 Comment
        </button>

        {currentUser && currentUser !== post.owner && (
          <button className="action-button" onClick={handleSupport}>
            💝 Support (0.001 Ⓝ)
          </button>
        )}
      </div>

      {showComments && (
        <div className="comment-section">
          <Comments comments={comments} />

          {currentUser && (
            <form onSubmit={handleComment} style={{ marginTop: "15px" }}>
              <textarea
                className="textarea"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                style={{ minHeight: "60px" }}
              />
              <button
                type="submit"
                className="button"
                disabled={loading || !newComment.trim()}
                style={{ fontSize: "12px" }}
              >
                {loading ? "Posting..." : "Comment"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
