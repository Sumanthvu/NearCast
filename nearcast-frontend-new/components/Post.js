"use client"
import { useState, useEffect } from "react"
import { callMethod, viewMethod, getAccountId } from "../utils/near"
import Comments from "./Comments"

export default function Post({ post, showToast, onPostUpdate }) {
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    getAccountId().then(setCurrentUser)
  }, [])

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

    try {
      await callMethod({
        method: "like_post",
        args: { post_id: post.post_id },
      })
      showToast("Post liked!")
      onPostUpdate()
    } catch (error) {
      console.error("Error liking post:", error)
      showToast("Failed to like post", "error")
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

    try {
      await callMethod({
        method: "follow_user",
        args: { user: post.owner },
      })
      showToast(`Now following ${post.owner}!`)
    } catch (error) {
      console.error("Error following user:", error)
      showToast("Failed to follow user", "error")
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
          <strong>{post.owner}</strong>
          <div className="timestamp">{formatTimestamp(post.timestamp)}</div>
        </div>
        {currentUser && currentUser !== post.owner && (
          <button
            onClick={handleFollow}
            className="button"
            style={{ marginLeft: "auto", fontSize: "12px", padding: "4px 8px" }}
          >
            Follow
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
        <button className="action-button" onClick={handleLike}>
          ❤️ {post.likes}
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
