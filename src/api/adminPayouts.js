// src/api/adminPayouts.js
import { API_BASE } from "./config";
import { fetchAuthSession } from "aws-amplify/auth";

// Build Authorization header using current Cognito session
async function getAdminAuthHeaders() {
    const session = await fetchAuthSession();
    const idToken = session?.tokens?.idToken?.toString();
    if (!idToken) throw new Error("Missing auth token. Please login again.");
    return { Authorization: `Bearer ${idToken}` };
}

async function api(path, { method = "GET", body } = {}) {
    const authHeaders = await getAdminAuthHeaders();

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text || null;
    }

    if (!res.ok) {
        const msg =
            (data && data.message) ||
            (data && data.error) ||
            (typeof data === "string" ? data : null) ||
            `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return data;
}

// ✅ These must match your admin lambda routes
export const getEligiblePayouts = () => api("/admin/payouts/eligible");
export const getPayoutHistory = (limit = 50, offset = 0) =>
    api(`/admin/payouts/history?limit=${limit}&offset=${offset}`);

// POST /admin/payouts/pay  body: { provider_id }
export const payProvider = (provider_id) =>
    api("/admin/payouts/pay", { method: "POST", body: { provider_id } });
