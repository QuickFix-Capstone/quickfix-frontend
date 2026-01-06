import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GhostButton from "../UI/GhostButton";
import {
    ShieldCheck,
    Briefcase,
    PlusCircle,
    Calendar,
    ShoppingBag,
    MessageSquare,
    User,
    LogOut,
} from "lucide-react";

export default function CustomerNav({ currentUser, onGoLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/customer/dashboard")}>
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-lg font-bold">QuickFix</span>
                </div>

                <div className="flex-1" />

                {/* Customer Navigation Items */}
                <div className="hidden items-center gap-2 md:flex">
                    <GhostButton
                        onClick={() => navigate("/customer/dashboard")}
                        className={isActive("/customer/dashboard") ? "bg-neutral-100" : ""}
                    >
                        <User className="h-4 w-4" /> Dashboard
                    </GhostButton>

                    <GhostButton
                        onClick={() => navigate("/customer/jobs")}
                        className={isActive("/customer/jobs") ? "bg-neutral-100" : ""}
                    >
                        <Briefcase className="h-4 w-4" /> My Jobs
                    </GhostButton>

                    <GhostButton
                        onClick={() => navigate("/customer/post-job")}
                        className={isActive("/customer/post-job") ? "bg-neutral-100" : ""}
                    >
                        <PlusCircle className="h-4 w-4" /> Post Job
                    </GhostButton>

                    <GhostButton
                        onClick={() => navigate("/customer/bookings")}
                        className={isActive("/customer/bookings") ? "bg-neutral-100" : ""}
                    >
                        <Calendar className="h-4 w-4" /> My Bookings
                    </GhostButton>

                    <GhostButton
                        onClick={() => navigate("/customer/services")}
                        className={isActive("/customer/services") ? "bg-neutral-100" : ""}
                    >
                        <ShoppingBag className="h-4 w-4" /> Browse Services
                    </GhostButton>

                    <GhostButton
                        onClick={() => alert("Messages feature coming soon!")}
                        className=""
                    >
                        <MessageSquare className="h-4 w-4" /> Messages
                    </GhostButton>

                    <div className="ml-2 h-8 w-px bg-neutral-200" />

                    {/* User Info & Logout */}
                    {currentUser && (
                        <>
                            <span className="text-xs text-neutral-600">
                                <strong>{currentUser.name || currentUser.email}</strong>
                            </span>
                            <GhostButton onClick={onGoLogout}>
                                <LogOut className="h-4 w-4" /> Logout
                            </GhostButton>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
