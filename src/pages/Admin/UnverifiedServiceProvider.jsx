import React, { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

export default function AdminUnverifiedServiceProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const session = await fetchAuthSession();

      const accessToken = session.tokens?.accessToken?.toString();
      if (!accessToken) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/admin/unverified_service_provider`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      // Handle auth failures explicitly
      if (res.status === 401 || res.status === 403) {
        navigate("/login");
        return;
      }

      const data = await res.json();
      console.log("📥 API Response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch providers");
      }

      setProviders(data.providers || []);
    } catch (err) {
      console.error("Admin unverified fetch error:", err);
      setError(err.message || "Failed to load providers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =====================================================
  // UI STATES
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600 text-lg">
            Loading unverified service providers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Error Loading Providers
          </h2>
          <p className="text-red-600 text-center mb-6">{error}</p>
          <button
            onClick={() => fetchProviders()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN VIEW
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Unverified Service Providers
            </h1>
            <p className="text-gray-600 mt-1">
              Review and manage pending service provider applications
            </p>
          </div>

          <button
            onClick={() => fetchProviders(true)}
            disabled={refreshing}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {providers.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              No unverified providers 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {providers.map((provider) => (
                    <tr key={provider.provider_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div
                          onClick={() =>
                            navigate(
                              `/admin/service-providers-details/${provider.provider_id}`,
                            )
                          }
                          className="font-medium text-blue-600 hover:underline cursor-pointer"
                        >
                          {provider.business_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {provider.is_active ? "Active" : "Inactive"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {provider.email}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-900">
                        {provider.city}, {provider.province}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/service-providers-details/${provider.provider_id}`,
                            )
                          }
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
