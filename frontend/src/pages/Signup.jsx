import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!name || !email || !password) {
      setMsg("Please fill in all fields");
      return;
    }

    setLoading(true);

    const result = await register(name, email, password, role);

    if (result.success) {
      setMsg("Account created successfully! ✅ Redirecting to login...");
      setTimeout(() => navigate("/"), 1500);
    } else {
      setMsg(result.error || "Registration failed ❌");
    }

    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>EditFlow</h1>
          <p style={styles.logoSubtext}>Professional Freelance Marketplace</p>
        </div>

        <h2 style={styles.title}>Create Account 🚀</h2>
        <p style={styles.subtitle}>Join our community of professionals</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              style={styles.input}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>I am a...</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="client">Client - I need editing services</option>
              <option value="editor">Editor - I provide editing services</option>
            </select>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? (
              <span style={styles.buttonContent}>
                <div style={styles.spinner}></div>
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {msg && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.875rem",
              borderRadius: "0.5rem",
              background: msg.includes("success")
                ? "rgba(74, 222, 128, 0.1)"
                : "rgba(248, 113, 113, 0.1)",
              border: `1px solid ${msg.includes("success") ? "#4ade80" : "#f87171"
                }`,
              color: msg.includes("success") ? "#4ade80" : "#f87171",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>{msg.includes("success") ? "✓" : "!"}</span>
            {msg}
          </div>
        )}

        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/" style={styles.link}>
            Sign in here
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
    padding: "2rem 1rem",
  },
  card: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    padding: "2.5rem",
    borderRadius: "1.25rem",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  logo: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoText: {
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "0.25rem",
  },
  logoSubtext: {
    color: "#94a3b8",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  title: {
    color: "white",
    marginBottom: "0.5rem",
    fontSize: "1.75rem",
    textAlign: "center",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    marginBottom: "2rem",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  input: {
    padding: "0.875rem",
    borderRadius: "0.625rem",
    background: "rgba(2, 6, 23, 0.6)",
    border: "1px solid rgba(51, 65, 85, 0.5)",
    color: "white",
    outline: "none",
    fontSize: "0.9375rem",
    transition: "all 0.3s ease",
  },
  select: {
    padding: "0.875rem",
    borderRadius: "0.625rem",
    background: "rgba(2, 6, 23, 0.6)",
    border: "1px solid rgba(51, 65, 85, 0.5)",
    color: "white",
    outline: "none",
    fontSize: "0.9375rem",
    cursor: "pointer",
  },
  button: {
    marginTop: "0.5rem",
    padding: "0.875rem",
    background: "linear-gradient(135deg, #6366f1, #22d3ee)",
    border: "none",
    borderRadius: "0.625rem",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "1rem",
    color: "white",
    transition: "all 0.3s ease",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "1.5rem 0 1rem",
  },
  dividerText: {
    background: "rgba(15, 23, 42, 0.8)",
    padding: "0 1rem",
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  footer: {
    marginTop: "0.5rem",
    color: "#94a3b8",
    fontSize: "0.875rem",
    textAlign: "center",
  },
  link: {
    color: "#22d3ee",
    textDecoration: "none",
    fontWeight: "600",
  },
};