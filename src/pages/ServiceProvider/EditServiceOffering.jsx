import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod";

export default function EditServiceOffering() {
  const { offeringId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    pricing_type: "fixed",
    category: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= Load Existing Offering ================= */
  useEffect(() => {
    const loadOffering = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(`${API_BASE}/service-offerings/${offeringId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load service offering");
        }

        const data = await res.json();

        setForm({
          title: data.title || "",
          description: data.description || "",
          price: data.price || "",
          pricing_type: data.pricing_type || "fixed",
          category: data.category || "",
        });
      } catch (err) {
        console.error(err);
        setError("Unable to load service offering");
      } finally {
        setLoading(false);
      }
    };

    loadOffering();
  }, [offeringId]);

  /* ================= Submit Update ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`${API_BASE}/service-offerings/${offeringId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Update failed");
      }

      navigate("/service-provider/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update service offering");
    } finally {
      setSaving(false);
    }
  };

  /* ================= Loading ================= */
  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  /* ================= Error ================= */
  if (error && !saving) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-xl border bg-white p-6 shadow-md text-center">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
          Edit Service Offering
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
        >
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <textarea
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <input
            type="number"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />

          <select
            className="w-full rounded-lg border px-3 py-2"
            value={form.pricing_type}
            onChange={(e) => setForm({ ...form, pricing_type: e.target.value })}
          >
            <option value="fixed">Fixed price</option>
            <option value="hourly">Hourly</option>
          </select>

          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
