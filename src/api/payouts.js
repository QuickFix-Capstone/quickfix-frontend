// Provider Payout API — matches AWS Lambda endpoints exactly
// Auth: pass authHeaders built from the provider's Cognito tokens

import { API_BASE } from "./config";

async function api(path, { method = "GET", headers = {}, body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
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
        // Backend returns { message, detail } — surface both so Stripe errors are visible
        let message = (data && data.message) ||
            (typeof data === "string" ? data : null) ||
            `HTTP ${res.status}`;

        // Append detail when present (e.g. Stripe API error body from HttpError)
        if (data && data.detail) {
            const detail = typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);
            // Extract the Stripe "message" from the detail body if possible
            try {
                const parsed = typeof data.detail === "object" ? data.detail : JSON.parse(data.detail);
                const stripeMsg = parsed?.body?.error?.message || parsed?.error?.message;
                if (stripeMsg) message = stripeMsg;
                else message = `${message}: ${detail}`;
            } catch {
                message = `${message}: ${detail}`;
            }
        }
        throw new Error(message);
    }

    return data;
}

// GET /providers/payout-method
// Returns: { method, paypal_email, stripe_account_id, verification_status }
export const getProviderPayoutMethod = (authHeaders) =>
    api("/providers/payout-method", { headers: authHeaders });

// POST /providers/payout-method
// Body: { method: "paypal", paypal_email: "..." } OR { method: "stripe_connect" }
export const saveProviderPayoutMethod = (payload, authHeaders) =>
    api("/providers/payout-method", { method: "POST", headers: authHeaders, body: payload });

// POST /providers/stripe/connect/start  (POST — matches StripeRefresh.jsx behavior)
// Returns: { onboarding_url: "https://connect.stripe.com/..." } or { url: "..." }
export const stripeConnectStart = (authHeaders) =>
    api("/providers/stripe/connect/start", { method: "POST", headers: authHeaders });

// GET /providers/stripe/connect/status
// Returns: { verification_status: "VERIFIED"|"PENDING", stripe_account_id: "acct_..." }
export const stripeConnectStatus = (authHeaders) =>
    api("/providers/stripe/connect/status", { headers: authHeaders });

// GET /providers/payouts/balance
// Returns: { net_owed_cents, in_payout_cents, paid_total_cents }
export const getProviderPayoutBalance = (authHeaders) =>
    api("/providers/payouts/balance", { headers: authHeaders });

// GET /providers/payouts/history?limit=N&offset=N
// Returns: { items: [...] } or array
export const getProviderPayoutHistory = (limit = 20, offset = 0, authHeaders) =>
    api(`/providers/payouts/history?limit=${limit}&offset=${offset}`, { headers: authHeaders });
