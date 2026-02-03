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
import { useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import Button from "../../components/UI/Button";

const API_BASE = "https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/prod";

export default function JobDetailsPage() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Price change modal state
  const [showPriceChangeModal, setShowPriceChangeModal] = useState(false);
  const [proposedFinalPrice, setProposedFinalPrice] = useState("");
  const [priceChangeReason, setPriceChangeReason] = useState("");
  const [submittingPriceChange, setSubmittingPriceChange] = useState(false);

  // ─────────────────────────────────────
  // Fetch job details
  // ─────────────────────────────────────
  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to load job");
        return;
      }

      setJob(data.job);
    } catch (err) {
      console.error(err);
      alert("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // ─────────────────────────────────────
  // Request price change
  // ─────────────────────────────────────
  const handleRequestPriceChange = async () => {
    if (!proposedFinalPrice || !priceChangeReason) {
      alert("Please provide a price and a reason.");
      return;
    }

    if (Number(proposedFinalPrice) < job.final_price) {
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
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmittingPriceChange(false);
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
      fetchJobDetails();
    } catch (err) {
      console.error(err);
      alert("Failed to complete job");
    }
  };

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!job) {
    return <div className="p-6">Job not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Job Details</h1>

      <div className="mb-4">
        <p>
          <strong>Status:</strong> {job.status}
        </p>
        <p>
          <strong>Final Price:</strong> ${job.final_price}
        </p>
      </div>

      {/* Pending banner */}
      {job.status === "budget_change_pending" && (
        <div className="mb-4 p-4 rounded-md bg-orange-50 border border-orange-200">
          <p className="font-medium text-orange-700">
            Waiting for customer approval
          </p>
          <p className="text-sm text-orange-600">
            You requested a price change. You cannot complete this job until the
            customer responds.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {/* Request Price Change */}
        {job.status === "in_progress" && !job.pending_price_change_request && (
          <Button
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
            onClick={() => setShowPriceChangeModal(true)}
          >
            Request Price Change
          </Button>
        )}

        {/* Complete Job */}
        <Button
          disabled={job.status === "budget_change_pending"}
          onClick={handleCompleteJob}
        >
          {job.status === "budget_change_pending"
            ? "Waiting for Approval"
            : "Mark as Complete"}
        </Button>
      </div>

      {/* Price Change Modal */}
      {showPriceChangeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Request Price Change</h2>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Current Price
              </label>
              <input
                type="text"
                value={`$${job.final_price}`}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                New Proposed Price
              </label>
              <input
                type="number"
                min={job.final_price}
                value={proposedFinalPrice}
                onChange={(e) => setProposedFinalPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                rows={4}
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                className="w-full border rounded px-3 py-2"
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
    </div>
  );
}
