// src/pages/customer/JobApplications.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { API_BASE } from "../../api/config";
import { cancelJob, updateJobApplicationStatus } from "../../api/jobs";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    Briefcase,
    RotateCcw,
} from "lucide-react";

export default function JobApplications() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { job_id } = useParams();
    const [applications, setApplications] = useState([]);
    const [jobTitle, setJobTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [editingApplicationId, setEditingApplicationId] = useState(null);
    const [editPrice, setEditPrice] = useState("");
    const [editMessage, setEditMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const getErrorMessage = async (response, fallback) => {
        try {
            const text = await response.text();
            if (!text) return fallback;
            try {
                const data = JSON.parse(text);
                return data?.message || fallback;
            } catch {
                return text;
            }
        } catch {
            return fallback;
        }
    };

    useEffect(() => {
        fetchApplications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [job_id]);

    const normalizeApplication = (application) => {
        const provider = application?.provider || {};
        const normalizedStatus = (application.status || "pending")
            .toString()
            .toLowerCase();
        const rawRating =
            provider.rating ??
            application.provider_rating ??
            application.average_rating ??
            null;
        const normalizedRating =
            rawRating === null || rawRating === undefined
                ? null
                : Number(rawRating);

        return {
            ...application,
            application_id: application.application_id || application.id || null,
            status: normalizedStatus,
            provider_name:
                application.provider_name ||
                provider.name ||
                provider.provider_name ||
                "Service Provider",
            provider_email: application.provider_email || provider.email || null,
            provider_phone: application.provider_phone || provider.phone || null,
            provider_rating: Number.isNaN(normalizedRating)
                ? null
                : normalizedRating,
        };
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const res = await fetch(
                `${API_BASE}/job/${job_id}/applications`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Applications fetched:", data);
                setApplications((data.applications || []).map(normalizeApplication));
                setJobTitle(data.job_title || "Job");
            } else {
                const errorMessage = await getErrorMessage(
                    res,
                    "Failed to load applications. Please try again."
                );
                console.error("Failed to fetch applications:", res.status, errorMessage);
                alert(errorMessage);
                navigate("/customer/jobs");
            }
        } catch (err) {
            console.error("Error fetching applications:", err);
            alert("Error loading applications. Please try again.");
            navigate("/customer/jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (applicationId, action) => {
        if (!applicationId) {
            setActionError("Unable to update this application: missing application ID.");
            return;
        }
        const normalizedAction = action === "accept" ? "accept" : "reject";
        setActionError("");

        setProcessingId(`status-${applicationId}`);
        try {
            const data = await updateJobApplicationStatus(
                job_id,
                applicationId,
                normalizedAction,
                auth
            );

            navigate("/customer/jobs", { replace: true });
            // Fallback in case router navigation is interrupted by app state issues
            setTimeout(() => {
                if (window.location.pathname !== "/customer/jobs") {
                    window.location.assign("/customer/jobs");
                }
            }, 50);
        } catch (err) {
            console.error("Error updating application:", err);
            setActionError(err.message || "Error updating application. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const startEditing = (application) => {
        setEditingApplicationId(application.application_id);
        setEditPrice(
            application.proposed_price !== null &&
                application.proposed_price !== undefined
                ? String(application.proposed_price)
                : ""
        );
        setEditMessage(application.cover_letter || application.message || "");
    };

    const cancelEditing = () => {
        setEditingApplicationId(null);
        setEditPrice("");
        setEditMessage("");
    };

    const handleUpdateApplication = async (applicationId) => {
        const parsedPrice = Number(editPrice);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            alert("Please enter a valid proposed price.");
            return;
        }
        if (!editMessage.trim()) {
            alert("Please enter application details.");
            return;
        }

        setProcessingId(`edit-${applicationId}`);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                `${API_BASE}/job/${job_id}/applications/${applicationId}/update`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        proposed_price: parsedPrice,
                        message: editMessage.trim(),
                    }),
                }
            );

            if (res.ok) {
                const data = await res.json();
                alert(data?.message || "Application updated successfully.");
                cancelEditing();
                await fetchApplications();
            } else {
                const errorMessage = await getErrorMessage(
                    res,
                    "Failed to update application. Please try again."
                );
                alert(errorMessage);
            }
        } catch (err) {
            console.error("Error updating application details:", err);
            alert("Error updating application. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleUnassignJob = async () => {
        if (
            !confirm(
                "Are you sure you want to unassign this job? The job will return to 'open' status and you can consider other applications."
            )
        ) {
            return;
        }

        setProcessingId("unassign");
        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const res = await fetch(
                `${API_BASE}/job/${job_id}/unassign`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.ok) {
                alert("Job unassigned successfully! The job is now open and you can choose a different application.");
                // Navigate back to jobs list page
                navigate("/customer/jobs");
            } else {
                const errorMessage = await getErrorMessage(
                    res,
                    "Failed to unassign job. Please try again."
                );
                console.error("Failed to unassign job:", errorMessage);
                alert(errorMessage);
            }
        } catch (err) {
            console.error("Error unassigning job:", err);
            alert("Error unassigning job. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelJob = async () => {
        if (!confirm("Are you sure you want to cancel this job?")) {
            return;
        }

        setProcessingId("cancel-job");
        try {
            await cancelJob(job_id, auth);
            alert("Job cancelled successfully.");
            navigate("/customer/jobs");
        } catch (err) {
            console.error("Error cancelling job:", err);
            alert(err.message || "Error cancelling job. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "accepted":
                return "bg-green-100 text-green-800 border-green-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-neutral-100 text-neutral-800 border-neutral-200";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading applications...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-6xl">
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">
                                Applications for: {jobTitle}
                            </h1>
                            <p className="mt-1 text-neutral-600">
                                Review and manage service provider applications
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => navigate(`/customer/jobs/${job_id}`)}
                                variant="outline"
                            >
                                View Job Details
                            </Button>
                            <Button
                                onClick={handleCancelJob}
                                disabled={processingId === "cancel-job"}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                                Cancel Job
                            </Button>
                        </div>
                    </div>
                    {actionError && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {actionError}
                        </div>
                    )}
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <Card className="border-neutral-200 bg-white p-12 text-center shadow-lg">
                        <Briefcase className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
                        <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                            No applications yet
                        </h3>
                        <p className="mb-6 text-neutral-600">
                            Service providers haven't applied to this job yet. Check back
                            later!
                        </p>
                        <Button
                            onClick={() => navigate("/customer/jobs")}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Back to My Jobs
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <Card
                                key={app.application_id || `${app.provider_email}-${app.created_at}`}
                                className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Provider Info */}
                                        <div className="mb-4 flex items-start gap-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white">
                                                <User className="h-8 w-8" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-neutral-900">
                                                    {app.provider_name || "Service Provider"}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap gap-4">
                                                    {app.provider_email && (
                                                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                            <Mail className="h-4 w-4" />
                                                            <span>{app.provider_email}</span>
                                                        </div>
                                                    )}
                                                    {app.provider_phone && (
                                                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                            <Phone className="h-4 w-4" />
                                                            <span>{app.provider_phone}</span>
                                                        </div>
                                                    )}
                                                    {app.provider_rating !== null &&
                                                        app.provider_rating !== undefined && (
                                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                                <span className="font-semibold">
                                                                    {app.provider_rating.toFixed(1)}
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Application Details */}
                                        {editingApplicationId === app.application_id ? (
                                            <div className="mb-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                                                <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                                    Edit Application
                                                </h4>
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                                        Proposed Price
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editPrice}
                                                        onChange={(e) => setEditPrice(e.target.value)}
                                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                                        Message
                                                    </label>
                                                    <textarea
                                                        value={editMessage}
                                                        onChange={(e) => setEditMessage(e.target.value)}
                                                        rows={4}
                                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() =>
                                                            handleUpdateApplication(
                                                                app.application_id
                                                            )
                                                        }
                                                        disabled={
                                                            processingId ===
                                                            `edit-${app.application_id}`
                                                        }
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {processingId ===
                                                        `edit-${app.application_id}`
                                                            ? "Saving..."
                                                            : "Save Changes"}
                                                    </Button>
                                                    <Button
                                                        onClick={cancelEditing}
                                                        variant="outline"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            app.cover_letter && (
                                                <div className="mb-4">
                                                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                                        Cover Letter
                                                    </h4>
                                                    <p className="whitespace-pre-wrap text-neutral-700">
                                                        {app.cover_letter}
                                                    </p>
                                                </div>
                                            )
                                        )}

                                        {/* Proposed Price */}
                                        {app.proposed_price !== null &&
                                            app.proposed_price !== undefined && (
                                            <div className="mb-4">
                                                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                                    Proposed Price
                                                </h4>
                                                <p className="text-2xl font-bold text-green-600">
                                                    ${Number(app.proposed_price).toFixed(2)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Application Metadata */}
                                        <div className="flex items-center gap-6 text-sm text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>Applied: {formatDate(app.applied_at || app.created_at)}</span>
                                            </div>
                                            <span
                                                className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                                                    app.status
                                                )}`}
                                            >
                                                {(app.status || "pending").toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {app.status === "pending" && (
                                        <div className="ml-4 flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                onClick={() => startEditing(app)}
                                                disabled={processingId === `status-${app.application_id}`}
                                                variant="outline"
                                                className="gap-2"
                                            >
                                                Edit Price/Message
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        app.application_id,
                                                        "accept"
                                                    )
                                                }
                                                disabled={processingId === `status-${app.application_id}`}
                                                className="gap-2 bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Accept
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        app.application_id,
                                                        "reject"
                                                    )
                                                }
                                                disabled={processingId === `status-${app.application_id}`}
                                                variant="outline"
                                                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                    {app.status === "accepted" && (
                                        <div className="ml-4 flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                onClick={handleUnassignJob}
                                                disabled={processingId === "unassign"}
                                                variant="outline"
                                                className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Unassign Job
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        app.application_id,
                                                        "reject"
                                                    )
                                                }
                                                disabled={processingId === `status-${app.application_id}`}
                                                variant="outline"
                                                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject Application
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
