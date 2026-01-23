import React, { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

export default function AdminServiceProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      setError(null);

      // 🔐 Get Cognito session
      const session = await fetchAuthSession();

      // ✅ ACCESS TOKEN
      const accessToken = session.tokens?.accessToken?.toString();
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_BASE}/admin/all-service-provider`, {
        method: "GET",
        headers: {
          // 🚨 REST API DOES NOT USE "Bearer"
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch service providers");
      }

      const data = await res.json();
      setProviders(data.items || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError(err.message || "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-gray-500">Loading service providers…</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600 font-semibold">Error: {error}</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Service Providers</h1>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Business</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">City</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Rating</th>
            </tr>
          </thead>

          <tbody>
            {providers.map((p) => (
              <tr key={p.provider_id} className="hover:bg-gray-50">
                <td className="p-2 border">{p.business_name || "—"}</td>
                <td className="p-2 border">{p.email}</td>
                <td className="p-2 border">
                  {p.city}, {p.province}
                </td>
                <td className="p-2 border">
                  <span
                    className={
                      p.verification_status === "APPROVED"
                        ? "text-green-600 font-semibold"
                        : p.verification_status === "PENDING"
                          ? "text-yellow-600 font-semibold"
                          : "text-red-600 font-semibold"
                    }
                  >
                    {p.verification_status}
                  </span>
                </td>
                <td className="p-2 border">{p.is_active ? "Yes" : "No"}</td>
                <td className="p-2 border">
                  {p.average_rating ? Number(p.average_rating).toFixed(1) : "—"}
                </td>
              </tr>
            ))}

            {providers.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No service providers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
