# Booking Update API - Frontend Integration Guide

## Current Implementation Status

### ✅ Already Implemented
- API endpoint updated to `/customer/bookings/{booking_id}`
- Response parsing handles nested `data.booking` structure
- Field access updated for nested objects (`service`, `schedule`, `pricing`, `location`)
- Fallback handling for both old and new response formats

### ⚠️ Needs Fixing

#### 1. Cancel Booking - Status Value Case
**Current Code** (Bookings.jsx, line ~120):
```javascript
body: JSON.stringify({
    status: "CANCELLED",  // ❌ Wrong - uppercase
}),
```

**Should Be**:
```javascript
body: JSON.stringify({
    status: "cancelled",  // ✅ Correct - lowercase
    notes: "Booking cancelled by customer"
}),
```

#### 2. Missing Status in Status Colors
**Current Code** (BookingDetails.jsx):
```javascript
const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    in_progress: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    // ❌ Missing: pending_confirmation, pending_reschedule
};
```

**Should Add**:
```javascript
const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    pending_confirmation: "bg-orange-100 text-orange-800 border-orange-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    pending_reschedule: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
};
```

---

## New Features to Implement

### Feature 1: Reschedule Booking

**When to Show**: 
- Status is `pending`, `confirmed`, or `pending_reschedule`
- Booking is not `in_progress`, `completed`, or `cancelled`

**UI Component**:
```javascript
const [showRescheduleModal, setShowRescheduleModal] = useState(false);
const [rescheduleData, setRescheduleData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
});

const handleReschedule = async () => {
    try {
        const token = auth.user?.id_token || auth.user?.access_token;
        const res = await fetch(
            `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer/bookings/${bookingId}`,
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

        if (res.ok) {
            const data = await res.json();
            setBooking(data.booking);
            setShowRescheduleModal(false);
            alert("Booking rescheduled successfully");
        } else {
            const error = await res.json();
            alert(error.message || "Failed to reschedule booking");
        }
    } catch (err) {
        console.error("Error rescheduling booking:", err);
        alert("Error rescheduling booking");
    }
};
```

**Add to Actions Card**:
```javascript
{(booking.status === "pending" || 
  booking.status === "confirmed" || 
  booking.status === "pending_reschedule") && (
    <Button
        onClick={() => setShowRescheduleModal(true)}
        variant="outline"
        className="w-full"
    >
        Reschedule Booking
    </Button>
)}
```

---

### Feature 2: Update Service Address

**When to Show**: 
- Status is `pending` only (per API restrictions)

**UI Component**:
```javascript
const [showAddressModal, setShowAddressModal] = useState(false);
const [addressData, setAddressData] = useState({
    service_address: booking.location?.address || '',
    service_city: booking.location?.city || '',
    service_state: booking.location?.state || '',
    service_postal_code: booking.location?.postal_code || ''
});

const handleUpdateAddress = async () => {
    try {
        const token = auth.user?.id_token || auth.user?.access_token;
        const res = await fetch(
            `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer/bookings/${bookingId}`,
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

        if (res.ok) {
            const data = await res.json();
            setBooking(data.booking);
            setShowAddressModal(false);
            alert("Address updated successfully");
        } else {
            const error = await res.json();
            alert(error.message || "Failed to update address");
        }
    } catch (err) {
        console.error("Error updating address:", err);
        alert("Error updating address");
    }
};
```

**Add to Actions Card**:
```javascript
{booking.status === "pending" && (
    <Button
        onClick={() => setShowAddressModal(true)}
        variant="outline"
        className="w-full"
    >
        Update Address
    </Button>
)}
```

---

### Feature 3: Request More Time (Pending Reschedule)

**When to Show**: 
- Status is `pending` or `confirmed`

**UI Component**:
```javascript
const handleRequestMoreTime = async () => {
    if (!confirm("Request more time to decide on this booking?")) {
        return;
    }

    try {
        const token = auth.user?.id_token || auth.user?.access_token;
        const res = await fetch(
            `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer/bookings/${bookingId}`,
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

        if (res.ok) {
            const data = await res.json();
            setBooking(data.booking);
            alert("Status updated - you can reschedule when ready");
        } else {
            const error = await res.json();
            alert(error.message || "Failed to update status");
        }
    } catch (err) {
        console.error("Error updating status:", err);
        alert("Error updating status");
    }
};
```

---

## Recommended Action Buttons by Status

| Status | Available Actions |
|--------|------------------|
| `pending` | ✅ Cancel, ✅ Reschedule, ✅ Update Address, ✅ Request More Time |
| `pending_confirmation` | ✅ Cancel (with notes only) |
| `confirmed` | ✅ Cancel, ✅ Reschedule, ✅ Request More Time |
| `pending_reschedule` | ✅ Cancel, ✅ Reschedule |
| `in_progress` | ❌ No actions (read-only) |
| `completed` | ❌ No actions (read-only) |
| `cancelled` | ❌ No actions (read-only) |

---

## Error Handling Best Practices

```javascript
const updateBooking = async (bookingId, updates) => {
    try {
        const token = auth.user?.id_token || auth.user?.access_token;
        const res = await fetch(
            `https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer/bookings/${bookingId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            }
        );

        const data = await res.json();

        if (!res.ok) {
            // Handle specific error cases
            if (res.status === 400) {
                throw new Error(data.message || "Invalid update request");
            } else if (res.status === 403) {
                throw new Error("You don't have permission to update this booking");
            } else if (res.status === 404) {
                throw new Error("Booking not found");
            } else {
                throw new Error("Failed to update booking");
            }
        }

        return data.booking;
    } catch (err) {
        console.error("Error updating booking:", err);
        throw err;
    }
};
```

---

## Complete Example: BookingDetails Actions Section

```javascript
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
        
        {/* Reschedule - Available for pending, confirmed, pending_reschedule */}
        {["pending", "confirmed", "pending_reschedule"].includes(booking.status) && (
            <Button
                onClick={() => setShowRescheduleModal(true)}
                variant="outline"
                className="w-full"
            >
                Reschedule Booking
            </Button>
        )}
        
        {/* Update Address - Only for pending */}
        {booking.status === "pending" && (
            <Button
                onClick={() => setShowAddressModal(true)}
                variant="outline"
                className="w-full"
            >
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
                Request More Time
            </Button>
        )}
        
        {/* Message Provider - Always available */}
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
```

---

## Testing Checklist

- [ ] Cancel booking with lowercase "cancelled" status
- [ ] Reschedule booking updates date/time correctly
- [ ] Address update works for pending bookings
- [ ] Request more time changes status to pending_reschedule
- [ ] Error messages display properly for invalid updates
- [ ] Status badges show correct colors for all statuses
- [ ] Actions are hidden/shown based on current status
- [ ] Response data updates booking state correctly
- [ ] Fallback handling works for both old/new response formats
