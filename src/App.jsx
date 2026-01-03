import { BrowserRouter, Routes, Route } from "react-router-dom";

import ServiceProviderSignUp from "./pages/ServiceProvider/ServiceProviderSignUp";
import ServiceProviderLogin from "./pages/ServiceProvider/ServiceProviderLogin";
import ServiceProviderOnboarding from "./pages/ServiceProvider/ServiceProviderOnboarding";
import ServiceProviderDashboard from "./pages/ServiceProvider/ServiceProviderDashboard";
import AuthRedirect from "./pages/Auth/AuthRedirect";
import Home from "./views/Home";
import CreateServiceOffering from "./pages/ServiceProvider/CreateServiceOffering";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<ServiceProviderSignUp />} />
        <Route path="/login" element={<ServiceProviderLogin />} />
        <Route path="/onboarding" element={<ServiceProviderOnboarding />} />
        <Route path="/service-provider/dashboard" element={<ServiceProviderDashboard />} />
        <Route path="/auth/redirect" element={<AuthRedirect />} />
        <Route path="/service-provider/create-service-offering" element={<CreateServiceOffering />} />
      </Routes>
    </BrowserRouter>
  );
}
