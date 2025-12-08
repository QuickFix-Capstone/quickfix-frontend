import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import TopNav from "./components/layout/TopNav.jsx";
import Home from "./views/Home.jsx";
import ProviderCreateGig from "./views/ProviderCreateGig.jsx";
import ProviderProfile from "./views/ProviderProfile.jsx";
import Login from "./pages/Login.jsx";
import RegisterCustomer from "./pages/RegisterCustomer.jsx";
import RegisterProvider from "./pages/RegisterProvider.jsx";
import Profile from "./pages/Profile.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm.jsx";

import { getCurrentUser, logoutUser } from "./auth/localAuth.js";

export default function App() {
  const [authUser, setAuthUser] = useState(getCurrentUser());
  const isLoggedIn = !!authUser;

  // Listen for logins across pages
  useEffect(() => {
    const stored = getCurrentUser();
    if (!authUser && stored) setAuthUser(stored);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setAuthUser(null);
  };

  return (
    <Router>
      <TopNav user={authUser} onLogout={handleLogout} />

      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home user={authUser} />} />
        <Route path="/login" element={<Login onLogin={(u) => setAuthUser(u)} />} />
        <Route path="/register" element={<RegisterCustomer />} />
        <Route path="/register/provider" element={<RegisterProvider />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/reset/confirm" element={<ResetPasswordConfirm />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={isLoggedIn ? <Profile user={authUser} /> : <Navigate to="/login" />}
        />

        <Route
          path="/provider/create-gig"
          element={isLoggedIn ? <ProviderCreateGig /> : <Navigate to="/login" />}
        />

        <Route
          path="/provider/service-offerings"
          element={isLoggedIn ? <ProviderProfile /> : <Navigate to="/login" />}
        />

        {/* Fallback */}
        <Route path="*" element={<div className="p-8 text-center">404 — Page Not Found</div>} />
      </Routes>
    </Router>
  );
}
