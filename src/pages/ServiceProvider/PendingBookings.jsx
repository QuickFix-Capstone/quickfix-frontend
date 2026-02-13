import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
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
  Filter,
} from "lucide-react";
import { createConversation } from "../../api/messagingProvider";

export default function PendingBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending_confirmation: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    in_progress: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-blue-100 text-blue-800 border-blue-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const filterOptions = [
    { value: "all", label: "All Bookings" },
    { value: "pending", label: "Pending" },
    { value: "pending_confirmation", label: "Pending Confirmation" },
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // =====================================================
  // Load bookings
  // =====================================================
  useEffect(() => {
    loadBookings();
  }, [refreshKey]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      if (!accessToken) {
        navigate("/service-provider/login", { replace: true });
        return;
      }

      const res = await fetch(`${API_BASE}/service-provider/pending-booking`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch bookings");
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // =====================================================
  // Message customer
  // =====================================================
  const handleMessageCustomer = async (booking) => {
    try {
      await createConversation(booking.customer_id, booking.booking_id);
    } finally {
      navigate("/service-provider/messages");
    }
  };

  // =====================================================
  // Helpers
  // =====================================================
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not scheduled";

  const formatTime = (time) => {
    if (!time) return "TBD";
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const filteredBookings =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

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
      <div className="p-6">
        <Card className="p-8 text-center bg-red-50 border-red-200">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <p className="text-red-700">{error}</p>
          <Button className="mt-4" onClick={silentRefresh}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/service-provider/dashboard")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bookings</h1>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card className="p-10 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
          <p className="text-neutral-600">No bookings found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <Card key={b.booking_id} className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-semibold">
                    {b.first_name} {b.last_name}
                  </h3>

                  <div className="flex flex-wrap gap-3 text-sm text-neutral-600">
                    {b.customer_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {b.customer_email}
                      </span>
                    )}
                    {b.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {b.customer_phone}
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                      statusColors[b.status] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {b.status.replace(/_/g, " ").toUpperCase()}
                  </span>

                  <p className="flex gap-2 text-sm">
                    <FileText className="h-4 w-4 mt-1 text-neutral-500" />
                    {b.service_description}
                  </p>

                  <div className="flex gap-4 text-sm text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(b.scheduled_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(b.scheduled_time)}
                    </span>
                  </div>

                  <div className="flex gap-2 text-sm text-neutral-600">
                    <MapPin className="h-4 w-4 mt-1" />
                    {b.service_address}, {b.service_city}, {b.service_state}{" "}
                    {b.service_postal_code}
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px]">
                  <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
                    <DollarSign className="h-5 w-5" />
                    {Number(b.final_price ?? b.estimated_price)?.toFixed(2) ||
                      "TBD"}
                  </div>

                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => navigate(`/service-provider/bookings/${b.booking_id}`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleMessageCustomer(b)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
