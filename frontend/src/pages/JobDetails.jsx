import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [job, setJob] = useState(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [myProposal, setMyProposal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  async function loadJobDetails() {
    try {
      setLoading(true);

      // Fetch job details
      const jobResponse = await api.get(`/jobs/${id}`);
      setJob(jobResponse.data);

      // Check if editor already submitted proposal
      if (user?.role === "editor") {
        try {
          const proposalResponse = await api.get(`/proposals/job/${id}/me`);
          setMyProposal(proposalResponse.data);
        } catch (err) {
          // No proposal yet - that's okay
        }
      }

    } catch (err) {
      setError(err.response?.data?.error || "Failed to load job details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function submitProposal() {
    if (!price || !message) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/proposals/job/${id}`, {
        price,
        message,
      });

      setMyProposal(response.data);
      alert("Proposal submitted successfully! ✅");

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  }

  const isOwner = user?.id === job?.client_id;

  const getDurationBadge = (duration) => {
    if (!duration) return null;
    const days = parseInt(duration);
    if (days <= 7) return { className: "badge-success", text: `${days} days`, icon: "⚡" };
    if (days <= 30) return { className: "badge-info", text: `${days} days`, icon: "📅" };
    return { className: "badge-warning", text: `${days} days`, icon: "⏳" };
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div className="container" style={{ maxWidth: "900px" }}>
          {/* Back Button */}
          <div style={styles.header}>
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={styles.loading}>
              <div className="spinner"></div>
              <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading job details...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Job Details */}
          {!loading && job && (
            <>
              {/* Main Job Card */}
              <div style={styles.jobCard}>
                <div style={styles.jobHeader}>
                  <h1 style={styles.jobTitle}>{job.title}</h1>
                  {job.duration_days && getDurationBadge(job.duration_days) && (
                    <span className={`badge ${getDurationBadge(job.duration_days).className}`}>
                      {getDurationBadge(job.duration_days).icon} {getDurationBadge(job.duration_days).text}
                    </span>
                  )}
                </div>

                <div style={styles.jobMeta}>
                  <div style={styles.metaItem}>
                    <span style={styles.metaIcon}>💰</span>
                    <div>
                      <div style={styles.metaLabel}>Budget</div>
                      <div style={styles.metaValue}>
                        ${job.budget_min || 0} - ${job.budget_max || 0}
                      </div>
                    </div>
                  </div>

                  {job.required_experience && (
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>⭐</span>
                      <div>
                        <div style={styles.metaLabel}>Experience Level</div>
                        <div style={styles.metaValue}>
                          {job.required_experience.charAt(0).toUpperCase() + job.required_experience.slice(1)}
                        </div>
                      </div>
                    </div>
                  )}

                  {job.category && (
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>📂</span>
                      <div>
                        <div style={styles.metaLabel}>Category</div>
                        <div style={styles.metaValue}>{job.category}</div>
                      </div>
                    </div>
                  )}

                  {job.created_at && (
                    <div style={styles.metaItem}>
                      <span style={styles.metaIcon}>📅</span>
                      <div>
                        <div style={styles.metaLabel}>Posted</div>
                        <div style={styles.metaValue}>
                          {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={styles.divider}></div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Job Description</h3>
                  <p style={styles.description}>{job.description}</p>
                </div>

                {job.client_name && (
                  <>
                    <div style={styles.divider}></div>
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Client Information</h3>
                      <div style={styles.clientInfo}>
                        <div style={styles.clientAvatar}>
                          {job.client_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.clientName}>{job.client_name}</div>
                          <div style={styles.clientLabel}>Project Client</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Client Actions */}
              {user?.role === "client" && isOwner && (
                <div style={styles.actionCard}>
                  <div style={styles.actionHeader}>
                    <div style={styles.actionIcon}>📨</div>
                    <div>
                      <h3 style={styles.actionTitle}>Review Proposals</h3>
                      <p style={styles.actionSubtitle}>
                        Check the proposals submitted by editors
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/jobs/${job.id}/proposals`)}
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                  >
                    View All Proposals →
                  </button>
                </div>
              )}

              {/* Editor - Already Applied */}
              {user?.role === "editor" && myProposal && (
                <div style={styles.successCard}>
                  <div style={styles.successIcon}>✅</div>
                  <div>
                    <h3 style={styles.successTitle}>Proposal Submitted</h3>
                    <p style={styles.successText}>
                      You've already submitted a proposal for this job. The client will review it and get back to you.
                    </p>
                    <div style={styles.proposalDetails}>
                      <div style={styles.proposalItem}>
                        <span style={styles.proposalLabel}>Your Price:</span>
                        <span style={styles.proposalValue}>${myProposal.price}</span>
                      </div>
                      <div style={styles.proposalItem}>
                        <span style={styles.proposalLabel}>Status:</span>
                        <span className={`badge badge-${myProposal.status === "pending" ? "warning" : "info"}`}>
                          {myProposal.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor - Apply Form */}
              {user?.role === "editor" && !isOwner && !myProposal && (
                <div style={styles.applyCard}>
                  <div style={styles.applyHeader}>
                    <div style={styles.applyIcon}>📝</div>
                    <div>
                      <h3 style={styles.applyTitle}>Submit Your Proposal</h3>
                      <p style={styles.applySubtitle}>
                        Convince the client why you're the best fit
                      </p>
                    </div>
                  </div>

                  <div style={styles.divider}></div>

                  <div style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Your Price (USD)</label>
                      <div style={styles.priceInput}>
                        <span style={styles.currencySymbol}>$</span>
                        <input
                          type="number"
                          placeholder="Enter your price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="0"
                          style={{ ...styles.input, paddingLeft: "2rem" }}
                        />
                      </div>
                      <small style={styles.hint}>
                        Budget range: ${job.budget_min || 0} - ${job.budget_max || 0}
                      </small>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Cover Letter</label>
                      <textarea
                        placeholder="Explain your approach, relevant experience, and why you're the perfect fit for this project..."
                        rows="6"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        style={{ ...styles.input, ...styles.textarea }}
                      />
                      <small style={styles.hint}>
                        Include your portfolio links and relevant past work
                      </small>
                    </div>

                    <button
                      onClick={submitProposal}
                      disabled={submitting || !price || !message}
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                    >
                      {submitting ? (
                        <>
                          <div className="spinner" style={{ width: "16px", height: "16px" }}></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Proposal →"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0",
  },
  jobCard: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1.5rem",
    padding: "2.5rem",
    marginBottom: "2rem",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  jobTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  jobMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  metaIcon: {
    fontSize: "1.5rem",
  },
  metaLabel: {
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  metaValue: {
    color: "#e2e8f0",
    fontSize: "1rem",
    fontWeight: "600",
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
    margin: "2rem 0",
  },
  section: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "1rem",
  },
  description: {
    color: "#94a3b8",
    fontSize: "1rem",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
  clientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  clientAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "1.5rem",
    fontWeight: "600",
  },
  clientName: {
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
  },
  clientLabel: {
    color: "#64748b",
    fontSize: "0.875rem",
  },
  actionCard: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(34, 211, 238, 0.3)",
    borderRadius: "1.5rem",
    padding: "2rem",
  },
  actionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  actionIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "1rem",
    background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
  },
  actionTitle: {
    color: "#fff",
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "0.25rem",
  },
  actionSubtitle: {
    color: "#94a3b8",
    fontSize: "0.875rem",
  },
  successCard: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "1.5rem",
    padding: "2rem",
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  successIcon: {
    fontSize: "2rem",
  },
  successTitle: {
    color: "#10b981",
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
  },
  successText: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  proposalDetails: {
    display: "flex",
    gap: "2rem",
  },
  proposalItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  proposalLabel: {
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  proposalValue: {
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
  },
  applyCard: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1.5rem",
    padding: "2rem",
  },
  applyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  applyIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "1rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
  },
  applyTitle: {
    color: "#fff",
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "0.25rem",
  },
  applySubtitle: {
    color: "#94a3b8",
    fontSize: "0.875rem",
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
  label: {
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  priceInput: {
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
  input: {
    width: "100%",
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
  hint: {
    color: "#64748b",
    fontSize: "0.75rem",
  },
};