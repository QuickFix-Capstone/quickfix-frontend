// import { useEffect, useState } from "react";
// import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
// import { useNavigate } from "react-router-dom";

// const UPLOAD_CERT_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/certifications/upload-url";

// const CREATE_CERT_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/certifications";

// export default function ServiceProviderOnboarding() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     getCurrentUser().catch(() => navigate("/login"));
//   }, [navigate]);

//   const [form, setForm] = useState({
//     name: "",
//     business_name: "",
//     address_line: "",
//     city: "",
//     province: "",
//     postal_code: "",
//     bio: "",
//     certification_s3_key: "",
//   });

//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");

//   const handleChange = (e) => {
//     setForm((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   // ===============================
//   // 📤 Upload Certification to S3
//   // ===============================
//   const uploadCertification = async () => {
//     try {
//       setUploading(true);
//       setError("");
//       setStatus("");

//       if (!file) throw new Error("Please select a PDF file");
//       if (file.type !== "application/pdf")
//         throw new Error("Only PDF files are allowed");
//       if (file.size > 5 * 1024 * 1024)
//         throw new Error("File must be under 5MB");

//       const session = await fetchAuthSession({ forceRefresh: true });

//       if (!session.tokens?.idToken) {
//         throw new Error("User not authenticated");
//       }
//       const token = session.tokens.idToken.toString();

//       setStatus("Requesting upload URL…");

//       const res = await fetch(UPLOAD_CERT_API, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ filename: file.name }),
//       });

//       if (!res.ok) throw new Error("Failed to get upload URL");

//       const { uploadUrl, s3Key } = await res.json();

//       setStatus("Uploading PDF to S3…");

//       const uploadRes = await fetch(uploadUrl, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/pdf",
//         },
//         body: file,
//       });

//       if (!uploadRes.ok) throw new Error("Upload failed");

//       setForm((prev) => ({
//         ...prev,
//         certification_s3_key: s3Key,
//       }));

//       setStatus("✅ Certification uploaded successfully!");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setUploading(false);
//     }
//   };

//   // ===============================
//   // 🚀 Submit Onboarding (NO DB YET)
//   // ===============================
//   const submit = async () => {
//     try {
//       setError("");
//       setLoading(true);

//       if (!form.name || !form.bio) {
//         throw new Error("Name and bio are required");
//       }

//       if (!form.certification_s3_key) {
//         throw new Error("Please upload your certification");
//       }

//       const session = await fetchAuthSession();
//       const token = session.tokens?.idToken?.toString();

//       if (!token) throw new Error("User not authenticated");

//       // 🔹 CREATE CERTIFICATION IN DB
//       const res = await fetch(CREATE_CERT_API, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           certification_s3_key: form.certification_s3_key,
//         }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.error || "Failed to save certification");
//       }

//       // 🔜 Later:
//       // POST /service_provider (save profile data)

//       navigate("/provider/dashboard");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-bold">Service Provider Onboarding</h1>
//         <p className="text-neutral-600">
//           Create your professional profile so customers can trust and book you.
//         </p>
//       </div>

//       {/* Errors */}
//       {error && (
//         <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Card */}
//       <div className="card p-6 space-y-6">
//         {/* Personal */}
//         <section className="space-y-4">
//           <h2 className="font-semibold text-lg">Personal Information</h2>

//           <input
//             name="name"
//             placeholder="Full Name"
//             className="input"
//             value={form.name}
//             onChange={handleChange}
//           />

//           <input
//             name="business_name"
//             placeholder="Business Name (optional)"
//             className="input"
//             value={form.business_name}
//             onChange={handleChange}
//           />
//         </section>

//         {/* Location */}
//         <section className="space-y-4">
//           <h2 className="font-semibold text-lg">Location</h2>

//           <input
//             name="address_line"
//             placeholder="Address"
//             className="input"
//             value={form.address_line}
//             onChange={handleChange}
//           />

//           <div className="grid md:grid-cols-3 gap-4">
//             <input
//               name="city"
//               placeholder="City"
//               className="input"
//               value={form.city}
//               onChange={handleChange}
//             />
//             <input
//               name="province"
//               placeholder="Province"
//               className="input"
//               value={form.province}
//               onChange={handleChange}
//             />
//             <input
//               name="postal_code"
//               placeholder="Postal Code"
//               className="input"
//               value={form.postal_code}
//               onChange={handleChange}
//             />
//           </div>
//         </section>

//         {/* Bio */}
//         <section className="space-y-4">
//           <h2 className="font-semibold text-lg">Professional Bio</h2>

