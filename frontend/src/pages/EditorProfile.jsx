import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function EditorProfile() {
    const { editorId } = useParams();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showHireModal, setShowHireModal] = useState(false);
    const [hireLoading, setHireLoading] = useState(false);
    const [hireForm, setHireForm] = useState({
        title: "",
        description: "",
        budget: "",
        message: "",
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isClient = user.role === "client";

    useEffect(() => {
        loadProfile();
    }, [editorId]);

    async function loadProfile() {
        try {
            setLoading(true);
            const response = await api.get(`/portfolio/editor/${editorId}`);
            setProfile(response.data.profile);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load profile");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleHireEditor(e) {
        e.preventDefault();
        if (!hireForm.title || !hireForm.description) {
            alert("Please fill in title and description");
            return;
        }

        if (hireForm.title.length < 10) {
            alert("Title must be at least 10 characters");
            return;
        }

        if (hireForm.description.length < 20) {
            alert("Description must be at least 20 characters");
            return;
        }

        setHireLoading(true);
        try {
            // Create a private job specifically for this editor
            const jobResponse = await api.post("/jobs", {
                title: hireForm.title,
                description: hireForm.description,
                budget_min: parseInt(hireForm.budget) || 0,
                budget_max: parseInt(hireForm.budget) || 0,
                target_editor_id: parseInt(editorId) // Make this a private job for this specific editor
            });

            const jobId = jobResponse.data.job?.id || jobResponse.data.id;

            alert(`Job invitation sent to "${profile.name}"! They will receive a notification and can submit a proposal.`);
            setShowHireModal(false);
            setHireForm({ title: "", description: "", budget: "", message: "" });
            navigate(`/jobs/${jobId}`);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create job");
        } finally {
            setHireLoading(false);
        }
    }

    return (
        <>
            <Navbar />
            <div style={styles.page}>
                <div className="container" style={{ maxWidth: "1000px" }}>
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

                    {/* Loading */}
                    {loading && (
                        <div style={styles.loading}>
                            <div className="spinner"></div>
                            <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading profile...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Profile Content */}
                    {!loading && profile && (
                        <>
                            {/* Profile Header */}
                            <div style={styles.profileCard}>
                                <div style={styles.profileHeader}>
                                    <div style={styles.avatar}>
                                        {profile.name?.charAt(0).toUpperCase() || "E"}
                                    </div>
                                    <div style={styles.profileInfo}>
                                        <h1 style={styles.profileName}>{profile.name}</h1>
                                        <p style={styles.profileEmail}>{profile.email}</p>
                                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                                            <span className="badge badge-info">Video Editor</span>
                                            {isClient && (
                                                <button
                                                    onClick={() => setShowHireModal(true)}
                                                    style={styles.hireButton}
                                                >
                                                    💼 Hire This Editor
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.divider}></div>

                                {/* Stats */}
                                <div style={styles.statsGrid}>
                                    <div style={styles.statCard}>
                                        <div style={styles.statValue}>{profile.stats?.completedProjects || 0}</div>
                                        <div style={styles.statLabel}>Completed Projects</div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statValue}>{profile.stats?.acceptedProposals || 0}</div>
                                        <div style={styles.statLabel}>Accepted Proposals</div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statValue}>{profile.stats?.successRate || 0}%</div>
                                        <div style={styles.statLabel}>Success Rate</div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statValue}>{profile.portfolio?.length || 0}</div>
                                        <div style={styles.statLabel}>Portfolio Items</div>
                                    </div>
                                </div>
                            </div>

                            {/* Portfolio Section */}
                            <div style={styles.section}>
                                <h2 style={styles.sectionTitle}>Portfolio 🎬</h2>

                                {profile.portfolio?.length === 0 ? (
                                    <div style={styles.emptyPortfolio}>
                                        <div style={styles.emptyIcon}>🎥</div>
                                        <p style={styles.emptyText}>No portfolio items yet</p>
                                    </div>
                                ) : (
                                    <div style={styles.portfolioGrid}>
                                        {profile.portfolio?.map((item) => (
                                            <div key={item.id} style={styles.portfolioCard}>
                                                {item.thumbnail_url ? (
                                                    <div
                                                        style={{
                                                            ...styles.thumbnail,
                                                            backgroundImage: `url(${item.thumbnail_url})`,
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={styles.thumbnailPlaceholder}>
                                                        🎬
                                                    </div>
                                                )}

                                                <div style={styles.portfolioContent}>
                                                    <h3 style={styles.portfolioTitle}>{item.title}</h3>
                                                    <p style={styles.portfolioDescription}>
                                                        {item.description?.slice(0, 100)}
                                                        {item.description?.length > 100 ? "..." : ""}
                                                    </p>

                                                    {item.category && (
                                                        <span className="badge badge-info" style={{ marginTop: "0.5rem" }}>
                                                            {item.category}
                                                        </span>
                                                    )}

                                                    {item.tags?.length > 0 && (
                                                        <div style={styles.tags}>
                                                            {item.tags.slice(0, 3).map((tag, index) => (
                                                                <span key={index} style={styles.tag}>
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {item.video_url && (
                                                    <a
                                                        href={item.video_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-outline"
                                                        style={{ margin: "1rem", display: "block", textAlign: "center" }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        ▶️ Watch Video
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Member Info */}
                            <div style={styles.memberInfo}>
                                <span style={styles.memberText}>
                                    Member since {new Date(profile.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Hire Modal */}
                    {showHireModal && (
                        <div style={styles.modalOverlay}>
                            <div style={styles.modal}>
                                <h2 style={styles.modalTitle}>
                                    💼 Hire {profile?.name}
                                </h2>
                                <p style={styles.modalSubtitle}>
                                    Create a job offer for this editor
                                </p>

                                <form onSubmit={handleHireEditor}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Project Title *</label>
                                        <input
                                            type="text"
                                            value={hireForm.title}
                                            onChange={(e) => setHireForm({ ...hireForm, title: e.target.value })}
                                            style={styles.input}
                                            placeholder="e.g., YouTube Video Edit"
                                            required
                                            minLength={10}
                                        />
                                        <small style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                            Min 10 characters ({hireForm.title.length}/10)
                                        </small>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Project Description *</label>
                                        <textarea
                                            value={hireForm.description}
                                            onChange={(e) => setHireForm({ ...hireForm, description: e.target.value })}
                                            style={{ ...styles.input, minHeight: "100px", resize: "vertical" }}
                                            placeholder="Describe your project requirements..."
                                            required
                                            minLength={20}
                                        />
                                        <small style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                            Min 20 characters ({hireForm.description.length}/20)
                                        </small>
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Budget ($)</label>
                                        <input
                                            type="number"
                                            value={hireForm.budget}
                                            onChange={(e) => setHireForm({ ...hireForm, budget: e.target.value })}
                                            style={styles.input}
                                            placeholder="Your budget"
                                            min="0"
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Message to Editor</label>
                                        <textarea
                                            value={hireForm.message}
                                            onChange={(e) => setHireForm({ ...hireForm, message: e.target.value })}
                                            style={{ ...styles.input, minHeight: "60px", resize: "vertical" }}
                                            placeholder="Any personal message..."
                                        />
                                    </div>

                                    <div style={styles.modalActions}>
                                        <button
                                            type="button"
                                            onClick={() => setShowHireModal(false)}
                                            style={styles.cancelBtn}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={styles.submitBtn}
                                            disabled={hireLoading}
                                        >
                                            {hireLoading ? "Creating..." : "Create Job Offer"}
                                        </button>
                                    </div>
                                </form>
                            </div>
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
    profileCard: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1.5rem",
        padding: "2.5rem",
        marginBottom: "2rem",
    },
    profileHeader: {
        display: "flex",
        alignItems: "center",
        gap: "2rem",
        flexWrap: "wrap",
    },
    avatar: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "3rem",
        fontWeight: "700",
        flexShrink: 0,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: "2rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "0.5rem",
    },
    profileEmail: {
        color: "#94a3b8",
        fontSize: "1rem",
        marginBottom: "0.75rem",
    },
    divider: {
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
        margin: "2rem 0",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "1.5rem",
    },
    statCard: {
        textAlign: "center",
        padding: "1rem",
        background: "rgba(30, 41, 59, 0.5)",
        borderRadius: "1rem",
    },
    statValue: {
        fontSize: "2rem",
        fontWeight: "700",
        color: "#22d3ee",
        marginBottom: "0.25rem",
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    section: {
        marginBottom: "2rem",
    },
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "1.5rem",
    },
    emptyPortfolio: {
        textAlign: "center",
        padding: "3rem 2rem",
        background: "rgba(15, 23, 42, 0.4)",
        borderRadius: "1rem",
        border: "2px dashed rgba(255, 255, 255, 0.1)",
    },
    emptyIcon: {
        fontSize: "3rem",
        marginBottom: "0.5rem",
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: "1rem",
    },
    portfolioGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
    },
    portfolioCard: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1rem",
        overflow: "hidden",
        transition: "all 0.3s ease",
    },
    thumbnail: {
        height: "180px",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "rgba(30, 41, 59, 0.5)",
    },
    thumbnailPlaceholder: {
        height: "180px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        fontSize: "4rem",
    },
    portfolioContent: {
        padding: "1.5rem",
    },
    portfolioTitle: {
        fontSize: "1.125rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "0.5rem",
    },
    portfolioDescription: {
        color: "#94a3b8",
        fontSize: "0.875rem",
        lineHeight: 1.6,
    },
    tags: {
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginTop: "1rem",
    },
    tag: {
        background: "rgba(102, 126, 234, 0.2)",
        color: "#667eea",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.25rem",
        fontSize: "0.75rem",
        fontWeight: "500",
    },
    memberInfo: {
        textAlign: "center",
        padding: "2rem 0",
    },
    memberText: {
        color: "#64748b",
        fontSize: "0.875rem",
    },
    // Hire button and modal styles
    hireButton: {
        padding: "0.5rem 1.25rem",
        backgroundColor: "#22c55e",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "0.9rem",
        transition: "all 0.2s ease",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
    },
    modal: {
        backgroundColor: "#1e293b",
        padding: "2rem",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflow: "auto",
        border: "1px solid rgba(255, 255, 255, 0.1)",
    },
    modalTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "0.5rem",
    },
    modalSubtitle: {
        color: "#94a3b8",
        marginBottom: "1.5rem",
    },
    formGroup: {
        marginBottom: "1.25rem",
    },
    label: {
        display: "block",
        marginBottom: "0.5rem",
        color: "#e2e8f0",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
    input: {
        width: "100%",
        padding: "0.75rem 1rem",
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "1rem",
        boxSizing: "border-box",
    },
    modalActions: {
        display: "flex",
        gap: "1rem",
        justifyContent: "flex-end",
        marginTop: "1.5rem",
    },
    cancelBtn: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "transparent",
        border: "1px solid #475569",
        borderRadius: "8px",
        color: "#fff",
        cursor: "pointer",
        fontSize: "1rem",
    },
    submitBtn: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#22c55e",
        border: "none",
        borderRadius: "8px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "1rem",
    },
};
