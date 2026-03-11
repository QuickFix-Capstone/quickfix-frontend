import { API_BASE } from "./config";
import { fetchAuthSession } from "aws-amplify/auth";

async function getAdminAuthHeaders() {
    const session = await fetchAuthSession();
    const idToken = session?.tokens?.idToken?.toString();
    if (!idToken) throw new Error("Missing auth token. Please login again.");
    return { Authorization: `Bearer ${idToken}` };
}

async function api(path, params = {}) {
    const authHeaders = await getAdminAuthHeaders();
    const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();

    const res = await fetch(`${API_BASE}${path}${qs ? `?${qs}` : ""}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeaders },
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

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

// GET /admin/payments/transactions?status=paid&customer_id=xxx&limit=50&offset=0
export function getAdminCustomerTransactions({ status, customerId, limit = 100, offset = 0 } = {}) {
    return api("/admin/payments/transactions", {
        ...(status ? { status } : {}),
        ...(customerId ? { customer_id: customerId } : {}),
        limit,
        offset,
    });
}