//           <textarea
//             name="bio"
//             placeholder="Describe your experience, skills, and reliability"
//             className="input min-h-[120px]"
//             value={form.bio}
//             onChange={handleChange}
//           />
//         </section>

//         {/* Certification Upload */}
//         <section className="space-y-4">
//           <h2 className="font-semibold text-lg">Certification</h2>

//           <input
//             type="file"
//             accept="application/pdf"
//             className="input"
//             onChange={(e) => {
//               setFile(e.target.files[0]);
//               setStatus("");
//             }}
//           />

//           <button
//             type="button"
//             onClick={uploadCertification}
//             disabled={uploading || !file}
//             className="btn-secondary"
//           >
//             {uploading ? "Uploading…" : "Upload Certification PDF"}
//           </button>

//           {status && <div className="text-sm text-blue-600">{status}</div>}

//           {form.certification_s3_key && (
//             <div className="rounded bg-green-100 p-3 text-sm text-green-700 break-all">
//               <strong>S3 Key:</strong>
//               <br />
//               {form.certification_s3_key}
//             </div>
//           )}
//         </section>

//         {/* CTA */}
//         <button
//           onClick={submit}
//           disabled={loading}
//           className="btn-primary w-full"
//         >
//           Complete Onboarding
//         </button>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
// import { useNavigate } from "react-router-dom";

// const UPLOAD_CERT_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/certifications/upload-url";

// const CREATE_CERT_API =
//   "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/certifications";

// export default function ServiceProviderOnboarding() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     getCurrentUser().catch(() => navigate("/login"));
//   }, [navigate]);

//   const [form, setForm] = useState({
//     name: "",
//     business_name: "",
//     address_line: "",
//     city: "",
//     province: "",
//     postal_code: "",
//     bio: "",
//     certification_s3_key: "",
//   });

//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [status, setStatus] = useState("");
//   const [error, setError] = useState("");

//   const handleChange = (e) => {
//     setForm((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   // ===============================
//   // 📤 Upload Certification to S3
//   // ===============================
//   const uploadCertification = async () => {
//     try {
//       setUploading(true);
//       setError("");
//       setStatus("");

//       if (!file) throw new Error("Please select a PDF file");
//       if (file.type !== "application/pdf")
//         throw new Error("Only PDF files are allowed");
//       if (file.size > 5 * 1024 * 1024)
//         throw new Error("File must be under 5MB");

//       const session = await fetchAuthSession();
//       const token = session.tokens?.idToken?.toString();

//       if (!token) throw new Error("User not authenticated");

//       setStatus("Requesting upload URL…");

//       const res = await fetch(UPLOAD_CERT_API, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           filename: file.name,
//           contentType: file.type,
//         }),
//       });

//       if (!res.ok) throw new Error("Failed to get upload URL");

//       const { uploadUrl, s3Key } = await res.json();

//       setStatus("Uploading PDF to S3…");

//       const uploadRes = await fetch(uploadUrl, {
//         method: "PUT",
//         headers: {
//           "Content-Type": file.type,
//         },
//         body: file,
//       });

//       if (!uploadRes.ok) throw new Error("Upload failed");

//       setForm((prev) => ({
//         ...prev,
//         certification_s3_key: s3Key,
//       }));

//       setStatus("✅ Certification uploaded successfully!");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setUploading(false);
//     }
//   };

//   // ===============================
//   // 🚀 Submit Onboarding
//   // ===============================
//   const submit = async () => {
//     try {
//       setError("");
//       setLoading(true);

//       if (!form.name || !form.bio) {
//         throw new Error("Name and bio are required");
//       }

//       if (!form.certification_s3_key) {
//         throw new Error("Please upload your certification");
//       }

//       const session = await fetchAuthSession();
//       const token = session.tokens?.idToken?.toString();

//       if (!token) throw new Error("User not authenticated");

//       const res = await fetch(CREATE_CERT_API, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           certification_s3_key: form.certification_s3_key,
//         }),
//       });

//       if (!res.ok) {
//         const err = await res.json();
//         throw new Error(err.error || "Failed to save certification");
//       }

//       navigate("/provider/dashboard");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
//       <div>
//         <h1 className="text-2xl font-bold">Service Provider Onboarding</h1>
//         <p className="text-neutral-600">
//           Create your professional profile so customers can trust and book you.
//         </p>
//       </div>

//       {error && (
//         <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       <div className="card p-6 space-y-6">
//         <input
//           name="name"
//           placeholder="Full Name"
//           className="input"
//           value={form.name}
//           onChange={handleChange}
//         />

//         <textarea
//           name="bio"
//           placeholder="Professional bio"
//           className="input min-h-[120px]"
//           value={form.bio}
//           onChange={handleChange}
//         />

