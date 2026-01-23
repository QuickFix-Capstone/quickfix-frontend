import { Navigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";

export default function AdminRoute({ children }) {
  const [allowed, setAllowed] = useState(null); // null = loading

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        const session = await fetchAuthSession({ forceRefresh: false });

        if (!mounted) return;

        const idToken = session.tokens?.idToken;
        if (!idToken) {
          setAllowed(false);
          return;
        }

        const groups =
          idToken.payload["cognito:groups"] || idToken.payload["groups"] || [];

        setAllowed(groups.includes("Administrator"));
      } catch {
        if (mounted) setAllowed(false);
      }
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  // 🔒 IMPORTANT: Do NOT redirect while loading
  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking admin access…
      </div>
    );
  }

  return allowed ? children : <Navigate to="/admin/login" replace />;
}
