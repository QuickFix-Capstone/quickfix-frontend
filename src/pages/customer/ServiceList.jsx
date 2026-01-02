// src/pages/customer/ServiceList.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { Search, Star, ArrowLeft, Filter } from "lucide-react";

export default function ServiceList() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");

    const categories = [
        { value: "ALL", label: "All Services" },
        { value: "PLUMBING", label: "Plumbing" },
        { value: "ELECTRICAL", label: "Electrical" },
        { value: "HVAC", label: "HVAC" },
        { value: "CLEANING", label: "Cleaning" },
        { value: "HANDYMAN", label: "Handyman" },
        { value: "PEST_CONTROL", label: "Pest Control" },
    ];

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

        fetchServices();
    }, [auth.isAuthenticated, navigate]);

    useEffect(() => {
        filterServices();
    }, [services, searchQuery, selectedCategory]);

    const fetchServices = async () => {
        try {
            const res = await fetch(
                "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/get_all_service_offering"
            );

            if (res.ok) {
                const data = await res.json();
                setServices(data.items || []);
            } else {
                console.error("Failed to fetch services");
            }
        } catch (err) {
            console.error("Error fetching services:", err);
        } finally {
            setLoading(false);
        }
    };

    const filterServices = () => {
        let filtered = services;

        // Filter by category
        if (selectedCategory !== "ALL") {
            filtered = filtered.filter(
                (service) => service.category === selectedCategory
            );
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(
                (service) =>
                    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    service.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredServices(filtered);
    };

    const formatPrice = (price, pricingType) => {
        return `$${price.toFixed(2)} ${pricingType === "HOURLY" ? "/hr" : ""}`;
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-neutral-700">{rating.toFixed(1)}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
                <div className="text-neutral-500">Loading services...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-7xl">
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
                    <h1 className="text-3xl font-bold text-neutral-900">
                        Available Services
                    </h1>
                    <p className="mt-1 text-neutral-600">
                        Browse and book professional services
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 bg-white py-3 pl-10 pr-4 text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="h-5 w-5 text-neutral-500" />
                        {categories.map((category) => (
                            <button
                                key={category.value}
                                onClick={() => setSelectedCategory(category.value)}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedCategory === category.value
                                        ? "bg-neutral-900 text-white"
                                        : "bg-white text-neutral-700 hover:bg-neutral-100"
                                    }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-neutral-600">
                    Showing {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""}
                </div>

                {/* Services Grid */}
                {filteredServices.length === 0 ? (
                    <Card className="border-neutral-200 bg-white p-12 text-center shadow-lg">
                        <p className="text-neutral-500">No services found matching your criteria.</p>
                        <Button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("ALL");
                            }}
                            className="mt-4"
                        >
                            Clear Filters
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredServices.map((service) => (
                            <Card
                                key={service.service_offering_id}
                                className="border-neutral-200 bg-white shadow-lg transition-shadow hover:shadow-xl"
                            >
                                {/* Service Image */}
                                <div className="h-48 w-full overflow-hidden rounded-t-lg bg-neutral-200">
                                    {service.main_image_url ? (
                                        <img
                                            src={service.main_image_url}
                                            alt={service.title}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-neutral-400">
                                            No image
                                        </div>
                                    )}
                                </div>

                                {/* Service Details */}
                                <div className="p-4">
                                    <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                                        {service.title}
                                    </h3>

                                    <div className="mb-3 flex items-center justify-between">
                                        {renderStars(service.rating)}
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${categoryColors[service.category] ||
                                                "bg-neutral-100 text-neutral-800"
                                                }`}
                                        >
                                            {service.category.replace("_", " ")}
                                        </span>
                                    </div>

                                    <p className="mb-4 line-clamp-2 text-sm text-neutral-600">
                                        {service.description}
                                    </p>

                                    <div className="mb-4 text-xl font-bold text-neutral-900">
                                        {formatPrice(service.price, service.pricing_type)}
                                    </div>

                                    <Button
                                        onClick={() => {
                                            // TODO: Implement booking flow
                                            alert(`Booking ${service.title} - Coming soon!`);
                                        }}
                                        className="w-full bg-neutral-900 hover:bg-neutral-800"
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
