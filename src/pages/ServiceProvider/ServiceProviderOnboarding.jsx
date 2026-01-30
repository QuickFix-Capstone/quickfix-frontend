import { useEffect, useState } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

// ===============================
// API ENDPOINTS
// ===============================
const UPLOAD_DOC_API =
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
  // FORM STATE
  // ===============================
  const [form, setForm] = useState({
    name: "",
    business_name: "",
    address_line: "",
    city: "",
    province: "",
    postal_code: "",
    bio: "",
  });

  // ===============================
  // DOCUMENT STATE
  // ===============================
  const [documents, setDocuments] = useState({
    certification: [],
    insurance: [],
    business_registration: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // ===============================
  // INPUT HANDLER
  // ===============================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ===============================
  // 📤 GENERIC DOCUMENT UPLOAD
  // ===============================
  const uploadDocument = async (documentType, file) => {
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

      setStatus(`Uploading ${documentType.replace("_", " ")}…`);

      // 🔹 Request presigned URL
      const res = await fetch(UPLOAD_DOC_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          document_type: documentType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { uploadUrl, s3Key } = await res.json();

      // 🔥 CRITICAL FIX:
      // ❌ DO NOT SET Content-Type HERE
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(
          `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
        );
      }

      setDocuments((prev) => ({
        ...prev,
        [documentType]: [
          ...prev[documentType],
          {
            s3_key: s3Key,
            filename: file.name,
          },
        ],
      }));

      setStatus("✅ Upload successful");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // 🚀 SUBMIT ONBOARDING
  // ===============================
  const submit = async () => {
    try {
      setError("");
      setLoading(true);

      if (
        !form.name ||
        !form.address_line ||
        !form.city ||
        !form.province ||
        !form.postal_code ||
        !form.bio
      ) {
        throw new Error("Please complete all required fields");
      }

      if (documents.certification.length === 0) {
        throw new Error("At least one certification is required");
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
          ...form,
          documents,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Onboarding failed");
      }

      navigate("/service-provider/dashboard", { replace: true });
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
          Upload your documents so customers can trust and book you.
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

        {/* CERTIFICATIONS */}
        <section className="space-y-2">
          <h3 className="font-semibold">Certifications (required)</h3>
          <input
            type="file"
            accept="application/pdf"
            className="input"
            onChange={(e) => uploadDocument("certification", e.target.files[0])}
          />
          {documents.certification.map((doc, i) => (
            <div key={i} className="text-sm text-green-600">
              ✔ {doc.filename}
            </div>
          ))}
        </section>

        {/* INSURANCE */}
        <section className="space-y-2">
          <h3 className="font-semibold">Insurance Documents</h3>
          <input
            type="file"
            accept="application/pdf"
            className="input"
            onChange={(e) => uploadDocument("insurance", e.target.files[0])}
          />
          {documents.insurance.map((doc, i) => (
            <div key={i} className="text-sm text-green-600">
              ✔ {doc.filename}
            </div>
          ))}
        </section>

        {/* BUSINESS REGISTRATION */}
        <section className="space-y-2">
          <h3 className="font-semibold">Business Registration</h3>
          <input
            type="file"
            accept="application/pdf"
            className="input"
            onChange={(e) =>
              uploadDocument("business_registration", e.target.files[0])
            }
          />
          {documents.business_registration.map((doc, i) => (
            <div key={i} className="text-sm text-green-600">
              ✔ {doc.filename}
            </div>
          ))}
        </section>

        {status && <div className="text-sm text-blue-600">{status}</div>}

        <button
          onClick={submit}
          disabled={
            loading || uploading || documents.certification.length === 0
          }
          className="btn-primary w-full"
        >
          {loading ? "Submitting…" : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}
