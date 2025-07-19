"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // Import useRouter
import { callMethod, viewMethod, getAccountId } from "../utils/near"
import Comments from "./Comments"

export default function Post({ post, showToast, onPostUpdate }) {
  // Removed onUserClick prop
  const router = useRouter() // Initialize useRouter
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
  const [showFullMedia, setShowFullMedia] = useState(false)

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

      showToast("Post liked!")
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
      showToast("Support sent successfully!")
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
    router.push(`/profile/${post.owner}`) // Navigate directly to profile page
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
      <div className="post-header">
        <div className="avatar" onClick={handleUserClick}>
          {post.owner.charAt(0).toUpperCase()}
        </div>
        <div className="post-user-info">
          <div className="username" onClick={handleUserClick}>
            {post.owner}
          </div>
          <div className="timestamp">{formatTimestamp(post.timestamp)}</div>
        </div>
        {currentUser && currentUser !== post.owner && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`follow-btn ${isFollowing ? "following" : ""}`}
          >
            {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {post.ipfs_hash && (
        <div className="media-container" onClick={() => setShowFullMedia(true)}>
          {post.media_type === "image" ? (
            <img
              src={getMediaUrl(post.ipfs_hash) || "/placeholder.svg"}
              alt="Post media"
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/400x300?text=Image+Not+Available`
              }}
            />
          ) : post.media_type === "video" ? (
            <video src={getMediaUrl(post.ipfs_hash)} controls />
          ) : null}
        </div>
      )}

      <div className="post-content">
        <div className="post-caption">
          <br/>
          <span className="username">{post.owner}</span> {post.caption}
        </div>
      </div>

      {/* Moved post-actions below caption */}
      <div className="post-actions">
        <button className={`action-btn ${isLiked ? "liked" : ""}`} onClick={handleLike} disabled={likeLoading}>
          {likeLoading ? "..." : isLiked ? "❤️" : "🤍"}
        </button>

        <button
          className="action-btn"
          onClick={() => {
            setShowComments(!showComments)
            if (!showComments) loadComments()
          }}
        >
          💬
        </button>

        {currentUser && currentUser !== post.owner && (
          <button className="action-btn" onClick={handleSupport}>
            💝
          </button>
        )}
      </div>

      {likeCount > 0 && (
        <div className="like-count">
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </div>
      )}

      {showComments && (
        <div className="comment-section">
          <Comments comments={comments} />

          {currentUser && (
            <form onSubmit={handleComment} className="comment-form">
              <textarea
                className="comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={1}
              />
              <button type="submit" className="comment-submit" disabled={loading || !newComment.trim()}>
                {loading ? "..." : "Post"}
              </button>
            </form>
          )}
        </div>
      )}

      {showFullMedia && (
        <div className="media-modal" onClick={() => setShowFullMedia(false)}>
          {post.media_type === "image" ? (
            <img src={getMediaUrl(post.ipfs_hash) || "/placeholder.svg"} alt="Full screen media" />
          ) : post.media_type === "video" ? (
            <video src={getMediaUrl(post.ipfs_hash)} controls />
          ) : null}
        </div>
      )}
    </div>
  )
}
