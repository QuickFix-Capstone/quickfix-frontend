// src/pages/customer/RegisterCustomer.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { User, Mail, Phone, MapPin } from "lucide-react";

// 👉 Adjust this if your API URL changes
const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com";

export default function RegisterCustomer({
  // These props are still passed from App, but we no longer use onRegister
  error: externalError,
  onBackToLogin,
}) {
  const auth = useAuth();
  const navigate = useNavigate();

  // 🔑 Form state (camelCase)
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 🐛 Debug: Log auth state on mount
  useEffect(() => {
    console.log("[RegisterCustomer] Component mounted");
    console.log("[RegisterCustomer] Auth state:", {
      isAuthenticated: auth.isAuthenticated,
      hasUser: !!auth.user,
      email: auth.user?.profile?.email,
      cognitoSub: auth.user?.profile?.sub,
      hasIdToken: !!auth.user?.id_token,
      hasAccessToken: !!auth.user?.access_token,
    });
  }, [auth]);

  // ─────────────────────────────────────────────
  // 0. Guard: user must be logged in via Cognito
  // ─────────────────────────────────────────────
  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="flex min-height-[70vh] items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-neutral-500">
            Please sign in first to complete your QuickFix profile.
          </p>
          {onBackToLogin && (
            <Button
              type="button"
              onClick={onBackToLogin}
              className="px-4 py-2 text-sm"
            >
              Go to Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Basic info from Cognito token
  const email = auth.user.profile.email;
  const cognitoSub = auth.user.profile.sub;
  const displayName =
    auth.user.profile.name || auth.user.profile.given_name || email;

  // ─────────────────────────────────────────────
  // 1. Handlers
  // ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    console.log("[RegisterCustomer] Validating form:", form);
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.province.trim() ||
      !form.postalCode.trim()
    ) {
      console.log("[RegisterCustomer] ❌ Validation failed: Missing required fields");
      setError("Missing required fields");
      return false;
    }
    console.log("[RegisterCustomer] ✅ Validation passed");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[RegisterCustomer] 📝 Form submitted");
    setError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const idToken = auth.user.id_token || auth.user.access_token;
      console.log("[RegisterCustomer] 🔑 Token extracted:", {
        hasIdToken: !!auth.user.id_token,
        hasAccessToken: !!auth.user.access_token,
        usingToken: idToken ? "id_token" : "access_token",
        tokenPreview: idToken ? `${idToken.substring(0, 20)}...` : "none",
      });

      // Combine address lines for backend "address" column
      const fullAddress = form.addressLine2
        ? `${form.addressLine1}, ${form.addressLine2}`
        : form.addressLine1;

      // 🔁 Map camelCase → backend snake_case
      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone,
        address: fullAddress,
        city: form.city,
        state: form.province,
        postal_code: form.postalCode,
        // email + cognito_sub will usually be taken from JWT in backend,
        // but adding them doesn't hurt if your Lambda expects them.
        email,
        cognito_sub: cognitoSub,
      };

      console.log("[RegisterCustomer] 📦 API Payload:", payload);
      console.log("[RegisterCustomer] 🌐 API Endpoint:", `${API_BASE}/customer`);

      const res = await fetch(`${API_BASE}/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("[RegisterCustomer] 📡 API Response:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (res.status === 201 || res.status === 200) {
        const responseBody = await res.json().catch(() => ({}));
        console.log("[RegisterCustomer] ✅ Success! Response body:", responseBody);
        console.log("[RegisterCustomer] 🚀 Navigating to /customer/dashboard");
        // ✅ Profile created → go to customer dashboard
        navigate("/customer/dashboard", { replace: true });
      } else {
        const body = await res.json().catch(() => ({}));
        console.log("[RegisterCustomer] ❌ API Error:", {
          status: res.status,
          body,
        });
        setError(body.message || `Unexpected status: ${res.status}`);
      }
    } catch (err) {
      console.error("[RegisterCustomer] 💥 Exception caught:", err);
      console.error("[RegisterCustomer] Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(err.message || "Network error");
    } finally {
      console.log("[RegisterCustomer] 🏁 Submission complete, resetting submitting state");
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // 2. UI
  // ─────────────────────────────────────────────
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
              Complete your customer profile
            </h1>
            <p className="text-xs text-neutral-500">
              We’ll use this info for bookings, locations, and communication.
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
          <div className="text-xs text-neutral-500">Linked to your login account.</div>
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
          {(error || externalError) && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              {error || externalError}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full justify-center bg-neutral-900 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              {submitting ? "Saving profile…" : "Complete Registration"}
            </Button>

            {onBackToLogin && (
              <Button
                type="button"
                variant="link"
                onClick={onBackToLogin}
                className="text-xs text-neutral-500 hover:text-neutral-900"
              >
                Back to login
              </Button>
            )}
          </div>

          <p className="pt-2 text-center text-[10px] text-neutral-400">
            © {new Date().getFullYear()} QuickFix. Secure &amp; private.
          </p>
        </form>
      </Card>
    </div>
  );
}