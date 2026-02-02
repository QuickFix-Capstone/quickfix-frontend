// src/pages/customer/PostJob.jsx
import React, { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import JobImageUpload from "../../components/job/JobImageUpload";
import { uploadJobImage } from "../../api/jobImages";
import { ArrowLeft, Calendar, Clock, MapPin, FileText, DollarSign, Briefcase } from "lucide-react";

export default function PostJob() {
    const auth = useAuth();
    const navigate = useNavigate();

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
    const [submitting, setSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

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

            console.log("Submitting job:", jobData);

            const res = await fetch(
                "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/job",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(jobData),
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Job posted successfully:", data);

                // Get job_id from the response (nested in job object)
                const jobId = data.job?.job_id || data.job_id;

                // Upload images if any were selected
                if (selectedImages.length > 0) {
                    setUploadingImages(true);
                    console.log(`Uploading ${selectedImages.length} images for job ${jobId}...`);

                    try {
                        const uploadPromises = selectedImages.map((file, index) =>
                            uploadJobImage(jobId, file, auth, {
                                order: index + 1,
                                description: null
                            })
                        );

                        await Promise.all(uploadPromises);
                        console.log("All images uploaded successfully");
                        alert(`Job posted successfully with ${selectedImages.length} image(s)! Service providers can now apply.`);
                    } catch (imageError) {
                        console.error("Image upload failed:", imageError);
                        alert("Job posted successfully, but some images failed to upload. You can add them later.");
                    } finally {
                        setUploadingImages(false);
                    }
                } else {
                    alert("Job posted successfully! Service providers can now apply.");
                }

                navigate("/customer/jobs");
            } else {
                const error = await res.text();
                console.error("Job posting failed:", error);
                alert("Failed to post job. Please try again.");
            }
        } catch (err) {
            console.error("Error posting job:", err);
            alert("Error posting job. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={() => navigate("/customer/dashboard")}
                        variant="outline"
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-neutral-900">Post a Job</h1>
                    <p className="mt-1 text-neutral-600">
                        Describe your job and let service providers apply
                    </p>
                </div>

                {/* Job Posting Form */}
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

                        {/* Job Images Upload */}
                        <JobImageUpload
                            onFilesSelected={setSelectedImages}
                            disabled={submitting || uploadingImages}
                        />

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={() => navigate("/customer/dashboard")}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || uploadingImages}
                                className="flex-1 bg-neutral-900 hover:bg-neutral-800"
                            >
                                {uploadingImages
                                    ? "Uploading Images..."
                                    : submitting
                                    ? "Posting Job..."
                                    : "Post Job"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
