import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createServiceOffering } from "../../api/serviceOffering";
import { ServiceCategory, PricingType } from "../../constants/serviceEnum";


const labelize = (value) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function CreateServiceOffering({ onCancel, onSuccess }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: ServiceCategory.PLUMBING,
    pricing_type: PricingType.HOURLY,
    price: "",
    main_image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCancel = () => {
    if (onCancel) {
      onCancel(); // ✅ dashboard conditional rendering
    } else {
      navigate("/service-provider/dashboard"); // ✅ route fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      await createServiceOffering({
        ...form,
        price: Number(form.price),
      });

      if (onSuccess) {
        onSuccess(); // ✅ tells dashboard to refresh once
      } else {
        navigate("/service-provider/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to create service offering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create a Service Offering</h1>
        <p className="text-neutral-600">
          List a service clients can discover and book instantly.
        </p>
      </div>

      {/* Card */}
      <div className="card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Service Details</h2>

            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Title</label>
              <input
                name="title"
                required
                placeholder="e.g. Emergency Plumbing Repair"
                className="input"
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Description</label>
              <textarea
                name="description"
                required
                placeholder="Describe what you offer, what's included, and why clients should choose you."
                className="input min-h-[120px]"
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-neutral-600">Category</label>
                <select
                  name="category"
                  className="input"
                  value={form.category}
                  onChange={handleChange}
                >
                  {Object.values(ServiceCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {labelize(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-neutral-600">Pricing Type</label>
                <select
                  name="pricing_type"
                  className="input"
                  value={form.pricing_type}
                  onChange={handleChange}
                >
                  {Object.values(PricingType).map((type) => (
                    <option key={type} value={type}>
                      {labelize(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>

            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Price</label>
              <div className="flex items-center rounded-xl border border-neutral-300 px-3 focus-within:ring-2 focus-within:ring-black/20">
                <span className="text-neutral-500">$</span>
                <input
                  type="number"
                  name="price"
                  required
                  placeholder="0.00"
                  className="w-full border-none bg-transparent px-2 py-2 outline-none"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Media</h2>

            <div className="space-y-2">
              <label className="text-sm text-neutral-600">
                Main Image URL (optional)
              </label>
              <input
                name="main_image_url"
                placeholder="https://example.com/service.jpg"
                className="input"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2 text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Creating..." : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
