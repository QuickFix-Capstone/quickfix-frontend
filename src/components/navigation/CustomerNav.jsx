import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import GhostButton from "../UI/GhostButton";
import UnreadBadge from "../messaging/UnreadBadge";
import { getConversations } from "../../api/messaging";
import {
  ShieldCheck,
  Briefcase,
  PlusCircle,
  Calendar,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  Receipt,
} from "lucide-react";

export default function CustomerNav({ currentUser, onGoLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [totalUnread, setTotalUnread] = useState(0);

  const isActive = (path) => location.pathname === path;

  // Fetch unread message count
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const data = await getConversations(50);
      const total = (data.conversations || []).reduce(
        (sum, conv) => sum + conv.unreadCount,
        0
      );
      setTotalUnread(total);
    } catch (error) {
      // Silently fail - user might not be authenticated yet
      console.error("Failed to fetch unread count:", error);
    }
  }

  const navBtn = (active) =>
    `
      flex items-center gap-2 rounded-lg px-3 py-2 text-sm
      transition-all duration-200
      ${active
      ? "bg-neutral-900 text-white shadow-sm"
      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
    }
    `;

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <div
          onClick={() => navigate("/customer/dashboard")}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-neutral-100"
        >
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <span className="text-lg font-bold tracking-tight">
            Quick<span className="text-indigo-600">Fix</span>
          </span>
        </div>

        <div className="flex-1" />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <GhostButton
            onClick={() => navigate("/customer/dashboard")}
            className={navBtn(isActive("/customer/dashboard"))}
          >
            <User className="h-4 w-4" />
            Dashboard
          </GhostButton>

          <GhostButton
            onClick={() => navigate("/customer/jobs")}
            className={navBtn(isActive("/customer/jobs"))}
          >
            <Briefcase className="h-4 w-4" />
            My Jobs
          </GhostButton>

          <GhostButton
            onClick={() => navigate("/customer/post-job")}
            className={navBtn(isActive("/customer/post-job"))}
          >
            <PlusCircle className="h-4 w-4" />
            Post Job
          </GhostButton>

          <GhostButton
            onClick={() => navigate("/customer/bookings")}
            className={navBtn(isActive("/customer/bookings"))}
          >
            <Calendar className="h-4 w-4" />
            Bookings
          </GhostButton>

          <GhostButton
            onClick={() => navigate("/customer/services")}
            className={navBtn(isActive("/customer/services"))}
          >
            <ShoppingBag className="h-4 w-4" />
            Services
          </GhostButton>

          <GhostButton
            onClick={() => navigate("/customer/messages")}
            className={navBtn(isActive("/customer/messages"))}
          >
            <MessageSquare className="h-4 w-4" />
            Messages
            {totalUnread > 0 && (
              <UnreadBadge count={totalUnread} />
            )}
          </GhostButton>

          <GhostButton
            onClick={() => navigate("/customer/payment-history")}
            className={navBtn(isActive("/customer/payment-history"))}
          >
            <Receipt className="h-4 w-4" />
            Payment History
          </GhostButton>

          {/* Divider */}
          <div className="mx-2 h-6 w-px bg-neutral-300" />

          {/* User + Logout */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {currentUser.name || currentUser.email}
              </span>

              <GhostButton
                onClick={onGoLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </GhostButton>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
