import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, total: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const response = await api.get("/projects");
      const data = response.data;
      const projectList = Array.isArray(data) ? data : data.projects || [];

      setProjects(projectList);

      // Calculate stats - active includes in_progress, under_review, revision_requested
      const activeStatuses = ["in_progress", "under_review", "revision_requested"];
      setStats({
        active: projectList.filter(p => activeStatuses.includes(p.status)).length,
        completed: projectList.filter(p => p.status === "completed").length,
        total: projectList.length,
      });
    } catch (err) {
      setError("Failed to load projects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      in_progress: { className: "badge-info", text: "Active", icon: "🔵" },
      under_review: { className: "badge-warning", text: "Under Review", icon: "🟡" },
      revision_requested: { className: "badge-warning", text: "Revision", icon: "🔄" },

      completed: { className: "badge-success", text: "Completed", icon: "✅" },
      cancelled: { className: "badge-error", text: "Cancelled", icon: "❌" },
    };
    return badges[status] || { className: "badge-info", text: status || "Active", icon: "🔵" };
  };

  return (
    <>
      <Navbar />
      <div style={styles.page}>
        <div className="container">
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                Welcome back, {user.name}! 👋
              </h1>
              <p style={styles.subtitle}>
                Here's what's happening with your projects
              </p>
            </div>
            <div style={styles.actions}>
              <button
                onClick={() => navigate("/jobs")}
                className="btn btn-outline"
              >
                🌍 Browse Jobs
              </button>
              {user?.role === "client" && (
                <button
                  onClick={() => navigate("/jobs/create")}
                  className="btn btn-primary"
                >
                  ➕ Post New Job
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📊</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.total}</div>
                <div style={styles.statLabel}>Total Projects</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                🔵
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.active}</div>
                <div style={styles.statLabel}>Active Projects</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" }}>
                ✅
              </div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats.completed}</div>
                <div style={styles.statLabel}>Completed</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Projects Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Your Projects</h2>
              {projects.length > 0 && (
                <span style={styles.badge}>{projects.length}</span>
              )}
            </div>

            {loading ? (
              <div style={styles.loading}>
                <div className="spinner"></div>
                <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📂</div>
                <h3 style={styles.emptyTitle}>No projects yet</h3>
                <p style={styles.emptyText}>
                  {user?.role === "client"
                    ? "Post your first job to get started!"
                    : "Browse available jobs and submit proposals to start working."}
                </p>
                <button
                  onClick={() => navigate("/jobs")}
                  className="btn btn-primary"
                  style={{ marginTop: "1.5rem" }}
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div style={styles.projectsGrid}>
                {projects.map((project) => {
                  const statusBadge = getStatusBadge(project.status);
                  return (
                    <div
                      key={project.id}
                      style={styles.projectCard}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="card-hover"
                    >
                      <div style={styles.projectHeader}>
                        <span className={`badge ${statusBadge.className}`}>
                          {statusBadge.icon} {statusBadge.text}
                        </span>
                        <span style={styles.projectId}>#{project.id}</span>
                      </div>

                      <div style={styles.projectBody}>
                        <h3 style={styles.projectTitle}>
                          Project #{project.id}
                        </h3>

                        <div style={styles.projectMeta}>
                          <div style={styles.metaItem}>
                            <span style={styles.metaLabel}>Role:</span>
                            <span style={styles.metaValue}>
                              {user.role === "client" ? "Client" : "Editor"}
                            </span>
                          </div>

                          {project.created_at && (
                            <div style={styles.metaItem}>
                              <span style={styles.metaLabel}>Created:</span>
                              <span style={styles.metaValue}>
                                {new Date(project.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={styles.projectFooter}>
                        <span style={styles.viewDetails}>
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
  actions: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2.5rem",
  },
  statCard: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1rem",
    padding: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    transition: "all 0.3s ease",
  },
  statIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "1rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#fff",
    lineHeight: 1,
    marginBottom: "0.25rem",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  section: {
    marginTop: "2rem",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#fff",
  },
  badge: {
    background: "rgba(34, 211, 238, 0.2)",
    color: "#22d3ee",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.875rem",
    fontWeight: "600",
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
  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  projectCard: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "1rem",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  projectId: {
    color: "#64748b",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  projectBody: {
    marginBottom: "1rem",
  },
  projectTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "1rem",
  },
  projectMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  metaItem: {
    display: "flex",
    gap: "0.5rem",
  },
  metaLabel: {
    color: "#64748b",
    fontSize: "0.875rem",
    minWidth: "80px",
  },
  metaValue: {
    color: "#e2e8f0",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  projectFooter: {
    paddingTop: "1rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  viewDetails: {
    color: "#22d3ee",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
};