import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, budgetFilter]);

  async function loadJobs() {
    try {
      setLoading(true);
      const response = await api.get("/jobs");
      setJobs(response.data);
    } catch (err) {
      setError("Failed to load jobs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function filterJobs() {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Budget filter
    if (budgetFilter !== "all") {
      filtered = filtered.filter((job) => {
        const budget = parseInt(job.budget_max || 0);
        switch (budgetFilter) {
          case "low":
            return budget < 500;
          case "medium":
            return budget >= 500 && budget < 2000;
          case "high":
            return budget >= 2000;
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
  }

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
        <div className="container">
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Browse Jobs 🌍</h1>
              <p style={styles.subtitle}>
                Find your next video editing project
              </p>
            </div>
            <div style={styles.stats}>
              <span style={styles.statBadge}>
                {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} available
              </span>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filters}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search jobs by title, description, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={styles.clearButton}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Budgets</option>
              <option value="low">Under $500</option>
              <option value="medium">$500 - $2,000</option>
              <option value="high">$2,000+</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Jobs List */}
          {loading ? (
            <div style={styles.loading}>
              <div className="spinner"></div>
              <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                {searchTerm || budgetFilter !== "all" ? "🔍" : "📋"}
              </div>
              <h3 style={styles.emptyTitle}>
                {searchTerm || budgetFilter !== "all"
                  ? "No jobs match your filters"
                  : "No jobs posted yet"}
              </h3>
              <p style={styles.emptyText}>
                {searchTerm || budgetFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Check back later for new opportunities"}
              </p>
              {(searchTerm || budgetFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setBudgetFilter("all");
                  }}
                  className="btn btn-outline"
                  style={{ marginTop: "1.5rem" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={styles.jobsGrid}>
              {filteredJobs.map((job) => {
                const durationBadge = getDurationBadge(job.duration_days);
                return (
                  <div
                    key={job.id}
                    style={styles.jobCard}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="card-hover"
                  >
                    {/* Card Header */}
                    <div style={styles.cardHeader}>
                      <div style={styles.jobTitle}>{job.title}</div>
                      {durationBadge && (
                        <span className={`badge ${durationBadge.className}`}>
                          {durationBadge.icon} {durationBadge.text}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div style={styles.cardBody}>
                      <p style={styles.description}>
                        {job.description?.slice(0, 150)}
                        {job.description?.length > 150 ? "..." : ""}
                      </p>

                      <div style={styles.jobDetails}>
                        <div style={styles.detailItem}>
                          <span style={styles.detailIcon}>💰</span>
                          <span style={styles.detailText}>
                            ${job.budget_min || 0} - ${job.budget_max || 0}
                          </span>
                        </div>

                        {job.required_experience && (
                          <div style={styles.detailItem}>
                            <span style={styles.detailIcon}>⭐</span>
                            <span style={styles.detailText}>
                              {job.required_experience}
                            </span>
                          </div>
                        )}

                        {job.category && (
                          <div style={styles.detailItem}>
                            <span style={styles.detailIcon}>📂</span>
                            <span style={styles.detailText}>{job.category}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div style={styles.cardFooter}>
                      <div style={styles.clientInfo}>
                        <div style={styles.clientAvatar}>
                          {job.client_name?.charAt(0).toUpperCase() || "C"}
                        </div>
                        <div>
                          <div style={styles.clientName}>{job.client_name || "Client"}</div>
                          <div style={styles.postedDate}>
                            Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : "recently"}
                          </div>
                        </div>
                      </div>

                      <span style={styles.viewButton}>
                        View Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
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
  stats: {
    display: "flex",
    gap: "1rem",
  },
  statBadge: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "0.5rem 1rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#fff",
  },
  filters: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  searchBox: {
    flex: 1,
    minWidth: "300px",
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    fontSize: "1.25rem",
    pointerEvents: "none",
  },
  searchInput: {
    flex: 1,
    padding: "0.75rem 2.5rem 0.75rem 3rem",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.75rem",
    color: "#fff",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.3s ease",
  },
  clearButton: {
    position: "absolute",
    right: "1rem",
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#94a3b8",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    transition: "all 0.2s ease",
  },
  select: {
    padding: "0.75rem 1rem",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.75rem",
    color: "#fff",
    fontSize: "0.875rem",
    outline: "none",
    cursor: "pointer",
    minWidth: "150px",
  },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "1rem",
    border: "2px dashed rgba(255, 255, 255, 0.1)",
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "0.5rem",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "1rem",
  },
  jobsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: "1.5rem",
  },
  jobCard: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1rem",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },
  jobTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  cardBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  description: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    lineHeight: 1.6,
  },
  jobDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  detailIcon: {
    fontSize: "1rem",
  },
  detailText: {
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "1rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  clientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  clientAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: "0.875rem",
  },
  clientName: {
    color: "#fff",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  postedDate: {
    color: "#64748b",
    fontSize: "0.75rem",
  },
  viewButton: {
    color: "#22d3ee",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
};