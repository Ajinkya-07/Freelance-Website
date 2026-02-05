import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "client" });
    const [actionLoading, setActionLoading] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Check if user is admin
    useEffect(() => {
        if (user.role !== "admin") {
            navigate("/dashboard");
        }
    }, [user.role, navigate]);

    useEffect(() => {
        loadStats();
        loadUsers();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [searchTerm, roleFilter]);

    async function loadStats() {
        try {
            const response = await api.get("/admin/stats");
            setStats(response.data.stats);
        } catch (err) {
            console.error("Failed to load stats", err);
        }
    }

    async function loadUsers() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (roleFilter) params.append("role", roleFilter);

            const response = await api.get(`/admin/users?${params.toString()}`);
            setUsers(response.data.users || []);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post("/admin/users", formData);
            setShowCreateModal(false);
            setFormData({ name: "", email: "", password: "", role: "client" });
            loadUsers();
            loadStats();
            alert("User created successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to create user");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleUpdateUser(e) {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.put(`/admin/users/${selectedUser.id}`, {
                name: formData.name,
                email: formData.email,
                role: formData.role,
            });
            setShowEditModal(false);
            setSelectedUser(null);
            loadUsers();
            alert("User updated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update user");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDeleteUser(userId, userName) {
        if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await api.delete(`/admin/users/${userId}`);
            loadUsers();
            loadStats();
            alert("User deleted successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete user");
        }
    }

    function openEditModal(user) {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: "", role: user.role });
        setShowEditModal(true);
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "admin": return "#e74c3c";
            case "editor": return "#3498db";
            case "client": return "#27ae60";
            default: return "#95a5a6";
        }
    };

    return (
        <div style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Admin Panel 🛡️</h1>
                    <p style={styles.subtitle}>Manage users and monitor platform activity</p>
                </div>
                <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={styles.errorBanner}>
                    ⚠️ {error}
                </div>
            )}

            {/* Tabs */}
            <div style={styles.tabs}>
                <button
                    onClick={() => setActiveTab("dashboard")}
                    style={activeTab === "dashboard" ? styles.tabActive : styles.tab}
                >
                    📊 Dashboard
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    style={activeTab === "users" ? styles.tabActive : styles.tab}
                >
                    👥 Users
                </button>
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && stats && (
                <div style={styles.statsContainer}>
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>👥</div>
                            <div style={styles.statValue}>{stats.users?.total || 0}</div>
                            <div style={styles.statLabel}>Total Users</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>💼</div>
                            <div style={styles.statValue}>{stats.users?.clients || 0}</div>
                            <div style={styles.statLabel}>Clients</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>🎬</div>
                            <div style={styles.statValue}>{stats.users?.editors || 0}</div>
                            <div style={styles.statLabel}>Editors</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>🛡️</div>
                            <div style={styles.statValue}>{stats.users?.admins || 0}</div>
                            <div style={styles.statLabel}>Admins</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>📋</div>
                            <div style={styles.statValue}>{stats.jobs?.total || 0}</div>
                            <div style={styles.statLabel}>Total Jobs</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statIcon}>🟢</div>
                            <div style={styles.statValue}>{stats.jobs?.open || 0}</div>
                            <div style={styles.statLabel}>Open Jobs</div>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div style={styles.recentSection}>
                        <h3 style={styles.sectionTitle}>Recent Users</h3>
                        <div style={styles.recentList}>
                            {stats.users?.recentUsers?.map((u) => (
                                <div key={u.id} style={styles.recentItem}>
                                    <div style={styles.recentAvatar}>
                                        {u.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={styles.recentInfo}>
                                        <div style={styles.recentName}>{u.name}</div>
                                        <div style={styles.recentEmail}>{u.email}</div>
                                    </div>
                                    <span style={{ ...styles.roleBadge, backgroundColor: getRoleBadgeColor(u.role) }}>
                                        {u.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
                <div style={styles.usersContainer}>
                    {/* Toolbar */}
                    <div style={styles.toolbar}>
                        <div style={styles.filters}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                style={styles.filterSelect}
                            >
                                <option value="">All Roles</option>
                                <option value="client">Clients</option>
                                <option value="editor">Editors</option>
                                <option value="admin">Admins</option>
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ name: "", email: "", password: "", role: "client" });
                                setShowCreateModal(true);
                            }}
                            style={styles.createBtn}
                        >
                            ➕ Add User
                        </button>
                    </div>

                    {/* Users Table */}
                    <div style={styles.tableContainer}>
                        {loading ? (
                            <div style={styles.loading}>Loading users...</div>
                        ) : users.length === 0 ? (
                            <div style={styles.empty}>No users found</div>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Email</th>
                                        <th style={styles.th}>Role</th>
                                        <th style={styles.th}>Joined</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} style={styles.tr}>
                                            <td style={styles.td}>{u.id}</td>
                                            <td style={styles.td}>{u.name}</td>
                                            <td style={styles.td}>{u.email}</td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.roleBadge, backgroundColor: getRoleBadgeColor(u.role) }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td style={styles.td}>
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    style={styles.editBtn}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                                    style={styles.deleteBtn}
                                                    disabled={u.id === user.id}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>Create New User</h2>
                        <form onSubmit={handleCreateUser}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={styles.input}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    style={styles.select}
                                >
                                    <option value="client">Client</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitBtn} disabled={actionLoading}>
                                    {actionLoading ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>Edit User</h2>
                        <form onSubmit={handleUpdateUser}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    style={styles.select}
                                >
                                    <option value="client">Client</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitBtn} disabled={actionLoading}>
                                    {actionLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: "#0f172a",
        color: "#fff",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem",
    },
    title: {
        fontSize: "2rem",
        fontWeight: "700",
        margin: 0,
    },
    subtitle: {
        color: "#94a3b8",
        margin: "0.5rem 0 0",
    },
    backBtn: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "transparent",
        border: "1px solid #475569",
        color: "#fff",
        borderRadius: "8px",
        cursor: "pointer",
    },
    errorBanner: {
        padding: "1rem",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        border: "1px solid #ef4444",
        borderRadius: "8px",
        color: "#ef4444",
        marginBottom: "1rem",
    },
    tabs: {
        display: "flex",
        gap: "0.5rem",
        marginBottom: "2rem",
        borderBottom: "1px solid #334155",
        paddingBottom: "1rem",
    },
    tab: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "transparent",
        border: "none",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "1rem",
        borderRadius: "8px",
    },
    tabActive: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#3b82f6",
        border: "none",
        color: "#fff",
        cursor: "pointer",
        fontSize: "1rem",
        borderRadius: "8px",
        fontWeight: "600",
    },
    statsContainer: {
        // Stats container
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem",
    },
    statCard: {
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        padding: "1.5rem",
        borderRadius: "12px",
        textAlign: "center",
        border: "1px solid #334155",
    },
    statIcon: {
        fontSize: "2rem",
        marginBottom: "0.5rem",
    },
    statValue: {
        fontSize: "2rem",
        fontWeight: "700",
        color: "#fff",
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: "0.9rem",
        marginTop: "0.25rem",
    },
    recentSection: {
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #334155",
    },
    sectionTitle: {
        fontSize: "1.25rem",
        marginBottom: "1rem",
        color: "#fff",
    },
    recentList: {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
    },
    recentItem: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem",
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        borderRadius: "8px",
    },
    recentAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "600",
        fontSize: "1rem",
    },
    recentInfo: {
        flex: 1,
    },
    recentName: {
        fontWeight: "600",
        color: "#fff",
    },
    recentEmail: {
        fontSize: "0.85rem",
        color: "#94a3b8",
    },
    roleBadge: {
        padding: "0.25rem 0.75rem",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: "600",
        color: "#fff",
        textTransform: "capitalize",
    },
    usersContainer: {
        // Users container
    },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem",
    },
    filters: {
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
    },
    searchInput: {
        padding: "0.75rem 1rem",
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "1rem",
        width: "250px",
    },
    filterSelect: {
        padding: "0.75rem 1rem",
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "1rem",
    },
    createBtn: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#22c55e",
        border: "none",
        borderRadius: "8px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "1rem",
    },
    tableContainer: {
        backgroundColor: "rgba(30, 41, 59, 0.8)",
        borderRadius: "12px",
        border: "1px solid #334155",
        overflow: "hidden",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        padding: "1rem",
        textAlign: "left",
        backgroundColor: "#1e293b",
        color: "#94a3b8",
        fontWeight: "600",
        fontSize: "0.85rem",
        textTransform: "uppercase",
    },
    tr: {
        borderBottom: "1px solid #334155",
    },
    td: {
        padding: "1rem",
        color: "#fff",
    },
    editBtn: {
        padding: "0.5rem",
        backgroundColor: "#3b82f6",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        marginRight: "0.5rem",
    },
    deleteBtn: {
        padding: "0.5rem",
        backgroundColor: "#ef4444",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },
    loading: {
        padding: "3rem",
        textAlign: "center",
        color: "#94a3b8",
    },
    empty: {
        padding: "3rem",
        textAlign: "center",
        color: "#94a3b8",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "#1e293b",
        padding: "2rem",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "400px",
        border: "1px solid #334155",
    },
    modalTitle: {
        fontSize: "1.5rem",
        marginBottom: "1.5rem",
        color: "#fff",
    },
    formGroup: {
        marginBottom: "1rem",
    },
    label: {
        display: "block",
        marginBottom: "0.5rem",
        color: "#94a3b8",
        fontSize: "0.9rem",
    },
    input: {
        width: "100%",
        padding: "0.75rem",
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "1rem",
    },
    select: {
        width: "100%",
        padding: "0.75rem",
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "1rem",
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
    },
    submitBtn: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#3b82f6",
        border: "none",
        borderRadius: "8px",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
    },
};
