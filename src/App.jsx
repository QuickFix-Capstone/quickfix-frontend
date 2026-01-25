import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";

// ================= LAYOUTS =================
import CustomerNav from "./components/navigation/CustomerNav";
import ServiceProviderNav from "./components/navigation/ServiceProviderTopNav";
import ServiceProviderLayout from "./components/layout/ServiceProviderLayout";
import TopNav from "./components/layout/TopNav";

// ================= VIEWS =================
import Home from "./views/Home";
import SearchView from "./views/SearchView";

// ================= CUSTOMER PAGES =================
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerDashboard from "./pages/customer/Dashboard";
import RegisterCustomer from "./pages/customer/RegisterCustomer";
import EditProfile from "./pages/customer/EditProfile";
import ServiceList from "./pages/customer/ServiceList";
import Bookings from "./pages/customer/Bookings";
import BookingForm from "./pages/customer/BookingForm";
import PostJob from "./pages/customer/PostJob";
import MyJobs from "./pages/customer/MyJobs";
import JobDetails from "./pages/customer/JobDetails";
import EditJob from "./pages/customer/EditJob";
import JobApplications from "./pages/customer/JobApplications";
import CustomerEntry from "./pages/customer/CustomerEntry";
import TestMessagingAPI from "./pages/customer/TestMessagingAPI"; // TEMPORARY TEST PAGE
import Messages from "./pages/customer/Messages";

// ================= PROVIDER PAGES =================
import ServiceProviderSignUp from "./pages/ServiceProvider/ServiceProviderSignUp";
import ServiceProviderLogin from "./pages/ServiceProvider/ServiceProviderLogin";
import ServiceProviderOnboarding from "./pages/ServiceProvider/ServiceProviderOnboarding";
import ServiceProviderDashboard from "./pages/ServiceProvider/ServiceProviderDashboard";
import CreateServiceOffering from "./pages/ServiceProvider/CreateServiceOffering";
import ServiceProviderHomePage from "./pages/ServiceProvider/ServiceProviderHomePage";
import JobDetailsPage from "./pages/ServiceProvider/JobDetailsPage";
import ServiceProviderProfile from "./pages/ServiceProvider/ServiceProviderProfile";
import ServiceProviderEntry from "./pages/ServiceProviderEntry";
import SPMessages from "./pages/ServiceProvider/SPMessages";
import SPBookings from "./pages/ServiceProvider/SPBookings";

// ================= AUTH PAGES =================
import Login from "./pages/Login";
import RegisterProvider from "./pages/RegisterProvider";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import Logout from "./pages/Logout";
import AuthCallback from "./pages/AuthCallback";

// ================= LOCAL AUTH =================
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
} from "./auth/localAuth";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [localUser, setLocalUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetInfo, setResetInfo] = useState("");

  // ================= LOAD LOCAL USER =================
  useEffect(() => {
    const user = getCurrentUser();
    if (user) setLocalUser(user);
  }, []);

  // ================= OIDC USER =================
  const oidcUser = auth.user
    ? {
        name: auth.user.profile.name || auth.user.profile.email,
        email: auth.user.profile.email,
        role: "customer",
      }
    : null;

  const currentUser = oidcUser || localUser;

  // ================= AUTH STATES =================
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

  // ================= HANDLERS =================
  const handleLogin = async (email, password, role) => {
    try {
      const user = await loginUser(email, password, role);
      setLocalUser(user);
      setLoginError("");

      navigate(
        role === "provider"
          ? "/service-provider/dashboard"
          : "/customer/dashboard",
      );
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleRegister = async (payload) => {
    try {
      const user = await registerUser(payload);
      setLocalUser(user);
      navigate(
        user.role === "provider"
          ? "/service-provider/onboarding"
          : "/customer/dashboard",
      );
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

  // ================= NAV SELECTION =================
  const isCustomerRoute = location.pathname.startsWith("/customer");
  const isProviderRoute = location.pathname.startsWith("/service-provider");

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* ================= NAV ================= */}
      {!isProviderRoute &&
        (isCustomerRoute ? (
          <CustomerNav currentUser={currentUser} onGoLogout={handleLogout} />
        ) : (
          <TopNav currentUser={currentUser} onLogout={handleLogout} />
        ))}

      {/* ================= ROUTES ================= */}
      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/" element={<Home currentUser={currentUser} />} />
        <Route path="/search" element={<SearchView />} />

        {/* ---------- AUTH ---------- */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} error={loginError} />}
        />
        <Route
          path="/logout"
          element={
            <Logout onConfirm={handleLogout} onCancel={() => navigate("/")} />
          }
        />
        <Route
          path="/reset-password"
          element={
            <ResetPassword
              onRequestReset={handleRequestReset}
              error={resetError}
              info={resetInfo}
            />
          }
        />
        <Route
          path="/reset-confirm"
          element={
            <ResetPasswordConfirm
              onResetPassword={handleConfirmReset}
              error={resetError}
            />
          }
        />

        {/* ---------- CUSTOMER ---------- */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route
          path="/customer/register"
          element={
            <RegisterCustomer
              onRegister={handleRegister}
              error={registerError}
            />
          }
        />
        <Route path="/customer/entry" element={<CustomerEntry />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/edit" element={<EditProfile />} />
        <Route path="/customer/services" element={<ServiceList />} />
        <Route path="/customer/bookings" element={<Bookings />} />
        <Route path="/customer/book" element={<BookingForm />} />
        <Route path="/customer/post-job" element={<PostJob />} />
        <Route path="/customer/jobs" element={<MyJobs />} />
        <Route path="/customer/jobs/:job_id" element={<JobDetails />} />
        <Route path="/customer/jobs/:job_id/edit" element={<EditJob />} />
        <Route
          path="/customer/jobs/:job_id/applications"
          element={<JobApplications />}
        />

        {/* Messages */}
        <Route path="/customer/messages" element={<Messages />} />

        {/* TEMPORARY TEST ROUTE - DELETE AFTER TESTING */}
        <Route path="/customer/test-messaging" element={<TestMessagingAPI />} />

        {/* ---------- PROVIDER AUTH ---------- */}
        <Route
          path="/service-provider/signup"
          element={<ServiceProviderSignUp />}
        />
        <Route
          path="/service-provider/login"
          element={<ServiceProviderLogin />}
        />
        <Route
          path="/service-provider/onboarding"
          element={<ServiceProviderOnboarding />}
        />

        {/* ---------- PROVIDER AREA (NESTED) ---------- */}
        <Route path="/service-provider" element={<ServiceProviderLayout />}>
          <Route path="home" element={<ServiceProviderHomePage />} />
          <Route path="dashboard" element={<ServiceProviderDashboard />} />
          <Route
            path="create-service-offering"
            element={<CreateServiceOffering />}
          />
          <Route path="job/:jobId" element={<JobDetailsPage />} />
          <Route path="profile" element={<ServiceProviderProfile />} />
          <Route path="messages" element={<SPMessages />} />
          <Route path="bookings" element={<SPBookings />} />
        </Route>
      </Routes>

      <footer className="text-center py-8 text-neutral-400">
        Built for QuickFix Capstone • React + Tailwind • AWS Powered
      </footer>
    </div>
  );
}
