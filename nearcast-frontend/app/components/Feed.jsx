"use client";
import { useEffect, useState } from "react";
import { viewMethod } from "../utils/near";

export default function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    viewMethod("get_all_posts").then(setPosts);
  }, []);

  return (
    <div>
      {posts.length === 0 && <p>No posts yet.</p>}
      {[...posts].reverse().map((post) => (
        <div key={post.post_id} style={{
          border: "1px solid #efefef",
          padding: "18px",
          borderRadius: "10px",
          background: "#fafaff",
          marginBottom: "20px"
        }}>
          <div style={{ fontWeight: "bold", color: "#3a3a8f" }}>{post.owner}</div>
          <div style={{ margin: "10px 0" }}>{post.caption}</div>
          {post.media_type === "image" &&
            <img src={`https://gateway.pinata.cloud/ipfs/${post.ipfs_hash}`}
              alt="media" style={{ borderRadius: 8, maxWidth: "100%" }} />}
          {post.media_type === "video" &&
            <video controls style={{ borderRadius: 8, maxWidth: "100%" }}>
              <source src={`https://gateway.pinata.cloud/ipfs/${post.ipfs_hash}`} />
            </video>}
        </div>
      ))}
    </div>
  );
}
