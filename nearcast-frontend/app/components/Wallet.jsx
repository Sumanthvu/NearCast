"use client";
import { useEffect, useState } from "react";
import { walletLogin, walletLogout, walletAccountId } from "../utils/near";


export default function Wallet() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    walletAccountId().then(setAccount);
  }, []);

  return (
    <div>
      {account ? (
        <div>
          <span style={{ fontWeight: "bold" }}>{walletAccountId}</span>
          <button onClick={walletLogout} style={{
            marginLeft: 10,
            background: "#24248f",
            color: "#fff",
            padding: "6px 14px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}>
            Logout
          </button>
        </div>
      ) : (
        <button onClick={walletLogin} style={{
          background: "#24248f",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: "6px",
          border: "none",
          fontSize: "1em",
          cursor: "pointer"
        }}>
          Login with NEAR
        </button>
      )}
    </div>
  );
}
