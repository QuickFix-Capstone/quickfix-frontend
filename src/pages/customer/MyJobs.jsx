// src/pages/customer/MyJobs.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { ArrowLeft, Briefcase, MapPin, Calendar, Clock, DollarSign, Users, Image } from "lucide-react";
import { getJobImages } from "../../api/jobImages";

export default function MyJobs() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit] = useState(10);
    const [offset, setOffset] = useState(0);
    const [jobImages, setJobImages] = useState({}); // Store images for each job: { jobId: [images] }

    useEffect(() => {
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offset]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            console.log("Token being used:", token ? "Token exists" : "No token");
            console.log("Token length:", token?.length);

            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/jobs?limit=${limit}&offset=${offset}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Response status:", res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("Jobs fetched:", data);
                console.log("Jobs array:", data.jobs);
                console.log("Jobs array length:", data.jobs?.length);
                setJobs(data.jobs || []);

                // Fetch images for all jobs
                if (data.jobs && data.jobs.length > 0) {
                    fetchJobImages(data.jobs);
                }
            } else {
                const errorText = await res.text();
                console.error("Failed to fetch jobs. Status:", res.status, "Error:", errorText);
                alert("Failed to load your jobs. Please try again.");
            }
        } catch (err) {
            console.error("Error fetching jobs:", err);
            alert("Error loading jobs. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchJobImages = async (jobsList) => {
        const imagesMap = {};

        // Fetch images for each job in parallel
        await Promise.all(
            jobsList.map(async (job) => {
                try {
                    const images = await getJobImages(job.job_id, auth);
                    if (images && images.length > 0) {
                        imagesMap[job.job_id] = images;
                    }
                } catch (err) {
                    // Silently fail - job might not have images or images endpoint might not be available
                    console.log(`No images for job ${job.job_id}:`, err.message);
                }
            })
        );

        setJobImages(imagesMap);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open":
                return "bg-green-100 text-green-800";
            case "assigned":
                return "bg-blue-100 text-blue-800";
            case "in_progress":
                return "bg-yellow-100 text-yellow-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-neutral-100 text-neutral-800";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    console.log("MyJobs render - loading:", loading, "jobs count:", jobs.length);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading your jobs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-6xl">
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">My Posted Jobs</h1>
                            <p className="mt-1 text-neutral-600">
                                Manage your job postings and view applications
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate("/customer/post-job")}
                            className="gap-2 bg-orange-600 hover:bg-orange-700"
                        >
                            <Briefcase className="h-4 w-4" />
                            Post New Job
                        </Button>
                    </div>
                </div>

                {/* Jobs List */}
                {jobs.length === 0 ? (
                    <Card className="border-neutral-200 bg-white p-12 text-center shadow-lg">
                        <Briefcase className="mx-auto mb-4 h-16 w-16 text-neutral-300" />
                        <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                            No jobs posted yet
                        </h3>
                        <p className="mb-6 text-neutral-600">
                            Start by posting your first job and let service providers apply
                        </p>
                        <Button
                            onClick={() => navigate("/customer/post-job")}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Post Your First Job
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <Card
                                key={job.job_id}
                                className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Job Title and Status */}
                                        <div className="mb-3 flex items-start gap-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-neutral-900">
                                                    {job.title}
                                                </h3>
                                                <span
                                                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                                        job.status
                                                    )}`}
                                                >
                                                    {job.status.replace("_", " ").toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="mb-4 text-neutral-600">
                                            {job.description}
                                        </p>

                                        {/* Job Images Gallery */}
                                        {jobImages[job.job_id] && jobImages[job.job_id].length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Image className="h-4 w-4 text-neutral-600" />
                                                    <span className="text-sm font-medium text-neutral-700">
                                                        {jobImages[job.job_id].length} Image{jobImages[job.job_id].length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {jobImages[job.job_id].slice(0, 5).map((image) => (
                                                        <div
                                                            key={image.image_id}
                                                            className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer"
                                                            onClick={() => window.open(image.url, '_blank')}
                                                            title="Click to view full size"
                                                        >
                                                            <img
                                                                src={image.url}
                                                                alt={image.description || `Job image ${image.image_order}`}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Job Details Grid */}
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                <Briefcase className="h-4 w-4" />
                                                <span className="capitalize">{job.category}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                <MapPin className="h-4 w-4" />
                                                <span>
                                                    {job.location?.city}, {job.location?.state}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(job.preferred_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                <Clock className="h-4 w-4" />
                                                <span>{job.preferred_time || "Flexible"}</span>
                                            </div>
                                        </div>

                                        {/* Budget and Applications */}
                                        <div className="mt-4 flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                <span className="font-semibold text-neutral-900">
                                                    ${job.budget?.min?.toFixed(2)} - $
                                                    {job.budget?.max?.toFixed(2)}
                                                </span>
                                            </div>
                                            {job.application_count !== undefined && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                    <span className="font-semibold text-neutral-900">
                                                        {job.application_count} Application
                                                        {job.application_count !== 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="ml-4 flex flex-col gap-2">
                                        <Button
                                            onClick={() =>
                                                navigate(`/customer/jobs/${job.job_id}`)
                                            }
                                            variant="outline"
                                            className="whitespace-nowrap"
                                        >
                                            View Details
                                        </Button>
                                        {job.status === "open" && (
                                            <Button
                                                onClick={() =>
                                                    navigate(`/customer/jobs/${job.job_id}/applications`)
                                                }
                                                className="whitespace-nowrap bg-neutral-900 hover:bg-neutral-800"
                                            >
                                                View Applications ({job.application_count || 0})
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {jobs.length > 0 && (
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <Button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-neutral-600">
                            Showing {offset + 1} - {offset + jobs.length}
                        </span>
                        <Button
                            onClick={() => setOffset(offset + limit)}
                            disabled={jobs.length < limit}
                            variant="outline"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
