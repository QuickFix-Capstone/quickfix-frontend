import { Outlet } from "react-router-dom";
import ServiceProviderTopNav from "../navigation/ServiceProviderTopNav";

export default function ServiceProviderLayout({ currentUser, onLogout }) {
  return (
    <>
      <ServiceProviderTopNav currentUser={currentUser} onLogout={onLogout} />
      <main className="pt-4">
        <Outlet />
      </main>
    </>
  );
}
