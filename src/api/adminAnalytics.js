import { API_BASE } from "./config.js";

/**
 * Extract Cognito ID token from localStorage
 */
function getCognitoIdToken() {
    const prefix = "CognitoIdentityServiceProvider.";

    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(prefix) && key.endsWith(".idToken")) {
            return localStorage.getItem(key);
        }
    }

    throw new Error("Cognito ID token not found");
}

/**
 * Fetch admin analytics V1 metrics.
 * Requires an authenticated admin (Administrator group).
 *
 * @returns {Promise<Object>} The analytics payload with metrics
 */
export async function fetchAdminAnalytics() {
    const idToken = getCognitoIdToken();

    const res = await fetch(`${API_BASE}/admin/analytics/v1`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        const message = data?.message || "Failed to fetch admin analytics";
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }

    return data;
}
