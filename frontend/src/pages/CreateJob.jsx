import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function CreateJob() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [category, setCategory] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!title.trim() || !description.trim()) {
      setMsg("Please fill in all required fields");
      setMsgType("error");
      return;
    }

    if (parseInt(budgetMin) > parseInt(budgetMax)) {
      setMsg("Minimum budget cannot be greater than maximum budget");
      setMsgType("error");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const response = await api.post("/jobs", {
        title,
        description,
        duration_days: durationDays,
        budget_min: budgetMin,
        budget_max: budgetMax,
        category,
        required_experience: experienceLevel,
      });

      setMsg("Job posted successfully! ✅");
      setMsgType("success");

      setTimeout(() => navigate("/jobs"), 1500);

    } catch (err) {
      console.error(err);
      setMsg(err.response?.data?.error || "Failed to create job");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div className="container" style={{ maxWidth: "800px" }}>
          {/* Header */}
          <div style={styles.header}>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-outline"
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>

          {/* Form Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.icon}>💼</div>
              <div>
                <h1 style={styles.title}>Post a New Job</h1>
                <p style={styles.subtitle}>
                  Find the perfect video editor for your project
                </p>
              </div>
            </div>

            <div style={styles.divider}></div>

            {/* Message */}
            {msg && (
              <div className={`alert alert-${msgType}`} style={{ marginBottom: "1.5rem" }}>
                <span>{msgType === "error" ? "⚠️" : "✅"}</span>
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Job Title */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Job Title <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Edit 10-minute YouTube Video"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={styles.input}
                />
                <small style={styles.hint}>
                  A clear, descriptive title helps attract the right editors
                </small>
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Job Description <span style={styles.required}>*</span>
                </label>
                <textarea
                  placeholder="Describe your project requirements, style preferences, and expectations..."
                  rows="6"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ ...styles.input, ...styles.textarea }}
                />
                <small style={styles.hint}>
                  Include details about footage length, editing style, and deliverables
                </small>
              </div>

              {/* Category & Experience */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g., YouTube, Corporate, Wedding"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    style={styles.select}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Budget Range */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Budget Range (USD)</label>
                <div style={styles.budgetRow}>
                  <div style={styles.budgetInput}>
                    <span style={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      min="0"
                      style={{ ...styles.input, paddingLeft: "2rem" }}
                    />
                  </div>
                  <span style={styles.budgetSeparator}>—</span>
                  <div style={styles.budgetInput}>
                    <span style={styles.currencySymbol}>$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      min="0"
                      style={{ ...styles.input, paddingLeft: "2rem" }}
                    />
                  </div>
                </div>
                <small style={styles.hint}>
                  Competitive budgets attract quality editors
                </small>
              </div>

              {/* Duration */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Expected Duration (Days)</label>
                <input
                  type="number"
                  placeholder="e.g., 7"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  min="1"
                  style={styles.input}
                />
                <small style={styles.hint}>
                  How many days do you need to complete this project?
                </small>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={styles.submitButton}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={styles.spinner}></div>
                    Posting Job...
                  </>
                ) : (
                  <>
                    📢 Post Job
                  </>
                )}
              </button>

              <p style={styles.terms}>
                By posting a job, you agree to our Terms of Service and Community Guidelines
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 72px)",
    padding: "2rem 0",
  },
  header: {
    marginBottom: "2rem",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  card: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1.5rem",
    padding: "2.5rem",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  icon: {
    width: "60px",
    height: "60px",
    borderRadius: "1rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    flexShrink: 0,
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "1rem",
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.5rem",
  },
  label: {
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  required: {
    color: "#f87171",
  },
  input: {
    padding: "0.75rem 1rem",
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.5rem",
    color: "#fff",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.2s ease",
  },
  textarea: {
    resize: "vertical",
    minHeight: "120px",
    fontFamily: "inherit",
  },
  select: {
    padding: "0.75rem 1rem",
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.5rem",
    color: "#fff",
    fontSize: "0.875rem",
    outline: "none",
    cursor: "pointer",
  },
  hint: {
    color: "#64748b",
    fontSize: "0.75rem",
  },
  budgetRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  budgetInput: {
    flex: 1,
    position: "relative",
  },
  currencySymbol: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: "600",
    pointerEvents: "none",
  },
  budgetSeparator: {
    color: "#64748b",
    fontSize: "1.25rem",
  },
  submitButton: {
    marginTop: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  spinner: {
    width: "16px",
    height: "16px",
  },
  terms: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.75rem",
    marginTop: "0.5rem",
  },
};