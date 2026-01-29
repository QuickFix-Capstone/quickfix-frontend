import { Outlet } from "react-router-dom";
import ServiceProviderTopNav from "../navigation/ServiceProviderTopNav";
import MessagesPopup from "../messaging/MessagesPopup";

export default function ServiceProviderLayout({ currentUser, onLogout }) {
  return (
    <>
      <ServiceProviderTopNav currentUser={currentUser} onLogout={onLogout} />
      <main className="pt-4">
        <Outlet />
      </main>
      <MessagesPopup />
    </>
  );
}
