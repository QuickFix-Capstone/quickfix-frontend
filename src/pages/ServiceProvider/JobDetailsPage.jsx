import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  User,
  Tag,
  AlertCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Button from "../../components/UI/Button";
import { API_BASE } from "../../api/config";
import useWebSocket from "../../hooks/useWebSocket";

const statusStyles = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  assigned: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  budget_change_pending: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [activeImageId, setActiveImageId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Price change modal state
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [proposedFinalPrice, setProposedFinalPrice] = useState("");
  const [priceChangeReason, setPriceChangeReason] = useState("");
  const [submittingPriceChange, setSubmittingPriceChange] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationPrice, setApplicationPrice] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─────────────────────────────────────
  // Load current user ID for WebSocket
  // ─────────────────────────────────────
  useEffect(() => {
    getCurrentUser()
      .then((u) => setUserId(u.userId))
      .catch(() => {});
  }, []);

  // ─────────────────────────────────────
  // WebSocket for real-time status updates
  // ─────────────────────────────────────
  useWebSocket(userId, (data) => {
    if (data.type === "JOB_STATUS_CHANGED" && data.jobId === jobId) {
      setJob((prev) => (prev ? { ...prev, status: data.newStatus } : prev));
    }
  });

  const handleStartJob = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(
        `${API_BASE}/service-provider/jobs/${job.job_id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Failed to start job");
        return;
      }

      alert("Job started");
      silentRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to start job");
    }
  };

  // ─────────────────────────────────────
  // Fetch job details
  // ─────────────────────────────────────
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(`${API_BASE}/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to load job");
        return;
      }

      const jobData = data.job || null;
      setJob(jobData);
      const initialImages = Array.isArray(jobData?.images)
        ? jobData.images
        : [];
      setImages(initialImages);
      setActiveImageId(initialImages[0]?.image_id || null);

      // Fetch image records separately so we can get display URLs when available.
      try {
        const imagesRes = await fetch(`${API_BASE}/jobs/${jobId}/images`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (imagesRes.ok) {
          const imagesData = await imagesRes.json().catch(() => ({}));
          const apiImages = Array.isArray(imagesData?.images)
            ? imagesData.images
            : Array.isArray(imagesData)
              ? imagesData
              : [];
          if (apiImages.length > 0) {
            setImages(apiImages);
            setActiveImageId(apiImages[0]?.image_id || null);
          }
        }
      } catch {
        // Images endpoint may not be available for this job; fall back to initial images.
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId, refreshKey]);

  const silentRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // ─────────────────────────────────────
  // Request price change
  // ─────────────────────────────────────
  const handleRequestPriceChange = async () => {
    const currentFinalPrice = Number(
      job?.final_price ?? job?.budget?.final_price ?? 0,
    );

    if (!proposedFinalPrice || !priceChangeReason) {
      alert("Please provide a price and a reason.");
      return;
    }

    if (Number(proposedFinalPrice) < currentFinalPrice) {
      alert("Proposed price must be greater than or equal to current price.");
      return;
    }

    try {
      setSubmittingPriceChange(true);

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(
        `${API_BASE}/jobs/${job.job_id}/price-change-requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proposed_final_price: Number(proposedFinalPrice),
            reason: priceChangeReason,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to submit price change request");
        return;
      }

      alert("Price change request submitted. Waiting for customer approval.");
      setShowPriceChangeModal(false);
      setProposedFinalPrice("");
      setPriceChangeReason("");
      silentRefresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmittingPriceChange(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!applicationMessage.trim()) {
      alert("Please include a message for your application.");
      return;
    }

    if (applicationPrice && Number(applicationPrice) < 0) {
      alert("Proposed price cannot be negative.");
      return;
    }

    try {
      setSubmittingApplication(true);
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const payload = {
        message: applicationMessage.trim(),
      };
      if (applicationPrice !== "") {
        payload.proposed_price = Number(applicationPrice);
      }

      const res = await fetch(`${API_BASE}/job/${job.job_id}/applications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Failed to submit application");
        return;
      }

      alert("Application submitted successfully.");
      setShowApplyModal(false);
      setApplicationPrice("");
      setApplicationMessage("");
      silentRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to submit application");
    } finally {
      setSubmittingApplication(false);
    }
  };

  // ─────────────────────────────────────
  // Complete job
  // ─────────────────────────────────────
  const handleCompleteJob = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(`${API_BASE}/jobs/${job.job_id}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to complete job");
        return;
      }

      alert("Job marked as completed");
      silentRefresh();
    } catch (err) {
      console.error(err);
      alert("Failed to complete job");
    }
  };

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-900">Job not found</p>
          <button
            onClick={() => navigate("/service-provider/jobs")}
            className="mt-4 px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const badge =
    statusStyles[job.status] || "bg-slate-50 text-slate-700 border-slate-200";
  const hasApplied = Boolean(job?.has_applied || job?.application_status);
  const finalPrice = job?.final_price ?? job?.budget?.final_price;
  const sortedImages = [...images].sort(
    (a, b) => (a.image_order || 0) - (b.image_order || 0),
  );
  const primaryImage =
    sortedImages.find((img) => img.image_id === activeImageId) ||
    sortedImages[0] ||
    null;
  const getImageUrl = (image) =>
    image?.url ||
    image?.image_url ||
    image?.signed_url ||
    image?.presigned_url ||
    image?.preview_url ||
    null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate("/service-provider/jobs")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>

        {/* Header card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Job #{job.job_id}
                {job.booking_id && <> &middot; Booking #{job.booking_id}</>}
              </p>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {job.title || "Untitled Job"}
              </h1>
            </div>
            <span
              className={`shrink-0 text-xs px-3 py-1 rounded-full border font-medium ${badge}`}
            >
              {String(job.status).replaceAll("_", " ")}
            </span>
          </div>

          {job.description && (
            <p className="mt-4 text-slate-600 leading-relaxed">
              {job.description}
            </p>
          )}

          {job.category && (
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              <Tag className="w-3.5 h-3.5" />
              {job.category}
            </div>
          )}
        </div>

        {/* Budget change pending banner */}
        {job.status === "budget_change_pending" && (
          <div className="mb-4 p-4 rounded-2xl bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-orange-700">
                  Waiting for customer approval
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  You requested a price change. You cannot complete this job
                  until the customer responds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Job images */}
        <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            Job Images
          </div>

          {primaryImage && getImageUrl(primaryImage) ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={getImageUrl(primaryImage)}
                  alt={primaryImage.description || "Job image"}
                  className="h-64 w-full cursor-zoom-in object-cover sm:h-80"
                  onClick={() => setSelectedImage(primaryImage)}
                />
              </div>

              {sortedImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {sortedImages.map((img) => {
                    const url = getImageUrl(img);
                    if (!url) return null;
                    const isActive =
                      (activeImageId || primaryImage?.image_id) ===
                      img.image_id;
                    return (
                      <button
                        type="button"
                        key={img.image_id || img.image_key}
                        onClick={() => setActiveImageId(img.image_id)}
                        className={`overflow-hidden rounded-lg border ${
                          isActive
                            ? "border-indigo-400 ring-2 ring-indigo-100"
                            : "border-slate-200"
                        }`}
                      >
                        <img
                          src={url}
                          alt={img.description || "Job thumbnail"}
                          className="h-16 w-full object-cover sm:h-20"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">
                No preview image available yet.
              </p>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Location */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Location
            </div>
            <p className="text-slate-900">
              {job.location?.address && (
                <>
                  {job.location.address}
                  <br />
                </>
              )}
              {job.location?.city || "—"}
              {job.location?.state && `, ${job.location.state}`}
              {(job.location?.postal_code || job.location?.zip) &&
                ` ${job.location?.postal_code || job.location?.zip}`}
            </p>
          </div>

          {/* Schedule */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Schedule
            </div>
            <p className="text-slate-900">
              {job.schedule?.preferred_date || job.preferred_date || "—"}
            </p>
            {(job.schedule?.preferred_time || job.preferred_time) && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {job.schedule?.preferred_time || job.preferred_time}
              </p>
            )}
          </div>

          {/* Budget */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Budget
            </div>
            {finalPrice != null && (
              <p className="text-lg font-semibold text-green-700">
                ${Number(finalPrice).toFixed(2)}
              </p>
            )}
            {(job.budget?.min != null || job.budget?.max != null) && (
              <p className="text-sm text-slate-500 mt-1">
                Range: ${job.budget?.min ?? "—"} – ${job.budget?.max ?? "—"}
              </p>
            )}
            {finalPrice == null && !job.budget?.min && !job.budget?.max && (
              <p className="text-slate-500">Not specified</p>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              Customer
            </div>
            <p className="text-slate-900">
              {job.customer_name || job.customer_id || "—"}
            </p>
            {job.customer_email && (
              <p className="text-sm text-slate-500 mt-1">
                {job.customer_email}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            {job.status === "open" && !hasApplied && !job.is_assigned && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowApplyModal(true)}
              >
                Apply to Job
              </Button>
            )}

            {job.status === "open" && hasApplied && !job.is_assigned && (
              <Button disabled>Application Submitted</Button>
            )}

            {job.status === "in_progress" &&
              !job.pending_price_change_request && (
                <Button
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowPriceChangeModal(true)}
                >
                  Request Price Change
                </Button>
              )}

            {job.status === "assigned" && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleStartJob}
              >
                Start Job
              </Button>
            )}

            {(job.status === "assigned" || job.status === "in_progress") && (
              <Button
                disabled={job.status === "budget_change_pending"}
                onClick={handleCompleteJob}
              >
                {job.status === "budget_change_pending"
                  ? "Waiting for Approval"
                  : "Mark as Complete"}
              </Button>
            )}

            {job.status === "budget_change_pending" && (
              <Button disabled>Waiting for Approval</Button>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Apply to Job</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Proposed Price (optional)
              </label>
              <input
                type="number"
                min="0"
                value={applicationPrice}
                onChange={(e) => setApplicationPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter your quote"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Introduce yourself and describe your approach."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApplyModal(false)}
                disabled={submittingApplication}
              >
                Cancel
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmitApplication}
                disabled={submittingApplication}
              >
                {submittingApplication ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Price Change Modal */}
      {showPriceChangeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Request Price Change</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Current Price
              </label>
              <input
                type="text"
                value={`$${Number(finalPrice ?? 0).toFixed(2)}`}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                New Proposed Price
              </label>
              <input
                type="number"
                min={Number(finalPrice ?? 0)}
                value={proposedFinalPrice}
                onChange={(e) => setProposedFinalPrice(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                rows={4}
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Explain why additional budget is required…"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPriceChangeModal(false)}
                disabled={submittingPriceChange}
              >
                Cancel
              </Button>

              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleRequestPriceChange}
                disabled={submittingPriceChange}
              >
                {submittingPriceChange ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full image modal */}
      {selectedImage && getImageUrl(selectedImage) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={getImageUrl(selectedImage)}
              alt={selectedImage.description || "Job image"}
              className="max-h-[85vh] w-full object-contain"
            />
            {selectedImage.description && (
              <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                {selectedImage.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
