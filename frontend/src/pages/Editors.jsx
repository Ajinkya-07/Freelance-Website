import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Editors() {
    const [editors, setEditors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        loadEditors();
    }, []);

    async function loadEditors() {
        try {
            setLoading(true);
            const response = await api.get("/portfolio/editors");
            setEditors(response.data.editors || []);
        } catch (err) {
            setError("Failed to load editors");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Navbar />
            <div style={styles.page}>
                <div className="container">
                    {/* Header */}
                    <div style={styles.header}>
                        <div>
                            <h1 style={styles.title}>Discover Editors 🎬</h1>
                            <p style={styles.subtitle}>
                                Find talented video editors for your projects
                            </p>
                        </div>
                        <span style={styles.countBadge}>
                            {editors.length} Editors
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div style={styles.loading}>
                            <div className="spinner"></div>
                            <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading editors...</p>
                        </div>
                    ) : editors.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>👥</div>
                            <h3 style={styles.emptyTitle}>No editors yet</h3>
                            <p style={styles.emptyText}>
                                Be the first to join as a video editor!
                            </p>
                        </div>
                    ) : (
                        <div style={styles.editorsGrid}>
                            {editors.map((editor) => (
                                <div
                                    key={editor.id}
                                    style={styles.editorCard}
                                    onClick={() => navigate(`/editors/${editor.id}`)}
                                    className="card-hover"
                                >
                                    <div style={styles.editorAvatar}>
                                        {editor.name?.charAt(0).toUpperCase() || "E"}
                                    </div>

                                    <h3 style={styles.editorName}>{editor.name}</h3>

                                    <div style={styles.editorStats}>
                                        <div style={styles.statItem}>
                                            <span style={styles.statValue}>{editor.completed_projects || 0}</span>
                                            <span style={styles.statLabel}>Projects</span>
                                        </div>
                                        <div style={styles.statItem}>
                                            <span style={styles.statValue}>{editor.portfolio_count || 0}</span>
                                            <span style={styles.statLabel}>Portfolio</span>
                                        </div>
                                    </div>

                                    <div style={styles.joinedDate}>
                                        Member since {new Date(editor.created_at).toLocaleDateString()}
                                    </div>

                                    <button
                                        className="btn btn-outline"
                                        style={styles.viewButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/editors/${editor.id}`);
                                        }}
                                    >
                                        View Profile →
                                    </button>
                                </div>
                            ))}
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
    countBadge: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "0.5rem 1rem",
        borderRadius: "9999px",
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#fff",
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
    editorsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.5rem",
    },
    editorCard: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1.5rem",
        padding: "2rem",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
    editorAvatar: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "2rem",
        fontWeight: "700",
        margin: "0 auto 1rem",
    },
    editorName: {
        fontSize: "1.25rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "1rem",
    },
    editorStats: {
        display: "flex",
        justifyContent: "center",
        gap: "2rem",
        marginBottom: "1rem",
        padding: "1rem 0",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    statItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    statValue: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#22d3ee",
    },
    statLabel: {
        fontSize: "0.75rem",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    joinedDate: {
        color: "#64748b",
        fontSize: "0.75rem",
        marginBottom: "1rem",
    },
    viewButton: {
        width: "100%",
    },
};
