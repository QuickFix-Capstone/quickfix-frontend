import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  Briefcase,
  ClipboardList,
  UserCircle2,
} from "lucide-react";
import { API_BASE } from "../../api/config";

import OfferingCard from "../../components/UI/OfferingCards";
import CreateServiceCard from "../../components/UI/CreateServiceCardStyle";
import MyJobApplicationsWidget from "../../pages/ServiceProvider/MyJobApplicationWidget";

export default function ServiceProviderDashboard() {
  const [offerings, setOfferings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);

  const navigate = useNavigate();

  const handleEdit = (offering) => {
    navigate(`/service-provider/edit/${offering.service_offering_id}`);
  };

  const handleDelete = async (offering) => {
    const confirmed = window.confirm(`Delete "${offering.title}"?`);
    if (!confirmed) return;
    console.log("Deleting:", offering.service_offering_id);
  };

  const goToBookings = () => {
    navigate("/service-provider/bookings");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error("Profile fetch failed");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load provider profile");
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) return;

        const res = await fetch(
          `${API_BASE}/service-provider/pending-booking`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          },
        );

        if (!res.ok) return;
        const data = await res.json();
        const pending = (data.bookings || []).filter(
          (b) => b.status === "pending" || b.status === "pending_confirmation",
        );
        setPendingCount(pending.length);
      } catch (err) {
        console.error("Failed to load pending bookings count", err);
      }
    };

    fetchPendingCount();
  }, []);

  useEffect(() => {
    const fetchApplicationCount = async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) return;

        const res = await fetch(`${API_BASE}/service_provider/applications`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        setApplicationCount(
          Array.isArray(data.applications) ? data.applications.length : 0,
        );
      } catch (err) {
        console.error("Failed to load application count", err);
      }
    };

    fetchApplicationCount();
  }, []);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(
          "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service-offerings",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) throw new Error("Offerings fetch failed");
        const data = await res.json();
        setOfferings(data.items || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load service offerings");
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-8 w-64 rounded-lg bg-gradient-to-r from-slate-200 to-slate-300 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="rounded-xl border bg-white p-6 text-center shadow-md">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-indigo-600 hover:to-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Service Provider Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome back
              {profile?.business_name ? `, ${profile.business_name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Keep track of bookings, applications, and service offerings in one
              place.
            </p>
          </div>
          <button
            onClick={() => navigate("/service-provider/profile")}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow hover:from-indigo-600 hover:to-blue-600 transition"
          >
            Edit Profile
          </button>
        </div>

        {profile && (
          <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {profile.business_name || "Service Provider"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {profile.email}
                    {profile.phone_number ? ` | ${profile.phone_number}` : ""}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                  profile.verification_status === "VERIFIED"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {profile.verification_status === "VERIFIED"
                  ? "Verified"
                  : "Verification Pending"}
              </span>
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate("/service-provider/jobs")}
            className="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <p className="font-semibold text-slate-900">My Jobs</p>
            <p className="mt-1 text-sm text-slate-600">
              View assigned and open jobs
            </p>
          </button>

          <button
            onClick={() => navigate("/service-provider/applications")}
            className="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <p className="font-semibold text-slate-900">Applications</p>
            <p className="mt-1 text-sm text-slate-600">
              Track submitted proposals
            </p>
          </button>

          <button
            onClick={goToBookings}
            className={`rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${
              pendingCount > 0
                ? "border-red-900 bg-red-700 text-white ring-4 ring-red-300 animate-[pulse_0.9s_ease-in-out_infinite]"
                : "bg-white"
            }`}
          >
            <div
              className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                pendingCount > 0
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <p
              className={`font-semibold ${pendingCount > 0 ? "text-white" : "text-slate-900"}`}
            >
              Bookings
            </p>
            <p
              className={`mt-1 text-sm ${pendingCount > 0 ? "text-red-100" : "text-slate-600"}`}
            >
              {pendingCount > 0
                ? "New booking waiting for review"
                : "Review pending confirmations"}
            </p>
          </button>

          <button
            onClick={() => navigate("/service-provider/calendar")}
            className="rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="font-semibold text-slate-900">Calendar</p>
            <p className="mt-1 text-sm text-slate-600">
              Manage availability and schedule
            </p>
          </button>
        </div>

        <div className="mb-10">
          <MyJobApplicationsWidget />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Your Service Offerings
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage, edit, and showcase your services.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateServiceCard />
          {offerings.map((offering) => (
            <div
              key={offering.service_offering_id}
              className="transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <OfferingCard
                offering={offering}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
