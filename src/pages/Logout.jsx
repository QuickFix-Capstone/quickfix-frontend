import { useEffect } from "react";
import { logoutUser } from "../auth/localAuth";
import { Navigate } from "react-router-dom";

export default function Logout() {
  useEffect(() => {
    logoutUser();
  }, []);

  return <Navigate to="/login" replace />;
}
