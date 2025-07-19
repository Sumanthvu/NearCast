"use client"
import { useState } from "react"
import { callMethod, getAccountId } from "../utils/near"
import { uploadToIPFS } from "../utils/ipfs"

export default function PostForm({ onPostCreated, showToast }) {
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)

    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreviewUrl(null)
    }
  }

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
    let mediaType = "text"
    let ipfsHash = null

    try {
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
          ipfsHash = null
          mediaType = "text"
        }
      }

      await callMethod({
        method: "create_post",
        args: {
          caption: caption.trim(),
          media_type: mediaType,
          ipfs_hash: ipfsHash,
        },
        deposit: "0",
        gas: "30000000000000",
      })

      setCaption("")
      setFile(null)
      setPreviewUrl(null)
      showToast("Post created successfully!")
      onPostCreated()
    } catch (error) {
      console.error("Error creating post:", error)

      if (
        error.message.includes("deposit") ||
        error.message.includes("attached") ||
        error.message.includes("payable")
      ) {
        try {
          console.log("Retrying with minimal deposit...")
          await callMethod({
            method: "create_post",
            args: {
              caption: caption.trim(),
              media_type: mediaType,
              ipfs_hash: ipfsHash,
            },
            deposit: "0.000000000000000000000001",
          })

          setCaption("")
          setFile(null)
          setPreviewUrl(null)
          showToast("Post created successfully!")
          onPostCreated()
        } catch (retryError) {
          console.error("Retry failed:", retryError)
          showToast("Failed to create post. Please try again.", "error")
        }
      } else {
        showToast("Failed to create post. Please try again.", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <div className="avatar">{/* This will be filled with current user's initial */}</div>
        <div style={{ flex: 1, fontSize: "16px", color: "#8e8e8e" }}>What's on your mind?</div>
      </div>

      <form onSubmit={handleSubmit} className="create-post-form">
        <textarea
          className="post-textarea"
          placeholder="Share something with the community..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={280}
        />

        <div
          className={`file-upload-section ${file ? "has-file" : ""}`}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {previewUrl ? (
            <div style={{ position: "relative" }}>
              {file.type.startsWith("image/") ? (
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setPreviewUrl(null)
                }}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="upload-icon">📷</div>
              <div className="upload-text">Add photos or videos</div>
              <div className="upload-subtext">Click to browse your files</div>
            </>
          )}
        </div>

        <div className="post-actions-bar">
          <div className="char-count">{caption.length}/280</div>
          <button type="submit" className="post-btn" disabled={loading || !caption.trim()}>
            {loading ? "Posting..." : "Share"}
          </button>
        </div>
      </form>
    </div>
  )
}
