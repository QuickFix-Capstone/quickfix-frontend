import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  HomeIcon,
  PlusCircle,
  User,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Menu,
  X,
  MessageCircle,
  Calendar,
  CalendarDays,
} from "lucide-react";
import GhostButton from "../UI/GhostButton";

export default function TopNav({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const displayName =
    currentUser?.businessName ||
    currentUser?.name ||
    currentUser?.email ||
    "User";

  const avatarLetter = displayName[0]?.toUpperCase();

  // eslint-disable-next-line no-unused-vars
  const NavItem = ({ icon: IconComponent, label, path }) => (
    <GhostButton
      onClick={() => {
        navigate(path);
        setMobileOpen(false);
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition
        ${
          isActive(path)
            ? "bg-neutral-100 font-semibold text-indigo-600"
            : "hover:bg-neutral-50"
        }`}
    >
      <IconComponent className="h-4 w-4" />
      {label}
    </GhostButton>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center px-4 py-3">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate("/service-provider/home")}
        >
          <ShieldCheck className="h-6 w-6 text-indigo-600" />
          <span className="text-lg font-bold tracking-tight">QuickFix</span>
        </div>

        <div className="flex-1" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem icon={HomeIcon} label="Home" path="/service-provider/home" />

          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            path="/service-provider/dashboard"
          />

          <NavItem
            icon={PlusCircle}
            label="Create Service"
            path="/service-provider/create-service-offering"
          />

          <NavItem
            icon={MessageCircle}
            label="Messages"
            path="/service-provider/messages"
          />

          <NavItem
            icon={Calendar}
            label="Bookings"
            path="/service-provider/bookings"
          />

          <NavItem
            icon={CalendarDays}
            label="Calendar"
            path="/service-provider/calendar"
          />

          <div className="mx-2 h-6 w-px bg-neutral-200" />

          {!currentUser ? (
            <GhostButton onClick={() => navigate("/login")}>
              <User className="h-4 w-4" />
              Login
            </GhostButton>
          ) : (
            <>
              {/* Profile Button */}
              <button
                onClick={() => navigate("/service-provider/profile")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 transition"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                  {avatarLetter}
                </div>

                {/* Business / Name */}
                <div className="flex items-center gap-1 max-w-[160px]">
                  <span className="font-medium truncate">{displayName}</span>

                  {currentUser.isVerified && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </div>
              </button>

              <GhostButton onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </GhostButton>
            </>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <div className="px-4 py-3 flex flex-col gap-1">
            <NavItem
              icon={HomeIcon}
              label="Home"
              path="/service-provider/home"
            />

            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              path="/service-provider/dashboard"
            />

            <NavItem
              icon={PlusCircle}
              label="Create Service"
              path="/service-provider/create-service-offering"
            />

            <NavItem
              icon={MessageCircle}
              label="Messages"
              path="/service-provider/messages"
            />

            <NavItem
              icon={Calendar}
              label="Bookings"
              path="/service-provider/bookings"
            />

            <NavItem
              icon={CalendarDays}
              label="Calendar"
              path="/service-provider/calendar"
            />

            <div className="my-2 h-px bg-neutral-200" />

            {!currentUser ? (
              <GhostButton
                onClick={() => {
                  navigate("/login");
                  setMobileOpen(false);
                }}
              >
                <User className="h-4 w-4" />
                Login
              </GhostButton>
            ) : (
              <>
                <GhostButton
                  onClick={() => navigate("/service-provider/profile")}
                >
                  <User className="h-4 w-4" />
                  Profile
                </GhostButton>

                <GhostButton
                  onClick={() => {
                    onLogout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </GhostButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
