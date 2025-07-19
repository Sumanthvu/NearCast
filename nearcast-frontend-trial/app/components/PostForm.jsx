"use client";
import { useState } from "react";
import { uploadToPinata } from "../utils/ipfs";
import { callMethod } from "../utils/near";

export default function PostForm({ refresh }) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    setPosting(true);
    let ipfs_hash = null;
    let media_type = "text";

    if (file) {
      ipfs_hash = await uploadToPinata(file);
      media_type = file.type.startsWith("image") ? "image" : "video";
    }

    await callChange("create_post", { caption, media_type, ipfs_hash }, "0.001");
    setCaption("");
    setFile(null);
    setPosting(false);
    if (refresh) refresh();
  };

  return (
    <div>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="What's happening?"
        style={{
          width: "100%",
          padding: 10,
          fontSize: "1em",
          border: "1px solid #ccc",
          borderRadius: 6,
          marginBottom: 10
        }}
      />
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files[0])}
        style={{ marginBottom: 10 }}
      />
      <br />
      <button
        onClick={handlePost}
        disabled={posting || !caption.trim()}
        style={{
          background: "#24248f",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer"
        }}
      >
        {posting ? "Posting..." : "Post"}
      </button>
    </div>
  );
}
