import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated()]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications?limit=10");
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        try {
            await api.patch(`/notifications/${notification.id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, is_read: 1 } : n)
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }

        // Navigate to the reference
        setShowNotifications(false);
        if (notification.reference_type === 'job') {
            navigate(`/jobs/${notification.reference_id}`);
        } else if (notification.reference_type === 'project') {
            navigate(`/projects/${notification.reference_id}`);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post("/notifications/mark-all-read");
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const isActive = (path) => location.pathname === path;

    if (!isAuthenticated()) return null;

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <Link to="/dashboard" className="navbar-brand">
                    <span style={{ fontSize: "1.5rem" }}>🎬</span> EditFlow
                </Link>

                <div className="navbar-menu">
                    <Link
                        to="/dashboard"
                        className="navbar-link"
                        style={isActive("/dashboard") ? activeStyle : {}}
                    >
                        Dashboard
                    </Link>

                    <Link
                        to="/jobs"
                        className="navbar-link"
                        style={isActive("/jobs") ? activeStyle : {}}
                    >
                        Jobs
                    </Link>

                    <Link
                        to="/editors"
                        className="navbar-link"
                        style={isActive("/editors") ? activeStyle : {}}
                    >
                        Editors
                    </Link>

                    <Link
                        to="/wallet"
                        className="navbar-link"
                        style={isActive("/wallet") ? activeStyle : {}}
                    >
                        💳 Wallet
                    </Link>

                    {user?.role === "editor" && (
                        <Link
                            to="/my-portfolio"
                            className="navbar-link"
                            style={isActive("/my-portfolio") ? activeStyle : {}}
                        >
                            🎨 Portfolio
                        </Link>
                    )}

                    {user?.role === "client" && (
                        <Link
                            to="/jobs/create"
                            className="btn btn-primary"
                            style={{
                                padding: "0.5rem 1rem",
                                fontSize: "0.875rem",
                            }}
                        >
                            + Post Job
                        </Link>
                    )}

                    {/* Notification Bell */}
                    <div style={styles.notificationWrapper} ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={styles.notificationBtn}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={styles.notificationBadge}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div style={styles.notificationDropdown}>
                                <div style={styles.notificationHeader}>
                                    <span style={{ fontWeight: 600 }}>Notifications</span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            style={styles.markAllBtn}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div style={styles.notificationList}>
                                    {notifications.length === 0 ? (
                                        <div style={styles.noNotifications}>
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                style={{
                                                    ...styles.notificationItem,
                                                    backgroundColor: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.1)'
                                                }}
                                            >
                                                <div style={styles.notificationTitle}>{n.title}</div>
                                                <div style={styles.notificationMessage}>{n.message}</div>
                                                <div style={styles.notificationTime}>
                                                    {new Date(n.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={styles.userMenu}>
                        <div style={styles.avatar}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.userInfo}>
                            <div style={styles.userName}>{user?.name}</div>
                            <div style={styles.userRole}>
                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={styles.logoutBtn}
                            className="btn-secondary"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const activeStyle = {
    color: "#22d3ee",
    fontWeight: "700",
};

const styles = {
    userMenu: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginLeft: "1rem",
        paddingLeft: "1rem",
        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
    },
    avatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #22d3ee)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "1.125rem",
    },
    userInfo: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
    },
    userName: {
        fontSize: "0.875rem",
        fontWeight: "600",
        color: "#fff",
    },
    userRole: {
        fontSize: "0.75rem",
        color: "#94a3b8",
        textTransform: "capitalize",
    },
    logoutBtn: {
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
    },
    notificationWrapper: {
        position: "relative",
    },
    notificationBtn: {
        background: "transparent",
        border: "none",
        fontSize: "1.25rem",
        cursor: "pointer",
        position: "relative",
        padding: "8px",
    },
    notificationBadge: {
        position: "absolute",
        top: "0",
        right: "0",
        backgroundColor: "#ef4444",
        color: "white",
        borderRadius: "50%",
        width: "18px",
        height: "18px",
        fontSize: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
    },
    notificationDropdown: {
        position: "absolute",
        top: "100%",
        right: "0",
        width: "320px",
        backgroundColor: "#1e293b",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        zIndex: 1000,
        marginTop: "8px",
        border: "1px solid rgba(255,255,255,0.1)",
    },
    notificationHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
    },
    markAllBtn: {
        background: "transparent",
        border: "none",
        color: "#22d3ee",
        cursor: "pointer",
        fontSize: "12px",
    },
    notificationList: {
        maxHeight: "300px",
        overflowY: "auto",
    },
    noNotifications: {
        padding: "24px",
        textAlign: "center",
        color: "#94a3b8",
    },
    notificationItem: {
        padding: "12px 16px",
        cursor: "pointer",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        transition: "background-color 0.2s",
    },
    notificationTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#fff",
        marginBottom: "4px",
    },
    notificationMessage: {
        fontSize: "12px",
        color: "#94a3b8",
        marginBottom: "4px",
    },
    notificationTime: {
        fontSize: "11px",
        color: "#64748b",
    },
};

export default Navbar;
