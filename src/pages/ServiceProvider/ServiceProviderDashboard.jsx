import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  Briefcase,
  ClipboardList,
  UserCircle2,
} from "lucide-react";
import { API_BASE } from "../../api/config";
import { serviceOfferingsApi } from "../../api/serviceOffering";
import { deleteServiceOffering } from "../../api/serviceOfferings";

import OfferingCard from "../../components/UI/OfferingCards";
import CreateServiceCard from "../../components/UI/CreateServiceCardStyle";
import MyJobApplicationsWidget from "../../pages/ServiceProvider/MyJobApplicationWidget";
import AlertBanner from "../../components/UI/AlertBanner";
import ProviderReviews from "../../components/reviews/ProviderReviews";

export default function ServiceProviderDashboard() {
  const [offerings, setOfferings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleEdit = (offering) => {
    navigate(
      `/service-provider/offerings/${offering.service_offering_id}/edit`,
    );
  };

  const handleDelete = async (offering) => {
    setDeleteTarget(offering);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.service_offering_id) return;

    try {
      setIsDeleting(true);
      await deleteServiceOffering(deleteTarget.service_offering_id);
      setOfferings((prev) =>
        prev.filter(
          (item) =>
            item.service_offering_id !== deleteTarget.service_offering_id,
        ),
      );
      setToast("Service offering deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete service offering.");
    } finally {
      setIsDeleting(false);
    }
  };

  const goToBookings = () => {
    navigate("/service-provider/bookings");
  };

  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

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
        const data = await serviceOfferingsApi.listMine();
        const list = Array.isArray(data)
          ? data
          : data?.items || data?.offerings || [];
        setOfferings(list);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load service offerings");
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-indigo-300/35 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14">
          <div className="h-10 w-72 animate-pulse rounded-xl bg-gradient-to-r from-slate-300 to-slate-200" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <AlertBanner variant="error" message={error} className="mt-3 text-left" />
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute right-0 top-10 h-[26rem] w-[26rem] rounded-full bg-indigo-300/30 blur-3xl" />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Delete Service Offering
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete "{deleteTarget.title}"?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="w-full rounded-lg border border-red-300 bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-sm text-white hover:brightness-110 disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-7xl px-4 py-10">
        {toast ? (
          <AlertBanner variant="success" message={toast} className="mb-4" />
        ) : null}

        <div className="mb-8 rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-600 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Service Provider Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
                Welcome back
                {profile?.business_name ? `, ${profile.business_name}` : ""}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Keep track of bookings, applications, and service offerings in one
                place.
              </p>
            </div>
            <button
              onClick={() => navigate("/service-provider/profile")}
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-white/20"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {profile && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow-md">
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
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  profile.verification_status === "VERIFIED"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-700"
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
            className="group rounded-2xl border border-indigo-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
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
            className="group rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <p className="font-semibold text-slate-900">Applications</p>
            <p className="mt-1 text-sm text-slate-600">
              {applicationCount > 0
                ? `${applicationCount} application${applicationCount === 1 ? "" : "s"} submitted`
                : "Track submitted proposals"}
            </p>
          </button>

          <button
            onClick={goToBookings}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left shadow-lg backdrop-blur-lg transition hover:-translate-y-1 ${
              pendingCount > 0
                ? "border-red-300 bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 text-white ring-2 ring-red-300/70 animate-[pulse_1s_ease-in-out_infinite]"
                : "border-rose-100 bg-white shadow-sm"
            }`}
          >
            {pendingCount > 0 ? (
              <span className="absolute right-3 top-3 inline-flex h-3 w-3 rounded-full bg-white animate-ping" />
            ) : null}
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
            className="group rounded-2xl border border-violet-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
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

        <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
            <CreateServiceCard />
          </div>
          {offerings.map((offering) => (
            <div
              key={offering.service_offering_id}
              className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
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

        <ProviderReviews providerId={profile?.provider_id} />
      </div>
    </div>
  );
}

