// Payment API helper - matches AWS Lambda endpoints exactly
// Uses OIDC context for authentication

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Get auth headers from OIDC context
 * Note: This should be called with the auth object from useAuth()
 * Usage: getAuthHeaders(auth.user)
 */
export function getAuthHeaders(user) {
    // Prefer access_token, fallback to id_token
    const token = user?.access_token || user?.id_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
}

// ✅ Quote: POST /payments/quote (with job_id in body)
export const getQuote = (jobId, authHeaders) =>
    api(`/payments/quote`, {
        method: "POST",
        body: { job_id: jobId },
        headers: authHeaders,
    });

// ✅ PayPal: create order
export const paypalCreateOrder = (jobId, authHeaders) =>
    api(`/payments/paypal/create-order`, {
        method: "POST",
        body: { job_id: jobId },
        headers: authHeaders,
    });

// ✅ PayPal: capture
export const paypalCapture = (orderId, authHeaders) =>
    api(`/payments/paypal/capture`, {
        method: "POST",
        body: { order_id: orderId },
        headers: authHeaders,
    });

// ✅ Stripe: create intent
export const stripeCreateIntent = (jobId, authHeaders) =>
    api(`/payments/stripe/create-intent`, {
        method: "POST",
        body: { job_id: jobId },
        headers: authHeaders,
    });

// ✅ Receipt: GET /payments/{payment_id}
export const getReceipt = (paymentId, authHeaders) =>
    api(`/payments/${encodeURIComponent(paymentId)}`, {
        headers: authHeaders,
    });
