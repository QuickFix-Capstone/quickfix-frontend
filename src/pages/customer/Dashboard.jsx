// src/pages/customer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import { User, LogOut, Plus, Calendar, Settings, Upload, Briefcase } from "lucide-react";

export default function CustomerDashboard() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

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

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];

        // Validate file
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size must be less than 5MB');
            return;
        }

        setAvatarFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return;

        setUploading(true);

        try {
            const token = auth.user?.id_token || auth.user?.access_token;

            // Step 1: Get presigned URL from backend
            const presignedRes = await fetch(
                'https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/prod/customer/upload_avatar',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        file_name: avatarFile.name,
                        content_type: avatarFile.type
                    })
                }
            );

            if (!presignedRes.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { upload_url, avatar_url, fields } = await presignedRes.json();

            console.log('Presigned response:', { upload_url, avatar_url, fields });

            // Step 2: Upload directly to S3 using presigned POST
            const formData = new FormData();

            // IMPORTANT: Add fields in the exact order they appear in the policy
            // The order matters for S3 presigned POST
            if (fields) {
                // Add Content-Type first if it exists
                if (fields['Content-Type']) {
                    formData.append('Content-Type', fields['Content-Type']);
                }

                // Add all other fields except Content-Type
                Object.keys(fields).forEach(key => {
                    if (key !== 'Content-Type') {
                        formData.append(key, fields[key]);
                    }
                });
            }

            // Add the file LAST - this is critical for S3 presigned POST
            formData.append('file', avatarFile);

            console.log('Uploading to S3...', upload_url);

            const uploadRes = await fetch(upload_url, {
                method: 'POST',
                body: formData
            });

            console.log('S3 upload response status:', uploadRes.status);

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                console.error('S3 upload error:', errorText);
                throw new Error(`Failed to upload to S3: ${uploadRes.status}`);
            }

            // Step 3: Update customer profile with avatar URL
            console.log('Updating profile with avatar URL:', avatar_url);

            const updateRes = await fetch(
                'https://kfvf20j7j9.execute-api.us-east-2.amazonaws.com/customer',
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...profile,
                        avatar_url: avatar_url
                    })
                }
            );

            console.log('Profile update response status:', updateRes.status);

            if (!updateRes.ok) {
                const errorText = await updateRes.text();
                console.error('Profile update error:', errorText);
                throw new Error(`Failed to update profile: ${updateRes.status}`);
            }

            const updatedData = await updateRes.json();
            console.log('Profile updated successfully:', updatedData);

            setProfile(updatedData.customer);

            // Clear preview
            setAvatarFile(null);
            setAvatarPreview(null);

            alert('Avatar updated successfully!');

        } catch (error) {
            console.error('Avatar upload error:', error);
            alert('Failed to upload avatar. Please try again.');
        } finally {
            setUploading(false);
        }
    };

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
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white overflow-hidden">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-8 w-8" />
                            )}
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

                            {/* Avatar Upload Section */}
                            <div className="mt-4 border-t border-neutral-200 pt-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Change Avatar
                                </label>

                                {avatarPreview && (
                                    <div className="mb-3">
                                        <img
                                            src={avatarPreview}
                                            alt="Preview"
                                            className="h-24 w-24 rounded-full object-cover border-2 border-neutral-300"
                                        />
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="block w-full text-sm text-neutral-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-neutral-900 file:text-white
                                        hover:file:bg-neutral-800 file:cursor-pointer"
                                />

                                {avatarFile && (
                                    <Button
                                        onClick={uploadAvatar}
                                        disabled={uploading}
                                        className="mt-3 gap-2 bg-neutral-900 hover:bg-neutral-800"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {uploading ? 'Uploading...' : 'Upload Avatar'}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => navigate("/customer/edit")}
                        >
                            <Settings className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    </div>
                </Card>

                {/* Quick Actions */}
                <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                            onClick={() => navigate("/customer/services")}
                            className="w-full bg-neutral-900 hover:bg-neutral-800"
                        >
                            Get Started
                        </Button>
                    </Card>

                    <Card className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                            <Plus className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                            Post a Job
                        </h3>
                        <p className="mb-4 text-sm text-neutral-600">
                            Let service providers apply to your job
                        </p>
                        <Button
                            onClick={() => navigate("/customer/post-job")}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                            Post Now
                        </Button>
                    </Card>

                    <Card className="border-neutral-200 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                            <Briefcase className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                            My Jobs
                        </h3>
                        <p className="mb-4 text-sm text-neutral-600">
                            View and manage your posted jobs
                        </p>
                        <Button
                            onClick={() => navigate("/customer/jobs")}
                            variant="outline"
                            className="w-full"
                        >
                            View Jobs
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
                            onClick={() => navigate("/customer/edit")}
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
