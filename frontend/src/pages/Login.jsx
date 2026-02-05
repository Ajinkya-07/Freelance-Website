import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!email || !password) {
      setMsg("Please fill in all fields");
      return;
    }

    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      setMsg("Login successful ✅");
      setTimeout(() => navigate("/dashboard"), 500);
    } else {
      setMsg(result.error || "Login failed ❌");
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>EditConnect</h1>
          <p style={styles.logoSubtext}>Professional Freelance Marketplace</p>
        </div>

        <h2 style={styles.title}>Welcome Back 👋</h2>
        <p style={styles.subtitle}>Login to your dashboard</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            style={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {msg && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px",
              borderRadius: "8px",
              background: msg.includes("success")
                ? "rgba(74, 222, 128, 0.1)"
                : "rgba(248, 113, 113, 0.1)",
              color: msg.includes("success") ? "#4ade80" : "#f87171",
              fontSize: "14px",
            }}
          >
            {msg}
          </div>
        )}

        <p style={styles.footer}>
          New here?{" "}
          <Link to="/signup" style={styles.link}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #020617)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  card: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },

  logo: {
    textAlign: "center",
    marginBottom: "30px",
  },

  logoText: {
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "5px",
  },

  logoSubtext: {
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  title: {
    color: "white",
    marginBottom: "8px",
    fontSize: "24px",
    textAlign: "center",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    marginBottom: "30px",
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    padding: "14px",
    borderRadius: "10px",
    background: "rgba(2, 6, 23, 0.6)",
    border: "1px solid rgba(51, 65, 85, 0.5)",
    color: "white",
    outline: "none",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },

  button: {
    marginTop: "10px",
    padding: "14px",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "16px",
    color: "white",
    transition: "transform 0.2s ease",
  },

  footer: {
    marginTop: "25px",
    color: "#94a3b8",
    fontSize: "14px",
    textAlign: "center",
  },

  link: {
    color: "#22d3ee",
    textDecoration: "none",
    fontWeight: "600",
  },
};