import React, { useEffect, useState } from "react";
import {
    getProviderPayoutMethod,
    saveProviderPayoutMethod,
    stripeConnectStart,
    stripeConnectStatus,
} from "../../../api/payouts";

// ── helpers ───────────────────────────────────────────────────────────────────

function getAuthHeaders() {
    // Prefer id_token — AWS Cognito JWT authorizer uses the ID token (contains sub, email, groups)
    const token =
        localStorage.getItem("quickfix_id_token") ||
        localStorage.getItem("quickfix_access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

const BADGE = {
    VERIFIED: { bg: "#E8F5E9", fg: "#1B5E20", label: "Verified" },
    PENDING: { bg: "#FFF8E1", fg: "#E65100", label: "Pending" },
    DISABLED: { bg: "#FFEBEE", fg: "#B71C1C", label: "Disabled" },
    UNKNOWN: { bg: "#ECEFF1", fg: "#263238", label: "Not set" },
};

function Badge({ status }) {
    const s = BADGE[status] || BADGE.UNKNOWN;
    return (
        <span
            style={{
                background: s.bg,
                color: s.fg,
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.3,
            }}
        >
            {s.label}
        </span>
    );
}

function Alert({ type, text }) {
    const colors = {
        success: { bg: "#E8F5E9", fg: "#1B5E20" },
        error: { bg: "#FFEBEE", fg: "#B71C1C" },
        info: { bg: "#E3F2FD", fg: "#0D47A1" },
    };
    const c = colors[type] || colors.info;
    return (
        <div
            style={{
                marginTop: 16,
                padding: "12px 16px",
                borderRadius: 12,
                background: c.bg,
                color: c.fg,
                fontWeight: 600,
                fontSize: 14,
            }}
        >
            {text}
        </div>
    );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ProviderPayoutSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [connectBusy, setConnectBusy] = useState(false);

    const [method, setMethod] = useState("paypal");
    const [paypalEmail, setPaypalEmail] = useState("");
    const [stripeAccountId, setStripeAccountId] = useState("");
    const [verificationStatus, setVerificationStatus] = useState("UNKNOWN");
    const [msg, setMsg] = useState(null);

    // load() — shows a non-blocking warning if the backend isn't ready yet,
    // but always finishes loading so the form renders.
    async function load() {
        setLoading(true);
        setMsg(null);
        try {
            const res = await getProviderPayoutMethod(getAuthHeaders());
            // Lambda returns: { provider_id, payout_method: { method, paypal_email, stripe_account_id, status } }
            // payout_method is null/empty when the provider hasn't set one yet
            const pm = res?.payout_method || res; // fallback to root for safety
            if (pm?.method) setMethod(pm.method);
            setPaypalEmail(pm?.paypal_email || "");
            setStripeAccountId(pm?.stripe_account_id || "");
            // DB column is 'status'; Lambda may also return 'verification_status'
            const vs = pm?.verification_status || pm?.status || "UNKNOWN";
            setVerificationStatus(vs.toUpperCase());
        } catch (e) {
            // Show as info/warning — backend may not be wired yet, but still let the user interact
            let text;
            if (e.message?.includes("403") || e.message?.toLowerCase().includes("not found")) {
                text = "Your provider account was not found. Make sure you are logged in as a service provider.";
            } else if (e.message?.toLowerCase().includes("fetch") || e.message?.toLowerCase().includes("network")) {
                text = "Could not reach the server. Check your connection and try refreshing.";
            } else {
                text = e.message || "Could not load saved payout settings.";
            }
            setMsg({ type: "info", text: `⚠️ ${text} You can still set up your payout method below.` });
        } finally {
            setLoading(false);
        }
    }

    // silentRefresh — refreshes status/account id in background after save WITHOUT clearing msg
    async function silentRefresh() {
        try {
            const res = await getProviderPayoutMethod(getAuthHeaders());
            const pm = res?.payout_method || res;
            const vs = pm?.verification_status || pm?.status;
            if (vs) setVerificationStatus(vs.toUpperCase());
            if (pm?.stripe_account_id) setStripeAccountId(pm.stripe_account_id);
            if (pm?.paypal_email) setPaypalEmail(pm.paypal_email);
        } catch {
            // silently ignore — success message is already shown
        }
    }

    async function onSave() {
        setSaving(true);
        setMsg(null);
        try {
            if (method === "paypal") {
                if (!paypalEmail?.includes("@")) {
                    throw new Error("Please enter a valid PayPal email address.");
                }
                await saveProviderPayoutMethod(
                    { method: "paypal", paypal_email: paypalEmail.trim() },
                    getAuthHeaders()
                );
            } else {
                await saveProviderPayoutMethod({ method: "stripe_connect" }, getAuthHeaders());
            }
            // Set success FIRST, then silently refresh state in background
            setMsg({ type: "success", text: "✅ Payout method saved successfully." });
            silentRefresh(); // do NOT await — avoids wiping the success message
        } catch (e) {
            setMsg({ type: "error", text: e.message || "Save failed. Please try again." });
        } finally {
            setSaving(false);
        }
    }

    async function onStripeConnect() {
        setConnectBusy(true);
        setMsg(null);
        try {
            const res = await stripeConnectStart(getAuthHeaders());
            const url = res?.onboarding_url || res?.url;
            if (!url) throw new Error("Stripe onboarding link not received from backend.");
            window.open(url, "_blank", "noopener,noreferrer");
            setMsg({
                type: "info",
                text: '🔗 Stripe onboarding opened in a new tab. Complete it there, then come back and click "Check Status".',
            });
        } catch (e) {
            // Show the real backend error so the team can diagnose env var / config issues
            const raw = e.message || "Stripe connect failed.";
            const hint = raw.toLowerCase().includes("stripe") || raw.toLowerCase().includes("key")
                ? " (Check STRIPE_SECRET_KEY and redirect URL env vars in the Lambda.)"
                : "";
            setMsg({ type: "error", text: `❌ ${raw}${hint}` });
        } finally {
            setConnectBusy(false);
        }
    }

    async function onCheckStripeStatus() {
        setMsg(null);
        try {
            const res = await stripeConnectStatus(getAuthHeaders());
            if (res?.stripe_account_id) setStripeAccountId(res.stripe_account_id);
            const vs = res?.verification_status || res?.status;
            if (vs) setVerificationStatus(vs.toUpperCase());
            const label = vs?.toUpperCase() === "VERIFIED" ? "✅ Stripe account verified!" : "⏳ Stripe onboarding in progress. Check back after completing onboarding.";
            setMsg({ type: vs?.toUpperCase() === "VERIFIED" ? "success" : "info", text: label });
        } catch (e) {
            const raw = e.message || "";
            // Friendly message when Stripe account hasn't been created yet
            const isNotLinked = raw.toLowerCase().includes("no stripe_account_id") || raw.toLowerCase().includes("not found") || raw.includes("400");
            setMsg({
                type: isNotLinked ? "info" : "error",
                text: isNotLinked
                    ? "⚠️ Not connected yet. Click \"Connect with Stripe\" to start onboarding first."
                    : `❌ ${raw || "Failed to check Stripe status."}`,
            });
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── styles ────────────────────────────────────────────────────────────────
    const card = {
        border: "1px solid #ECEFF1",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
        background: "#fff",
    };

    const methodBtn = (active) => ({
        flex: 1,
        minWidth: 160,
        padding: "14px 16px",
        borderRadius: 12,
        border: active ? "2px solid #4F46E5" : "1px solid #CFD8DC",
        background: active ? "#EEF2FF" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
    });

    const primaryBtn = (disabled) => ({
        padding: "11px 20px",
        borderRadius: 12,
        border: "none",
        background: "#0F172A",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity 0.15s",
    });

    const outlineBtn = {
        padding: "11px 20px",
        borderRadius: 12,
        border: "1px solid #CFD8DC",
        background: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
    };

    const indigoBtn = (disabled) => ({
        padding: "11px 20px",
        borderRadius: 12,
        border: "none",
        background: "#4F46E5",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity 0.15s",
    });

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: "24px 24px 48px", maxWidth: 860, margin: "0 auto" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 6,
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Payout Settings</h1>
                    <p style={{ marginTop: 6, color: "#546E7A", fontSize: 14 }}>
                        Choose how you want to receive payouts from QuickFix. Admin payouts require a
                        verified method.
                    </p>
                </div>
                <Badge status={verificationStatus} />
            </div>

            {msg && <Alert {...msg} />}

            {/* Card */}
            <div style={{ ...card, marginTop: 20 }}>
                {loading ? (
                    <p style={{ color: "#607D8B", margin: 0 }}>Loading payout settings…</p>
                ) : (
                    <>
                        {/* Method selector */}
                        <p style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: 13, color: "#546E7A", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Payout Method
                        </p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <button onClick={() => setMethod("paypal")} style={methodBtn(method === "paypal")}>
                                <div style={{ fontWeight: 800, fontSize: 14, color: method === "paypal" ? "#4F46E5" : "#0F172A" }}>
                                    💳 PayPal
                                </div>
                                <div style={{ fontSize: 12, color: "#607D8B", marginTop: 3 }}>
                                    Fast setup with email
                                </div>
                            </button>

                            <button onClick={() => setMethod("stripe_connect")} style={methodBtn(method === "stripe_connect")}>
                                <div style={{ fontWeight: 800, fontSize: 14, color: method === "stripe_connect" ? "#4F46E5" : "#0F172A" }}>
                                    🔗 Stripe Connect
                                </div>
                                <div style={{ fontSize: 12, color: "#607D8B", marginTop: 3 }}>
                                    Verified bank onboarding
                                </div>
                            </button>
                        </div>

                        {/* Method-specific section */}
                        <div
                            style={{
                                marginTop: 20,
                                padding: "16px 18px",
                                borderRadius: 12,
                                background: "#F8FAFC",
                                border: "1px solid #ECEFF1",
                            }}
                        >
                            {method === "paypal" ? (
                                <>
                                    <h3 style={{ margin: "0 0 6px 0", fontSize: 15 }}>PayPal Email</h3>
                                    <p style={{ margin: "0 0 12px 0", color: "#546E7A", fontSize: 13 }}>
                                        We'll send payouts to this email. Make sure it matches your PayPal account.
                                    </p>
                                    <input
                                        type="email"
                                        value={paypalEmail}
                                        onChange={(e) => setPaypalEmail(e.target.value)}
                                        placeholder="yourname@example.com"
                                        style={{
                                            width: "100%",
                                            padding: "11px 14px",
                                            borderRadius: 10,
                                            border: "1px solid #CFD8DC",
                                            outline: "none",
                                            fontSize: 14,
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <h3 style={{ margin: "0 0 6px 0", fontSize: 15 }}>Stripe Connect</h3>
                                    <p style={{ margin: "0 0 12px 0", color: "#546E7A", fontSize: 13 }}>
                                        Connect your Stripe account so QuickFix can send payouts directly to your bank.
                                    </p>

                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                        <button
                                            onClick={onStripeConnect}
                                            disabled={connectBusy}
                                            style={indigoBtn(connectBusy)}
                                        >
                                            {connectBusy ? "Opening…" : "Connect with Stripe"}
                                        </button>
                                        <button onClick={onCheckStripeStatus} style={outlineBtn}>
                                            Check Status
                                        </button>
                                    </div>

                                    <div style={{ marginTop: 14, fontSize: 13, color: "#455A64" }}>
                                        <strong>Linked account:</strong>{" "}
                                        {stripeAccountId ? (
                                            <span style={{ fontFamily: "monospace" }}>{stripeAccountId}</span>
                                        ) : (
                                            "Not linked yet"
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Save + Refresh */}
                        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <button onClick={onSave} disabled={saving} style={primaryBtn(saving)}>
                                {saving ? "Saving…" : "Save Payout Method"}
                            </button>
                            <button onClick={load} style={outlineBtn}>
                                Refresh
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Explainer note */}
            <div
                style={{
                    marginTop: 20,
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "#F1F5F9",
                    color: "#475569",
                    fontSize: 13,
                    lineHeight: 1.6,
                }}
            >
                <strong>ℹ️ How payouts work:</strong> After a customer's payment is completed, QuickFix
                records your earnings. An admin will trigger the payout once your method is verified.
                PayPal payouts are typically processed within 1 business day; Stripe Connect payouts
                follow your bank's standard settlement schedule.
            </div>
        </div>
    );
}
