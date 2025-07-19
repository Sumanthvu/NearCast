import './globals.css'; // You may still need this if you use Tailwind or global fonts

export const metadata = {
  title: "NEARCast",
  description: "NEAR-powered decentralized social app"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f7fa"
      }}>
        <header style={{
          backgroundColor: "#24248f",
          color: "#fff",
          padding: "20px",
          fontSize: "1.5em",
          fontWeight: "bold",
          letterSpacing: "1px",
          textAlign: "center"
        }}>
          NEARCast
        </header>
        <main style={{
          maxWidth: "700px",
          margin: "30px auto",
          padding: "20px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 0 12px rgba(0,0,0,0.05)"
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
