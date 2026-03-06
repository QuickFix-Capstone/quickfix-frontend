import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAccessToken,
  getServiceOfferingById,
  updateServiceOffering,
} from "../../api/serviceOfferings";
import { normalizeServiceOffering } from "../../utils/normalizeServiceOffering";
import AlertBanner from "../../components/UI/AlertBanner";

const CATEGORY_OPTIONS = ["PLUMBING", "ELECTRICAL", "CLEANING", "CARPENTRY"];
const PRICING_TYPE_OPTIONS = ["FIXED", "HOURLY"];

function labelize(value) {
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidImageReference(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return true;
  if (isValidUrl(trimmed)) return true;
  return /^[A-Za-z0-9/_\-.]+$/.test(trimmed);
}

function isNumericLike(value) {
  if (value === "" || value === null || value === undefined) return true;
  return Number.isFinite(Number(value));
}

function normalizeLoadedOffering(data = {}) {
  const source = data.item || data.offering || data;
  return {
    title: source.title || "",
    description: source.description || "",
    category: source.category || "PLUMBING",
    price: source.price ?? "",
    pricing_type: source.pricing_type || "FIXED",
    main_image_url: source.main_image_url || "",
    is_active:
      typeof source.is_active === "boolean"
        ? source.is_active
        : Boolean(source.is_active),
    latitude: source.latitude ?? "",
    longitude: source.longitude ?? "",
    service_radius_km: source.service_radius_km ?? "",
  };
}

function hasChangedField(name, value, original) {
  if (!original) return true;
  if (name === "price") return Number(value) !== Number(original.price);
  if (name === "is_active")
    return Boolean(value) !== Boolean(original.is_active);
  if (name === "latitude") return Number(value) !== Number(original.latitude);
  if (name === "longitude") return Number(value) !== Number(original.longitude);
  if (name === "service_radius_km") {
    return Number(value) !== Number(original.service_radius_km);
  }
  return value !== original[name];
}

function validateForm(data) {
  const errors = {};

  if (!data.title?.trim()) errors.title = "Title is required.";
  if (!CATEGORY_OPTIONS.includes(String(data.category || "").toUpperCase())) {
    errors.category = "Invalid category.";
  }
  if (
    !PRICING_TYPE_OPTIONS.includes(
      String(data.pricing_type || "").toUpperCase(),
    )
  ) {
    errors.pricing_type = "Invalid pricing type.";
  }
  if (
    data.price === "" ||
    !Number.isFinite(Number(data.price)) ||
    Number(data.price) <= 0
  ) {
    errors.price = "Price must be a number greater than 0.";
  }
  if (typeof data.is_active !== "boolean") {
    errors.is_active = "Invalid active status.";
  }
  if (!isValidImageReference(data.main_image_url)) {
    errors.main_image_url = "Enter a valid URL or image key path.";
  }
  if (!isNumericLike(data.latitude)) {
    errors.latitude = "Latitude must be numeric.";
  }
  if (!isNumericLike(data.longitude)) {
    errors.longitude = "Longitude must be numeric.";
  }
  if (
    data.service_radius_km !== "" &&
    (!Number.isFinite(Number(data.service_radius_km)) ||
      Number(data.service_radius_km) <= 0)
  ) {
    errors.service_radius_km = "Service radius must be greater than 0.";
  }

  return errors;
}

function GenericErrorModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          We could not update the offering. Please try again.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditServiceOffering() {
  const { service_offering_id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [forbiddenReason, setForbiddenReason] = useState("");
  const [showServerErrorModal, setShowServerErrorModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "PLUMBING",
    price: "",
    pricing_type: "FIXED",
    main_image_url: "",
    is_active: true,
    latitude: "",
    longitude: "",
    service_radius_km: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [dirtyFields, setDirtyFields] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setForbiddenReason("");
        const token = await getAccessToken();
        const data = await getServiceOfferingById(service_offering_id, token);
        const normalized = normalizeLoadedOffering(data);
        setFormData(normalized);
        setOriginalData(normalized);
      } catch (err) {
        if (err.status === 401) {
          navigate("/service-provider/login");
          return;
        }
        if (err.status === 403) {
          setForbiddenReason(err.reason || "forbidden");
          setError(err.message || "Provider access required.");
          return;
        }
        if (err.status === 404) {
          setError("Offering not found.");
          return;
        }
        setError(err.message || "Unable to load offering.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, service_offering_id]);

  const canSave = useMemo(() => {
    const hasDirty = Object.values(dirtyFields).some(Boolean);
    return hasDirty && !saving;
  }, [dirtyFields, saving]);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setDirtyFields((prev) => ({
      ...prev,
      [name]: hasChangedField(name, value, originalData),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setForbiddenReason("");
    setShowServerErrorModal(false);

    const errors = validateForm(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const payload = normalizeServiceOffering(formData, dirtyFields);
    if (Object.keys(payload).length === 0) {
      setError("No changes detected.");
      return;
    }

    try {
      setSaving(true);
      setFieldErrors({});
      const token = await getAccessToken();
      await updateServiceOffering(service_offering_id, payload, token);
      setSuccess("Service offering updated successfully");
      navigate("/service-provider/dashboard", {
        state: { toast: "Service offering updated successfully" },
      });
    } catch (err) {
      if (err.status === 401) {
        navigate("/service-provider/login");
        return;
      }
      if (err.status === 403) {
        setForbiddenReason(err.reason || "forbidden");
        if (err.reason === "ownership") {
          setError("You cannot edit this offering.");
        } else if (err.reason === "not_verified") {
          setError("Account must be verified to edit offerings.");
        } else if (err.reason === "access_required") {
          setError("Provider access required.");
        } else {
          setError(err.message || "Forbidden.");
        }
        return;
      }
      if (err.status === 404) {
        setError("Offering not found.");
        return;
      }
      if (err.status === 400) {
        if (err.fieldErrors) {
          setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
        }
        setError(err.message || "Please fix validation errors.");
        return;
      }
      if (err.status >= 500) {
        setShowServerErrorModal(true);
        return;
      }
      setError(err.message || "Failed to update service offering.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse space-y-4 rounded-2xl border bg-white p-6">
          <div className="h-8 w-48 rounded bg-neutral-200" />
          <div className="h-10 rounded bg-neutral-100" />
          <div className="h-10 rounded bg-neutral-100" />
          <div className="h-24 rounded bg-neutral-100" />
          <div className="h-10 rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  const showVerificationBanner = forbiddenReason === "not_verified";

  return (
    <>
      <GenericErrorModal
        open={showServerErrorModal}
        onClose={() => setShowServerErrorModal(false)}
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Edit Service Offering
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Update your service details and save.
          </p>
        </div>

        {showVerificationBanner ? (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Account must be verified.
            <button
              type="button"
              onClick={() => navigate("/service-provider/documents")}
              className="ml-2 underline"
            >
              Go to verification
            </button>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border bg-white p-6"
        >
          {error ? (
            <AlertBanner variant="error" message={error} />
          ) : null}

          {success ? (
            <AlertBanner variant="success" message={success} />
          ) : null}

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Basic Info
            </h2>

            <div className="space-y-2">
              <label className="text-sm text-slate-700" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className="input"
                value={formData.title}
                onChange={(e) => setField("title", e.target.value)}
              />
              {fieldErrors.title ? (
                <p className="text-xs text-red-600">{fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="input min-h-[110px]"
                value={formData.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-700" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  className="input"
                  value={formData.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {labelize(value)}
                    </option>
                  ))}
                </select>
                {fieldErrors.category ? (
                  <p className="text-xs text-red-600">{fieldErrors.category}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm text-slate-700"
                  htmlFor="pricing_type"
                >
                  Pricing Type
                </label>
                <select
                  id="pricing_type"
                  className="input"
                  value={formData.pricing_type}
                  onChange={(e) => setField("pricing_type", e.target.value)}
                >
                  {PRICING_TYPE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {labelize(value)}
                    </option>
                  ))}
                </select>
                {fieldErrors.pricing_type ? (
                  <p className="text-xs text-red-600">
                    {fieldErrors.pricing_type}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700" htmlFor="price">
                Price
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formData.price}
                onChange={(e) => setField("price", e.target.value)}
              />
              {fieldErrors.price ? (
                <p className="text-xs text-red-600">{fieldErrors.price}</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Service Location
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-700" htmlFor="latitude">
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  className="input"
                  value={formData.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                />
                {fieldErrors.latitude ? (
                  <p className="text-xs text-red-600">{fieldErrors.latitude}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-700" htmlFor="longitude">
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  className="input"
                  value={formData.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                />
                {fieldErrors.longitude ? (
                  <p className="text-xs text-red-600">
                    {fieldErrors.longitude}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm text-slate-700"
                htmlFor="service_radius_km"
              >
                Service Radius (km)
              </label>
              <input
                id="service_radius_km"
                type="number"
                min="0"
                step="0.1"
                className="input"
                value={formData.service_radius_km}
                onChange={(e) => setField("service_radius_km", e.target.value)}
              />
              {fieldErrors.service_radius_km ? (
                <p className="text-xs text-red-600">
                  {fieldErrors.service_radius_km}
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Media</h2>
            <div className="space-y-2">
              <label
                className="text-sm text-slate-700"
                htmlFor="main_image_url"
              >
                Image URL
              </label>
              <input
                id="main_image_url"
                className="input"
                value={formData.main_image_url}
                onChange={(e) => setField("main_image_url", e.target.value)}
              />
              {fieldErrors.main_image_url ? (
                <p className="text-xs text-red-600">
                  {fieldErrors.main_image_url}
                </p>
              ) : null}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Status</h2>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setField("is_active", e.target.checked)}
              />
              Active
            </label>
            {fieldErrors.is_active ? (
              <p className="text-xs text-red-600">{fieldErrors.is_active}</p>
            ) : null}
          </section>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/service-provider/dashboard")}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Service"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
