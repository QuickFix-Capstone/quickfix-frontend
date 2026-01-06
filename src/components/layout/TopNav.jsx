import { useNavigate, useLocation } from "react-router-dom";
import GhostButton from "../UI/GhostButton";
import {
  ShieldCheck,
  HomeIcon,
  Search,
  PlusCircle,
  MessageSquare,
  CreditCard,
  Briefcase,
  Settings,
  User,
  LogOut,
} from "lucide-react";

export default function TopNav({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center gap-4 px-4 py-3">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-bold">QuickFix</span>
        </div>

        <div className="flex-1" />

        {/* NAV BUTTONS */}
        <div className="hidden md:flex items-center gap-2">
          {/* Home */}
          <GhostButton
            onClick={() => navigate("/")}
            className={isActive("/") ? "bg-neutral-100" : ""}
          >
            <HomeIcon className="h-4 w-4" /> Home
          </GhostButton>

          {/* Search */}
          <GhostButton
            onClick={() => navigate("/search")}
            className={isActive("/search") ? "bg-neutral-100" : ""}
          >
            <Search className="h-4 w-4" /> Search
          </GhostButton>

          {/* POST JOB → YOU WANTED THIS */}
          <GhostButton
            onClick={() => navigate("/service-provider/create-gig")}
            className={
              isActive("/service-provider/create-gig") ? "bg-neutral-100" : ""
            }
          >
            <PlusCircle className="h-4 w-4" /> Post Job
          </GhostButton>

          {/* PROVIDER → YOU WANTED THIS */}
          <GhostButton
            onClick={() => navigate("/service-provider/service-offerings/9")}
            className={
              location.pathname.startsWith(
                "/service-provider/service-offerings"
              )
                ? "bg-neutral-100"
                : ""
            }
          >
            <Briefcase className="h-4 w-4" /> Provider
          </GhostButton>

          {/* Messages */}
          <GhostButton
            onClick={() => navigate("/messages")}
            className={isActive("/messages") ? "bg-neutral-100" : ""}
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </GhostButton>

          {/* Checkout */}
          <GhostButton
            onClick={() => navigate("/checkout")}
            className={isActive("/checkout") ? "bg-neutral-100" : ""}
          >
            <CreditCard className="h-4 w-4" /> Checkout
          </GhostButton>

          {/* Admin */}
          <GhostButton
            onClick={() => navigate("/admin")}
            className={isActive("/admin") ? "bg-neutral-100" : ""}
          >
            <Settings className="h-4 w-4" /> Admin
          </GhostButton>

          <div className="ml-2 h-8 w-px bg-neutral-200" />

          {/* Login / Logout */}
          {!currentUser ? (
            <GhostButton onClick={() => navigate("/login")}>
              <User className="h-4 w-4" /> Login / Profile
            </GhostButton>
          ) : (
            <>
              <span className="text-xs text-neutral-600">
                {currentUser.role}:{" "}
                <strong>{currentUser.name || currentUser.email}</strong>
              </span>
              <GhostButton onClick={onLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </GhostButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
