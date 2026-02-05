import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function MyPortfolio() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [tags, setTags] = useState("");

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        if (user.role !== "editor") {
            navigate("/dashboard");
            return;
        }
        loadPortfolio();
    }, []);

    async function loadPortfolio() {
        try {
            setLoading(true);
            const response = await api.get("/portfolio/my");
            setItems(response.data.items || []);
        } catch (err) {
            setError("Failed to load portfolio");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function openAddModal() {
        setEditingItem(null);
        resetForm();
        setShowModal(true);
    }

    function openEditModal(item) {
        setEditingItem(item);
        setTitle(item.title);
        setDescription(item.description);
        setCategory(item.category || "");
        setThumbnailUrl(item.thumbnail_url || "");
        setVideoUrl(item.video_url || "");
        setTags(item.tags?.join(", ") || "");
        setShowModal(true);
    }

    function resetForm() {
        setTitle("");
        setDescription("");
        setCategory("");
        setThumbnailUrl("");
        setVideoUrl("");
        setTags("");
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            alert("Title and description are required");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                category: category.trim() || null,
                thumbnailUrl: thumbnailUrl.trim() || null,
                videoUrl: videoUrl.trim() || null,
                tags: tags.split(",").map((t) => t.trim()).filter((t) => t),
            };

            if (editingItem) {
                await api.put(`/portfolio/${editingItem.id}`, payload);
            } else {
                await api.post("/portfolio", payload);
            }

            setShowModal(false);
            loadPortfolio();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to save portfolio item");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this portfolio item?")) {
            return;
        }

        try {
            await api.delete(`/portfolio/${id}`);
            loadPortfolio();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete item");
            console.error(err);
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
                            <h1 style={styles.title}>My Portfolio 🎨</h1>
                            <p style={styles.subtitle}>Showcase your best video editing work</p>
                        </div>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            ➕ Add New Work
                        </button>
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
                            <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading portfolio...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>🎬</div>
                            <h3 style={styles.emptyTitle}>No portfolio items yet</h3>
                            <p style={styles.emptyText}>
                                Add your best work to attract clients
                            </p>
                            <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: "1.5rem" }}>
                                Add Your First Work
                            </button>
                        </div>
                    ) : (
                        <div style={styles.portfolioGrid}>
                            {items.map((item) => (
                                <div key={item.id} style={styles.portfolioCard}>
                                    {item.thumbnail_url ? (
                                        <div
                                            style={{
                                                ...styles.thumbnail,
                                                backgroundImage: `url(${item.thumbnail_url})`,
                                            }}
                                        />
                                    ) : (
                                        <div style={styles.thumbnailPlaceholder}>🎬</div>
                                    )}

                                    <div style={styles.cardContent}>
                                        <h3 style={styles.cardTitle}>{item.title}</h3>
                                        <p style={styles.cardDescription}>
                                            {item.description?.slice(0, 100)}
                                            {item.description?.length > 100 ? "..." : ""}
                                        </p>

                                        {item.category && (
                                            <span className="badge badge-info" style={{ marginBottom: "0.5rem" }}>
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

                                    <div style={styles.cardActions}>
                                        {item.video_url && (
                                            <a
                                                href={item.video_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline"
                                                style={styles.actionBtn}
                                            >
                                                ▶️ View
                                            </a>
                                        )}
                                        <button
                                            className="btn btn-outline"
                                            style={styles.actionBtn}
                                            onClick={() => openEditModal(item)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{ ...styles.actionBtn, color: "#f87171" }}
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editingItem ? "Edit Portfolio Item" : "Add Portfolio Item"}
                            </h2>
                            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Corporate Brand Video"
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Description *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your work, techniques used, and results achieved..."
                                    rows="4"
                                    style={{ ...styles.input, ...styles.textarea }}
                                    required
                                />
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="e.g., YouTube, Corporate"
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        placeholder="e.g., motion graphics, color grading"
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Thumbnail URL</label>
                                <input
                                    type="url"
                                    value={thumbnailUrl}
                                    onChange={(e) => setThumbnailUrl(e.target.value)}
                                    placeholder="https://example.com/thumbnail.jpg"
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Video URL</label>
                                <input
                                    type="url"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? "Saving..." : editingItem ? "Update" : "Add to Portfolio"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
    portfolioGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "1.5rem",
    },
    portfolioCard: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1rem",
        overflow: "hidden",
    },
    thumbnail: {
        height: "200px",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "rgba(30, 41, 59, 0.5)",
    },
    thumbnailPlaceholder: {
        height: "200px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        fontSize: "4rem",
    },
    cardContent: {
        padding: "1.5rem",
    },
    cardTitle: {
        fontSize: "1.25rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "0.5rem",
    },
    cardDescription: {
        color: "#94a3b8",
        fontSize: "0.875rem",
        lineHeight: 1.6,
        marginBottom: "0.75rem",
    },
    tags: {
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        marginTop: "0.5rem",
    },
    tag: {
        background: "rgba(102, 126, 234, 0.2)",
        color: "#667eea",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.25rem",
        fontSize: "0.75rem",
        fontWeight: "500",
    },
    cardActions: {
        display: "flex",
        gap: "0.5rem",
        padding: "1rem 1.5rem",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    },
    actionBtn: {
        flex: 1,
        padding: "0.5rem",
        fontSize: "0.75rem",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
    },
    modal: {
        background: "#0f172a",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1.5rem",
        width: "100%",
        maxWidth: "600px",
        maxHeight: "90vh",
        overflow: "auto",
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    modalTitle: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#fff",
    },
    closeBtn: {
        background: "none",
        border: "none",
        color: "#94a3b8",
        fontSize: "1.25rem",
        cursor: "pointer",
        padding: "0.5rem",
    },
    form: {
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
    },
    formRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
    },
    label: {
        color: "#e2e8f0",
        fontSize: "0.875rem",
        fontWeight: "600",
    },
    input: {
        padding: "0.75rem 1rem",
        background: "rgba(30, 41, 59, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "0.5rem",
        color: "#fff",
        fontSize: "0.875rem",
        outline: "none",
    },
    textarea: {
        resize: "vertical",
        minHeight: "100px",
        fontFamily: "inherit",
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "1rem",
        marginTop: "1rem",
    },
};
