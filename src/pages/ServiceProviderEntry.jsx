// src/pages/ServiceProviderEntry.jsx
import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function ServiceProviderEntry() {
    const auth = useAuth();
    const navigate = useNavigate();
    console.log("ID TOKEN:", auth.user?.id_token);

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

                // 👉 Assuming your provider API endpoint is /service-provider or similar
                // If it's different, we can update it later.
                const res = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/service_provider",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 200) {
                    // ✅ Existing provider → go to provider dashboard
                    navigate("/provider/dashboard");
                } else if (res.status === 404) {
                    // 🆕 First time provider → go to registration form
                    navigate("/provider/register"); // Ensure this route exists
                } else {
                    console.error("Unexpected status:", res.status);
                    navigate("/");
                }
            } catch (err) {
                console.error("Provider profile check failed", err);
                navigate("/");
            }
        };

        checkProfile();
    }, [auth.isLoading, auth.isAuthenticated, auth.user, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center text-neutral-500">
            Checking provider account…
        </div>
    );
}
