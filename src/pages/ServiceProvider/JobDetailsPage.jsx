// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";

// const JOB_DETAILS_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job_information";

// const APPLY_JOB_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job";

// export default function ProviderJobDetails() {
//   const { jobId } = useParams();

//   const [job, setJob] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Apply form state
//   const [showApplyForm, setShowApplyForm] = useState(false);
//   const [price, setPrice] = useState("");
//   const [message, setMessage] = useState("");
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const [_submitError, setSubmitError] = useState("");
//   const [_submitSuccess, setSubmitSuccess] = useState(false);

//   // =============================
//   // FETCH JOB DETAILS
//   // =============================
//   useEffect(() => {
//     const fetchJob = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const session = await fetchAuthSession();
//         const token = session.tokens.idToken.toString();

//         const res = await fetch(`${JOB_DETAILS_API}/${jobId}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (res.status === 403)
//           throw new Error("You are not allowed to view this job");
//         if (res.status === 404) throw new Error("Job not found");
//         if (!res.ok) throw new Error("Failed to load job");

//         const data = await res.json();
//         setJob(data.job);
//       } catch (err) {
//         setError(err.message || "Failed to load job");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchJob();
//   }, [jobId]);

//   // =============================
//   // SUBMIT APPLICATION
//   // =============================
//   const submitApplication = async () => {
//     try {
//       setSubmitLoading(true);
//       setSubmitError("");

//       const session = await fetchAuthSession();
//       const token = session.tokens.idToken.toString();

//       const res = await fetch(`${APPLY_JOB_API}/${jobId}/applications`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           proposed_price: Number(price),
//           message,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.message || "Failed to submit application");
//       }

//       setSubmitSuccess(true);
//       setShowApplyForm(false);

//       // Update local job state
//       setJob((prev) => ({
//         ...prev,
//         has_applied: true,
//       }));
//     } catch (err) {
//       setSubmitError(err.message);
//     } finally {
//       setSubmitLoading(false);
//     }
//   };

//   // =============================
//   // UI STATES
//   // =============================
//   if (loading) {
//     return <p className="text-neutral-500">Loading job...</p>;
//   }

//   if (error) {
//     return <p className="text-red-500">{error}</p>;
//   }

//   if (!job) return null;
//   return (
//     <div className="mx-auto max-w-3xl p-6">
//       <div className="rounded-2xl border bg-white shadow-sm overflow-hidden space-y-6">
//         {/* IMAGE PLACEHOLDER */}
//         <div className="relative w-full bg-neutral-100">
//           <div className="aspect-[16/9] flex items-center justify-center text-neutral-400">
//             <div className="flex flex-col items-center gap-2">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-10 w-10"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={1.5}
//                   d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9A2.25 2.25 0 0118.75 18.75H5.25A2.25 2.25 0 013 16.5z"
//                 />
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={1.5}
//                   d="M3 15l4.5-4.5a1.5 1.5 0 012.12 0L15 16.5"
//                 />
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={1.5}
//                   d="M14.25 14.25l1.5-1.5a1.5 1.5 0 012.12 0L21 15"
//                 />
//               </svg>
//               <span className="text-sm font-medium">Job image placeholder</span>
//             </div>
//           </div>

//           {/* Hover overlay */}
//           <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition" />
//         </div>

//         {/* CONTENT */}
//         <div className="p-6 space-y-6">
//           {/* HEADER */}
//           <div className="space-y-2">
//             <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
//               {job.title}
//             </h1>
//             <p className="text-neutral-600 leading-relaxed">
//               {job.description}
//             </p>
//           </div>

//           {/* META INFO */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
//             <div className="rounded-lg bg-neutral-50 p-4">
//               <p className="font-medium text-neutral-800">📍 Location</p>
//               <p className="text-neutral-600 mt-1">
//                 {job.location?.address
//                   ? `${job.location.address}, ${job.location.city}, ${job.location.state}`
//                   : `${job.location.city}, ${job.location.state}`}
//               </p>
//             </div>

//             <div className="rounded-lg bg-neutral-50 p-4">
//               <p className="font-medium text-neutral-800">💰 Budget</p>
//               <p className="text-green-700 font-semibold mt-1">
//                 {job.budget?.min && job.budget?.max
//                   ? `$${job.budget.min} – $${job.budget.max}`
//                   : "Not specified"}
//               </p>
//             </div>

