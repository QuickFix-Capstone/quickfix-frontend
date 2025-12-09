import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

// Layout
import TopNav from "./components/layout/TopNav";

// Views
import Home from "./views/Home";
import SearchView from "./views/SearchView";
import ProviderCreateGig from "./views/ProviderCreateGig";
import ProviderProfile from "./views/ProviderProfile";

// Pages
import Login from "./pages/Login";
import RegisterCustomer from "./pages/RegisterCustomer";
import RegisterProvider from "./pages/RegisterProvider";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import Logout from "./pages/Logout";
import CustomerEntry from "./pages/CustomerEntry";
import ServiceProviderEntry from "./pages/ServiceProviderEntry";

// Local Auth
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  requestPasswordReset,
  resetPassword
} from "./auth/localAuth";

export default function App() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [localUser, setLocalUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [resetConfirmInfo, setResetConfirmInfo] = useState("");

  // Load local auth user once
  useEffect(() => {
    const user = getCurrentUser();
    if (user) setLocalUser(user);
  }, []);

  const oidcUser = auth.user
    ? {
      name: auth.user.profile.name || auth.user.profile.email,
      email: auth.user.profile.email,
      role: "customer"
    }
    : null;

  const currentUser = oidcUser || localUser;

  // AUTH STATES
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading authentication...
      </div>
    );
  }

  if (auth.error) {
    return <div>Error: {auth.error.message}</div>;
  }

  // HANDLERS ----------
  const handleLogin = async (email, password, role) => {
    try {
      const user = await loginUser(email, password, role);
      setLocalUser(user);
      setLoginError("");
      navigate(role === "provider" ? "/provider/create-gig" : "/");
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleRegister = async (payload) => {
    try {
      const user = await registerUser(payload);
      setLocalUser(user);
      navigate(user.role === "provider" ? "/provider/create-gig" : "/");
    } catch (err) {
      setRegisterError(err.message);
    }
  };

  const handleLogout = async () => {
    if (auth.user) await auth.removeUser();
    await logoutUser();
    setLocalUser(null);
    navigate("/login");
  };

  const handleRequestReset = async (email) => {
    const ok = await requestPasswordReset(email);
    if (!ok) {
      setResetError("Email not found");
      return;
    }
    setResetInfo("Reset email sent. Continue below.");
    navigate("/reset-confirm");
  };

  const handleConfirmReset = async (newPassword) => {
    try {
      const updated = await resetPassword(newPassword);
      setLocalUser(updated);
      navigate("/login");
    } catch (err) {
      setResetError(err.message);
    }
  };

  // ROUTES ----------
  return (
    <div className="min-h-screen bg-neutral-100">
      <TopNav currentUser={currentUser} onLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchView />} />

        {/* Provider */}
        <Route path="/provider/create-gig" element={<ProviderCreateGig />} />
        <Route path="/provider/service-offerings/:providerId" element={<ProviderProfile />} />

        {/* Auth */}
        <Route path="/login" element={
          <Login onLogin={handleLogin} error={loginError} />
        } />

        <Route path="/customer/register" element={
          <RegisterCustomer onRegister={handleRegister} error={registerError} />
        } />

        <Route path="/provider/register" element={
          <RegisterProvider onRegister={handleRegister} error={registerError} />
        } />

        <Route path="/customer/entry" element={<CustomerEntry />} />
        <Route path="/provider/entry" element={<ServiceProviderEntry />} />

        <Route path="/reset-password" element={
          <ResetPassword
            onRequestReset={handleRequestReset}
            error={resetError}
            info={resetInfo}
          />
        } />

        <Route path="/reset-confirm" element={
          <ResetPasswordConfirm
            onResetPassword={handleConfirmReset}
            error={resetError}
            info={resetConfirmInfo}
          />
        } />

        <Route path="/logout" element={
          <Logout onConfirm={handleLogout} onCancel={() => navigate("/")} />
        } />
      </Routes>

      <footer className="text-center py-8 text-neutral-400">
        Built for QuickFix Capstone • Fiverr-style UI • React + Tailwind
      </footer>
    </div>
  );
}
