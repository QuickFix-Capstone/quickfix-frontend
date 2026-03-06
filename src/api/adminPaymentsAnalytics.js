import { API_BASE } from "./config";
import { fetchAuthSession } from "aws-amplify/auth";

async function getAdminAuthHeaders() {
    const session = await fetchAuthSession();
    const idToken = session?.tokens?.idToken?.toString();
    if (!idToken) throw new Error("Missing auth token. Please login again.");
    return { Authorization: `Bearer ${idToken}` };
}

async function api(path) {
    const authHeaders = await getAdminAuthHeaders();

    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders,
        },
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

// GET /admin/payments/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week
export function getAdminPaymentsAnalytics({ from, to, groupBy = "day" } = {}) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (groupBy) params.set("groupBy", groupBy);

    const qs = params.toString();
    return api(`/admin/payments/analytics${qs ? `?${qs}` : ""}`);
}
