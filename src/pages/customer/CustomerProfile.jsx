// src/pages/customer/CustomerProfile.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import CustomerProfileHeader from "../../components/customer/CustomerProfileHeader";
import CustomerProfileStats from "../../components/customer/CustomerProfileStats";
import ProviderReviewCard from "./ProviderReviewCard";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { getReviewsAboutMe } from "../../api/customerReviews";
import { Settings, ArrowLeft } from "lucide-react";

export default function CustomerProfile() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [badges, setBadges] = useState([]);
    const [reviewsAboutMe, setReviewsAboutMe] = useState([]);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate("/customer/login");
            return;
        }

        const fetchProfileData = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;
                
                // Fetch customer profile
                const profileRes = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer",
                    {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfile(profileData.customer);
                }

                // Fetch reviews about me
                const reviewsData = await getReviewsAboutMe({ 
                    sort: "newest", 
                    limit: 10, 
                    offset: 0 
                });
                setReviewsAboutMe(reviewsData.reviews || []);

                // Calculate basic stats from reviews
                if (reviewsData.reviews && reviewsData.reviews.length > 0) {
                    const avgRating = reviewsData.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsData.reviews.length;
                    setStats({
                        avg_rating: avgRating,
                        review_count: reviewsData.reviews.length,
                        jobs_posted_6mo: 0, // TODO: Fetch from backend
                        jobs_completed: 0,   // TODO: Fetch from backend
                        completion_rate: 0,  // TODO: Fetch from backend
                        jobs_cancelled: 0    // TODO: Fetch from backend
                    });

                    // Generate badges based on stats
                    const generatedBadges = [];
                    if (avgRating >= 4.5) {
                        generatedBadges.push({ type: 'highly_rated', label: 'Highly Rated' });
                    }
                    setBadges(generatedBadges);
                }

            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [auth.isAuthenticated, auth.user, navigate]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-neutral-500">Loading your profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="mx-auto max-w-7xl">
                {/* Back Button */}
                <Button
                    onClick={() => navigate("/customer/dashboard")}
                    variant="outline"
                    className="mb-6 gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Button>

                {/* Profile Header */}
                <div className="mb-8">
                    <CustomerProfileHeader profile={profile} stats={stats} />
                </div>

                {/* Settings Button */}
                <div className="mb-6 flex justify-end">
                    <Button
                        onClick={() => navigate("/customer/edit")}
                        variant="outline"
                        className="gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </div>

                {/* Stats Section */}
                <div className="mb-8">
                    <h2 className="mb-4 text-2xl font-bold text-neutral-900">
                        Activity Overview
                    </h2>
                    <CustomerProfileStats stats={stats} badges={badges} />
                </div>

                {/* Reviews About Me Section */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900">
                                Reviews About Me
                            </h2>
                            <p className="text-sm text-neutral-600">
                                Feedback from service providers
                            </p>
                        </div>
                        {reviewsAboutMe.length > 3 && (
                            <Button
                                onClick={() => navigate("/customer/reviews-about-me")}
                                variant="outline"
                                className="text-sm"
                            >
                                View All
                            </Button>
                        )}
                    </div>

                    {reviewsAboutMe.length === 0 ? (
                        <Card className="border border-neutral-200 bg-white p-8 text-center">
                            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                                No Provider Reviews Yet
                            </h3>
                            <p className="text-sm text-neutral-600">
                                Service providers haven't left feedback about you yet
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {reviewsAboutMe.slice(0, 6).map((review) => (
                                <ProviderReviewCard key={review.review_id} review={review} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
