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

    // Modal states
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // Form states
    const [rescheduleData, setRescheduleData] = useState({
        scheduled_date: '',
        scheduled_time: '',
        notes: ''
    });
    const [addressData, setAddressData] = useState({
        service_address: '',
        service_city: '',
        service_state: '',
        service_postal_code: ''
    });

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        pending_confirmation: "bg-orange-100 text-orange-800 border-orange-200",
        confirmed: "bg-blue-100 text-blue-800 border-blue-200",
        pending_reschedule: "bg-amber-100 text-amber-800 border-amber-200",
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
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings/${bookingId}`,
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
                setBooking(data.booking); // Extract the booking object from the response
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
        if (!timeString) return 'N/A';
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
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings/${bookingId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "cancelled",
                        notes: "Booking cancelled by customer"
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

    const handleReschedule = async () => {
        if (!rescheduleData.scheduled_date || !rescheduleData.scheduled_time) {
            alert("Please select both date and time");
            return;
        }

        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings/${bookingId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        scheduled_date: rescheduleData.scheduled_date,
                        scheduled_time: rescheduleData.scheduled_time,
                        notes: rescheduleData.notes || "Rescheduled by customer"
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                setBooking(data.booking);
                setShowRescheduleModal(false);
                setRescheduleData({ scheduled_date: '', scheduled_time: '', notes: '' });
                alert("Booking rescheduled successfully");
            } else {
                alert(data.message || "Failed to reschedule booking");
            }
        } catch (err) {
            console.error("Error rescheduling booking:", err);
            alert("Error rescheduling booking");
        }
    };

    const handleUpdateAddress = async () => {
        if (!addressData.service_address || !addressData.service_city ||
            !addressData.service_state || !addressData.service_postal_code) {
            alert("Please fill in all address fields");
            return;
        }

        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings/${bookingId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...addressData,
                        notes: "Service address updated by customer"
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                setBooking(data.booking);
                setShowAddressModal(false);
                alert("Address updated successfully");
            } else {
                alert(data.message || "Failed to update address");
            }
        } catch (err) {
            console.error("Error updating address:", err);
            alert("Error updating address");
        }
    };

    const handleRequestMoreTime = async () => {
        if (!confirm("Request more time to decide on this booking?")) {
            return;
        }

        try {
            const token = auth.user?.id_token || auth.user?.access_token;
            const res = await fetch(
                `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/bookings/${bookingId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "pending_reschedule",
                        notes: "Customer needs more time to decide"
                    }),
                }
            );

            const data = await res.json();

            if (res.ok) {
                setBooking(data.booking);
                alert("Status updated - you can reschedule when ready");
            } else {
                alert(data.message || "Failed to update status");
            }
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Error updating status");
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
                                {booking.service?.description || booking.service_description}
                            </h1>
                            <p className="mt-1 text-neutral-600">
                                Booking ID: {booking.booking_id}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${categoryColors[booking.service?.category || booking.service_category] ||
                                    "bg-neutral-100 text-neutral-800"
                                    }`}
                            >
                                {(booking.service?.category || booking.service_category)?.replace("_", " ")}
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
                                            <p className="text-sm">{formatDate(booking.schedule?.date || booking.scheduled_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <Clock className="h-5 w-5" />
                                        <div>
                                            <p className="font-medium">Time</p>
                                            <p className="text-sm">{formatTime(booking.schedule?.time || booking.scheduled_time)}</p>
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
                                    {(booking.pricing?.estimated_price || booking.estimated_price)?.toFixed(2) || (booking.pricing?.final_price || booking.final_price)?.toFixed(2)}
                                </div>
                                {(booking.pricing?.estimated_price || booking.estimated_price) && !(booking.pricing?.final_price || booking.final_price) && (
                                    <span className="text-sm text-neutral-500">Estimated Price</span>
                                )}
                                {(booking.pricing?.final_price || booking.final_price) && (
                                    <span className="text-sm text-green-600">Final Price</span>
                                )}
                            </div>
                        </Card>


                        {/* Actions */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>
                            <div className="space-y-3">
                                {/* Cancel - Available for pending, pending_confirmation, confirmed, pending_reschedule */}
                                {["pending", "pending_confirmation", "confirmed", "pending_reschedule"].includes(booking.status) && (
                                    <Button
                                        onClick={handleCancelBooking}
                                        variant="outline"
                                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        Cancel Booking
                                    </Button>
                                )}

                                {/* Reschedule - Available for pending, pending_confirmation, confirmed, pending_reschedule */}
                                {["pending", "pending_confirmation", "confirmed", "pending_reschedule"].includes(booking.status) && (
                                    <Button
                                        onClick={() => {
                                            setRescheduleData({
                                                scheduled_date: booking.schedule?.date || booking.scheduled_date || '',
                                                scheduled_time: booking.schedule?.time || booking.scheduled_time || '',
                                                notes: ''
                                            });
                                            setShowRescheduleModal(true);
                                        }}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Reschedule Booking
                                    </Button>
                                )}

                                {/* Update Address - For pending, pending_confirmation, and pending_reschedule */}
                                {["pending", "pending_confirmation", "pending_reschedule"].includes(booking.status) && (
                                    <Button
                                        onClick={() => {
                                            setAddressData({
                                                service_address: booking.location?.address || booking.service_address || '',
                                                service_city: booking.location?.city || booking.service_city || '',
                                                service_state: booking.location?.state || booking.service_state || '',
                                                service_postal_code: booking.location?.postal_code || booking.service_postal_code || ''
                                            });
                                            setShowAddressModal(true);
                                        }}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Update Address
                                    </Button>
                                )}

                                {/* Request More Time - For pending or confirmed */}
                                {["pending", "confirmed"].includes(booking.status) && (
                                    <Button
                                        onClick={handleRequestMoreTime}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Clock className="h-4 w-4 mr-2" />
                                        Request More Time
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

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-semibold mb-4">Reschedule Booking</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Date
                                </label>
                                <input
                                    type="date"
                                    value={rescheduleData.scheduled_date}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, scheduled_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Time
                                </label>
                                <input
                                    type="time"
                                    value={rescheduleData.scheduled_time}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, scheduled_time: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={rescheduleData.notes}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Reason for rescheduling..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleReschedule}
                                    className="flex-1"
                                >
                                    Confirm Reschedule
                                </Button>
                                <Button
                                    onClick={() => setShowRescheduleModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Update Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md p-6 m-4">
                        <h3 className="text-xl font-semibold mb-4">Update Service Address</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    value={addressData.service_address}
                                    onChange={(e) => setAddressData({ ...addressData, service_address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="123 Main St"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={addressData.service_city}
                                    onChange={(e) => setAddressData({ ...addressData, service_city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Toronto"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        value={addressData.service_state}
                                        onChange={(e) => setAddressData({ ...addressData, service_state: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ON"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        value={addressData.service_postal_code}
                                        onChange={(e) => setAddressData({ ...addressData, service_postal_code: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="M5H 2N2"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleUpdateAddress}
                                    className="flex-1"
                                >
                                    Update Address
                                </Button>
                                <Button
                                    onClick={() => setShowAddressModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}