import { useState } from "react";
import AdminServiceProviders from "./AllServiceProvider";
import SystemHealth from "./SystemHealth";
import AdminUnverifiedServiceProviders from "./UnverifiedServiceProvider";
import useOnlineUsers from "../../hooks/useOnlineUsers";

const TABS = {
  ALL: "ALL",
  UNVERIFIED: "UNVERIFIED",
  SYSTEM: "SYSTEM",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const { onlineCount, isConnected } = useOnlineUsers();

  const tabStyle = (tab) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap
     ${
       activeTab === tab
         ? "bg-black text-white shadow-sm"
         : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
     }`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage providers and monitor platform health
          </p>
        </div>

        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"}`}
          />
          <span className="text-2xl font-semibold text-gray-900">
            {onlineCount}
          </span>
          <span className="text-sm text-gray-500">
            {onlineCount === 1 ? "user" : "users"} online
          </span>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-2 border border-gray-200 rounded-lg p-1 w-fit overflow-x-auto">
        <button
          className={tabStyle(TABS.ALL)}
          onClick={() => setActiveTab(TABS.ALL)}
        >
          All Providers
        </button>

        <button
          className={tabStyle(TABS.UNVERIFIED)}
          onClick={() => setActiveTab(TABS.UNVERIFIED)}
        >
          Unverified
        </button>

        <button
          className={tabStyle(TABS.SYSTEM)}
          onClick={() => setActiveTab(TABS.SYSTEM)}
        >
          System Health
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="border border-gray-200 rounded-xl p-4">
        {activeTab === TABS.ALL && <AdminServiceProviders />}
        {activeTab === TABS.UNVERIFIED && <AdminUnverifiedServiceProviders />}
        {activeTab === TABS.SYSTEM && <SystemHealth />}
      </div>
    </div>
  );
}
