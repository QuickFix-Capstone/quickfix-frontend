import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../api/config";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  User,
  Check,
  X,
} from "lucide-react";
import { createConversation } from "../../api/messagingProvider";

export default function BookingDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending_confirmation: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    in_progress: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // =====================================================
  // FETCH BOOKING BY ID
  // =====================================================
  const fetchBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        navigate("/service-provider/login", { replace: true });
        return;
      }

      const res = await fetch(`${API_BASE}/service-provider/pending-booking`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load bookings");
      }

      const found = (data.bookings || []).find(
        (b) => String(b.booking_id) === String(bookingId),
      );

      if (!found) {
        throw new Error("Booking not found");
      }

      setBooking(found);
    } catch (err) {
      setError(err.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ACCEPT BOOKING
  // =====================================================
  const handleAcceptBooking = async () => {
    if (!window.confirm("Accept this booking?")) return;

    setActionLoading(true);
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      const res = await fetch(
        `${API_BASE}/bookings/${bookingId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to accept booking");
      }

      alert("Booking accepted!");
      navigate(`/service-provider/job/${data.job_id}`);
    } catch (err) {
      console.error("[ACCEPT BOOKING ERROR]", err);
      alert(err.message || "Error accepting booking");
    } finally {
      setActionLoading(false);
    }
  };

  // =====================================================
  // DECLINE BOOKING (simple cancel)
  // =====================================================
  const handleDeclineBooking = async () => {
    if (!window.confirm("Decline this booking?")) return;

    setActionLoading(true);
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      const res = await fetch(`${API_BASE}/booking/${bookingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to decline booking");
      }

      alert("Booking declined");
      navigate("/service-provider/bookings");
    } catch (err) {
      alert(err.message || "Error declining booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessageCustomer = async () => {
    if (!booking) return;
    await createConversation(booking.customer_id, booking.booking_id);
    navigate("/service-provider/messages");
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Not scheduled";

  const formatTime = (time) => {
    if (!time) return "TBD";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  // =====================================================
  // UI STATES
  // =====================================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/service-provider/bookings")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>

        <Card className="p-8 mt-6 text-center bg-red-50 border-red-200">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <p className="text-red-700">{error}</p>
          <Button className="mt-4" onClick={fetchBooking}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate("/service-provider/bookings")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Bookings
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{booking.service_description}</h1>
          <p className="text-neutral-500 mt-1">Booking #{booking.booking_id}</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-medium ${
            statusColors[booking.status]
          }`}
        >
          {booking.status.toUpperCase()}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-neutral-600">
                <User className="h-5 w-5" />
                <p className="font-medium">
                  {booking.first_name} {booking.last_name}
                </p>
              </div>

              {booking.customer_email && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Mail className="h-5 w-5" />
                  <p className="text-sm">{booking.customer_email}</p>
                </div>
              )}

              {booking.customer_phone && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Phone className="h-5 w-5" />
                  <p className="text-sm">{booking.customer_phone}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Service Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-neutral-600">
                <FileText className="h-5 w-5 mt-1" />
                <div>
                  <p className="font-medium">Description</p>
                  <p className="text-sm">{booking.service_description}</p>
                </div>
              </div>

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

              <div className="flex items-start gap-2 text-neutral-600">
                <MapPin className="h-5 w-5 mt-1" />
                <div>
                  <p className="font-medium">Service Location</p>
                  <p className="text-sm">
                    {booking.service_address}
                    <br />
                    {booking.service_city}, {booking.service_state}{" "}
                    {booking.service_postal_code}
                  </p>
                </div>
              </div>

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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pricing</h3>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-green-600">
                <DollarSign className="h-6 w-6" />
                {Number(booking.final_price ?? booking.estimated_price)?.toFixed(2) || "TBD"}
              </div>
              {booking.final_price ? (
                <span className="text-sm text-green-600">Final Price</span>
              ) : booking.estimated_price ? (
                <span className="text-sm text-neutral-500">Estimated Price</span>
              ) : null}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              {(booking.status === "pending" ||
                booking.status === "pending_confirmation") && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    disabled={actionLoading}
                    onClick={handleAcceptBooking}
                  >
                    <Check className="h-4 w-4" />
                    Accept Booking
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 gap-2"
                    disabled={actionLoading}
                    onClick={handleDeclineBooking}
                  >
                    <X className="h-4 w-4" />
                    Decline Booking
                  </Button>
                </>
              )}

              <Button
                className="w-full gap-2"
                onClick={handleMessageCustomer}
              >
                <MessageSquare className="h-4 w-4" />
                Message Customer
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/service-provider/bookings")}
              >
                Back to All Bookings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
