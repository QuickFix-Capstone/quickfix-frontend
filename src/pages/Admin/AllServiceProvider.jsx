import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Building2,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
  ChevronRight,
  Search,
} from "lucide-react";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

export default function AdminServiceProviders() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_BASE}/admin/all-service-provider`, {
        method: "GET",
        headers: {
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

  const statusBadge = (status) => {
    const map = {
      APPROVED: {
        icon: CheckCircle,
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      VERIFIED: {
        icon: CheckCircle,
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      PENDING: {
        icon: Clock,
        bg: "bg-amber-50 text-amber-700 border-amber-200",
      },
      REJECTED: {
        icon: XCircle,
        bg: "bg-rose-50 text-rose-700 border-rose-200",
      },
    };

    const cfg = map[status?.toUpperCase()] || map.PENDING;
    const Icon = cfg.icon;
    const isApprovedOrVerified =
      status?.toUpperCase() === "APPROVED" ||
      status?.toUpperCase() === "VERIFIED";
    const displayStatus = isApprovedOrVerified ? "Verified" : status;

    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${cfg.bg}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="font-medium">{displayStatus}</span>
      </div>
    );
  };

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "APPROVED"
        ? p.verification_status?.toUpperCase() === "APPROVED" ||
          p.verification_status?.toUpperCase() === "VERIFIED"
        : p.verification_status?.toUpperCase() === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: providers.length,
    approved: providers.filter(
      (p) =>
        p.verification_status?.toUpperCase() === "APPROVED" ||
        p.verification_status?.toUpperCase() === "VERIFIED",
    ).length,
    pending: providers.filter(
      (p) => p.verification_status?.toUpperCase() === "PENDING",
    ).length,
    rejected: providers.filter(
      (p) => p.verification_status?.toUpperCase() === "REJECTED",
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Service Providers</h1>
          <p className="text-gray-500">
            Manage and review all service providers
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Users className="w-5 h-5" />
          <span className="font-medium">{providers.length} total</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
            Total
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">
            Verified
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {stats.approved}
          </p>
        </div>
        <div className="bg-amber-50 border-2 border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">
            Pending
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {stats.pending}
          </p>
        </div>
        <div className="bg-rose-50 border-2 border-rose-100 rounded-xl p-4">
          <p className="text-xs text-rose-600 font-semibold uppercase tracking-wide">
            Rejected
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border-2 border-gray-100 rounded-lg focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">All Status</option>
          <option value="APPROVED">Verified</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((p) => (
          <div
            key={p.provider_id}
            onClick={() =>
              navigate(`/admin/service-providers-details/${p.provider_id}`)
            }
            className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-blue-200 transition cursor-pointer group"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                    {p.business_name || "Unnamed Business"}
                  </h3>
                  {statusBadge(p.verification_status)}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition" />
            </div>

            {/* Card Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{p.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {p.city}, {p.province}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-4 h-4 text-gray-400" />
                <span>
                  {p.average_rating
                    ? `${Number(p.average_rating).toFixed(1)} stars`
                    : "No ratings yet"}
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  p.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {p.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-gray-400">
                Click to view details
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProviders.length === 0 && (
        <div className="bg-white border-2 border-gray-100 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No providers found
          </h3>
          <p className="text-gray-400">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your search or filter"
              : "No service providers have registered yet"}
          </p>
        </div>
      )}
    </div>
  );
}
