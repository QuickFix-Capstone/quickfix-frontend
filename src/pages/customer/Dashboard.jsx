// src/pages/customer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { User, LogOut, Plus, Calendar, Settings } from "lucide-react";

export default function CustomerDashboard() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            navigate("/customer/login");
            return;
        }

        const fetchProfile = async () => {
            try {
                const token = auth.user?.id_token || auth.user?.access_token;
                const res = await fetch(
                    "https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 200) {
                    const data = await res.json();
                    setProfile(data.customer);
                } else {
                    console.error("Failed to fetch profile");
                    navigate("/customer/register");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [auth.isAuthenticated, auth.user, navigate]);

    const handleLogout = async () => {
        // Clear the auth session locally and navigate to home
        await auth.removeUser();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-neutral-500">Loading your dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">
                            Welcome back, {profile?.first_name || "Customer"}! 👋
                        </h1>
                        <p className="mt-1 text-neutral-600">
                            Manage your service requests and bookings
                        </p>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>

                {/* Profile Card */}
                <Card className="mb-6 border-neutral-200 bg-white p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white">
                            <User className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-neutral-900">
                                {profile?.first_name} {profile?.last_name}
                            </h2>
                            <p className="text-sm text-neutral-600">{profile?.email}</p>
                            <p className="mt-2 text-sm text-neutral-500">
                                {profile?.address}, {profile?.city}, {profile?.state} {profile?.postal_code}
                            </p>
                            {profile?.phone && (
                                <p className="text-sm text-neutral-500">📞 {profile.phone}</p>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => navigate("/customer/settings")}
                        >
                            <Settings className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    </div>
                </Card>

                {/* Quick Actions */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <Card className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                            <Plus className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                            Book a Service
                        </h3>
                        <p className="mb-4 text-sm text-neutral-600">
                            Find and book trusted service providers
                        </p>
                        <Button
                            onClick={() => navigate("/customer/book")}
                            className="w-full bg-neutral-900 hover:bg-neutral-800"
                        >
                            Get Started
                        </Button>
                    </Card>

                    <Card className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                            My Bookings
                        </h3>
                        <p className="mb-4 text-sm text-neutral-600">
                            View your upcoming appointments
                        </p>
                        <Button
                            onClick={() => navigate("/customer/bookings")}
                            variant="outline"
                            className="w-full"
                        >
                            View All
                        </Button>
                    </Card>

                    <Card className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                            <User className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                            Account Settings
                        </h3>
                        <p className="mb-4 text-sm text-neutral-600">
                            Update your profile and preferences
                        </p>
                        <Button
                            onClick={() => navigate("/customer/settings")}
                            variant="outline"
                            className="w-full"
                        >
                            Manage
                        </Button>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="border-neutral-200 bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-xl font-semibold text-neutral-900">
                        Recent Activity
                    </h3>
                    <div className="text-center py-8 text-neutral-500">
                        <p>No recent activity yet.</p>
                        <p className="mt-2 text-sm">Book your first service to get started!</p>
                    </div>
                </Card>

                {/* Debug Info (remove in production) */}
                <Card className="mt-6 border-yellow-200 bg-yellow-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-yellow-900">
                        🔍 Debug Info (Development Only)
                    </h4>
                    <pre className="overflow-auto text-xs text-yellow-800">
                        {JSON.stringify(profile, null, 2)}
                    </pre>
                </Card>
            </div>
        </div>
    );
}
