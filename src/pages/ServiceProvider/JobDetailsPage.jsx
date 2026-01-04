// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { fetchAuthSession } from "aws-amplify/auth";

// const JOB_DETAILS_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job_information";

// export default function ProviderJobDetails() {
//   const { jobId } = useParams();

//   const [job, setJob] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchJob = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         // 🔐 Get Cognito ID token
//         const session = await fetchAuthSession();
//         const token = session.tokens.idToken.toString();

//         // 🌐 Call backend
//         const res = await fetch(`${JOB_DETAILS_API}/${jobId}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         // 🚫 Handle common error cases explicitly
//         if (res.status === 403) {
//           throw new Error("You are not allowed to view this job");
//         }

//         if (res.status === 404) {
//           throw new Error("Job not found");
//         }

//         if (!res.ok) {
//           throw new Error("Something went wrong loading the job");
//         }

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

//   // -----------------------------
//   // UI STATES
//   // -----------------------------

//   if (loading) {
//     return <p className="text-neutral-500">Loading job...</p>;
//   }

//   if (error) {
//     return <p className="text-red-500">{error}</p>;
//   }

//   if (!job) {
//     return null;
//   }

//   // -----------------------------
//   // RENDER
//   // -----------------------------

//   return (
//     <div className="mx-auto max-w-3xl p-6 space-y-4">
//       {/* TITLE */}
//       <h1 className="text-2xl font-bold">{job.title}</h1>

//       {/* DESCRIPTION */}
//       <p className="text-neutral-600">{job.description}</p>

//       {/* META */}
//       <div className="mt-4 space-y-2 text-sm">
//         {/* LOCATION */}
//         <p>
//           <strong>Location:</strong>{" "}
//           {job.location?.address
//             ? `${job.location.address}, ${job.location.city}, ${job.location.state}`
//             : `${job.location.city}, ${job.location.state}`}
//         </p>

//         {/* BUDGET */}
//         <p>
//           <strong>Budget:</strong>{" "}
//           {job.budget?.min && job.budget?.max
//             ? `$${job.budget.min} – $${job.budget.max}`
//             : "Not specified"}
//         </p>

//         {/* STATUS */}
//         <p>
//           <strong>Status:</strong> {job.status}
//         </p>

//         {/* DATE / TIME */}
//         {(job.preferred_date || job.preferred_time) && (
//           <p>
//             <strong>Preferred:</strong> {job.preferred_date}{" "}
//             {job.preferred_time || ""}
//           </p>
//         )}
//       </div>

//       {/* STATE TAGS */}
//       <div className="pt-4 space-x-3">
//         {job.is_assigned && (
//           <span className="text-green-600 font-medium">Assigned to you</span>
//         )}

//         {job.has_applied && !job.is_assigned && (
//           <span className="text-blue-600 font-medium">Application sent</span>
//         )}
//       </div>
//     </div>
//   );
// }

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

  // =============================
  // RENDER
  // =============================
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* TITLE */}
      <h1 className="text-2xl font-bold">{job.title}</h1>

      {/* DESCRIPTION */}
      <p className="text-neutral-600">{job.description}</p>

      {/* META */}
      <div className="space-y-2 text-sm">
        <p>
          <strong>Location:</strong>{" "}
          {job.location?.address
            ? `${job.location.address}, ${job.location.city}, ${job.location.state}`
            : `${job.location.city}, ${job.location.state}`}
        </p>

        <p>
          <strong>Budget:</strong>{" "}
          {job.budget?.min && job.budget?.max
            ? `$${job.budget.min} – $${job.budget.max}`
            : "Not specified"}
        </p>

        <p>
          <strong>Status:</strong> {job.status}
        </p>

        {(job.preferred_date || job.preferred_time) && (
          <p>
            <strong>Preferred:</strong> {job.preferred_date}{" "}
            {job.preferred_time || ""}
          </p>
        )}
      </div>

      {/* STATUS TAGS */}
      <div className="space-x-3">
        {job.is_assigned && (
          <span className="text-green-600 font-medium">Assigned to you</span>
        )}

        {job.has_applied && !job.is_assigned && (
          <span className="text-blue-600 font-medium">Application sent</span>
        )}
      </div>

      {/* APPLY SECTION */}
      {job.status === "open" && !job.has_applied && !job.is_assigned && (
        <div className="pt-6 border-t space-y-4">
          {!showApplyForm ? (
            <button
              onClick={() => setShowApplyForm(true)}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Apply to Job
            </button>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium">
                  Proposed Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g. 120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Message (REQUIRED)
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Why are you a good fit?"
                />
              </div>

              {submitError && (
                <p className="text-red-500 text-sm">{submitError}</p>
              )}

              {submitSuccess && (
                <p className="text-green-600 text-sm">
                  Application submitted successfully
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={submitApplication}
                  disabled={submitLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  {submitLoading ? "Submitting..." : "Submit Application"}
                </button>

                <button
                  onClick={() => setShowApplyForm(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
