import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Wallet() {
    const [wallet, setWallet] = useState({ balance: 0, currency: "USD" });
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    // Add funds modal
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [addAmount, setAddAmount] = useState("");
    const [addingFunds, setAddingFunds] = useState(false);

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        loadWalletData();
    }, []);

    async function loadWalletData() {
        try {
            setLoading(true);

            const [walletRes, transactionsRes, paymentsRes, statsRes] = await Promise.all([
                api.get("/payments/wallet"),
                api.get("/payments/wallet/transactions"),
                api.get("/payments/my"),
                api.get("/payments/stats"),
            ]);

            setWallet(walletRes.data.wallet);
            setTransactions(transactionsRes.data.transactions || []);
            setPayments(paymentsRes.data.payments || []);
            setStats(statsRes.data.stats);
        } catch (err) {
            setError("Failed to load wallet data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddFunds(e) {
        e.preventDefault();

        if (!addAmount || parseFloat(addAmount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setAddingFunds(true);

        try {
            await api.post("/payments/wallet/add-funds", {
                amount: parseFloat(addAmount),
            });

            setShowAddFunds(false);
            setAddAmount("");
            loadWalletData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add funds");
            console.error(err);
        } finally {
            setAddingFunds(false);
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: { className: "badge-warning", text: "Pending", icon: "⏳" },
            completed: { className: "badge-success", text: "Completed", icon: "✅" },
            failed: { className: "badge-error", text: "Failed", icon: "❌" },
            refunded: { className: "badge-info", text: "Refunded", icon: "↩️" },
        };
        return badges[status] || badges.pending;
    };

    return (
        <>
            <Navbar />
            <div style={styles.page}>
                <div className="container">
                    {/* Header */}
                    <div style={styles.header}>
                        <div>
                            <h1 style={styles.title}>Wallet & Payments 💳</h1>
                            <p style={styles.subtitle}>
                                Manage your funds and transactions
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAddFunds(true)}>
                            ➕ Add Funds (Demo)
                        </button>
                    </div>

                    {/* Demo Notice */}
                    <div className="alert alert-info" style={{ marginBottom: "2rem" }}>
                        <span>💡</span>
                        This is a demo payment system. No real money is involved.
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
                            <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Loading wallet...</p>
                        </div>
                    ) : (
                        <>
                            {/* Balance Card */}
                            <div style={styles.balanceCard}>
                                <div style={styles.balanceIcon}>💰</div>
                                <div style={styles.balanceInfo}>
                                    <div style={styles.balanceLabel}>Available Balance</div>
                                    <div style={styles.balanceAmount}>
                                        ${wallet.balance?.toFixed(2) || "0.00"}
                                        <span style={styles.currency}>{wallet.currency}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            {stats && (
                                <div style={styles.statsGrid}>
                                    <div style={styles.statCard}>
                                        <div style={styles.statIcon}>📤</div>
                                        <div style={styles.statContent}>
                                            <div style={styles.statValue}>${stats.totalPaid?.toFixed(2) || "0.00"}</div>
                                            <div style={styles.statLabel}>Total Paid</div>
                                        </div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statIcon}>📥</div>
                                        <div style={styles.statContent}>
                                            <div style={styles.statValue}>${stats.totalReceived?.toFixed(2) || "0.00"}</div>
                                            <div style={styles.statLabel}>Total Received</div>
                                        </div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statIcon}>📊</div>
                                        <div style={styles.statContent}>
                                            <div style={styles.statValue}>{stats.paymentsMade + stats.paymentsReceived}</div>
                                            <div style={styles.statLabel}>Transactions</div>
                                        </div>
                                    </div>
                                    <div style={styles.statCard}>
                                        <div style={styles.statIcon}>⏳</div>
                                        <div style={styles.statContent}>
                                            <div style={styles.statValue}>{stats.pendingPayments}</div>
                                            <div style={styles.statLabel}>Pending</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div style={styles.tabs}>
                                <button
                                    style={{
                                        ...styles.tab,
                                        ...(activeTab === "overview" ? styles.tabActive : {}),
                                    }}
                                    onClick={() => setActiveTab("overview")}
                                >
                                    Recent Activity
                                </button>
                                <button
                                    style={{
                                        ...styles.tab,
                                        ...(activeTab === "payments" ? styles.tabActive : {}),
                                    }}
                                    onClick={() => setActiveTab("payments")}
                                >
                                    Payments
                                </button>
                                <button
                                    style={{
                                        ...styles.tab,
                                        ...(activeTab === "transactions" ? styles.tabActive : {}),
                                    }}
                                    onClick={() => setActiveTab("transactions")}
                                >
                                    Wallet History
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div style={styles.tabContent}>
                                {activeTab === "overview" && (
                                    <>
                                        <h3 style={styles.sectionTitle}>Recent Payments</h3>
                                        {payments.length === 0 ? (
                                            <div style={styles.emptyState}>
                                                <div style={styles.emptyIcon}>💸</div>
                                                <p style={styles.emptyText}>No payments yet</p>
                                            </div>
                                        ) : (
                                            <div style={styles.transactionList}>
                                                {payments.slice(0, 5).map((payment) => {
                                                    const statusBadge = getStatusBadge(payment.status);
                                                    const isIncoming = payment.payee_id === user.id;

                                                    return (
                                                        <div key={payment.id} style={styles.transactionItem}>
                                                            <div style={styles.txIcon}>
                                                                {isIncoming ? "📥" : "📤"}
                                                            </div>
                                                            <div style={styles.txInfo}>
                                                                <div style={styles.txTitle}>
                                                                    {isIncoming ? `From ${payment.payer_name}` : `To ${payment.payee_name}`}
                                                                </div>
                                                                <div style={styles.txMeta}>
                                                                    {payment.job_title || payment.description || `Payment #${payment.transaction_id}`}
                                                                </div>
                                                            </div>
                                                            <div style={styles.txRight}>
                                                                <div style={{
                                                                    ...styles.txAmount,
                                                                    color: isIncoming ? "#10b981" : "#f87171",
                                                                }}>
                                                                    {isIncoming ? "+" : "-"}${payment.amount?.toFixed(2)}
                                                                </div>
                                                                <span className={`badge ${statusBadge.className}`} style={{ fontSize: "0.7rem" }}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}

                                {activeTab === "payments" && (
                                    <>
                                        <h3 style={styles.sectionTitle}>All Payments</h3>
                                        {payments.length === 0 ? (
                                            <div style={styles.emptyState}>
                                                <div style={styles.emptyIcon}>💸</div>
                                                <p style={styles.emptyText}>No payments found</p>
                                            </div>
                                        ) : (
                                            <div style={styles.transactionList}>
                                                {payments.map((payment) => {
                                                    const statusBadge = getStatusBadge(payment.status);
                                                    const isIncoming = payment.payee_id === user.id;

                                                    return (
                                                        <div key={payment.id} style={styles.transactionItem}>
                                                            <div style={styles.txIcon}>
                                                                {isIncoming ? "📥" : "📤"}
                                                            </div>
                                                            <div style={styles.txInfo}>
                                                                <div style={styles.txTitle}>
                                                                    {isIncoming ? `From ${payment.payer_name}` : `To ${payment.payee_name}`}
                                                                </div>
                                                                <div style={styles.txMeta}>
                                                                    {payment.transaction_id} • {new Date(payment.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <div style={styles.txRight}>
                                                                <div style={{
                                                                    ...styles.txAmount,
                                                                    color: isIncoming ? "#10b981" : "#f87171",
                                                                }}>
                                                                    {isIncoming ? "+" : "-"}${payment.amount?.toFixed(2)}
                                                                </div>
                                                                <span className={`badge ${statusBadge.className}`} style={{ fontSize: "0.7rem" }}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}

                                {activeTab === "transactions" && (
                                    <>
                                        <h3 style={styles.sectionTitle}>Wallet Transaction History</h3>
                                        {transactions.length === 0 ? (
                                            <div style={styles.emptyState}>
                                                <div style={styles.emptyIcon}>📜</div>
                                                <p style={styles.emptyText}>No wallet transactions yet</p>
                                            </div>
                                        ) : (
                                            <div style={styles.transactionList}>
                                                {transactions.map((tx) => (
                                                    <div key={tx.id} style={styles.transactionItem}>
                                                        <div style={styles.txIcon}>
                                                            {tx.type === "credit" ? "📥" : "📤"}
                                                        </div>
                                                        <div style={styles.txInfo}>
                                                            <div style={styles.txTitle}>{tx.description}</div>
                                                            <div style={styles.txMeta}>
                                                                {new Date(tx.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            ...styles.txAmount,
                                                            color: tx.type === "credit" ? "#10b981" : "#f87171",
                                                        }}>
                                                            {tx.type === "credit" ? "+" : "-"}${tx.amount?.toFixed(2)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add Funds Modal */}
            {showAddFunds && (
                <div style={styles.modalOverlay} onClick={() => setShowAddFunds(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Add Demo Funds</h2>
                            <button style={styles.closeBtn} onClick={() => setShowAddFunds(false)}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddFunds} style={styles.form}>
                            <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
                                Add virtual funds to your wallet for testing payments.
                                This is demo money only.
                            </p>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Amount (USD)</label>
                                <div style={styles.amountInput}>
                                    <span style={styles.currencySymbol}>$</span>
                                    <input
                                        type="number"
                                        value={addAmount}
                                        onChange={(e) => setAddAmount(e.target.value)}
                                        placeholder="100.00"
                                        min="1"
                                        max="10000"
                                        step="0.01"
                                        style={{ ...styles.input, paddingLeft: "2rem" }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={styles.quickAmounts}>
                                {[50, 100, 500, 1000].map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        style={styles.quickAmount}
                                        onClick={() => setAddAmount(amount.toString())}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>

                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowAddFunds(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={addingFunds}
                                >
                                    {addingFunds ? "Adding..." : "Add Funds"}
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
        marginBottom: "1.5rem",
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
    balanceCard: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "1.5rem",
        padding: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        marginBottom: "2rem",
    },
    balanceIcon: {
        width: "70px",
        height: "70px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "0.875rem",
        fontWeight: "500",
        marginBottom: "0.5rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    balanceAmount: {
        fontSize: "2.5rem",
        fontWeight: "700",
        color: "#fff",
        display: "flex",
        alignItems: "baseline",
        gap: "0.5rem",
    },
    currency: {
        fontSize: "1rem",
        fontWeight: "500",
        opacity: 0.8,
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
    },
    statCard: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1rem",
        padding: "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
    },
    statIcon: {
        width: "50px",
        height: "50px",
        borderRadius: "0.75rem",
        background: "rgba(102, 126, 234, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "#fff",
        lineHeight: 1.2,
    },
    statLabel: {
        color: "#94a3b8",
        fontSize: "0.75rem",
        fontWeight: "500",
    },
    tabs: {
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1.5rem",
        background: "rgba(15, 23, 42, 0.5)",
        borderRadius: "1rem",
        padding: "0.25rem",
    },
    tab: {
        flex: 1,
        padding: "0.75rem 1rem",
        background: "transparent",
        border: "none",
        color: "#94a3b8",
        fontSize: "0.875rem",
        fontWeight: "600",
        borderRadius: "0.75rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    tabActive: {
        background: "rgba(102, 126, 234, 0.2)",
        color: "#667eea",
    },
    tabContent: {
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1.5rem",
        padding: "1.5rem",
    },
    sectionTitle: {
        fontSize: "1.25rem",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "1rem",
    },
    emptyState: {
        textAlign: "center",
        padding: "3rem 2rem",
    },
    emptyIcon: {
        fontSize: "3rem",
        marginBottom: "0.5rem",
    },
    emptyText: {
        color: "#94a3b8",
        fontSize: "1rem",
    },
    transactionList: {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
    },
    transactionItem: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem",
        background: "rgba(30, 41, 59, 0.5)",
        borderRadius: "0.75rem",
    },
    txIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "50%",
        background: "rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.25rem",
        flexShrink: 0,
    },
    txInfo: {
        flex: 1,
        minWidth: 0,
    },
    txTitle: {
        color: "#fff",
        fontSize: "0.875rem",
        fontWeight: "600",
        marginBottom: "0.25rem",
    },
    txMeta: {
        color: "#64748b",
        fontSize: "0.75rem",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    txRight: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.25rem",
    },
    txAmount: {
        fontSize: "1rem",
        fontWeight: "700",
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
        maxWidth: "400px",
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    },
    modalTitle: {
        fontSize: "1.25rem",
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
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        marginBottom: "1rem",
    },
    label: {
        color: "#e2e8f0",
        fontSize: "0.875rem",
        fontWeight: "600",
    },
    amountInput: {
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
    },
    quickAmounts: {
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1.5rem",
    },
    quickAmount: {
        flex: 1,
        padding: "0.5rem",
        background: "rgba(102, 126, 234, 0.2)",
        border: "1px solid rgba(102, 126, 234, 0.3)",
        borderRadius: "0.5rem",
        color: "#667eea",
        fontSize: "0.875rem",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "1rem",
    },
};
