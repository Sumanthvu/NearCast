"use client"
import { useState } from "react"
import { callMethod, getAccountId } from "../utils/near"
import { uploadToIPFS } from "../utils/ipfs"

export default function PostForm({ onPostCreated, showToast }) {
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const accountId = await getAccountId()
    if (!accountId) {
      showToast("Please login first", "error")
      return
    }

    if (!caption.trim()) {
      showToast("Please enter a caption", "error")
      return
    }

    setLoading(true)

    try {
      let ipfsHash = null
      let mediaType = "text"

      // Handle file upload if present
      if (file) {
        console.log("Uploading file to IPFS:", file.name)
        try {
          const uploadResult = await uploadToIPFS(file)
          ipfsHash = uploadResult.IpfsHash
          mediaType = file.type.startsWith("image/") ? "image" : "video"
          console.log("File uploaded successfully:", ipfsHash)
        } catch (uploadError) {
          console.error("IPFS upload failed:", uploadError)
          showToast("Failed to upload media. Posting without media...", "error")
          // Continue without media
          ipfsHash = null
          mediaType = "text"
        }
      }

      console.log("Creating post with:", { caption: caption.trim(), media_type: mediaType, ipfs_hash: ipfsHash })

      // Create post on NEAR
      await callMethod({
        method: "create_post",
        args: {
          caption: caption.trim(),
          media_type: mediaType,
          ipfs_hash: ipfsHash,
        },
        deposit: "0.001",
      })

      setCaption("")
      setFile(null)
      showToast("Post created successfully!")
      onPostCreated()
    } catch (error) {
      console.error("Error creating post:", error)
      if (error.message.includes("Failed to upload to IPFS")) {
        showToast("Failed to upload media to IPFS", "error")
      } else if (error.message.includes("User rejected")) {
        showToast("Transaction was cancelled", "error")
      } else {
        showToast("Failed to create post. Please try again.", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-form">
      <h3 style={{ marginTop: 0, color: "#24248f" }}>Create a Post</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          placeholder="What's happening?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
        />

        <div className="file-input">
          <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files[0])} />
          {file && (
            <div style={{ marginTop: "10px", fontSize: "14px", color: "#657786" }}>
              Selected: {file.name}
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{
                  marginLeft: "10px",
                  background: "none",
                  border: "none",
                  color: "#e0245e",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Add a checkbox for posting without media if upload fails */}
        <div style={{ fontSize: "12px", color: "#657786", marginBottom: "10px" }}>
          💡 Tip: If media upload fails, the post will be created as text-only
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#657786" }}>{caption.length}/280 characters</span>
          <button type="submit" className="button" disabled={loading || !caption.trim()}>
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  )
}
