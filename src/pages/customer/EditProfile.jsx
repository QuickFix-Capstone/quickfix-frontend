// src/pages/customer/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { User, Mail, Phone, MapPin, ArrowLeft } from "lucide-react";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com";

export default function EditProfile() {
    const auth = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        province: "",
        postalCode: "",
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Guard: user must be logged in
    useEffect(() => {
        if (!auth.isAuthenticated || !auth.user) {
            navigate("/customer/login");
            return;
        }

        // Fetch existing profile
        const fetchProfile = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;
                console.log("[EditProfile] Fetching existing profile...");

                const res = await fetch(`${API_BASE}/customer`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 200) {
                    const data = await res.json();
                    const customer = data.customer;
                    console.log("[EditProfile] Profile loaded:", customer);

                    // Pre-fill form with existing data
                    // Split address back into line1 and line2 if needed
                    const addressParts = customer.address ? customer.address.split(", ") : ["", ""];

                    setForm({
                        firstName: customer.first_name || "",
                        lastName: customer.last_name || "",
                        phone: customer.phone || "",
                        addressLine1: addressParts[0] || "",
                        addressLine2: addressParts[1] || "",
                        city: customer.city || "",
                        province: customer.state || "",
                        postalCode: customer.postal_code || "",
                    });
                } else {
                    console.error("[EditProfile] Failed to fetch profile");
                    setError("Could not load your profile. Please try again.");
                }
            } catch (err) {
                console.error("[EditProfile] Error fetching profile:", err);
                setError("Network error loading profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [auth, navigate]);

    const email = auth.user?.profile?.email;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        console.log("[EditProfile] Validating form:", form);
        if (
            !form.firstName.trim() ||
            !form.lastName.trim() ||
            !form.addressLine1.trim() ||
            !form.city.trim() ||
            !form.province.trim() ||
            !form.postalCode.trim()
        ) {
            console.log("[EditProfile] ❌ Validation failed: Missing required fields");
            setError("Missing required fields");
            return false;
        }
        console.log("[EditProfile] ✅ Validation passed");
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("[EditProfile] 📝 Form submitted");
        setError("");

        if (!validate()) return;

        setSubmitting(true);
        try {
            const idToken = auth.user.id_token || auth.user.access_token;
            console.log("[EditProfile] 🔑 Using token for update");

            // Combine address lines
            const fullAddress = form.addressLine2
                ? `${form.addressLine1}, ${form.addressLine2}`
                : form.addressLine1;

            // Map to backend snake_case
            const payload = {
                first_name: form.firstName,
                last_name: form.lastName,
                phone: form.phone,
                address: fullAddress,
                city: form.city,
                state: form.province,
                postal_code: form.postalCode,
            };

            console.log("[EditProfile] 📦 Update payload:", payload);

            const res = await fetch(`${API_BASE}/customer`, {
                method: "PUT", // Using PUT for update
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(payload),
            });

            console.log("[EditProfile] 📡 API Response:", {
                status: res.status,
                statusText: res.statusText,
            });

            if (res.status === 200) {
                const responseBody = await res.json().catch(() => ({}));
                console.log("[EditProfile] ✅ Profile updated successfully:", responseBody);
                console.log("[EditProfile] 🚀 Navigating back to dashboard");
                navigate("/customer/dashboard", { replace: true });
            } else {
                const body = await res.json().catch(() => ({}));
                console.log("[EditProfile] ❌ Update failed:", { status: res.status, body });
                setError(body.message || `Update failed: ${res.status}`);
            }
        } catch (err) {
            console.error("[EditProfile] 💥 Exception:", err);
            setError(err.message || "Network error");
        } finally {
            console.log("[EditProfile] 🏁 Submission complete");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-black mx-auto"></div>
                    <p className="text-sm text-neutral-500">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[85vh] items-start justify-center p-4 md:p-8">
            {/* background gradient */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-white to-white" />

            <Card className="w-full max-w-3xl border-neutral-200/60 bg-white/80 p-8 shadow-xl shadow-neutral-200/40 backdrop-blur-xl">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 ring-4 ring-neutral-100">
                        <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
                            Edit your profile
                        </h1>
                        <p className="text-xs text-neutral-500">
                            Update your personal information and address
                        </p>
                    </div>
                </div>

                {/* Email info */}
                <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                        <Mail className="h-3 w-3" />
                        <span>Email address</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{email}</div>
                    <div className="text-xs text-neutral-500">Cannot be changed.</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name + phone */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="flex items-center gap-1 text-xs font-medium text-neutral-600">
                                <User className="h-3 w-3" />
                                First Name
                            </label>
                            <input
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                placeholder="First name"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-neutral-600">
                                Last Name
                            </label>
                            <input
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                placeholder="Last name"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-1 text-xs font-medium text-neutral-600">
                            <Phone className="h-3 w-3" />
                            Phone Number
                        </label>
                        <input
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                            placeholder="Optional, but recommended"
                        />
                    </div>

                    {/* Address */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-neutral-600">
                            <MapPin className="h-3 w-3" />
                            <span>Address</span>
                        </div>

                        <div>
                            <label className="text-[11px] font-medium text-neutral-500">
                                Street Address
                            </label>
                            <input
                                name="addressLine1"
                                value={form.addressLine1}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                placeholder="123 Main St"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[11px] font-medium text-neutral-500">
                                Apt / Suite (Optional)
                            </label>
                            <input
                                name="addressLine2"
                                value={form.addressLine2}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                placeholder="Unit 202"
                            />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="text-[11px] font-medium text-neutral-500">
                                    City
                                </label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-medium text-neutral-500">
                                    State / Prov
                                </label>
                                <input
                                    name="province"
                                    value={form.province}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-medium text-neutral-500">
                                    Postal Code
                                </label>
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm uppercase focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-col gap-2">
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full justify-center bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
                        >
                            {submitting ? "Saving changes…" : "Save Changes"}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/customer/dashboard")}
                            className="w-full justify-center gap-2 text-xs text-neutral-600 hover:text-neutral-900"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Back to Dashboard
                        </Button>
                    </div>

                    <p className="pt-2 text-center text-[10px] text-neutral-400">
                        © {new Date().getFullYear()} QuickFix. Secure &amp; private.
                    </p>
                </form>
            </Card>
        </div>
    );
}
