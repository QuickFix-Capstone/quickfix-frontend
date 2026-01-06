// src/pages/AuthCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Processing...");
    const [error, setError] = useState(null);

    useEffect(() => {
        const exchangeCodeForTokens = async () => {
            // Extract authorization code from URL
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (!code) {
                setError("No authorization code found in URL");
                return;
            }

            console.log("🔄 Manually exchanging authorization code for tokens");
            setStatus("Exchanging authorization code...");

            try {
                // Manual token exchange - exactly like the curl command that worked
                const response = await fetch("https://quickfix.auth.us-east-2.amazoncognito.com/oauth2/token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        client_id: "p2u5qdegml3hp60n6ohu52n2b",
                        code: code,
                        redirect_uri: `${window.location.origin}/auth/callback`,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
                }

                const tokens = await response.json();
                console.log("✅ Token exchange successful!");
                console.log("Tokens received:", {
                    hasIdToken: !!tokens.id_token,
                    hasAccessToken: !!tokens.access_token,
                    hasRefreshToken: !!tokens.refresh_token
                });

                // Store tokens in localStorage (mimicking what react-oidc-context would do)
                const userKey = `oidc.user:https://cognito-idp.us-east-2.amazonaws.com/us-east-2_45z5OMePi:p2u5qdegml3hp60n6ohu52n2b`;
                const userData = {
                    id_token: tokens.id_token,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    token_type: tokens.token_type,
                    expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
                    profile: parseJwt(tokens.id_token), // Decode the ID token to get user info
                };

                localStorage.setItem(userKey, JSON.stringify(userData));
                console.log("💾 Tokens stored in localStorage");

                setStatus("Success! Redirecting...");

                // Force a full page reload to /customer/entry
                // This makes react-oidc-context load the user from localStorage
                setTimeout(() => {
                    window.location.replace("/customer/entry");
                }, 500);

            } catch (err) {
                console.error("❌ Token exchange failed:", err);
                setError(err.message);
                setStatus("Failed");
            }
        };

        exchangeCodeForTokens();
    }, [navigate]);

    // Helper function to decode JWT
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Failed to parse JWT:", e);
            return {};
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4 max-w-md">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-black"></div>
                <p className="text-lg text-neutral-600 font-semibold">{status}</p>
                {error && (
                    <div className="mt-4 p-4 bg-red-50 rounded-md w-full">
                        <p className="text-sm text-red-600 font-semibold">Error: {error}</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="mt-2 text-xs text-red-700 underline"
                        >
                            Return to login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
