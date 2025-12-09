// src/App.jsx
import React, { useState, useEffect } from "react";

import Home from "./views/Home";
import SearchView from "./views/SearchView";
import PostJobWizard from "./views/PostJobWizard";
import Messages from "./views/Messages";
import Checkout from "./views/Checkout";
import ProviderDashboard from "./views/ProviderDashboard";
import ProviderCreateGig from "./views/ProviderCreateGig";
import AdminConsole from "./views/AdminConsole";

import Login from "./pages/Login";
import RegisterCustomer from "./pages/RegisterCustomer";
import RegisterProvider from "./pages/RegisterProvider";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import Logout from "./pages/Logout";

import GhostButton from "./components/UI/GhostButton";
import Button from "./components/UI/Button";

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

import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  requestPasswordReset,
  getResetEmail,
  resetPassword,
} from "./auth/localAuth";

function TopNav({ view, setView, currentUser, onGoLogin, onGoLogout }) {
  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView("home")}>
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-bold">QuickFix</span>
        </div>
        <div className="flex-1" />
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

          {!currentUser ? (
            <GhostButton onClick={onGoLogin}>
              <User className="h-4 w-4" /> Login / Profile
            </GhostButton>
          ) : (
            <>
              <span className="text-xs text-neutral-600">
                {currentUser.role === "provider" ? "Provider" : "Customer"}:{" "}
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

export default function App() {
  const [view, setView] = useState("home");
  const [currentUser, setCurrentUserState] = useState(null);

  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [resetConfirmInfo, setResetConfirmInfo] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
    }
  }, []);

  const handleLogin = (email, password, role) => {
    try {
      const user = loginUser(email, password, role);
      setCurrentUserState(user);
      setLoginError("");
      setView(role === "provider" ? "provider" : "home");
    } catch (err) {
      setLoginError(err.message || "Login failed.");
    }
  };

  const handleRegister = (payload) => {
    try {
      const user = registerUser(payload);
      setCurrentUserState(user);
      setRegisterError("");
      setView(user.role === "provider" ? "provider" : "home");
    } catch (err) {
      setRegisterError(err.message || "Registration failed.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    setView("login");
  };

  const handleRequestReset = (email) => {
    setResetError("");
    setResetInfo("");
    const ok = requestPasswordReset(email);
    if (!ok) {
      setResetError("No account found with that email.");
      return;
    }
    setResetInfo(
      "If this email exists, a reset link was sent. For this demo, you can now set a new password."
    );
    setView("resetConfirm");
  };

  const handleConfirmReset = (newPassword) => {
    try {
      const updated = resetPassword(newPassword);
      setResetConfirmInfo("Password updated. You can now log in.");
      setResetError("");
      // Optionally log the user in automatically
      setCurrentUserState(updated);
      setView("login");
    } catch (err) {
      setResetError(err.message || "Could not reset password.");
    }
  };

  const renderView = () => {
    switch (view) {
      case "login":
        return (
          <Login
            onLogin={handleLogin}
            error={loginError}
            onGoRegisterCustomer={() => {
              setRegisterError("");
              setView("registerCustomer");
            }}
            onGoRegisterProvider={() => {
              setRegisterError("");
              setView("registerProvider");
            }}
            onGoResetPassword={() => {
              setResetError("");
              setResetInfo("");
              setView("resetPassword");
            }}
          />
        );
      case "registerCustomer":
        return (
          <RegisterCustomer
            onRegister={handleRegister}
            error={registerError}
            onBackToLogin={() => setView("login")}
          />
        );
      case "registerProvider":
        return (
          <RegisterProvider
            onRegister={handleRegister}
            error={registerError}
            onBackToLogin={() => setView("login")}
          />
        );
      case "resetPassword":
        return (
          <ResetPassword
            onRequestReset={handleRequestReset}
            info={resetInfo}
            error={resetError}
            onBack={() => setView("login")}
          />
        );
      case "resetConfirm":
        return (
          <ResetPasswordConfirm
            onResetPassword={handleConfirmReset}
            error={resetError}
            info={resetConfirmInfo}
            onBackToLogin={() => setView("login")}
          />
        );
      case "logout":
        return (
          <Logout
            onConfirm={handleLogout}
            onCancel={() => setView("home")}
          />
        );
      case "search":
        return <SearchView />;
      case "postJob":
        return <PostJobWizard />;
      case "messages":
        return <Messages />;
      case "checkout":
        return <Checkout />;
      case "provider":
        return (
          <div>
            <ProviderDashboard />
            <ProviderCreateGig />
          </div>
        );
      case "admin":
        return <AdminConsole />;
      case "home":
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <TopNav
        view={view}
        setView={setView}
        currentUser={currentUser}
        onGoLogin={() => setView("login")}
        onGoLogout={() => setView("logout")}
      />
      {renderView()}
      <footer className="mx-auto mt-10 max-w-7xl px-4 pb-16 text-center text-sm text-neutral-500">
        Built for QuickFix Capstone • Fiverr-style UX skeleton • React + Tailwind
      </footer>
    </div>
  );
}

