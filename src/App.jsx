
// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

import Home from "./views/Home";
import SearchView from "./views/SearchView";
import PostJobWizard from "./views/PostJobWizard";
import Messages from "./views/Messages";
import Checkout from "./views/Checkout";
import ProviderDashboard from "./views/ProviderDashboard";
import ProviderCreateGig from "./views/ProviderCreateGig";
import AdminConsole from "./views/AdminConsole";

import Login from "./pages/Login";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerDashboard from "./pages/customer/Dashboard";
import RegisterCustomer from "./pages/customer/RegisterCustomer";
import EditProfile from "./pages/customer/EditProfile";
import ServiceList from "./pages/customer/ServiceList";
import Bookings from "./pages/customer/Bookings";
import BookingForm from "./pages/customer/BookingForm";
import RegisterProvider from "./pages/RegisterProvider";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import Logout from "./pages/Logout";
import AuthCallback from "./pages/AuthCallback";

import GhostButton from "./components/UI/GhostButton";
import CustomerEntry from "./pages/customer/CustomerEntry";
import ServiceProviderEntry from "./pages/ServiceProviderEntry";
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

function TopNav({ currentUser, onGoLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg font-bold">QuickFix</span>
        </div>
        <div className="flex-1" />
        <div className="hidden items-center gap-2 md:flex">
          <GhostButton
            onClick={() => navigate("/")}
            className={isActive("/") ? "bg-neutral-100" : ""}
          >
            <HomeIcon className="h-4 w-4" /> Home
          </GhostButton>
          <GhostButton
            onClick={() => navigate("/search")}
            className={isActive("/search") ? "bg-neutral-100" : ""}
          >
            <Search className="h-4 w-4" /> Search
          </GhostButton>
          <GhostButton
            onClick={() => navigate("/post-job")}
            className={isActive("/post-job") ? "bg-neutral-100" : ""}
          >
            <PlusCircle className="h-4 w-4" /> Post Job
          </GhostButton>
          <GhostButton
            onClick={() => navigate("/messages")}
            className={isActive("/messages") ? "bg-neutral-100" : ""}
          >
            <MessageSquare className="h-4 w-4" /> Messages
          </GhostButton>
          <GhostButton
            onClick={() => navigate("/checkout")}
            className={isActive("/checkout") ? "bg-neutral-100" : ""}
          >
            <CreditCard className="h-4 w-4" /> Checkout
          </GhostButton>
          <GhostButton
            onClick={() => navigate("/provider")}
            className={isActive("/provider") ? "bg-neutral-100" : ""}
          >
            <Briefcase className="h-4 w-4" /> Provider
          </GhostButton>
          <GhostButton
            onClick={() => navigate("/admin")}
            className={isActive("/admin") ? "bg-neutral-100" : ""}
          >
            <Settings className="h-4 w-4" /> Admin
          </GhostButton>

          <div className="ml-2 h-8 w-px bg-neutral-200" />

          {!currentUser ? (
            <GhostButton onClick={() => navigate("/login")}>
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
  const navigate = useNavigate();
  const auth = useAuth();

  const [localUser, setLocalUser] = useState(null);

  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [resetConfirmInfo, setResetConfirmInfo] = useState("");

  // Sync local auth (legacy)
  useEffect(() => {
    const user = getCurrentUser();
    console.log("App mounted. Local user:", user);
    if (user) {
      setLocalUser(user);
    }
  }, []);

  // Combine OIDC user and Local user
  console.log("Auth state:", { isLoading: auth.isLoading, user: auth.user, error: auth.error });

  // OIDC user structure is different, we map it to match existing app expectations
  const oidcUser = auth.user ? {
    name: auth.user.profile.name || auth.user.profile.email,
    email: auth.user.profile.email,
    role: "customer", // Assume customer for Cognito users for now
  } : null;

  const currentUser = oidcUser || localUser;

  if (auth.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-black"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return <div>Auth Error: {auth.error.message}</div>;
  }

  const handleLogin = async (email, password, role) => {
    try {
      const user = await loginUser(email, password, role);
      setLocalUser(user);
      setLoginError("");
      navigate(role === "provider" ? "/provider" : "/");
    } catch (err) {
      setLoginError(err.message || "Login failed.");
      throw err;
    }
  };

  const handleRegister = async (payload) => {
    try {
      const user = await registerUser(payload);
      setLocalUser(user);
      setRegisterError("");
      navigate(user.role === "provider" ? "/provider" : "/");
    } catch (err) {
      setRegisterError(err.message || "Registration failed.");
      throw err;
    }
  };

  const handleLogout = async () => {
    if (auth.user) {
      await auth.removeUser();
    }
    await logoutUser();
    setLocalUser(null);
    navigate("/login");
  };

  const handleRequestReset = async (email) => {
    setResetError("");
    setResetInfo("");
    const ok = await requestPasswordReset(email);
    if (!ok) {
      setResetError("No account found with that email.");
      return;
    }
    setResetInfo(
      "If this email exists, a reset link was sent. For this demo, you can now set a new password."
    );
    navigate("/reset-confirm");
  };

  const handleConfirmReset = async (newPassword) => {
    try {
      const updated = await resetPassword(newPassword);
      setResetConfirmInfo("Password updated. You can now log in.");
      setResetError("");
      setLocalUser(updated);
      navigate("/login");
    } catch (err) {
      setResetError(err.message || "Could not reset password.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <TopNav
        currentUser={currentUser}
        onGoLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchView />} />
        <Route path="/post-job" element={<PostJobWizard />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/provider" element={
          <div>
            <ProviderDashboard />
            <ProviderCreateGig />
          </div>
        } />
        <Route path="/admin" element={<AdminConsole />} />

        {/* Auth Routes */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={
          <Login
            onLogin={handleLogin}
            error={loginError}
            // Passing these just in case, though Login uses navigate() now
            onGoRegisterCustomer={() => navigate("/customer/login")}
            onGoRegisterProvider={() => navigate("/provider/login")}
            onGoResetPassword={() => navigate("/reset-password")}
          />
        } />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/edit" element={<EditProfile />} />
        <Route path="/customer/services" element={<ServiceList />} />
        <Route path="/customer/bookings" element={<Bookings />} />
        <Route path="/customer/book" element={<BookingForm />} />

        <Route path="/customer/entry" element={<CustomerEntry />} />
        <Route path="/customer/register" element={
          <RegisterCustomer
            onRegister={handleRegister}
            error={registerError}
            onBackToLogin={() => navigate("/login")}
          />
        } />
        <Route path="/provider/entry" element={<ServiceProviderEntry />} />
        <Route path="/provider/register" element={
          <RegisterProvider
            onRegister={handleRegister}
            error={registerError}
            onBackToLogin={() => navigate("/login")}
          />
        } />
        <Route path="/provider/login" element={
          <RegisterProvider
            onRegister={handleRegister}
            error={registerError}
            onBackToLogin={() => navigate("/login")}
          />
        } />
        <Route path="/reset-password" element={
          <ResetPassword
            onRequestReset={handleRequestReset}
            info={resetInfo}
            error={resetError}
            onBack={() => navigate("/login")}
          />
        } />
        <Route path="/reset-confirm" element={
          <ResetPasswordConfirm
            onResetPassword={handleConfirmReset}
            error={resetError}
            info={resetConfirmInfo}
            onBackToLogin={() => navigate("/login")}
          />
        } />
        <Route path="/logout" element={
          <Logout
            onConfirm={handleLogout}
            onCancel={() => navigate("/")}
          />
        } />
      </Routes>
      <footer className="mx-auto mt-10 max-w-7xl px-4 pb-16 text-center text-sm text-neutral-500">
        Built for QuickFix Capstone • Fiverr-style UX skeleton • React + Tailwind
      </footer>
    </div>
  );
}

