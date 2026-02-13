// src/pages/customer/JobDetails.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { API_BASE } from "../../api/config";
import { cancelJob } from "../../api/jobs";
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    Calendar,
    Clock,
    DollarSign,
    FileText,
    User,
    Edit,
    Trash2,
    CheckCircle,
    Star,
} from "lucide-react";

export default function JobDetails() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { job_id } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [confirmingComplete, setConfirmingComplete] = useState(false);

    const normalizeJobStatus = (status) => {
        const value = (status || "").toLowerCase();
        if (value === "canceled" || value === "cancel") return "cancelled";
        return value;
    };

    useEffect(() => {
        fetchJobDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [job_id]);

    const fetchJobDetails = async () => {
        setLoading(true);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const res = await fetch(
                `${API_BASE}/customer/jobs?limit=100&offset=0`,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Jobs list fetched:", data);
                const jobData = (data.jobs || []).find(
                    (j) => String(j.job_id) === String(job_id)
                );
                if (!jobData) {
                    console.error("Job not found in list");
                    alert("Job not found. It may have been deleted.");
                    navigate("/customer/jobs");
                    return;
                }
                setJob({
                    ...jobData,
                    status: normalizeJobStatus(jobData?.status),
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

    const handleCancelJob = async () => {
        if (!confirm("Are you sure you want to cancel this job?")) {
            return;
        }

        setCancelling(true);
        try {
            await cancelJob(job_id, auth);
            alert("Job cancelled successfully.");
            navigate("/customer/jobs");
        } catch (err) {
            console.error("Error cancelling job:", err);
            alert(err.message || "Error cancelling job. Please try again.");
        } finally {
            setCancelling(false);
        }
    };

    const handleConfirmComplete = async () => {
        if (!confirm("Confirm that this job has been completed?")) return;

        setConfirmingComplete(true);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                `${API_BASE}/jobs/${job_id}/confirm-complete`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data.message || "Failed to confirm completion");
                return;
            }

            alert("Job confirmed as completed!");
            fetchJobDetails();
        } catch (err) {
            console.error(err);
            alert("Failed to confirm completion");
        } finally {
            setConfirmingComplete(false);
        }
    };

    const getStatusColor = (status) => {
        switch (normalizeJobStatus(status)) {
            case "open":
                return "bg-green-100 text-green-800 border-green-200";
            case "assigned":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "in_progress":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "pending_completion":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "completed":
                return "bg-gray-100 text-gray-800 border-gray-200";
            case "cancelled":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-neutral-100 text-neutral-800 border-neutral-200";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return "Flexible";
        // Convert 24-hour time to 12-hour format
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading job details...</div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <Card className="border-neutral-200 bg-white p-8 text-center shadow-lg">
                    <p className="mb-4 text-neutral-700">Job not found</p>
                    <Button onClick={() => navigate("/customer/jobs")}>
                        Back to My Jobs
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={() => navigate("/customer/jobs")}
                        variant="outline"
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to My Jobs
                    </Button>
                </div>

                {/* Job Header Card */}
                <Card className="mb-6 border-neutral-200 bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="mb-2 text-3xl font-bold text-neutral-900">
                                {job.title}
                            </h1>
                            <span
                                className={`inline-block rounded-full border px-4 py-1.5 text-sm font-semibold ${getStatusColor(
                                    job.status
                                )}`}
                            >
                                {(job.status || "unknown").replace("_", " ").toUpperCase()}
                            </span>
                        </div>
                        {normalizeJobStatus(job.status) === "open" && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => navigate(`/customer/jobs/${job_id}/edit`)}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    onClick={handleCancelJob}
                                    disabled={cancelling}
                                    variant="outline"
                                    className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Cancel Job
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Category Badge */}
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800">
                            <Briefcase className="h-4 w-4" />
                            {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                        </span>
                    </div>
                </Card>

                {/* Job Details Card */}
                <Card className="mb-6 border-neutral-200 bg-white p-6 shadow-lg">
                    <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                        Job Description
                    </h2>
                    <p className="mb-6 whitespace-pre-wrap text-neutral-700">
                        {job.description}
                    </p>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Location */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                <MapPin className="h-4 w-4" />
                                Location
                            </h3>
                            <p className="text-neutral-900">{job.location?.address}</p>
                            <p className="text-neutral-600">
                                {job.location?.city}, {job.location?.state} {job.location?.zip}
                            </p>
                        </div>

                        {/* Schedule */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                <Calendar className="h-4 w-4" />
                                Preferred Schedule
                            </h3>
                            <div className="flex items-center gap-2 text-neutral-900">
                                <Calendar className="h-4 w-4 text-neutral-400" />
                                <span>{formatDate(job.preferred_date)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-neutral-900">
                                <Clock className="h-4 w-4 text-neutral-400" />
                                <span>{formatTime(job.preferred_time)}</span>
                            </div>
                        </div>

                        {/* Budget */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                <DollarSign className="h-4 w-4" />
                                Budget Range
                            </h3>
                            <p className="text-2xl font-bold text-green-600">
                                ${job.budget?.min?.toFixed(2)} - ${job.budget?.max?.toFixed(2)}
                            </p>
                        </div>

                        {/* Posted Date */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                <FileText className="h-4 w-4" />
                                Posted On
                            </h3>
                            <p className="text-neutral-900">
                                {formatDate(job.created_at)}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Assigned Provider Card (if assigned) */}
                {job.assigned_provider_id && job.provider_name && (
                    <Card className="mb-6 border-neutral-200 bg-white p-6 shadow-lg">
                        <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                            Assigned Service Provider
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-neutral-900">
                                    {job.provider_name}
                                </p>
                                {job.provider_email && (
                                    <p className="text-sm text-neutral-600">
                                        {job.provider_email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Applications Button (for open jobs) */}
                {job.status === "open" && (
                    <Card className="border-neutral-200 bg-white p-6 text-center shadow-lg">
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                            Review Applications
                        </h3>
                        <p className="mb-4 text-neutral-600">
                            {job.application_count || 0} service provider
                            {job.application_count !== 1 ? "s have" : " has"} applied to this
                            job
                        </p>
                        <Button
                            onClick={() =>
                                navigate(`/customer/jobs/${job_id}/applications`)
                            }
                            className="bg-neutral-900 hover:bg-neutral-800"
                        >
                            View All Applications
                        </Button>
                    </Card>
                )}

                {/* Pending completion — customer needs to confirm */}
                {normalizeJobStatus(job.status) === "pending_completion" && (
                    <Card className="mb-6 border-emerald-200 bg-emerald-50 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                            <h3 className="text-lg font-semibold text-emerald-800">
                                Service Provider Marked This Job Complete
                            </h3>
                        </div>
                        <p className="text-sm text-emerald-700 mb-4">
                            Please review the work and confirm completion.
                        </p>
                        <Button
                            onClick={handleConfirmComplete}
                            disabled={confirmingComplete}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {confirmingComplete
                                ? "Confirming..."
                                : "Confirm Job Completed"}
                        </Button>
                    </Card>
                )}

                {/* Job fully completed */}
                {normalizeJobStatus(job.status) === "completed" && (
                    <Card className="mb-6 border-green-200 bg-green-50 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <h3 className="text-lg font-semibold text-green-800">
                                Job Completed
                            </h3>
                        </div>
                        <p className="text-sm text-green-700 mb-4">
                            Both you and the service provider have confirmed this job as complete.
                        </p>
                        <Button
                            disabled
                            className="bg-yellow-500 text-white gap-2 opacity-70 cursor-not-allowed"
                        >
                            <Star className="h-4 w-4" />
                            Add Review (Coming Soon)
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
