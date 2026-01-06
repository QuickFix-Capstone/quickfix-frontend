import { useState } from "react";
import { createServiceOffering } from "../api/quickfix";

export default function ProviderCreateGig() {
  const [form, setForm] = useState({
    provider_id: "",
    title: "",
    category: "",
    price: "",
    description: "",
    city: "",
    state: "",
    postal_code: "",
    availability: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createServiceOffering(form);
      setMessage("Service offering created successfully!");
      alert("Service offering created successfully! 🎉");
    } catch {
      setMessage("Error: Could not create service offering.");
      alert("Error: Could not create service offering.🥲");
    } finally {
      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-base md:text-lg font-semibold">
            Create Service Offering
          </h1>

          {/* Button scales better on mobile */}
          <button
            form="gigForm"
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 md:px-4 md:py-2 shadow-sm hover:shadow transition active:scale-[.99] bg-black text-white text-sm md:text-base"
          >
            {loading ? "Saving..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form
        id="gigForm"
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl px-4 py-6 md:py-8 space-y-6 md:space-y-8"
      >
        {/* Card: Basic Details */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
          <h2 className="text-lg font-bold leading-tight">Basic Details</h2>

          {/* Provider ID */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Provider ID</label>
            <input
              type="number"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 
               text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Enter your provider ID"
              value={form.provider_id}
              onChange={(e) => updateField("provider_id", e.target.value)}
            />
          </div>


          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Gig Title</label>
            <input
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Eg. Install a new AC unit"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Category</label>

            <select
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20 bg-white"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option value="">Select a category</option>
              <option value="Plumbing">Plumbing</option>
              <option value="HVAC">HVAC</option>
              <option value="Electrical">Electrical</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Painting">Painting</option>
              <option value="Cleaning">Cleaning</option>
              <option value="General Handyman">General Handyman</option>
            </select>
          </div>


          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Price ($)</label>
            <input
              type="number"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
              placeholder="100"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
            />
          </div>
        </div>

        {/* Card: Location */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
          <h2 className="text-lg font-bold leading-tight">Location</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">City</label>
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Toronto"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-600">State</label>
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
                placeholder="ON"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Postal Code</label>
              <input
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
                placeholder="M1B 5K4"
                value={form.postal_code}
                onChange={(e) => updateField("postal_code", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Card: Description */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
          <h2 className="text-lg font-bold leading-tight">Description</h2>

          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Explain your service</label>
            <textarea
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20 min-h-[120px] md:min-h-[140px]"
              placeholder="Describe your offering in detail..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>
        </div>

        {/* Card: Availability */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
          <h2 className="text-lg font-bold leading-tight">Availability</h2>

          <div className="space-y-2">
            <label className="text-sm text-neutral-600">Available Date</label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 md:py-2.5 text-sm md:text-base outline-none focus:ring-2 focus:ring-black/20"
              value={form.availability}
              onChange={(e) => updateField("availability", e.target.value)}
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="rounded-xl bg-neutral-100 border border-neutral-300 p-4 text-sm">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
