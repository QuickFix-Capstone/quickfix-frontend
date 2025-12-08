import { Link, useLocation, useNavigate } from "react-router-dom";
import GhostButton from "../UI/GhostButton";
import {
  HomeIcon,
  Search,
  PlusCircle,
  MessageSquare,
  CreditCard,
  Briefcase,
  Settings,
  User,
  LogOut
} from "lucide-react";

export default function TopNav({ user, onLogout }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    pathname === path ? "bg-neutral-100" : "";

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        
        {/* LOGO */}
        <Link to="/" className="text-lg font-bold select-none">
          QuickFix
        </Link>

        <div className="flex-1"></div>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-2">

          <Link to="/">
            <GhostButton className={isActive("/")}>
              <HomeIcon className="h-4 w-4" /> Home
            </GhostButton>
          </Link>

          <Link to="/search">
            <GhostButton className={isActive("/search")}>
              <Search className="h-4 w-4" /> Search
            </GhostButton>
          </Link>

          <Link to="/provider/create-gig">
            <GhostButton className={isActive("/provider/create-gig")}>
              <PlusCircle className="h-4 w-4" /> Offer Service
            </GhostButton>
          </Link>

          <Link to="/messages">
            <GhostButton className={isActive("/messages")}>
              <MessageSquare className="h-4 w-4" /> Messages
            </GhostButton>
          </Link>

          <Link to="/checkout">
            <GhostButton className={isActive("/checkout")}>
              <CreditCard className="h-4 w-4" /> Checkout
            </GhostButton>
          </Link>

          <Link to="/provider/dashboard">
            <GhostButton className={isActive("/provider/dashboard")}>
              <Briefcase className="h-4 w-4" /> Provider
            </GhostButton>
          </Link>

          <Link to="/admin">
            <GhostButton className={isActive("/admin")}>
              <Settings className="h-4 w-4" /> Admin
            </GhostButton>
          </Link>

          <div className="ml-2 h-8 w-px bg-neutral-200" />

          {/* 🔥 Auth Buttons */}
          {user ? (
            <>
              <Link to="/profile">
                <GhostButton className={isActive("/profile")}>
                  <User className="h-4 w-4" /> {user.name}
                </GhostButton>
              </Link>

              <GhostButton onClick={handleLogoutClick}>
                <LogOut className="h-4 w-4" /> Logout
              </GhostButton>
            </>
          ) : (
            <Link to="/login">
              <GhostButton className={isActive("/login")}>
                <User className="h-4 w-4" /> Login / Profile
              </GhostButton>
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
