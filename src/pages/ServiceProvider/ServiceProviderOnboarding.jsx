import { useEffect, useState } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../../context/LocationContext";
import AlertBanner from "../../components/UI/AlertBanner";

const UPLOAD_DOC_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/service_provider/certifications/upload-url";

const ONBOARD_PROVIDER_API =
  "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/create_service_provider";

export default function ServiceProviderOnboarding() {
  const navigate = useNavigate();
  const {
    location,
    getLocation,
    loading: locationLoading,
    error: locationError,
    address,
    addressLoading,
    addressError,
  } = useLocation();

  useEffect(() => {
    getCurrentUser().catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  const [form, setForm] = useState({
    name: "",
    business_name: "",
    address_line: "",
    city: "",
    province: "",
    postal_code: "",
    bio: "",
  });

  const [documents, setDocuments] = useState({
    certification: [],
    insurance: [],
    business_registration: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!location) getLocation();
  }, [location, getLocation]);

  useEffect(() => {
    if (!address) return;
    setForm((prev) => ({
      ...prev,
      address_line: prev.address_line || address.address_line || "",
      city: prev.city || address.city || "",
      province: prev.province || address.province || "",
      postal_code: prev.postal_code || address.postal_code || "",
    }));
  }, [address]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const uploadDocument = async (documentType, file) => {
    try {
      setUploading(true);
      setError("");
      setStatus("");

      if (!file) throw new Error("Please select a PDF file");
      if (file.type !== "application/pdf")
        throw new Error("Only PDF files are allowed");
      if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5MB");

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("User not authenticated");

      setStatus(`Uploading ${documentType.replace("_", " ")}...`);

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

      setStatus("Upload successful");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

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

      if (!acknowledged) {
        throw new Error("Please acknowledge the onboarding terms");
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

  const profileInfoComplete =
    form.name &&
    form.address_line &&
    form.city &&
    form.province &&
    form.postal_code &&
    form.bio;

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            Service Provider Setup
          </p>
          {/* mobile: smaller heading → desktop: large */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">
            Build your professional profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Complete your details and upload documents to verify your profile
            and start receiving customer bookings.
          </p>
        </div>

        <AlertBanner variant="error" message={error} className="mb-6" />

        {(locationLoading || addressLoading) && (
          <AlertBanner
            variant="info"
            message="Detecting your location..."
            className="mb-6"
          />
        )}

        {(locationError || addressError) && (
          <AlertBanner
            variant="warning"
            message={locationError || addressError}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-neutral-900">
              Profile Details
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              These details are shown to customers when they view your profile.
            </p>

            <div className="mt-5 space-y-4">
              {!location && (
                <button
                  type="button"
                  onClick={getLocation}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                >
                  Use my current location
                </button>
              )}

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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                className="input min-h-[140px]"
                value={form.bio}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Checklist</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Complete every requirement to unlock your profile.
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span>Basic profile info</span>
                <span className="font-semibold text-neutral-700">
                  {profileInfoComplete ? "Done" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span>Certification uploaded</span>
                <span className="font-semibold text-neutral-700">
                  {documents.certification.length > 0 ? "Done" : "Required"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                <span>Acknowledgment</span>
                <span className="font-semibold text-neutral-700">
                  {acknowledged ? "Done" : "Required"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="text-lg font-semibold text-neutral-900">
              Verification Documents
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Upload PDFs only. Maximum file size is 5MB.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-2 rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-800">
                  Certifications (required)
                </h3>
                <input
                  type="file"
                  accept="application/pdf"
                  className="input"
                  onChange={(e) =>
                    uploadDocument("certification", e.target.files[0])
                  }
                />
                {documents.certification.map((doc, i) => (
                  <div key={i} className="text-sm text-green-700">
                    OK {doc.filename}
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-800">
                  Insurance Documents
                </h3>
                <input
                  type="file"
                  accept="application/pdf"
                  className="input"
                  onChange={(e) => uploadDocument("insurance", e.target.files[0])}
                />
                {documents.insurance.map((doc, i) => (
                  <div key={i} className="text-sm text-green-700">
                    OK {doc.filename}
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-800">
                  Business Registration
                </h3>
                <input
                  type="file"
                  accept="application/pdf"
                  className="input"
                  onChange={(e) =>
                    uploadDocument("business_registration", e.target.files[0])
                  }
                />
                {documents.business_registration.map((doc, i) => (
                  <div key={i} className="text-sm text-green-700">
                    OK {doc.filename}
                  </div>
                ))}
              </div>
            </div>

            <AlertBanner variant="info" message={status} className="mt-4" />
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-400 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-neutral-700">
                I acknowledge that the information and documents I submit are
                accurate and can be used for verification. I understand that
                false information may delay or reject profile approval.
              </span>
            </label>

            <button
              onClick={submit}
              disabled={
                loading ||
                uploading ||
                documents.certification.length === 0 ||
                !acknowledged
              }
              className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Create Profile"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

