import React, { useEffect, useState } from "react";
import { getProviderPayoutBalance, getProviderPayoutHistory } from "../../../api/payouts";

function getAuthHeaders() {
    // Prefer id_token — AWS Cognito JWT authorizer uses the ID token (contains sub, email, groups)
    const token =
        localStorage.getItem("quickfix_id_token") ||
        localStorage.getItem("quickfix_access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function money(cents) {
    if (cents === null || cents === undefined || cents === "") return "—";
    return `$${(Number(cents) / 100).toFixed(2)}`;
}

function StatusPill({ status }) {
    const map = {
        COMPLETED: { bg: "#E8F5E9", fg: "#1B5E20" },
        PENDING: { bg: "#FFF8E1", fg: "#E65100" },
        FAILED: { bg: "#FFEBEE", fg: "#B71C1C" },
    };
    const s = map[status?.toUpperCase()] || { bg: "#ECEFF1", fg: "#263238" };
    return (
        <span
            style={{
                background: s.bg,
                color: s.fg,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
            }}
        >
            {status || "—"}
        </span>
    );
}

function BalanceCard({ label, value, loading, sub }) {
    return (
        <div
            style={{
                background: "#fff",
                border: "1px solid #ECEFF1",
                borderRadius: 16,
                padding: "18px 20px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
            }}
        >
            <div style={{ color: "#607D8B", fontWeight: 700, fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8, color: "#0F172A" }}>
                {loading ? <span style={{ color: "#B0BEC5" }}>…</span> : value}
            </div>
            {sub && (
                <div style={{ color: "#90A4AE", fontSize: 12, marginTop: 6 }}>{sub}</div>
            )}
        </div>
    );
}

export default function ProviderPayoutDashboard() {
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(null);
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const [b, h] = await Promise.all([
                getProviderPayoutBalance(getAuthHeaders()),
                getProviderPayoutHistory(20, 0, getAuthHeaders()),
            ]);
            setBalance(b?.balance ?? b);
            setRows(h?.items || (Array.isArray(h) ? h : []));
        } catch (e) {
            setError(e.message || "Failed to load payouts.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ padding: "24px 24px 48px", maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 4,
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Payout Dashboard</h1>
                    <p style={{ marginTop: 6, color: "#546E7A", fontSize: 14 }}>
                        Track your earnings, active payouts, and full payout history.
                    </p>
                </div>
                <button
                    onClick={load}
                    style={{
                        padding: "10px 18px",
                        borderRadius: 12,
                        border: "1px solid #CFD8DC",
                        background: "#fff",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                    }}
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div
                    style={{
                        marginTop: 16,
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: "#FFEBEE",
                        color: "#B71C1C",
                        fontWeight: 700,
                        fontSize: 14,
                    }}
                >
                    {error}
                </div>
            )}

            {/* Balance Cards */}
            <div
                style={{
                    marginTop: 20,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                }}
            >
                <BalanceCard
                    label="Net Owed"
                    value={money(balance?.owed_cents)}
                    loading={loading}
                    sub="Earnings ready for admin payout"
                />
                <BalanceCard
                    label="In Processing"
                    value={money(balance?.in_payout_cents)}
                    loading={loading}
                    sub="Currently queued in a payout"
                />
                <BalanceCard
                    label="Total Paid Out"
                    value={money(balance?.paid_total_cents)}
                    loading={loading}
                    sub="All completed payouts to date"
                />
            </div>

            {/* History Table */}
            <div
                style={{
                    marginTop: 20,
                    background: "#fff",
                    border: "1px solid #ECEFF1",
                    borderRadius: 16,
                    padding: "18px 20px",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                }}
            >
                <h3 style={{ margin: "0 0 14px 0", fontSize: 16 }}>Payout History</h3>

                {loading ? (
                    <p style={{ color: "#607D8B", margin: 0 }}>Loading…</p>
                ) : rows.length === 0 ? (
                    <div
                        style={{
                            padding: "32px 0",
                            textAlign: "center",
                            color: "#90A4AE",
                            fontSize: 14,
                        }}
                    >
                        No payouts yet. Once your method is verified, your first payout will appear here.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        textAlign: "left",
                                        color: "#546E7A",
                                        fontSize: 12,
                                        textTransform: "uppercase",
                                        letterSpacing: 0.4,
                                    }}
                                >
                                    <th style={{ padding: "8px 10px" }}>Date</th>
                                    <th style={{ padding: "8px 10px" }}>Method</th>
                                    <th style={{ padding: "8px 10px" }}>Amount</th>
                                    <th style={{ padding: "8px 10px" }}>Status</th>
                                    <th style={{ padding: "8px 10px" }}>Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr
                                        key={r.payout_id || r.id || i}
                                        style={{
                                            borderTop: "1px solid #F1F5F9",
                                            transition: "background 0.1s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "12px 10px", color: "#334155" }}>
                                            {r.paid_at || r.created_at || "—"}
                                        </td>
                                        <td style={{ padding: "12px 10px", color: "#334155" }}>
                                            {r.method || "—"}
                                        </td>
                                        <td style={{ padding: "12px 10px", fontWeight: 800, color: "#0F172A" }}>
                                            {money(r.amount_cents)}
                                        </td>
                                        <td style={{ padding: "12px 10px" }}>
                                            <StatusPill status={r.status} />
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px 10px",
                                                color: "#607D8B",
                                                fontFamily: "monospace",
                                                fontSize: 12,
                                            }}
                                        >
                                            {r.external_id || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