//         <input
//           type="file"
//           accept="application/pdf"
//           className="input"
//           onChange={(e) => {
//             setFile(e.target.files[0]);
//             setStatus("");
//           }}
//         />

//         <button
//           type="button"
//           onClick={uploadCertification}
//           disabled={uploading || !file}
//           className="btn-secondary"
//         >
//           {uploading ? "Uploading…" : "Upload Certification PDF"}
//         </button>

//         {status && <div className="text-sm text-blue-600">{status}</div>}

//         <button
//           onClick={submit}
//           disabled={loading || uploading || !form.certification_s3_key}
//           className="btn-primary w-full"
//         >
//           {loading ? "Submitting…" : "Complete Onboarding"}
//         </button>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

// ===============================
// API ENDPOINTS
// ===============================
const UPLOAD_CERT_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/certifications/upload-url";

const ONBOARD_PROVIDER_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/create_service_provider";

export default function ServiceProviderOnboarding() {
  const navigate = useNavigate();

  // ===============================
  // AUTH GUARD
  // ===============================
  useEffect(() => {
    getCurrentUser().catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  // ===============================
  // STATE
  // ===============================
  const [form, setForm] = useState({
    name: "",
    business_name: "",
    address_line: "",
    city: "",
    province: "",
    postal_code: "",
    bio: "",
    certification_s3_key: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // ===============================
  // FORM HANDLER
  // ===============================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ===============================
  // 📤 UPLOAD CERTIFICATION (S3 ONLY)
  // ===============================
  const uploadCertification = async () => {
    try {
      setUploading(true);
      setError("");
      setStatus("");

      if (!file) throw new Error("Please select a PDF file");
      if (file.type !== "application/pdf")
        throw new Error("Only PDF files are allowed");
      if (file.size > 5 * 1024 * 1024)
        throw new Error("File must be under 5MB");

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("User not authenticated");

      setStatus("Requesting secure upload URL…");

      const res = await fetch(UPLOAD_CERT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");

      const { uploadUrl, s3Key } = await res.json();

      setStatus("Uploading certification to S3…");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      setForm((prev) => ({
        ...prev,
        certification_s3_key: s3Key,
      }));

      setStatus("✅ Certification uploaded successfully");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // 🚀 COMPLETE ONBOARDING
  // ===============================
  const submit = async () => {
    try {
      setError("");
      setLoading(true);

      if (
        !form.name ||
        !form.business_name ||
        !form.address_line ||
        !form.city ||
        !form.province ||
        !form.postal_code ||
        !form.bio
      ) {
        throw new Error("Please complete all required fields");
      }

      if (!form.certification_s3_key) {
        throw new Error("Please upload your certification");
      }

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("User not authenticated");

      const res = await fetch(ONBOARD_PROVIDER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          business_name: form.business_name,
          address_line: form.address_line,
          city: form.city,
          province: form.province,
          postal_code: form.postal_code,
          bio: form.bio,
          certification_s3_key: form.certification_s3_key,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete onboarding");
      }

      navigate("/provider/dashboard", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Service Provider Onboarding</h1>
        <p className="text-neutral-600">
          Create your professional profile so customers can trust and book you.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card p-6 space-y-6">
        <input
          name="name"
          placeholder="Full Name"
          className="input"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="business_name"
          placeholder="Business Name (optional)"
          className="input"
          value={form.business_name}
          onChange={handleChange}
        />

        <input
          name="address_line"
          placeholder="Street Address"
          className="input"
          value={form.address_line}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="city"
            placeholder="City"
            className="input"
            value={form.city}
            onChange={handleChange}
          />
          <input
            name="province"
            placeholder="Province"
            className="input"
            value={form.province}
            onChange={handleChange}
          />
          <input
            name="postal_code"
            placeholder="Postal Code"
            className="input"
            value={form.postal_code}
            onChange={handleChange}
          />
        </div>

        <textarea
          name="bio"
          placeholder="Professional bio"
          className="input min-h-[120px]"
          value={form.bio}
          onChange={handleChange}
        />

        <input
          type="file"
          accept="application/pdf"
          className="input"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setStatus("");
          }}
        />

        <button
          type="button"
          onClick={uploadCertification}
          disabled={uploading || !file}
          className="btn-secondary"
        >
          {uploading ? "Uploading…" : "Upload Certification PDF"}
        </button>

        {status && <div className="text-sm text-blue-600">{status}</div>}

        <button
          onClick={submit}
          disabled={loading || uploading || !form.certification_s3_key}
          className="btn-primary w-full"
        >
          {loading ? "Submitting…" : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}
