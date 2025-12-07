import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProviderCreateGig from "./views/ProviderCreateGig";
import ProviderProfile from "./views/ProviderProfile";
import Home from "./views/Home";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/provider/create-gig" element={<ProviderCreateGig />} />
        <Route path="/provider/service-offerings"
          element={<ProviderProfile />} />

      </Routes>
    </Router>
  );
}
