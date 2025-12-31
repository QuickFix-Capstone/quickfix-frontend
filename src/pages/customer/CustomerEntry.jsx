// src/pages/CustomerEntry.jsx
import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function CustomerEntry() {
    const auth = useAuth();
    const navigate = useNavigate();
    console.log("ID TOKEN:", auth.user?.id_token);
    console.log("ACCESS TOKEN:", auth.user?.access_token);

    useEffect(() => {
        // Wait until OIDC finished loading
        if (auth.isLoading) return;

        // If somehow not logged in, go back to login
        if (!auth.isAuthenticated) {
            navigate("/login");
            return;
        }

        const checkProfile = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;

                console.log("🔍 CustomerEntry: Checking profile...");
                console.log("🔑 Token present:", !!token);

                const res = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer", // 👈 or /customer/get_profile
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("Profile check response status:", res.status);

                if (res.status === 200) {
                    // ✅ Existing customer → go to customer dashboard
                    const data = await res.json();
                    console.log("Existing customer profile:", data);
                    navigate("/customer/dashboard");
                } else if (res.status === 404) {
                    // 🆕 First time → go to registration form
                    console.log("New customer - redirecting to registration");
                    navigate("/customer/register");
                } else {
                    console.error("Unexpected status:", res.status);
                    // Fallback – send them home or to error page
                    navigate("/customer/register");
                }
            } catch (err) {
                console.error("Profile check failed", err);
                // If API call fails, assume new user and redirect to registration
                console.log("Error fallback - redirecting to registration");
                navigate("/customer/register");
            }
        };

        checkProfile();
    }, [auth.isLoading, auth.isAuthenticated, auth.user, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center text-neutral-500">
            Finishing sign-in…
        </div>
    );
}