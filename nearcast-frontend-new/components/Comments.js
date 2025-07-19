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
      <div style={{ textAlign: "center", color: "#657786", padding: "20px" }}>
        No comments yet. Be the first to comment!
      </div>
    )
  }

  return (
    <div>
      {comments.map((comment, index) => (
        <div key={index} className="comment">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
            <div className="avatar" style={{ width: "30px", height: "30px", fontSize: "12px" }}>
              {comment.commenter.charAt(0).toUpperCase()}
            </div>
            <strong style={{ fontSize: "14px" }}>{comment.commenter}</strong>
            <span className="timestamp">{formatTimestamp(comment.timestamp)}</span>
          </div>
          <p style={{ margin: "0 0 0 40px", fontSize: "14px", lineHeight: "1.4" }}>{comment.content}</p>
        </div>
      ))}
    </div>
  )
}
