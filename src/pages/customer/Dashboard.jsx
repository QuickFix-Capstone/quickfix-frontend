// src/pages/customer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import UnreadBadge from "../../components/messaging/UnreadBadge";
import { getConversations } from "../../api/messaging";
import { getMyReviews } from "../../api/reviews";
import ReviewCard from "./ReviewCard";
import { User, LogOut, Plus, Calendar, Settings, Upload, Briefcase, MessageSquare, TrendingUp, Clock, Star } from "lucide-react";

export default function CustomerDashboard() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalUnread, setTotalUnread] = useState(0);
    const [pendingReviews, setPendingReviews] = useState([]);
    const [myReviews, setMyReviews] = useState([]);

    // Dashboard stats
    const [totalBookings, setTotalBookings] = useState(0);
    const [activeJobs, setActiveJobs] = useState(0);
    const [pendingBookings, setPendingBookings] = useState(0);

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

    // Fetch unread message count
    useEffect(() => {
        if (!auth.isAuthenticated) return;

        const fetchUnreadCount = async () => {
            try {
                const data = await getConversations(50);
                const total = (data.conversations || []).reduce(
                    (sum, conv) => sum + conv.unreadCount,
                    0
                );
                setTotalUnread(total);
            } catch (error) {
                // Silently fail - user might not have any conversations yet
                console.error("Failed to fetch unread count:", error);
            }
        };

        fetchUnreadCount();

        // Poll every 30 seconds for new messages
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [auth.isAuthenticated]);

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

    // Fetch dashboard stats
    useEffect(() => {
        if (!auth.isAuthenticated) return;

        const fetchStats = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;

                // Fetch all bookings to calculate total and pending
                const bookingsRes = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings?limit=1000",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json();
                    const bookings = bookingsData.bookings || [];

                    setTotalBookings(bookings.length);

                    // Count pending confirmations
                    const pending = bookings.filter(
                        b => b.status === 'pending_confirmation' || b.status === 'PENDING CONFIRMATION'
                    ).length;
                    setPendingBookings(pending);
                }

                // Fetch all jobs to calculate active jobs
                const jobsRes = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/jobs?limit=1000",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (jobsRes.ok) {
                    const jobsData = await jobsRes.json();
                    const jobs = jobsData.jobs || [];

                    // Count active jobs (assigned or in_progress)
                    const active = jobs.filter(
                        j => j.status === 'assigned' || j.status === 'in_progress'
                    ).length;
                    setActiveJobs(active);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            }
        };

        fetchStats();
    }, [auth.isAuthenticated, auth.user]);

    const handleLogout = async () => {
        // Clear the auth session locally and navigate to home
        await auth.removeUser();
        navigate("/");
    };

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
                </div>

                {/* Activity Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Stats Card 1 - Total Bookings */}
                    <Card
                        className="border-0 bg-white p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105"
                        onClick={() => navigate("/customer/bookings")}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Total Bookings</p>
                                <p className="text-2xl font-bold text-neutral-900">{totalBookings}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Card 2 - Active Jobs */}
                    <Card
                        className="border-0 bg-white p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105"
                        onClick={() => navigate("/customer/jobs")}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                <Briefcase className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Active Jobs</p>
                                <p className="text-2xl font-bold text-neutral-900">{activeJobs}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Card 3 - Pending Confirmations */}
                    <Card
                        className="border-0 bg-white p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105"
                        onClick={() => navigate("/customer/bookings")}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">Pending</p>
                                <p className="text-2xl font-bold text-neutral-900">{pendingBookings}</p>
                            </div>
                        </div>
                    </Card>
                </div>

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
            </div>
        </div>
    );
}
