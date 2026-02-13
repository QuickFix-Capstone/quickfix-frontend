// src/pages/customer/EditJob.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { ArrowLeft, Calendar, Clock, MapPin, FileText, DollarSign, Briefcase } from "lucide-react";

export default function EditJob() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { job_id } = useParams();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        location_address: "",
        location_city: "",
        location_state: "",
        location_zip: "",
        preferred_date: "",
        preferred_time: "",
        budget_min: "",
        budget_max: "",
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        "plumber",
        "electrician",
        "carpenter",
        "painter",
        "cleaner",
        "landscaper",
        "handyman",
        "other"
    ];

    useEffect(() => {
        fetchJobDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [job_id]);

    const fetchJobDetails = async () => {
        setLoading(true);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/jobs?limit=100&offset=0`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                const job = (data.jobs || []).find(
                    (j) => String(j.job_id) === String(job_id)
                );
                if (!job) {
                    console.error("Job not found in list");
                    alert("Job not found.");
                    navigate("/customer/jobs");
                    return;
                }
                console.log("Job details fetched for editing:", job);

                // Transform nested API response to flat form state
                setFormData({
                    title: job.title || "",
                    description: job.description || "",
                    category: job.category || "",
                    location_address: job.location?.address || "",
                    location_city: job.location?.city || "",
                    location_state: job.location?.state || "",
                    location_zip: job.location?.zip || "",
                    preferred_date: job.preferred_date || "",
                    preferred_time: job.preferred_time || "",
                    budget_min: job.budget?.min || "",
                    budget_max: job.budget?.max || "",
                });
            } else {
                console.error("Failed to fetch job details");
                alert("Failed to load job details. Please try again.");
                navigate("/customer/jobs");
            }
        } catch (err) {
            console.error("Error fetching job details:", err);
            alert("Error loading job details. Please try again.");
            navigate("/customer/jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const jobData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                location_address: formData.location_address,
                location_city: formData.location_city,
                location_state: formData.location_state,
                location_zip: formData.location_zip,
                preferred_date: formData.preferred_date,
                preferred_time: formData.preferred_time,
                budget_min: parseFloat(formData.budget_min),
                budget_max: parseFloat(formData.budget_max),
            };

            console.log("Updating job:", jobData);

            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job/${job_id}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(jobData),
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Job updated successfully:", data);
                alert("Job updated successfully!");
                navigate(`/customer/jobs/${job_id}`);
            } else {
                const error = await res.text();
                console.error("Job update failed:", error);
                alert("Failed to update job. Please try again.");
            }
        } catch (err) {
            console.error("Error updating job:", err);
            alert("Error updating job. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split("T")[0];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading job details...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={() => navigate(`/customer/jobs/${job_id}`)}
                        variant="outline"
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Job Details
                    </Button>
                    <h1 className="text-3xl font-bold text-neutral-900">Edit Job</h1>
                    <p className="mt-1 text-neutral-600">
                        Update your job details
                    </p>
                </div>

                {/* Job Editing Form */}
                <Card className="border-neutral-200 bg-white p-6 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Job Title */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <Briefcase className="h-4 w-4" />
                                Job Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Fix leaking kitchen sink"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-neutral-700">
                                Category *
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <FileText className="h-4 w-4" />
                                Job Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the work needed in detail..."
                                required
                                rows={5}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                        </div>

                        {/* Date & Time */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                    <Calendar className="h-4 w-4" />
                                    Preferred Date *
                                </label>
                                <input
                                    type="date"
                                    name="preferred_date"
                                    value={formData.preferred_date}
                                    onChange={handleChange}
                                    min={today}
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                    <Clock className="h-4 w-4" />
                                    Preferred Time *
                                </label>
                                <input
                                    type="time"
                                    name="preferred_time"
                                    value={formData.preferred_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <MapPin className="h-4 w-4" />
                                Job Location *
                            </label>
                            <input
                                type="text"
                                name="location_address"
                                value={formData.location_address}
                                onChange={handleChange}
                                placeholder="123 Main St"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    name="location_city"
                                    value={formData.location_city}
                                    onChange={handleChange}
                                    placeholder="Toronto"
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    State/Province *
                                </label>
                                <input
                                    type="text"
                                    name="location_state"
                                    value={formData.location_state}
                                    onChange={handleChange}
                                    placeholder="ON"
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Postal Code *
                                </label>
                                <input
                                    type="text"
                                    name="location_zip"
                                    value={formData.location_zip}
                                    onChange={handleChange}
                                    placeholder="M5H 1J9"
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                        </div>

                        {/* Budget Range */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <DollarSign className="h-4 w-4" />
                                Budget Range *
                            </label>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <input
                                        type="number"
                                        name="budget_min"
                                        value={formData.budget_min}
                                        onChange={handleChange}
                                        placeholder="Minimum ($)"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        name="budget_max"
                                        value={formData.budget_max}
                                        onChange={handleChange}
                                        placeholder="Maximum ($)"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                    />
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Set a realistic budget range for this job
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={() => navigate(`/customer/jobs/${job_id}`)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-neutral-900 hover:bg-neutral-800"
                            >
                                {submitting ? "Updating Job..." : "Update Job"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
