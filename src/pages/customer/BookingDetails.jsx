import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, User, FileText, MessageSquare, Camera } from "lucide-react";
import { createConversation } from "../../api/messaging";
import BookingImagesSection from "../../components/booking/BookingImagesSection";

export default function BookingDetails() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

        if (!bookingId) {
            setError("No booking ID provided");
            setLoading(false);
            return;
        }

        fetchBookingDetails();
    }, [auth.isAuthenticated, navigate, bookingId]);

    const fetchBookingDetails = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/booking/${bookingId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Booking details:", data);
                setBooking(data);
            } else if (res.status === 404) {
                setError("Booking not found");
            } else if (res.status === 403) {
                setError("You don't have permission to view this booking");
            } else {
                setError("Failed to load booking details");
            }
        } catch (err) {
            console.error("Error fetching booking details:", err);
            setError("Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const handleCancelBooking = async () => {
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
                fetchBookingDetails(); // Refresh the booking
            } else {
                alert("Failed to cancel booking");
            }
        } catch (err) {
            console.error("Error cancelling booking:", err);
            alert("Error cancelling booking");
        }
    };

    const handleMessageProvider = async () => {
        if (!booking) return;
        
        try {
            await createConversation(
                booking.provider_id,
                booking.service_offering_id || booking.booking_id
            );
            navigate("/customer/messages");
        } catch (error) {
            if (error.status === 409) {
                navigate("/customer/messages");
            } else {
                console.error("Failed to create conversation:", error);
                alert("Failed to start conversation. Please try again.");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading booking details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
                <div className="mx-auto max-w-4xl">
                    <Button
                        onClick={() => navigate("/customer/bookings")}
                        variant="outline"
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bookings
                    </Button>
                    <Card className="border-red-200 bg-red-50 p-8 text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => navigate("/customer/bookings")} variant="outline">
                            Return to Bookings
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    if (!booking) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div>
                    <Button
                        onClick={() => navigate("/customer/bookings")}
                        variant="outline"
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bookings
                    </Button>
                    
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">
                                {booking.service_description}
                            </h1>
                            <p className="mt-1 text-neutral-600">
                                Booking ID: {booking.booking_id}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${categoryColors[booking.service_category] ||
                                    "bg-neutral-100 text-neutral-800"
                                    }`}
                            >
                                {booking.service_category?.replace("_", " ")}
                            </span>
                            <span
                                className={`rounded-full border px-3 py-1 text-sm font-medium ${statusColors[booking.status] ||
                                    "bg-neutral-100 text-neutral-800 border-neutral-200"
                                    }`}
                            >
                                {booking.status?.replace("_", " ").toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Booking Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Service Details */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
                            <div className="space-y-4">
                                {/* Date & Time */}
                                <div className="flex flex-wrap gap-6">
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <Calendar className="h-5 w-5" />
                                        <div>
                                            <p className="font-medium">Date</p>
                                            <p className="text-sm">{formatDate(booking.scheduled_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <Clock className="h-5 w-5" />
                                        <div>
                                            <p className="font-medium">Time</p>
                                            <p className="text-sm">{formatTime(booking.scheduled_time)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-2 text-neutral-600">
                                    <MapPin className="h-5 w-5 mt-1" />
                                    <div>
                                        <p className="font-medium">Service Location</p>
                                        <p className="text-sm">
                                            {booking.location?.address}<br />
                                            {booking.location?.city}, {booking.location?.state} {booking.location?.postal_code}
                                        </p>
                                    </div>
                                </div>

                                {/* Provider */}
                                {booking.provider?.name && (
                                    <div className="flex items-start gap-2 text-neutral-600">
                                        <User className="h-5 w-5 mt-1" />
                                        <div>
                                            <p className="font-medium">Service Provider</p>
                                            <p className="text-sm">{booking.provider.name}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {booking.notes && (
                                    <div className="flex items-start gap-2 text-neutral-600">
                                        <FileText className="h-5 w-5 mt-1" />
                                        <div>
                                            <p className="font-medium">Notes</p>
                                            <p className="text-sm">{booking.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Booking Images */}
                        <BookingImagesSection
                            bookingId={booking.booking_id}
                            title="Service Photos"
                            showUpload={true}
                            allowDelete={true}
                            allowEdit={false}
                            maxFiles={5}
                        />
                    </div>

                    {/* Right Column - Actions & Price */}
                    <div className="space-y-6">
                        {/* Price */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-neutral-900">
                                    <DollarSign className="h-6 w-6" />
                                    {booking.estimated_price?.toFixed(2) || booking.final_price?.toFixed(2)}
                                </div>
                                {booking.estimated_price && !booking.final_price && (
                                    <span className="text-sm text-neutral-500">Estimated Price</span>
                                )}
                                {booking.final_price && (
                                    <span className="text-sm text-green-600">Final Price</span>
                                )}
                            </div>
                        </Card>

                        {/* Actions */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>
                            <div className="space-y-3">
                                {booking.status === "pending" && (
                                    <Button
                                        onClick={handleCancelBooking}
                                        variant="outline"
                                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        Cancel Booking
                                    </Button>
                                )}
                                
                                <Button
                                    onClick={handleMessageProvider}
                                    className="w-full gap-2"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Message Provider
                                </Button>
                                
                                <Button
                                    onClick={() => navigate("/customer/bookings")}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Back to All Bookings
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}