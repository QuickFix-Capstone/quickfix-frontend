// src/pages/customer/Bookings.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { useLocation as useUserLocation } from "../../context/LocationContext";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import ReviewModal from "../../components/reviews/ReviewModal";
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, AlertCircle, ChevronLeft, ChevronRight, Filter, MessageSquare } from "lucide-react";
import { createConversation } from "../../api/messaging";
import { getMyReviews } from "../../api/reviews";

export default function Bookings() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { location: userLocation, getLocation } = useUserLocation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [limit] = useState(20);
    const [offset, setOffset] = useState(0);
    const [pagination, setPagination] = useState({ total: 0, has_more: false });
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

    // Get user location on mount
    useEffect(() => {
        if (!userLocation) {
            getLocation();
        }
    }, [userLocation, getLocation]);

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        confirmed: "bg-blue-100 text-blue-800 border-blue-200",
        in_progress: "bg-purple-100 text-purple-800 border-purple-200",
        completed: "bg-green-100 text-green-800 border-green-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    const categoryColors = {
        PLUMBING: "bg-blue-100 text-blue-800",
        ELECTRICAL: "bg-yellow-100 text-yellow-800",
        HVAC: "bg-purple-100 text-purple-800",
        CLEANING: "bg-green-100 text-green-800",
        HANDYMAN: "bg-orange-100 text-orange-800",
        PEST_CONTROL: "bg-red-100 text-red-800",
    };

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate("/customer/login");
            return;
        }

        fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth.isAuthenticated, navigate, statusFilter, offset]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            // Construct Query Parameters
            const params = new URLSearchParams();
            if (statusFilter !== "all") {
                params.append("status", statusFilter);
            }
            params.append("limit", limit);
            params.append("offset", offset);

            console.log("Fetching bookings with params:", params.toString());

            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Bookings API response:", data);
                // Handle both array and object with bookings property
                if (Array.isArray(data)) {
                    setBookings(data);
                    setPagination({ total: data.length, has_more: false });
                } else {
                    setBookings(data.bookings || []);
                    setPagination(data.pagination || { total: 0, has_more: false });
                }
            } else {
                console.error("Failed to fetch bookings", res.status, res.statusText);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (timeString) => {
        // Handle both "HH:MM:SS" and "HH:MM" formats
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleCancelBooking = async (bookingId) => {
        if (!confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/booking/${bookingId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "CANCELLED",
                    }),
                }
            );

            if (res.ok) {
                alert("Booking cancelled successfully");
                fetchBookings(); // Refresh the list
            } else {
                alert("Failed to cancel booking");
            }
        } catch (err) {
            console.error("Error cancelling booking:", err);
            alert("Error cancelling booking");
        }
    };

    // Handle messaging a provider
    const handleMessageProvider = async (booking) => {
        try {
            await createConversation(
                booking.provider_id,
                booking.service_offering_id || booking.booking_id
            );
            navigate("/customer/messages");
        } catch (error) {
            // If conversation already exists (409), navigate to messages anyway
            if (error.status === 409) {
                navigate("/customer/messages");
            } else {
                console.error("Failed to create conversation:", error);
                alert("Failed to start conversation. Please try again.");
            }
        }
    };

    const handleOpenReviewModal = (booking) => {
        // Convert booking to job format for the modal
        const jobData = {
            job_id: null, // We'll use booking_id instead
            booking_id: booking.booking_id,
            title: booking.service_description,
            provider_name: booking.provider?.name,
            provider_id: booking.provider_id,
        };
        setSelectedBookingForReview(jobData);
        setReviewModalOpen(true);
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
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer/reviews`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        booking_id: reviewData.bookingId,
                        provider_id: reviewData.providerId,
                        rating: reviewData.rating,
                        comment: reviewData.comment || "No comment provided.",
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                alert("Review submitted successfully!");
                fetchBookings(); // Refresh bookings
            } else {
                throw new Error(data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert(error.message || "Failed to submit review. Please try again.");
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading your bookings...</div>
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">My Bookings</h1>
                            <p className="mt-1 text-neutral-600">
                                View and manage your service bookings
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status);
                                    setOffset(0); // Reset pagination on filter change
                                }}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${statusFilter === status
                                    ? "bg-neutral-900 text-white"
                                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="flex py-12 items-center justify-center">
                        <div className="text-neutral-500">Loading bookings...</div>
                    </div>
                ) : bookings.length === 0 ? (
                    <Card className="border-neutral-200 bg-white p-12 text-center shadow-lg">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                        <p className="mb-2 text-lg font-medium text-neutral-700">
                            No {statusFilter !== 'all' ? statusFilter.replace('_', ' ') : ''} bookings found
                        </p>
                        <p className="mb-6 text-neutral-500">
                            {statusFilter !== 'all'
                                ? "Try selecting a different status filter"
                                : "Start by booking a service from our available offerings"
                            }
                        </p>
                        {statusFilter === 'all' && (
                            <Button
                                onClick={() => navigate("/customer/services")}
                                className="bg-neutral-900 hover:bg-neutral-800"
                            >
                                Browse Services
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <Card
                                key={booking.booking_id}
                                className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    {/* Left: Booking Details */}
                                    <div className="flex-1 space-y-3">
                                        {/* Service Title & Category */}
                                        <div>
                                            <h3 className="text-xl font-semibold text-neutral-900">
                                                {booking.service_description}
                                            </h3>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[booking.service_category] ||
                                                        "bg-neutral-100 text-neutral-800"
                                                        }`}
                                                >
                                                    {booking.service_category?.replace("_", " ")}
                                                </span>
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[booking.status] ||
                                                        "bg-neutral-100 text-neutral-800 border-neutral-200"
                                                        }`}
                                                >
                                                    {booking.status?.replace("_", " ").toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formatDate(booking.scheduled_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>{formatTime(booking.scheduled_time)}</span>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-start gap-2 text-sm text-neutral-600">
                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>
                                                {booking.location?.address}, {booking.location?.city},{" "}
                                                {booking.location?.state} {booking.location?.postal_code}
                                            </span>
                                        </div>

                                        {/* Provider */}
                                        {booking.provider?.name && (
                                            <div className="text-sm text-neutral-600">
                                                <span className="font-medium">Provider:</span>{" "}
                                                {booking.provider.name}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {booking.notes && (
                                            <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
                                                <span className="font-medium">Notes:</span> {booking.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Price & Actions */}
                                    <div className="flex flex-col items-end gap-4 lg:min-w-[200px]">
                                        {/* Price */}
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-2xl font-bold text-neutral-900">
                                                <DollarSign className="h-5 w-5" />
                                                {booking.estimated_price?.toFixed(2) || booking.final_price?.toFixed(2)}
                                            </div>
                                            {booking.estimated_price && !booking.final_price && (
                                                <span className="text-xs text-neutral-500">Estimated</span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 w-full">
                                            {booking.status === "completed" && (
                                                <Button
                                                    onClick={() => handleOpenReviewModal(booking)}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    Write Review
                                                </Button>
                                            )}
                                            {booking.status === "pending" && (
                                                <Button
                                                    onClick={() => handleCancelBooking(booking.booking_id)}
                                                    variant="outline"
                                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => navigate(`/customer/bookings/${booking.booking_id}`)}
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    onClick={() => handleMessageProvider(booking)}
                                                    variant="outline"
                                                    className="gap-1 border-neutral-300 hover:bg-neutral-50"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                    Message
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Booking ID */}
                                        <div className="text-xs text-neutral-400">
                                            ID: {booking.booking_id}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && bookings.length > 0 && (
                    <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
                        <div className="text-sm text-neutral-500">
                            Showing {offset + 1} to {Math.min(offset + bookings.length, pagination.total)} of {pagination.total} results
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setOffset(Math.max(0, offset - limit))}
                                disabled={offset === 0}
                                variant="outline"
                                className="gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                            <Button
                                onClick={() => setOffset(offset + limit)}
                                disabled={!pagination.has_more}
                                variant="outline"
                                className="gap-1"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedBookingForReview && (
                <ReviewModal
                    isOpen={reviewModalOpen}
                    onClose={() => {
                        setReviewModalOpen(false);
                        setSelectedBookingForReview(null);
                    }}
                    job={selectedBookingForReview}
                    onSubmit={handleSubmitReview}
                />
            )}
        </div>
    );
}
