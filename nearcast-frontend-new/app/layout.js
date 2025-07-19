import "./globals.css"

export const metadata = {
  title: "NEARCast - Decentralized Social Platform",
  description: "A Web3 social platform built on NEAR Protocol",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5" }}>{children}</body>
    </html>
  )
}
