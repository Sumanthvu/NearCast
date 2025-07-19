import Wallet from "./components/Wallet";
import PostForm from "./components/PostForm";
import Feed from "./components/Feed";

export default function HomePage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Wallet />
      </div>
      <div style={{ marginBottom: 40 }}>
        <PostForm />
      </div>
      <Feed />
    </div>
  );
}
