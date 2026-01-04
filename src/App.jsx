// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import ServiceProviderSignUp from "./pages/ServiceProvider/ServiceProviderSignUp";
// import ServiceProviderLogin from "./pages/ServiceProvider/ServiceProviderLogin";
// import ServiceProviderOnboarding from "./pages/ServiceProvider/ServiceProviderOnboarding";
// import ServiceProviderDashboard from "./pages/ServiceProvider/ServiceProviderDashboard";
// import AuthRedirect from "./pages/Auth/AuthRedirect";
// import Home from "./views/Home";
// import CreateServiceOffering from "./pages/ServiceProvider/CreateServiceOffering";
// import ServiceProviderLayout from "./components/layout/ServiceProviderLayout";

// // export default function App() {
// //   return (
// //     <BrowserRouter>
// //       <Routes>
// //         <Route path="/" element={<Home />} />
// //         <Route path="/signup" element={<ServiceProviderSignUp />} />
// //         <Route path="/login" element={<ServiceProviderLogin />} />
// //         <Route path="/onboarding" element={<ServiceProviderOnboarding />} />
// //         <Route path="/service-provider/dashboard" element={<ServiceProviderDashboard />} />
// //         <Route path="/auth/redirect" element={<AuthRedirect />} />
// //         <Route path="/service-provider/create-service-offering" element={<CreateServiceOffering />} />
// //       </Routes>
// //     </BrowserRouter>
// //   );
// // }

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./views/Home";
import ServiceProviderSignUp from "./pages/ServiceProvider/ServiceProviderSignUp";
import ServiceProviderLogin from "./pages/ServiceProvider/ServiceProviderLogin";
import ServiceProviderOnboarding from "./pages/ServiceProvider/ServiceProviderOnboarding";
import ServiceProviderDashboard from "./pages/ServiceProvider/ServiceProviderDashboard";
import CreateServiceOffering from "./pages/ServiceProvider/CreateServiceOffering";
import AuthRedirect from "./pages/Auth/AuthRedirect";
import ServiceProviderHomePage from "./pages/ServiceProvider/ServiceProviderHomePage";
import ServiceProviderLayout from "./components/layout/ServiceProviderLayout";
import JobDetailsPage from "./pages/ServiceProvider/JobDetailsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<ServiceProviderSignUp />} />
        <Route path="/login" element={<ServiceProviderLogin />} />
        <Route path="/auth/redirect" element={<AuthRedirect />} />
        <Route path="/onboarding" element={<ServiceProviderOnboarding />} />

        {/* ✅ SERVICE PROVIDER AREA */}
        <Route path="/service-provider" element={<ServiceProviderLayout />}>
          <Route path="dashboard" element={<ServiceProviderDashboard />} />
          <Route
            path="create-service-offering"
            element={<CreateServiceOffering />}
          />
          <Route
            path="/service-provider/job/:jobId"
            element={<JobDetailsPage />}
          />
          <Route
            path="/service-provider/home"
            element={<ServiceProviderHomePage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
