// src/pages/customer/BookingForm.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useLocation } from "react-router-dom";
import { useLocation as useUserLocation } from "../../context/LocationContext";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { ArrowLeft, Calendar, Clock, MapPin, FileText, DollarSign, Camera, Upload } from "lucide-react";
import FileInput from "../../components/UI/FileInput";
import { uploadBookingImage } from "../../api/bookingImages";
import { API_BASE } from "../../api/config";

export default function BookingForm() {
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { location: userLocation, getLocation } = useUserLocation();
    const service = location.state?.service;

    // Get user location on mount
    useEffect(() => {
        if (!userLocation) {
            getLocation();
        }
    }, [userLocation, getLocation]);

    const [formData, setFormData] = useState({
        scheduled_date: "",
        scheduled_time: "",
        service_address: "",
        service_city: "",
        service_state: "",
        service_postal_code: "",
        estimated_price: "",
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    if (!service) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <Card className="border-neutral-200 bg-white p-8 text-center shadow-lg">
                    <p className="mb-4 text-neutral-700">No service selected</p>
                    <Button onClick={() => navigate("/customer/services")}>
                        Browse Services
                    </Button>
                </Card>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            const bookingData = {
                provider_id: service.provider_id,
                service_category: service.category,
                service_description: service.title,
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time,
                service_address: formData.service_address,
                service_city: formData.service_city,
                service_state: formData.service_state,
                service_postal_code: formData.service_postal_code || "RSH 139",
                estimated_price: parseFloat(formData.estimated_price),
                notes: formData.notes,
            };

            console.log("Submitting booking:", bookingData);

            const res = await fetch(
                `${API_BASE}/booking`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(bookingData),
                }
            );

            if (res.ok) {
                const data = await res.json();
                console.log("Booking created:", data);

                const bookingId = data.booking_id || data.id || data.booking?.booking_id;

                if (!bookingId) {
                    console.error("Server response missing booking_id:", data);
                    alert("Error: Server did not return a booking ID. Response: " + JSON.stringify(data));
                    return;
                }


                // If images were selected, upload them to the new booking
                if (selectedImages.length > 0) {
                    setUploadingImages(true);
                    await uploadImagesToBooking(bookingId);
                }

                // Navigate to bookings list page
                navigate('/customer/bookings');
            } else {
                const error = await res.text();
                console.error("Booking failed:", error);
                alert("Failed to create booking. Please try again.");
            }
        } catch (err) {
            console.error("Error creating booking:", err);
            alert("Error creating booking. Please try again.");
        } finally {
            setSubmitting(false);
            setUploadingImages(false);
        }
    };

    const uploadImagesToBooking = async (bookingId) => {
        console.log(`Uploading ${selectedImages.length} images to booking ${bookingId}`);

        try {
            for (let i = 0; i < selectedImages.length; i++) {
                const file = selectedImages[i];
                const options = {
                    order: i + 1,
                    description: `Issue photo ${i + 1}`,
                };

                await uploadBookingImage(bookingId, file, auth, options);
                console.log(`Uploaded image ${i + 1}/${selectedImages.length}`);
            }
            console.log("All images uploaded successfully");
        } catch (error) {
            console.error("Error uploading images:", error);
            // Don't fail the booking creation if image upload fails
            alert("Booking created, but some images failed to upload. You can add them later from the booking details page.");
        }
    };

    const handleImagesSelected = (files) => {
        setSelectedImages(files);
    };

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split("T")[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        onClick={() => navigate("/customer/services")}
                        variant="outline"
                        className="mb-4 gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Services
                    </Button>
                    <h1 className="text-3xl font-bold text-neutral-900">Book Service</h1>
                    <p className="mt-1 text-neutral-600">
                        Complete the form to book your service
                    </p>
                </div>

                {/* Service Summary */}
                <Card className="mb-6 border-neutral-200 bg-white p-6 shadow-lg">
                    <h2 className="mb-2 text-xl font-semibold text-neutral-900">
                        {service.title}
                    </h2>
                    <p className="mb-4 text-neutral-600">{service.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-800">
                            {service.category.replace("_", " ")}
                        </span>
                        <span className="text-lg font-bold text-neutral-900">
                            ${service.price.toFixed(2)}
                            {service.pricing_type === "HOURLY" ? "/hr" : ""}
                        </span>
                    </div>
                </Card>

                {/* Booking Form */}
                <Card className="border-neutral-200 bg-white p-6 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Date & Time */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                    <Calendar className="h-4 w-4" />
                                    Service Date *
                                </label>
                                <input
                                    type="date"
                                    name="scheduled_date"
                                    value={formData.scheduled_date}
                                    onChange={handleChange}
                                    min={minDate}
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                    <Clock className="h-4 w-4" />
                                    Service Time *
                                </label>
                                <input
                                    type="time"
                                    name="scheduled_time"
                                    value={formData.scheduled_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                        </div>

                        {/* Estimated Price */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <DollarSign className="h-4 w-4" />
                                Estimated Price *
                            </label>
                            <input
                                type="number"
                                name="estimated_price"
                                value={formData.estimated_price}
                                onChange={handleChange}
                                placeholder="Enter your estimated price"
                                min="0"
                                step="0.01"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                            <p className="mt-1 text-sm text-neutral-500">
                                Service provider's listed price: ${service.price.toFixed(2)}
                                {service.pricing_type === "HOURLY" ? "/hr" : ""}
                            </p>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <MapPin className="h-4 w-4" />
                                Service Address *
                            </label>
                            <input
                                type="text"
                                name="service_address"
                                value={formData.service_address}
                                onChange={handleChange}
                                placeholder="123 Main St"
                                required
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    name="service_city"
                                    value={formData.service_city}
                                    onChange={handleChange}
                                    placeholder="Toronto"
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    State/Province *
                                </label>
                                <input
                                    type="text"
                                    name="service_state"
                                    value={formData.service_state}
                                    onChange={handleChange}
                                    placeholder="ON"
                                    required
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Postal Code
                                </label>
                                <input
                                    type="text"
                                    name="service_postal_code"
                                    value={formData.service_postal_code}
                                    onChange={handleChange}
                                    placeholder="M5H 1J9"
                                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <FileText className="h-4 w-4" />
                                Additional Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any special instructions or requirements..."
                                rows={4}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                                <Camera className="h-4 w-4" />
                                Photos (Optional)
                            </label>
                            <p className="mb-3 text-sm text-neutral-500">
                                Upload photos to help the service provider understand the issue or requirements.
                                You can add up to 5 images (JPEG, PNG, WebP under 5MB each).
                            </p>
                            <FileInput
                                onFilesSelected={handleImagesSelected}
                                multiple={true}
                                disabled={submitting || uploadingImages}
                                existingCount={0}
                                maxFiles={5}
                                showPreview={true}
                                className="border-2 border-dashed border-neutral-300 rounded-lg"
                            />
                            {selectedImages.length > 0 && (
                                <p className="mt-2 text-sm text-green-600">
                                    {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected.
                                    {selectedImages.length === 1 ? ' It' : ' They'} will be uploaded after the booking is created.
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                onClick={() => navigate("/customer/services")}
                                variant="outline"
                                className="flex-1"
                                disabled={submitting || uploadingImages}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting || uploadingImages}
                                className="flex-1 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {uploadingImages ? (
                                    <div className="flex items-center gap-2">
                                        <Upload className="h-4 w-4 animate-pulse" />
                                        Uploading Images...
                                    </div>
                                ) : submitting ? (
                                    "Creating Booking..."
                                ) : (
                                    "Confirm Booking"
                                )}
                            </Button>
                        </div>

                        {/* Progress Info */}
                        {(submitting || uploadingImages) && (
                            <div className="text-center text-sm text-neutral-600">
                                {submitting && !uploadingImages && "Creating your booking..."}
                                {uploadingImages && `Uploading ${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''}...`}
                                <br />
                                <span className="text-xs text-neutral-500">Please don't close this page</span>
                            </div>
                        )}
                    </form>
                </Card>
            </div>
        </div>
    );
}
