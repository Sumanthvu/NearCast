"use client"

export default function Comments({ comments }) {
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

  if (!comments || comments.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#8e8e8e", padding: "20px", fontSize: "14px" }}>
        No comments yet. Be the first to comment!
      </div>
    )
  }

  return (
    <div>
      {comments.map((comment, index) => (
        <div key={index} className="comment">
          <div className="comment-header">
            <div className="comment-avatar">{comment.commenter.charAt(0).toUpperCase()}</div>
            <div className="comment-content">
              <span className="comment-username">{comment.commenter}</span>
              <span className="comment-text">{comment.content}</span>
              <div className="comment-time">{formatTimestamp(comment.timestamp)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
