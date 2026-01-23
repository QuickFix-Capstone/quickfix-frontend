import { useState } from "react";
import AdminServiceProviders from "./AllServiceProvider";
import SystemHealth from "./SystemHealth";

const TABS = {
  ALL: "ALL",
  UNVERIFIED: "UNVERIFIED",
  SYSTEM: "SYSTEM",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(TABS.ALL);

  const tabStyle = (tab) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition
     ${
       activeTab === tab
         ? "bg-blue-600 text-white"
         : "bg-gray-100 text-gray-700 hover:bg-gray-200"
     }`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Manage service providers and monitor system health
        </p>
      </div>

      {/* ================= TAB BUTTONS ================= */}
      <div className="flex gap-3">
        <button
          className={tabStyle(TABS.ALL)}
          onClick={() => setActiveTab(TABS.ALL)}
        >
          All Service Providers
        </button>

        <button
          className={tabStyle(TABS.UNVERIFIED)}
          onClick={() => setActiveTab(TABS.UNVERIFIED)}
        >
          Unverified Providers
        </button>

        <button
          className={tabStyle(TABS.SYSTEM)}
          onClick={() => setActiveTab(TABS.SYSTEM)}
        >
          System Dashboard
        </button>
      </div>

      {/* ================= TAB CONTENT ================= */}
      <div className="bg-white border rounded-xl p-4">
        {activeTab === TABS.ALL && <AdminServiceProviders />}
        {activeTab === TABS.SYSTEM && <SystemHealth />}
      </div>
    </div>
  );
}
