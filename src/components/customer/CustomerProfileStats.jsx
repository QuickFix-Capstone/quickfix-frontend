// src/components/customer/CustomerProfileStats.jsx
import React from "react";
import Card from "../UI/Card";
import { TrendingUp, Briefcase, CheckCircle, XCircle, Award } from "lucide-react";

export default function CustomerProfileStats({ stats, badges = [] }) {
    if (!stats) {
        return (
            <Card className="p-6">
                <p className="text-neutral-600">No statistics available yet</p>
            </Card>
        );
    }

    const statItems = [
        {
            label: "Jobs Posted (6mo)",
            value: stats.jobs_posted_6mo || 0,
            icon: Briefcase,
            color: "blue"
        },
        {
            label: "Completed",
            value: stats.jobs_completed || 0,
            icon: CheckCircle,
            color: "green"
        },
        {
            label: "Completion Rate",
            value: stats.completion_rate === null || stats.completion_rate === undefined
                ? "N/A"
                : `${stats.completion_rate.toFixed(1)}%`,
            icon: TrendingUp,
            color: "purple"
        },
        {
            label: "Cancelled",
            value: stats.jobs_cancelled || 0,
            icon: XCircle,
            color: "red"
        }
    ];

    const colorClasses = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        red: "bg-red-100 text-red-600"
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.label} className="border-0 bg-white p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[item.color]}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-600">{item.label}</p>
                                    <p className="text-2xl font-bold text-neutral-900">{item.value}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
                <Card className="border-0 bg-white p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <h3 className="text-lg font-bold text-neutral-900">Badges</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {badges.map((badge) => (
                            <span
                                key={badge.type}
                                className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800"
                            >
                                {badge.label}
                            </span>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