//             <div className="rounded-lg bg-neutral-50 p-4">
//               <p className="font-medium text-neutral-800">📌 Status</p>
//               <p className="mt-1 capitalize text-neutral-600">{job.status}</p>
//             </div>

//             {(job.preferred_date || job.preferred_time) && (
//               <div className="rounded-lg bg-neutral-50 p-4">
//                 <p className="font-medium text-neutral-800">
//                   🕒 Preferred Time
//                 </p>
//                 <p className="text-neutral-600 mt-1">
//                   {job.preferred_date} {job.preferred_time || ""}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* STATUS BADGES */}
//           <div className="flex gap-3">
//             {job.is_assigned && (
//               <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium">
//                 Assigned to you
//               </span>
//             )}

//             {job.has_applied && !job.is_assigned && (
//               <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
//                 Application sent
//               </span>
//             )}
//           </div>

//           {/* APPLY SECTION */}
//           {job.status === "open" && !job.has_applied && !job.is_assigned && (
//             <div className="pt-6 border-t space-y-5">
//               {!showApplyForm ? (
//                 <button
//                   onClick={() => setShowApplyForm(true)}
//                   className="w-full sm:w-auto px-6 py-3 rounded-lg bg-black text-white font-medium
//                            hover:bg-neutral-800 transition active:scale-[0.98]"
//                 >
//                   Apply to Job
//                 </button>
//               ) : (
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium mb-1">
//                       Proposed Price
//                     </label>
//                     <input
//                       type="number"
//                       value={price}
//                       onChange={(e) => setPrice(e.target.value)}
//                       className="w-full rounded-lg border px-4 py-2
//                                focus:ring-2 focus:ring-black focus:outline-none"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium mb-1">
//                       Message <span className="text-red-500">*</span>
//                     </label>
//                     <textarea
//                       required
//                       value={message}
//                       onChange={(e) => setMessage(e.target.value)}
//                       className="w-full rounded-lg border px-4 py-2 min-h-[120px]
//                                focus:ring-2 focus:ring-black focus:outline-none"
//                     />
//                   </div>

//                   <div className="flex gap-3">
//                     <button
//                       onClick={submitApplication}
//                       disabled={submitLoading}
//                       className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium
//                                hover:bg-green-700 transition disabled:opacity-50"
//                     >
//                       {submitLoading ? "Submitting..." : "Submit Application"}
//                     </button>

//                     <button
//                       onClick={() => setShowApplyForm(false)}
//                       className="px-6 py-3 rounded-lg border hover:bg-neutral-100 transition"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
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
      const initialImages = Array.isArray(jobData?.images) ? jobData.images : [];
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

  const badge = statusStyles[job.status] || "bg-slate-50 text-slate-700 border-slate-200";
  const hasApplied = Boolean(job?.has_applied || job?.application_status);
  const finalPrice = job?.final_price ?? job?.budget?.final_price;
  const sortedImages = [...images].sort((a, b) => (a.image_order || 0) - (b.image_order || 0));
  const primaryImage =
    sortedImages.find((img) => img.image_id === activeImageId) || sortedImages[0] || null;
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
            <span className={`shrink-0 text-xs px-3 py-1 rounded-full border font-medium ${badge}`}>
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
                  You requested a price change. You cannot complete this job until the
                  customer responds.
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
                    const isActive = (activeImageId || primaryImage?.image_id) === img.image_id;
                    return (
                      <button
                        type="button"
                        key={img.image_id || img.image_key}
                        onClick={() => setActiveImageId(img.image_id)}
                        className={`overflow-hidden rounded-lg border ${
                          isActive ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"
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
              <p className="text-sm text-slate-600">No preview image available yet.</p>
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
              {job.location?.address && <>{job.location.address}<br /></>}
              {job.location?.city || "—"}{job.location?.state && `, ${job.location.state}`}
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
              <p className="text-sm text-slate-500 mt-1">{job.customer_email}</p>
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

            {job.status === "in_progress" && !job.pending_price_change_request && (
              <Button
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={() => setShowPriceChangeModal(true)}
              >
                Request Price Change
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
