// src/api/adminPayouts.js
// Admin payout management — matches admin_payouts Lambda endpoints
// Auth pattern copied from AdminProviderDetails.jsx (fetchAuthSession → idToken)

import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE } from "./config";

async function getAdminToken() {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error("Not authenticated. Please log in as admin.");
    return token;
}

async function api(path, { method = "GET", body } = {}) {
    const token = await getAdminToken();
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // Surface detail field if present (e.g. from Lambda HttpError responses)
        let message = data.message || data.error || `HTTP ${res.status}`;
        if (data.detail) {
            try {
                const parsed = typeof data.detail === "object" ? data.detail : JSON.parse(data.detail);
                const stripeMsg = parsed?.body?.error?.message || parsed?.error?.message;
                if (stripeMsg) message = stripeMsg;
            } catch {
                // keep original message
            }
        }
        throw new Error(message);
    }

    return data;
}

// GET  /admin/payouts/eligible  → array of { provider_id, name, method, amount_cents, earning_count }
export const getEligiblePayouts = () => api("/admin/payouts/eligible");

// POST /admin/payouts/pay       → { payout_id, provider_id, amount_cents, status }
export const payProvider = (provider_id) =>
    api("/admin/payouts/pay", { method: "POST", body: { provider_id } });

// GET  /admin/payouts/history   → array of provider_payouts rows
export const getPayoutHistory = () => api("/admin/payouts/history");
