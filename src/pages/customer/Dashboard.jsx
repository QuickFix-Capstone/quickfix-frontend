// src/pages/customer/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import UnreadBadge from "../../components/messaging/UnreadBadge";
import ReviewModal from "../../components/reviews/ReviewModal";
import { getConversations } from "../../api/messaging";
import { getMyReviews } from "../../api/reviews";
import { getReviewsAboutMe } from "../../api/customerReviews";
import ReviewCard from "./ReviewCard";
import ProviderReviewCard from "./ProviderReviewCard";
import useMessagingWebSocket from "../../hooks/useMessagingWebSocket";
import { User, LogOut, Plus, Calendar, Settings, Upload, Briefcase, MessageSquare, TrendingUp, Clock, Star, Bell, ThumbsUp } from "lucide-react";

export default function CustomerDashboard() {
    const JOB_STATUS_WS_BASE = "wss://074y7xhv7f.execute-api.us-east-2.amazonaws.com/dev";
    const auth = useAuth();
    const navigate = useNavigate();
    const wsRef = useRef(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalUnread, setTotalUnread] = useState(0);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [reviewsAboutMe, setReviewsAboutMe] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [completionNotifications, setCompletionNotifications] = useState([]);
    const [showCompletedList, setShowCompletedList] = useState(false);
    const [showActiveList, setShowActiveList] = useState(false);
    const [showPendingList, setShowPendingList] = useState(false);
    const [showCancelledList, setShowCancelledList] = useState(false);
    const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedJobForReview, setSelectedJobForReview] = useState(null);
    const hasFetchedJobs = useRef(false);
    const notificationsMenuRef = useRef(null);
    const refreshUnreadCount = useCallback(async () => {
        if (!auth.isAuthenticated) return;

        try {
            const data = await getConversations(50);
            const total = (data.conversations || []).reduce(
                (sum, conv) => sum + conv.unreadCount,
                0
            );
            setTotalUnread(total);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    }, [auth.isAuthenticated]);

    const normalizeJobStatus = (status) => {
        const value = (status || "").toLowerCase();
        if (value === "in_prograss" || value === "in progress") return "in_progress";
        if (value === "canceled" || value === "cancel") return "cancelled";
        return value;
    };

    const jobStatusCounts = useMemo(() => {
        const counts = {
            pending: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
        };

        jobs.forEach((job) => {
            const status = normalizeJobStatus(job.status);

            if (status === "open" || status === "assigned") {
                counts.pending += 1;
            } else if (status === "confirmed" || status === "in_progress") {
                counts.active += 1;
            } else if (status === "completed") {
                counts.completed += 1;
            } else if (status === "cancelled") {
                counts.cancelled += 1;
            }
        });

        return counts;
    }, [jobs]);

    const pendingJobs = useMemo(() => {
        return jobs.filter((job) => {
            const status = normalizeJobStatus(job.status);
            return status === "open" || status === "assigned";
        });
    }, [jobs]);

    const activeJobs = useMemo(() => {
        return jobs.filter((job) => {
            const status = normalizeJobStatus(job.status);
            return status === "confirmed" || status === "in_progress";
        });
    }, [jobs]);

    const completedJobs = useMemo(() => {
        return jobs.filter((job) => normalizeJobStatus(job.status) === "completed");
    }, [jobs]);

    const cancelledJobs = useMemo(() => {
        return jobs.filter((job) => normalizeJobStatus(job.status) === "cancelled");
    }, [jobs]);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate("/customer/login");
            return;
        }

        const fetchProfile = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;
                const res = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 200) {
                    const data = await res.json();
                    setProfile(data.customer);
                } else {
                    console.error("Failed to fetch profile");
                    navigate("/customer/register");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [auth.isAuthenticated, auth.user, navigate]);

    useEffect(() => {
        if (!auth.isAuthenticated) return;
        if (hasFetchedJobs.current) return;
        hasFetchedJobs.current = true;

        const fetchJobs = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;
                const res = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/jobs?limit=10&offset=0",
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    setJobs(
                        (data.jobs || []).map((job) => ({
                            ...job,
                            status: normalizeJobStatus(job.status),
                        }))
                    );
                    return;
                }

                console.error("Failed to fetch jobs for dashboard:", res.status);
            } catch (error) {
                console.error("Error fetching jobs for dashboard:", error);
            }
        };

        fetchJobs();
    }, [auth.isAuthenticated, auth.user]);

    useEffect(() => {
        const userId = auth.user?.profile?.sub;
        if (!auth.isAuthenticated || !userId) return;

        const ws = new WebSocket(
            `${JOB_STATUS_WS_BASE}?user_id=${encodeURIComponent(userId)}`
        );
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const incomingJobId = message?.jobId || message?.job_id;
                const incomingStatus = normalizeJobStatus(message?.newStatus || message?.status);

                if (message?.type === "JOB_STATUS_CHANGED" && incomingJobId) {
                    setJobs((prevJobs) =>
                        prevJobs.map((job) =>
                            String(job.job_id) === String(incomingJobId)
                                ? { ...job, status: incomingStatus }
                                : job
                        )
                    );

                    if (incomingStatus === "completed") {
                        setCompletionNotifications((prev) => {
                            if (prev.some((n) => String(n.jobId) === String(incomingJobId))) {
                                return prev;
                            }
                            return [
                                { jobId: String(incomingJobId), receivedAt: Date.now() },
                                ...prev,
                            ].slice(0, 10);
                        });
                    }
                }
            } catch {
                // Ignore non-JSON websocket events
            }
        };

        ws.onerror = () => {
            ws.close();
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [auth.isAuthenticated, auth.user]);

    const clearCompletionNotification = (jobId) => {
        setCompletionNotifications((prev) =>
            prev.filter((item) => String(item.jobId) !== String(jobId))
        );
    };

    useEffect(() => {
        if (!showNotificationsMenu) return;

        const handleClickOutside = (event) => {
            if (
                notificationsMenuRef.current &&
                !notificationsMenuRef.current.contains(event.target)
            ) {
                setShowNotificationsMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotificationsMenu]);

    useEffect(() => {
        refreshUnreadCount();
    }, [refreshUnreadCount]);

    useMessagingWebSocket({
        enabled: auth.isAuthenticated,
        userId: auth.user?.profile?.sub,
        onMessage: refreshUnreadCount,
        onUnreadCount: (event) => {
            const totalFromEvent = Number(event?.totalUnread);
            if (Number.isFinite(totalFromEvent)) {
                setTotalUnread(totalFromEvent);
                return;
            }
            refreshUnreadCount();
        },
    });

    // Fetch completed bookings that need reviews
    useEffect(() => {
        if (!auth.isAuthenticated) return;

        const fetchPendingReviews = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;
                const res = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings?status=completed&limit=5",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 200) {
                    const data = await res.json();
                    // Filter bookings that don't have reviews yet
                    const bookingsNeedingReview = (data.bookings || []).filter(
                        booking => !booking.has_review
                    );
                    setPendingReviews(bookingsNeedingReview);
                }
            } catch (error) {
                console.error("Failed to fetch pending reviews:", error);
            }
        };

        fetchPendingReviews();
    }, [auth.isAuthenticated, auth.user]);

    // Fetch customer's reviews
    useEffect(() => {
        if (!auth.isAuthenticated) return;

        const fetchMyReviews = async () => {
            try {
                const data = await getMyReviews(10);
                setMyReviews(data.reviews || []);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            }
        };

        fetchMyReviews();
    }, [auth.isAuthenticated]);

    // Fetch reviews about me (from providers)
    useEffect(() => {
        if (!auth.isAuthenticated) return;

        const fetchReviewsAboutMe = async () => {
            try {
                const data = await getReviewsAboutMe({ 
                    sort: "newest", 
                    limit: 10, 
                    offset: 0 
                });
                setReviewsAboutMe(data.reviews || []);
            } catch (error) {
                console.error("Failed to fetch reviews about me:", error);
                // Silently fail - endpoint might not be implemented yet
            }
        };

        fetchReviewsAboutMe();
    }, [auth.isAuthenticated]);

    const handleOpenReviewModal = (job) => {
        // Ensure we have the provider_id field
        const jobData = {
            ...job,
            provider_id: job.provider_id || job.assigned_provider_id || job.providerId
        };
        setSelectedJobForReview(jobData);
        setReviewModalOpen(true);
    };

    const handleLogout = async () => {
        await auth.removeUser();
        navigate("/");
    };

    const handleSubmitReview = async (reviewData) => {
        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            
            // Validate comment length
            if (reviewData.comment && reviewData.comment.length < 10) {
                alert("Comment must be at least 10 characters");
                throw new Error("Comment too short");
            }
            
            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/reviews`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        job_id: reviewData.jobId,
                        provider_id: reviewData.providerId,
                        rating: reviewData.rating,
                        comment: reviewData.comment || "No comment provided.",
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                alert("Review submitted successfully!");
                // Try to refresh reviews, but don't fail if this errors
                try {
                    const reviewsData = await getMyReviews(10);
                    setMyReviews(reviewsData.reviews || []);
                } catch (refreshError) {
                    console.warn("Could not refresh reviews list:", refreshError);
                    // Review was submitted successfully, just couldn't refresh the list
                }
            } else {
                throw new Error(data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert(error.message || "Failed to submit review. Please try again.");
            throw error;
        }
    };

    const totalNotifications = completionNotifications.length + totalUnread;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-neutral-500">Loading your dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Enhanced Header */}
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold">
                                Welcome back, {profile?.first_name || "Customer"}! 👋
                            </h1>
                            <p className="mt-2 text-blue-100">
                                Your personalized service management hub
                            </p>
                        </div>
                        <div className="relative flex items-center gap-3" ref={notificationsMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowNotificationsMenu((prev) => !prev)}
                                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white/20"
                                aria-label="Open notifications"
                            >
                                <Bell className="h-5 w-5" />
                                {totalNotifications > 0 && (
                                    <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-semibold text-white">
                                        {totalNotifications > 99 ? "99+" : totalNotifications}
                                    </span>
                                )}
                            </button>

                            {showNotificationsMenu && (
                                <div className="absolute right-0 top-14 z-20 w-80 rounded-xl border border-white/30 bg-white p-4 text-neutral-900 shadow-2xl">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-bold">Notifications</h3>
                                        <span className="text-xs text-neutral-500">
                                            {totalNotifications} total
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNotificationsMenu(false);
                                            navigate("/customer/messages");
                                        }}
                                        className="mb-2 w-full rounded-lg border border-neutral-200 p-3 text-left transition hover:bg-neutral-50"
                                    >
                                        <p className="text-sm font-medium">Messages</p>
                                        <p className="text-xs text-neutral-600">
                                            {totalUnread > 0
                                                ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`
                                                : "No unread messages"}
                                        </p>
                                    </button>

                                    {completionNotifications.length === 0 ? (
                                        <div className="rounded-lg border border-neutral-200 p-3 text-xs text-neutral-600">
                                            No job completion updates yet.
                                        </div>
                                    ) : (
                                        <div className="max-h-60 space-y-2 overflow-y-auto">
                                            {completionNotifications.map((notification) => {
                                                const job = jobs.find(
                                                    (item) =>
                                                        String(item.job_id) ===
                                                        String(notification.jobId)
                                                );

                                                return (
                                                    <button
                                                        type="button"
                                                        key={`${notification.jobId}-${notification.receivedAt}`}
                                                        onClick={() => {
                                                            clearCompletionNotification(notification.jobId);
                                                            setShowNotificationsMenu(false);
                                                            navigate(`/customer/jobs/${notification.jobId}`);
                                                        }}
                                                        className="w-full rounded-lg border border-green-200 bg-green-50 p-3 text-left transition hover:bg-green-100"
                                                    >
                                                        <p className="text-sm font-semibold text-neutral-900">
                                                            {job?.title || `Job #${notification.jobId}`}
                                                        </p>
                                                        <p className="text-xs text-green-800">
                                                            Service provider marked this job as completed.
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="gap-2 border-white bg-white/10 text-white hover:bg-white/20"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Enhanced Quick Actions */}
                <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Browse Services Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Plus className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            Browse Services
                        </h3>
                        <p className="mb-4 text-sm text-blue-100">
                            Discover and book trusted service providers
                        </p>
                        <Button
                            onClick={() => navigate("/customer/services")}
                            className="w-full bg-blue-700 text-white font-bold border-2 border-blue-800 shadow-lg hover:bg-blue-800"
                        >
                            Explore Now
                        </Button>
                    </Card>

                    {/* Post a Job Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Plus className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            Post a Job
                        </h3>
                        <p className="mb-4 text-sm text-orange-100">
                            Let service providers apply to your job
                        </p>
                        <Button
                            onClick={() => navigate("/customer/post-job")}
                            className="w-full bg-orange-700 text-white font-bold border-2 border-orange-800 shadow-lg hover:bg-orange-800"
                        >
                            Create Job
                        </Button>
                    </Card>

                    {/* My Jobs Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Briefcase className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            My Jobs
                        </h3>
                        <p className="mb-4 text-sm text-indigo-100">
                            View and manage your posted jobs
                        </p>
                        <Button
                            onClick={() => navigate("/customer/jobs")}
                            className="w-full bg-indigo-700 text-white font-bold border-2 border-indigo-800 shadow-lg hover:bg-indigo-800"
                        >
                            View Jobs
                        </Button>
                    </Card>

                    {/* My Bookings Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Calendar className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            My Bookings
                        </h3>
                        <p className="mb-4 text-sm text-green-100">
                            View your upcoming appointments
                        </p>
                        <Button
                            onClick={() => navigate("/customer/bookings")}
                            className="w-full bg-green-700 text-white font-bold border-2 border-green-800 shadow-lg hover:bg-green-800"
                        >
                            View All
                        </Button>
                    </Card>

                    {/* Account Settings Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Settings className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            Settings
                        </h3>
                        <p className="mb-4 text-sm text-purple-100">
                            Update your profile and preferences
                        </p>
                        <Button
                            onClick={() => navigate("/customer/edit")}
                            className="w-full bg-purple-700 text-white font-bold border-2 border-purple-800 shadow-lg hover:bg-purple-800"
                        >
                            Manage
                        </Button>
                    </Card>

                    {/* Messages Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <MessageSquare className="h-7 w-7" />
                            </div>
                            {totalUnread > 0 && (
                                <div className="flex items-center gap-2">
                                    <UnreadBadge count={totalUnread} />
                                </div>
                            )}
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            Messages
                            {totalUnread > 0 && (
                                <span className="ml-2 text-sm font-normal text-pink-100">
                                    ({totalUnread} unread)
                                </span>
                            )}
                        </h3>
                        <p className="mb-4 text-sm text-pink-100">
                            {totalUnread > 0
                                ? "You have new messages from providers"
                                : "Chat with service providers"
                            }
                        </p>
                        <Button
                            onClick={() => navigate("/customer/messages")}
                            className="w-full bg-pink-700 text-white font-bold border-2 border-pink-800 shadow-lg hover:bg-pink-800"
                        >
                            {totalUnread > 0 ? "View Messages" : "Open Messages"}
                        </Button>
                    </Card>

                    {/* My Profile Card */}
                    <Card className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <User className="h-7 w-7" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">
                            My Profile
                        </h3>
                        <p className="mb-4 text-sm text-teal-100">
                            View your public profile and reputation
                        </p>
                        <Button
                            onClick={() => navigate("/customer/profile")}
                            className="w-full bg-teal-700 text-white font-bold border-2 border-teal-800 shadow-lg hover:bg-teal-800"
                        >
                            View Profile
                        </Button>
                    </Card>
                </div>

                {/* Activity Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Stats Card 1 */}
                    <Card
                        className={`border-0 bg-white p-6 shadow-lg transition ${showCompletedList ? "ring-2 ring-blue-500" : "hover:shadow-xl"} cursor-pointer`}
                        onClick={() => setShowCompletedList((prev) => !prev)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Completed</p>
                                <p className="text-2xl font-bold text-neutral-900">{jobStatusCounts.completed}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Card 2 */}
                    <Card
                        className={`border-0 bg-white p-6 shadow-lg transition ${showActiveList ? "ring-2 ring-orange-500" : "hover:shadow-xl"} cursor-pointer`}
                        onClick={() => setShowActiveList((prev) => !prev)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                <Briefcase className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Active Jobs</p>
                                <p className="text-2xl font-bold text-neutral-900">{jobStatusCounts.active}</p>
                                {completionNotifications.length > 0 && (
                                    <p className="text-xs font-medium text-green-700">
                                        {completionNotifications.length} completion update{completionNotifications.length > 1 ? "s" : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Stats Card 3 */}
                    <Card
                        className={`border-0 bg-white p-6 shadow-lg transition ${showPendingList ? "ring-2 ring-green-500" : "hover:shadow-xl"} cursor-pointer`}
                        onClick={() => setShowPendingList((prev) => !prev)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Pending</p>
                                <p className="text-2xl font-bold text-neutral-900">{jobStatusCounts.pending}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Card 4 */}
                    <Card
                        className={`border-0 bg-white p-6 shadow-lg transition ${showCancelledList ? "ring-2 ring-red-500" : "hover:shadow-xl"} cursor-pointer`}
                        onClick={() => setShowCancelledList((prev) => !prev)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                                <Calendar className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Cancelled</p>
                                <p className="text-2xl font-bold text-neutral-900">{jobStatusCounts.cancelled}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {completionNotifications.length > 0 && (
                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Job Completion Updates
                            </h2>
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => setCompletionNotifications([])}
                            >
                                Clear All
                            </Button>
                        </div>
                        <div className="grid gap-3">
                            {completionNotifications.map((notification) => {
                                const job = jobs.find(
                                    (item) => String(item.job_id) === String(notification.jobId)
                                );
                                return (
                                    <Card
                                        key={`${notification.jobId}-${notification.receivedAt}`}
                                        className="border border-green-200 bg-green-50 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-neutral-900">
                                                    {job?.title || `Job #${notification.jobId}`}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    Service provider marked this job as completed.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    clearCompletionNotification(notification.jobId);
                                                    navigate(`/customer/jobs/${notification.jobId}`);
                                                }}
                                                className="bg-green-600 text-white hover:bg-green-700"
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {showActiveList && (
                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Active Jobs
                            </h2>
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => navigate("/customer/jobs")}
                            >
                                View All Jobs
                            </Button>
                        </div>

                        {activeJobs.length === 0 ? (
                            <Card className="border border-neutral-200 bg-white p-6 text-neutral-600">
                                No active jobs found in this page of results.
                            </Card>
                        ) : (
                            <div className="grid gap-3">
                                {activeJobs.map((job) => (
                                    <Card
                                        key={job.job_id}
                                        className="border border-neutral-200 bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-neutral-900">
                                                    {job.title}
                                                </p>
                                                <p className="text-sm text-neutral-600">
                                                    Status: {(job.status || "").replace("_", " ")}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    navigate(`/customer/jobs/${job.job_id}`)
                                                }
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showCompletedList && (
                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Completed Jobs
                            </h2>
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => navigate("/customer/jobs")}
                            >
                                View All Jobs
                            </Button>
                        </div>

                        {completedJobs.length === 0 ? (
                            <Card className="border border-neutral-200 bg-white p-6 text-neutral-600">
                                No completed jobs found in this page of results.
                            </Card>
                        ) : (
                            <div className="grid gap-3">
                                {completedJobs.map((job) => (
                                    <Card
                                        key={job.job_id}
                                        className="border border-neutral-200 bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-neutral-900">
                                                    {job.title}
                                                </p>
                                                <p className="text-sm font-medium text-green-700">
                                                    Job is done.
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        navigate(`/customer/jobs/${job.job_id}`)
                                                    }
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    onClick={() => handleOpenReviewModal(job)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    Review
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showPendingList && (
                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Pending Jobs
                            </h2>
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => navigate("/customer/jobs")}
                            >
                                View All Jobs
                            </Button>
                        </div>

                        {pendingJobs.length === 0 ? (
                            <Card className="border border-neutral-200 bg-white p-6 text-neutral-600">
                                No pending jobs found in this page of results.
                            </Card>
                        ) : (
                            <div className="grid gap-3">
                                {pendingJobs.map((job) => (
                                    <Card
                                        key={job.job_id}
                                        className="border border-neutral-200 bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-neutral-900">
                                                    {job.title}
                                                </p>
                                                <p className="text-sm text-neutral-600">
                                                    Status: {(job.status || "").replace("_", " ")}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    navigate(`/customer/jobs/${job.job_id}`)
                                                }
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {showCancelledList && (
                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900">
                                Cancelled Jobs
                            </h2>
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => navigate("/customer/jobs")}
                            >
                                View All Jobs
                            </Button>
                        </div>

                        {cancelledJobs.length === 0 ? (
                            <Card className="border border-neutral-200 bg-white p-6 text-neutral-600">
                                No cancelled jobs found in this page of results.
                            </Card>
                        ) : (
                            <div className="grid gap-3">
                                {cancelledJobs.map((job) => (
                                    <Card
                                        key={job.job_id}
                                        className="border border-neutral-200 bg-white p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-neutral-900">
                                                    {job.title}
                                                </p>
                                                <p className="text-sm text-neutral-600">
                                                    Status: {(job.status || "").replace("_", " ")}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    navigate(`/customer/jobs/${job.job_id}`)
                                                }
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pending Reviews Section */}
                {pendingReviews.length > 0 && (
                    <div className="mt-8">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-900">
                                    Pending Reviews
                                </h2>
                                <p className="text-sm text-neutral-600">
                                    Share your experience with these completed services
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                                <Star className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingReviews.map((booking) => (
                                <Card
                                    key={booking.booking_id}
                                    className="border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="mb-3">
                                        <p className="font-semibold text-neutral-900">
                                            {booking.service_description}
                                        </p>
                                        <p className="text-sm text-neutral-600 mt-1">
                                            {booking.provider?.name || "Service Provider"}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            Completed on{" "}
                                            {new Date(booking.scheduled_date).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => navigate(`/customer/bookings/${booking.booking_id}`)}
                                        className="w-full bg-yellow-500 text-white font-semibold hover:bg-yellow-600"
                                    >
                                        Leave Review
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Reviews Section */}
                <div className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900">
                                My Reviews
                            </h2>
                            <p className="text-sm text-neutral-600">
                                Reviews you've left for service providers
                            </p>
                        </div>
                        {myReviews.length > 0 && (
                            <Button
                                onClick={() => navigate("/customer/reviews")}
                                variant="outline"
                                className="text-sm"
                            >
                                View All
                            </Button>
                        )}
                    </div>

                    {myReviews.length === 0 ? (
                        <Card className="border border-neutral-200 bg-white p-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                                <Star className="h-8 w-8 text-yellow-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                                No Reviews Yet
                            </h3>
                            <p className="mb-4 text-sm text-neutral-600">
                                Complete a booking and share your experience with others
                            </p>
                            <Button
                                onClick={() => navigate("/customer/bookings")}
                                variant="outline"
                            >
                                View Bookings
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {myReviews.slice(0, 3).map((review) => (
                                <ReviewCard key={review.review_id} review={review} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Reviews About Me Section */}
                <div className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900">
                                Reviews About Me
                            </h2>
                            <p className="text-sm text-neutral-600">
                                Feedback from service providers
                            </p>
                        </div>
                        {reviewsAboutMe.length > 0 && (
                            <Button
                                onClick={() => navigate("/customer/reviews-about-me")}
                                variant="outline"
                                className="text-sm"
                            >
                                View All
                            </Button>
                        )}
                    </div>

                    {reviewsAboutMe.length === 0 ? (
                        <Card className="border border-neutral-200 bg-white p-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                                <ThumbsUp className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                                No Provider Reviews Yet
                            </h3>
                            <p className="text-sm text-neutral-600">
                                Service providers haven't left feedback about you yet
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {reviewsAboutMe.slice(0, 3).map((review) => (
                                <ProviderReviewCard key={review.review_id} review={review} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {selectedJobForReview && (
                <ReviewModal
                    isOpen={reviewModalOpen}
                    onClose={() => {
                        setReviewModalOpen(false);
                        setSelectedJobForReview(null);
                    }}
                    job={selectedJobForReview}
                    onSubmit={handleSubmitReview}
                />
            )}
        </div>
    );
}
