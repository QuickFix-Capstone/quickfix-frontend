// src/pages/customer/CustomerLogin.jsx
import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { User, Mail, ArrowRight } from "lucide-react";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com";

export default function CustomerLogin() {
    const auth = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ─────────────────────────────────────────────
    // Check if Email Exists in Database
    // ─────────────────────────────────────────────
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Query your database to check if email exists
            const response = await fetch(`${API_BASE}/customer/check-email?email=${encodeURIComponent(email)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // 🔍 Debug: Log the response
            console.log("API Response Status:", response.status);
            console.log("API Response OK:", response.ok);
            console.log("Full Response:", response);

            if (response.status === 200) {
                // ✅ Email exists in database → Redirect to LOGIN
                const data = await response.json();
                console.log("User exists:", data);
                redirectToCognitoLogin(email);
            } else if (response.status === 404) {
                // 🆕 Email doesn't exist → Redirect to SIGNUP
                const data = await response.json();
                console.log("New user - redirecting to signup:", data);
                redirectToCognitoSignup(email);
            } else {
                const data = await response.json().catch(() => ({}));
                console.log("Unexpected response:", response.status, data);
                setError("Unable to verify email. Please try again.");
            }
        } catch (err) {
            console.error("Email check error:", err);
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // Redirect to Cognito Login (Existing User)
    // ─────────────────────────────────────────────
    const redirectToCognitoLogin = (userEmail) => {
        const domain = "https://quickfix.auth.us-east-2.amazoncognito.com";
        const clientId = "p2u5qdegml3hp60n6ohu52n2b";
        const redirectUri = "http://localhost:5173";
        const scope = "openid email profile";

        window.location.href =
            `${domain}/login?client_id=${clientId}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&login_hint=${encodeURIComponent(userEmail)}`;  // Pre-fill email
    };

    // ─────────────────────────────────────────────
    // Redirect to Cognito Signup (New User)
    // ─────────────────────────────────────────────
    const redirectToCognitoSignup = (userEmail) => {
        const domain = "https://quickfix.auth.us-east-2.amazoncognito.com";
        const clientId = "p2u5qdegml3hp60n6ohu52n2b";
        const redirectUri = "http://localhost:5173";
        const scope = "openid email profile";

        window.location.href =
            `${domain}/signup?client_id=${clientId}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&login_hint=${encodeURIComponent(userEmail)}`;  // Pre-fill email
    };

    // ─────────────────────────────────────────────
    // Social Login (Google)
    // ─────────────────────────────────────────────
    const signInWithGoogle = () => {
        auth.signinRedirect({
            extraQueryParams: {
                identity_provider: "Google",
            },
        });
    };

    const GoogleIcon = (
        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );

    return (
        <div className="relative flex min-h-[85vh] items-center justify-center p-4">
            {/* Background Gradient */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white" />

            <Card className="w-full max-w-md border-neutral-200/60 bg-white/80 p-8 shadow-xl shadow-neutral-200/40 backdrop-blur-xl">
                {/* Header */}
                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 ring-4 ring-neutral-100">
                        <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                            Welcome to QuickFix
                        </h2>
                        <p className="text-sm text-neutral-500">
                            Enter your email to continue
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleEmailSubmit} className="mb-6 space-y-4">
                    <div>
                        <label className="flex items-center gap-1 text-xs font-medium text-neutral-600">
                            <Mail className="h-3 w-3" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                            placeholder="your.email@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Checking...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Continue
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </form>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-neutral-500">Or continue with</span>
                    </div>
                </div>

                {/* Google Login Button */}
                <Button
                    type="button"
                    className="group relative w-full justify-center gap-3 border-neutral-200 bg-white font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    variant="outline"
                    onClick={signInWithGoogle}
                >
                    {GoogleIcon}
                    <span className="flex-1 text-center">Continue with Google</span>
                </Button>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-neutral-400">
                    © {new Date().getFullYear()} QuickFix. All rights reserved.
                </p>
            </Card>
        </div>
    );
}
