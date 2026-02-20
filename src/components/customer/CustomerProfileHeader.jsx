// src/components/customer/CustomerProfileHeader.jsx
import React from "react";
import { User, Calendar } from "lucide-react";

export default function CustomerProfileHeader({ profile, stats }) {
    const memberSince = profile?.created_at 
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unknown';

    const displayName = profile?.display_name || 
        (profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name.charAt(0)}.`
            : 'Customer');

    return (
        <div className="flex items-center gap-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                {profile?.avatar_url ? (
                    <img 
                        src={profile.avatar_url} 
                        alt={displayName}
                        className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <User className="h-12 w-12" />
                )}
            </div>
            
            <div className="flex-1">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                <div className="mt-2 flex items-center gap-2 text-blue-100">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Member since {memberSince}</span>
                </div>
                
                {stats?.avg_rating > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-2xl font-bold">{stats.avg_rating.toFixed(1)}</span>
                        <span className="text-sm text-blue-100">
                            ({stats.review_count} review{stats.review_count !== 1 ? 's' : ''})
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
