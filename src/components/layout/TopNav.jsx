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
} from "lucide-react";

export default function TopNav({ view, setView }) {
  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">

        {/* LEFT (LOGO) */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-lg font-bold">QuickFix</span>
        </div>

        <div className="flex-1"></div>

        {/* NAV BUTTONS */}
        <div className="hidden items-center gap-2 md:flex">

          <GhostButton
            onClick={() => setView("home")}
            className={view === "home" ? "bg-neutral-100" : ""}
          >
            <HomeIcon className="h-4 w-4" /> Home
          </GhostButton>

          <GhostButton
            onClick={() => setView("search")}
            className={view === "search" ? "bg-neutral-100" : ""}
          >
            <Search className="h-4 w-4" /> Search
          </GhostButton>

          <GhostButton
            onClick={() => setView("postJob")}
            className={view === "postJob" ? "bg-neutral-100" : ""}
          >
            <PlusCircle className="h-4 w-4" /> Post Job
          </GhostButton>

          <GhostButton
            onClick={() => setView("messages")}
            className={view === "messages" ? "bg-neutral-100" : ""}
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </GhostButton>

          <GhostButton
            onClick={() => setView("checkout")}
            className={view === "checkout" ? "bg-neutral-100" : ""}
          >
            <CreditCard className="h-4 w-4" /> Checkout
          </GhostButton>

          <GhostButton
            onClick={() => setView("provider")}
            className={view === "provider" ? "bg-neutral-100" : ""}
          >
            <Briefcase className="h-4 w-4" /> Provider
          </GhostButton>

          <GhostButton
            onClick={() => setView("admin")}
            className={view === "admin" ? "bg-neutral-100" : ""}
          >
            <Settings className="h-4 w-4" /> Admin
          </GhostButton>

          <div className="ml-2 h-8 w-px bg-neutral-200" />

          {/* PROFILE */}
          <GhostButton
            onClick={() => setView("profile")}
            className={view === "profile" ? "bg-neutral-100" : ""}
          >
            <User className="h-4 w-4" /> Profile
          </GhostButton>

        </div>
      </div>
    </div>
  );
}
