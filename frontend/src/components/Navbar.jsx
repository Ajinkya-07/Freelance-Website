import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
                    <span style={{ fontSize: "1.5rem" }}>🎬</span> EditConnect
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
};

export default Navbar;
