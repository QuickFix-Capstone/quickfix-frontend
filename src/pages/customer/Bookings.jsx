// src/pages/customer/Bookings.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, AlertCircle } from "lucide-react";

export default function Bookings() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const statusColors = {
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
        IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
        COMPLETED: "bg-green-100 text-green-800 border-green-200",
        CANCELLED: "bg-red-100 text-red-800 border-red-200",
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
    }, [auth.isAuthenticated, navigate]);

    const fetchBookings = async () => {
        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/booking",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                // Handle both array and object with bookings property
                const bookingsList = Array.isArray(data) ? data : (data.bookings || []);
                setBookings(bookingsList);
            } else {
                console.error("Failed to fetch bookings");
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
                    <h1 className="text-3xl font-bold text-neutral-900">My Bookings</h1>
                    <p className="mt-1 text-neutral-600">
                        View and manage your service bookings
                    </p>
                </div>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <Card className="border-neutral-200 bg-white p-12 text-center shadow-lg">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                        <p className="mb-2 text-lg font-medium text-neutral-700">
                            No bookings yet
                        </p>
                        <p className="mb-6 text-neutral-500">
                            Start by booking a service from our available offerings
                        </p>
                        <Button
                            onClick={() => navigate("/customer/services")}
                            className="bg-neutral-900 hover:bg-neutral-800"
                        >
                            Browse Services
                        </Button>
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
                                                    {booking.status}
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
                                                {booking.service_address}, {booking.service_city},{" "}
                                                {booking.service_state} {booking.service_postal_code}
                                            </span>
                                        </div>

                                        {/* Provider */}
                                        {booking.provider_name && (
                                            <div className="text-sm text-neutral-600">
                                                <span className="font-medium">Provider:</span>{" "}
                                                {booking.provider_name}
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
                                            {booking.status === "PENDING" && (
                                                <Button
                                                    onClick={() => handleCancelBooking(booking.booking_id)}
                                                    variant="outline"
                                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => navigate(`/customer/bookings/${booking.booking_id}`)}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                View Details
                                            </Button>
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
            </div>
        </div>
    );
}
