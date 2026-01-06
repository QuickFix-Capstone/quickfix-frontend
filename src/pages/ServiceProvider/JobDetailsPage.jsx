import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

const JOB_DETAILS_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job_information";

const APPLY_JOB_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job";

export default function ProviderJobDetails() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Apply form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // =============================
  // FETCH JOB DETAILS
  // =============================
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setError("");

        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();

        const res = await fetch(`${JOB_DETAILS_API}/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 403)
          throw new Error("You are not allowed to view this job");
        if (res.status === 404) throw new Error("Job not found");
        if (!res.ok) throw new Error("Failed to load job");

        const data = await res.json();
        setJob(data.job);
      } catch (err) {
        setError(err.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // =============================
  // SUBMIT APPLICATION
  // =============================
  const submitApplication = async () => {
    try {
      setSubmitLoading(true);
      setSubmitError("");

      const session = await fetchAuthSession();
      const token = session.tokens.idToken.toString();

      const res = await fetch(`${APPLY_JOB_API}/${jobId}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposed_price: Number(price),
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit application");
      }

      setSubmitSuccess(true);
      setShowApplyForm(false);

      // Update local job state
      setJob((prev) => ({
        ...prev,
        has_applied: true,
      }));
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // =============================
  // UI STATES
  // =============================
  if (loading) {
    return <p className="text-neutral-500">Loading job...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!job) return null;

  //   // =============================
  //   // RENDER
  //   // =============================
  //   return (
  //     <div className="mx-auto max-w-3xl p-6 space-y-6">
  //       {/* TITLE */}
  //       <h1 className="text-2xl font-bold">{job.title}</h1>

  //       {/* DESCRIPTION */}
  //       <p className="text-neutral-600">{job.description}</p>

  //       {/* META */}
  //       <div className="space-y-2 text-sm">
  //         <p>
  //           <strong>Location:</strong>{" "}
  //           {job.location?.address
  //             ? `${job.location.address}, ${job.location.city}, ${job.location.state}`
  //             : `${job.location.city}, ${job.location.state}`}
  //         </p>

  //         <p>
  //           <strong>Budget:</strong>{" "}
  //           {job.budget?.min && job.budget?.max
  //             ? `$${job.budget.min} – $${job.budget.max}`
  //             : "Not specified"}
  //         </p>

  //         <p>
  //           <strong>Status:</strong> {job.status}
  //         </p>

  //         {(job.preferred_date || job.preferred_time) && (
  //           <p>
  //             <strong>Preferred:</strong> {job.preferred_date}{" "}
  //             {job.preferred_time || ""}
  //           </p>
  //         )}
  //       </div>

  //       {/* STATUS TAGS */}
  //       <div className="space-x-3">
  //         {job.is_assigned && (
  //           <span className="text-green-600 font-medium">Assigned to you</span>
  //         )}

  //         {job.has_applied && !job.is_assigned && (
  //           <span className="text-blue-600 font-medium">Application sent</span>
  //         )}
  //       </div>

  //       {/* APPLY SECTION */}
  //       {job.status === "open" && !job.has_applied && !job.is_assigned && (
  //         <div className="pt-6 border-t space-y-4">
  //           {!showApplyForm ? (
  //             <button
  //               onClick={() => setShowApplyForm(true)}
  //               className="px-4 py-2 bg-black text-white rounded"
  //             >
  //               Apply to Job
  //             </button>
  //           ) : (
  //             <>
  //               <div>
  //                 <label className="block text-sm font-medium">
  //                   Proposed Price
  //                 </label>
  //                 <input
  //                   type="number"
  //                   value={price}
  //                   onChange={(e) => setPrice(e.target.value)}
  //                   className="w-full border rounded px-3 py-2"
  //                   placeholder="e.g. 120"
  //                 />
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-medium">
  //                   Message (REQUIRED)
  //                 </label>
  //                 <textarea
  //                   required
  //                   value={message}
  //                   onChange={(e) => setMessage(e.target.value)}
  //                   className="w-full border rounded px-3 py-2"
  //                   placeholder="Why are you a good fit?"
  //                 />
  //               </div>

  //               {submitError && (
  //                 <p className="text-red-500 text-sm">{submitError}</p>
  //               )}

  //               {submitSuccess && (
  //                 <p className="text-green-600 text-sm">
  //                   Application submitted successfully
  //                 </p>
  //               )}

  //               <div className="flex gap-3">
  //                 <button
  //                   onClick={submitApplication}
  //                   disabled={submitLoading}
  //                   className="px-4 py-2 bg-green-600 text-white rounded"
  //                 >
  //                   {submitLoading ? "Submitting..." : "Submit Application"}
  //                 </button>

  //                 <button
  //                   onClick={() => setShowApplyForm(false)}
  //                   className="px-4 py-2 border rounded"
  //                 >
  //                   Cancel
  //                 </button>
  //               </div>
  //             </>)
  //           )}
  //         </div>
  //       )}
  //     </div>
  //   );
  // }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden space-y-6">
        {/* IMAGE PLACEHOLDER */}
        <div className="relative w-full bg-neutral-100">
          <div className="aspect-[16/9] flex items-center justify-center text-neutral-400">
            <div className="flex flex-col items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v9A2.25 2.25 0 0118.75 18.75H5.25A2.25 2.25 0 013 16.5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 15l4.5-4.5a1.5 1.5 0 012.12 0L15 16.5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M14.25 14.25l1.5-1.5a1.5 1.5 0 012.12 0L21 15"
                />
              </svg>
              <span className="text-sm font-medium">Job image placeholder</span>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition" />
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* HEADER */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              {job.title}
            </h1>
            <p className="text-neutral-600 leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* META INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="font-medium text-neutral-800">📍 Location</p>
              <p className="text-neutral-600 mt-1">
                {job.location?.address
                  ? `${job.location.address}, ${job.location.city}, ${job.location.state}`
                  : `${job.location.city}, ${job.location.state}`}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="font-medium text-neutral-800">💰 Budget</p>
              <p className="text-green-700 font-semibold mt-1">
                {job.budget?.min && job.budget?.max
                  ? `$${job.budget.min} – $${job.budget.max}`
                  : "Not specified"}
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="font-medium text-neutral-800">📌 Status</p>
              <p className="mt-1 capitalize text-neutral-600">{job.status}</p>
            </div>

            {(job.preferred_date || job.preferred_time) && (
              <div className="rounded-lg bg-neutral-50 p-4">
                <p className="font-medium text-neutral-800">
                  🕒 Preferred Time
                </p>
                <p className="text-neutral-600 mt-1">
                  {job.preferred_date} {job.preferred_time || ""}
                </p>
              </div>
            )}
          </div>

          {/* STATUS BADGES */}
          <div className="flex gap-3">
            {job.is_assigned && (
              <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium">
                Assigned to you
              </span>
            )}

            {job.has_applied && !job.is_assigned && (
              <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
                Application sent
              </span>
            )}
          </div>

          {/* APPLY SECTION */}
          {job.status === "open" && !job.has_applied && !job.is_assigned && (
            <div className="pt-6 border-t space-y-5">
              {!showApplyForm ? (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-black text-white font-medium
                           hover:bg-neutral-800 transition active:scale-[0.98]"
                >
                  Apply to Job
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Proposed Price
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg border px-4 py-2
                               focus:ring-2 focus:ring-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-lg border px-4 py-2 min-h-[120px]
                               focus:ring-2 focus:ring-black focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={submitApplication}
                      disabled={submitLoading}
                      className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium
                               hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {submitLoading ? "Submitting..." : "Submit Application"}
                    </button>

                    <button
                      onClick={() => setShowApplyForm(false)}
                      className="px-6 py-3 rounded-lg border hover:bg-neutral-100 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
