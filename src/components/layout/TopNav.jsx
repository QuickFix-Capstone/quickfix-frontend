import { useNavigate, useLocation } from "react-router-dom";
import GhostButton from "../UI/GhostButton";
import {
  ShieldCheck,
  HomeIcon,
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

        {/* Public nav */}
        <div className="hidden md:flex items-center gap-2">
          <GhostButton
            onClick={() => navigate("/")}
            className={isActive("/") ? "bg-neutral-100" : ""}
          >
            <HomeIcon className="h-4 w-4" /> Home
          </GhostButton>

          <div className="ml-2 h-8 w-px bg-neutral-200" />

          {/* Login / Logout */}
          {!currentUser ? (
            <GhostButton onClick={() => navigate("/login")}>
              <User className="h-4 w-4" /> Sign Up / Login
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
