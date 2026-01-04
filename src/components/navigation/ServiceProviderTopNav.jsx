import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, HomeIcon, PlusCircle, User, LogOut } from "lucide-react";
import GhostButton from "../UI/GhostButton";

export default function TopNav({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center px-4 py-3">
        {/* Logo → Home */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/service-provider/home")}
        >
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-bold">QuickFix</span>
        </div>

        <div className="flex-1" />

        {/* NAV */}
        <div className="hidden md:flex items-center gap-2">
          {/* Home */}
          <GhostButton
            onClick={() => navigate("/service-provider/home")}
            className={
              isActive("/service-provider/home") ? "bg-neutral-100" : ""
            }
          >
            <HomeIcon className="h-4 w-4" /> Home
          </GhostButton>

          {/* Create Service Offering */}
          <GhostButton
            onClick={() =>
              navigate("/service-provider/create-service-offering")
            }
            className={
              isActive("/service-provider/create-service-offering")
                ? "bg-neutral-100"
                : ""
            }
          >
            <PlusCircle className="h-4 w-4" />
            Create Service
          </GhostButton>

          <div className="ml-2 h-8 w-px bg-neutral-200" />

          {/* Profile + Logout */}
          {!currentUser ? (
            <GhostButton onClick={() => navigate("/login")}>
              <User className="h-4 w-4" /> Login
            </GhostButton>
          ) : (
            <>
              {/* Profile → Provider Dashboard */}
              <button
                onClick={() => navigate("/service-provider/dashboard")}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100"
              >
                <User className="h-4 w-4" />
                <span className="font-medium">
                  {currentUser.name || currentUser.email}
                </span>
              </button>

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
